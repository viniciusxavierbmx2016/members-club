import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  subscriptionExpiring,
  subscriptionSuspended,
} from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { observeOrigin } from "@/lib/origin-lock";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await observeOrigin(req, "exempt-cron"); // 2.4 B.1 observe-mode

  const now = new Date();
  const results = { reminded: 0, suspended: 0, errors: 0 };

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      exempt: false,
      currentPeriodEnd: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { name: true, price: true } },
      billingReminders: true,
    },
  });

  for (const sub of subscriptions) {
    try {
      const periodEnd = sub.currentPeriodEnd!;
      const diffMs = periodEnd.getTime() - now.getTime();
      const daysUntilDue = diffMs / (1000 * 60 * 60 * 24);
      const daysOverdue = -daysUntilDue;

      const sentTypes = new Set(sub.billingReminders.map((r) => r.type));

      if (daysUntilDue <= 3 && daysUntilDue > 1 && !sentTypes.has("before_3d")) {
        const sent = await sendBillingEmail(sub, "before_3d", 3, true);
        if (sent) results.reminded++;
        else results.errors++;
      }

      if (daysUntilDue <= 1 && daysUntilDue > 0 && !sentTypes.has("before_1d")) {
        const sent = await sendBillingEmail(sub, "before_1d", 1, true);
        if (sent) results.reminded++;
        else results.errors++;
      }

      if (daysUntilDue <= 0 && daysOverdue < 1 && !sentTypes.has("due_today")) {
        const sent = await sendBillingEmail(sub, "due_today", 0, true);
        // PAST_DUE reflects the calendar (date passed), not the email
        // outcome — leaving it unconditional. If the email failed, no
        // BillingReminder("due_today") is recorded → the gate above stays
        // open; the second `update` here is a no-op since status is
        // already PAST_DUE.
        //
        // ⚠️ 9.318 1A — "the gate stays open" is not the same as "it will be
        // retried". This one is a WINDOW (`daysUntilDue <= 0 && daysOverdue
        // < 1`, one day wide) and the cron runs once a day, so a failure
        // here may simply lose the due_today notice when the window closes
        // and after_1d takes over. That is acceptable precisely BECAUSE the
        // window closes: this gate cannot retry forever.
        if (sub.status === "ACTIVE") {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          });
        }
        if (sent) results.reminded++;
        else results.errors++;
      }

      if (daysOverdue >= 1 && !sentTypes.has("after_1d")) {
        const sent = await sendBillingEmail(sub, "after_1d", -1);
        if (sent) results.reminded++;
        else results.errors++;
      }

      if (daysOverdue >= 3 && !sentTypes.has("after_3d_suspend")) {
        // A producer is never suspended without the warning email
        // actually leaving our infra. If Brevo is down, we record the
        // failure and try again next cron — the customer stays ACTIVE
        // in the meantime.
        const delivered = await sendSuspendEmail(sub);
        if (delivered) {
          await prisma.billingReminder.create({
            data: { subscriptionId: sub.id, type: "after_3d_suspend" },
          });
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "SUSPENDED", suspendedAt: now },
          });
          results.suspended++;
        } else {
          results.errors++;
        }
      }

      if (daysOverdue >= 7 && !sentTypes.has("after_7d")) {
        const sent = await sendBillingEmail(sub, "after_7d", -7);
        if (sent) results.reminded++;
        else results.errors++;
      }

      if (daysOverdue >= 15 && !sentTypes.has("after_15d")) {
        const sent = await sendBillingEmail(sub, "after_15d", -15);
        if (sent) results.reminded++;
        else results.errors++;
      }
    } catch (err) {
      console.error(
        `[BILLING-CRON] Error for sub ${sub.id}:`,
        err instanceof Error ? err.message : err
      );
      results.errors++;
    }
  }

  logger.info("BILLING-CRON", "Done", results as unknown as Record<string, unknown>);
  return Response.json(results);
}

type SubWithRelations = {
  id: string;
  user: { id: string; name: string; email: string };
  plan: { name: string; price: number } | null;
};

// 9.318 fatia 1A — o motivo da falha, para o log.
// Cópia do classificador de `auth/forgot-password/route.ts:24-43`: mesmo nome,
// mesma semântica, mesma ordem. ⚠️ DUPLICAÇÃO DECLARADA — extrair para `lib/`
// obrigaria a mexer numa rota de produção fora desta fatia; fica item próprio.
// ⚠️ O STATUS vem ANTES do `name` porque o SDK do Brevo não atribui `name` à
// própria classe de erro: no build de produção o minificador reduz o nome a
// uma letra, e `brevo-n-401` não informa nada. O número é o que discrimina.
function motivoDaFalha(error: unknown): string {
  if (error === "BREVO_API_KEY not configured") return "credencial-ausente";
  if (error === "Email inválido") return "destinatario-invalido";
  if (typeof error === "string") return "brevo-desconhecido";
  const e = error as {
    name?: string;
    statusCode?: number;
    status?: number;
    response?: { status?: number };
  } | null;
  const status = e?.statusCode ?? e?.status ?? e?.response?.status;
  if (status) return `brevo-${status}`;
  return `brevo-${e?.name || "SemNome"}`;
}

// Com `exigirEnvio: true`, retorna true somente se o Brevo ACEITOU o e-mail E a
// linha de BillingReminder foi criada. Na falha do envio nenhum lembrete é
// gravado → o portão continua aberto para a próxima rodada do cron, e um Brevo
// instável deixa de fazer um cliente perder o aviso em silêncio (o que já
// acontecia porque o lembrete era inserido ANTES do await).
//
// ⚠️ 9.318 fatia 1A — esta promessa existia desde `4052d2e` (31/mai/26) e era
// FALSA. `sendEmail` NUNCA rejeita (lib/email.ts: 0 `throw`, e o único `await`
// está DENTRO do `try` de :34-53), então o `catch` abaixo nunca abriu uma vez:
// o `create` rodava mesmo com o aviso não enviado, o tipo entrava no
// `sentTypes` e o aviso ficava carimbado como entregue PARA SEMPRE. O desfecho
// de `sendEmail` vem no valor RESOLVIDO, e é ele que decide agora.
// ⛔ O `catch` FICA DE PÉ: hoje é inalcançável, não custa nada, e é a rede se o
// contrato de `sendEmail` mudar.
//
// ⭐ POR QUE O PARÂMETRO TEM DEFAULT `false`, E O DEFAULT É O BISTURI:
// esta função é compartilhada pelos SEIS degraus de aviso. A fatia 1A conserta
// só os TRÊS anteriores ao vencimento (:45, :51, :57), que passam `true`
// explicitamente. Os três PÓS-vencimento (:74, :100, :106) omitem o argumento,
// caem no default e seguem BYTE-IDÊNTICOS — mesma linha de chamada, mesmo
// retorno, mesma escrita, mesmos logs. Com `exigirEnvio === false` o `&&`
// curto-circuita no PRIMEIRO operando: `envio?.success` nem chega a ser
// avaliado.
// ⚠️ E isso é deliberado, não preguiça: os pós-vencimento têm guarda ABERTA
// (`daysOverdue >= N`, que nunca fecha pelo calendário), então gatear o carimbo
// neles criaria retentativa diária sem teto. Eles são a fatia 1B e precisam de
// um limite de tentativa primeiro. Os três daqui são JANELAS que se fecham
// sozinhas — é por isso que consertá-los é seguro HOJE.
async function sendBillingEmail(
  sub: SubWithRelations,
  type: string,
  daysLeft: number,
  exigirEnvio = false
): Promise<boolean> {
  const template = subscriptionExpiring(
    sub.user.name || "Produtor",
    daysLeft
  );

  let envio: Awaited<ReturnType<typeof sendEmail>> | null = null;
  try {
    envio = await sendEmail({
      to: { email: sub.user.email, name: sub.user.name || undefined },
      subject: template.subject,
      htmlContent: template.htmlContent,
    });
  } catch (err) {
    console.error(
      `[BILLING-CRON] Email error (${type}) for ${sub.user.email}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }

  if (exigirEnvio && !envio?.success) {
    // ⛔ Sem BillingReminder aqui: é exatamente isto que mantém o portão
    // reaberto para a próxima rodada. O e-mail da pessoa não vai para o log —
    // só o id da assinatura e o motivo.
    logger.error("BILLING-CRON", `aviso ${type} NAO SAIU`, {
      subscriptionId: sub.id,
      reason: motivoDaFalha(envio?.error),
    });
    return false;
  }

  await prisma.billingReminder.create({
    data: { subscriptionId: sub.id, type },
  });
  logger.info("BILLING-CRON", `Sent ${type} to ${sub.user.email}`);
  return true;
}

// Returns true only if the email was actually delivered. The caller
// owns both the BillingReminder row and the Subscription status update
// — they MUST be gated on this boolean so a producer is never
// suspended without receiving the warning email.
async function sendSuspendEmail(sub: SubWithRelations): Promise<boolean> {
  const template = subscriptionSuspended(sub.user.name || "Produtor");

  try {
    await sendEmail({
      to: { email: sub.user.email, name: sub.user.name || undefined },
      subject: template.subject,
      htmlContent: template.htmlContent,
    });
  } catch (err) {
    console.error(
      `[BILLING-CRON] Suspend email error for ${sub.user.email}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }

  logger.info("BILLING-CRON", `Sent suspend to ${sub.user.email}`);
  return true;
}
