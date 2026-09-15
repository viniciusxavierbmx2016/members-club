import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordReset } from "@/lib/email-templates";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, validateBody } from "@/lib/validations";
import { logger } from "@/lib/logger";

/* 9.283 · O MOTIVO COM NOME PRÓPRIO — molde do instrumento do 9.260
   (`lib/auth.ts`): "o NOME do erro é o discriminador".

   ⛔ NUNCA a mensagem crua do Brevo. Dois motivos, e o segundo é o grave:
   (1) ela pode ecoar o e-mail do destinatário; (2) ela pode ecoar o
   `htmlContent`, que carrega o **action_link de recuperação** — uma
   credencial. Log de servidor não é lugar de link de reset. Por isso só
   saem o NOME da classe e o status numérico.

   ⚠️ ACOPLAMENTO DECLARADO: as duas strings abaixo são as literais de
   `lib/email.ts:26` e `:31`. Se elas mudarem lá, este classificador
   DEGRADA para `brevo-desconhecido` — não quebra, mas perde resolução.
   Não as importei porque não são exportadas e mexer em `email.ts` atinge
   os 20 call-sites de `sendEmail`. */
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
  // ⚠️ O STATUS VEM PRIMEIRO, e isso foi MEDIDO no palco: o SDK do Brevo não
  // atribui `name` à própria classe de erro, então no build de produção o
  // minificador reduz o nome a uma letra — a primeira versão desta fatia
  // registrou `brevo-n-401`, onde o `n` não informa nada. O supabase-js
  // sobrevive ao minificador porque atribui `name` como STRING (é por isso que
  // o 9.260 pôde usar o nome); o Brevo não faz isso. O número é o que discrimina.
  if (status) return `brevo-${status}`;
  return `brevo-${e?.name || "SemNome"}`;
}

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const v = validateBody(forgotPasswordSchema, body);
    if (!v.success) return v.error;
    const { email, from, workspace } = v.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const supabase = createAdminClient();
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://app.mymembersclub.com.br";

    // Build the recovery redirectTo. Workspace context — when present —
    // takes precedence so students return to the correct /w/<slug>/login
    // after setting their new password.
    const safeWorkspace = workspace?.replace(/[^a-z0-9-]/gi, "").slice(0, 200);
    const params = new URLSearchParams();
    if (safeWorkspace) {
      params.set("from", "workspace");
      params.set("workspace", safeWorkspace);
    } else if (from) {
      params.set("from", from);
    }
    const qs = params.toString();
    const redirectTo = `${origin}/reset-password${qs ? `?${qs}` : ""}`;

    /* 9.309 · O `generateLink` SAI DO CAMINHO DA RESPOSTA.
       ⭐ MEDIDO: ele é a totalidade do vazamento por tempo. A etapa comum aos
       dois casos (`prisma.user.findUnique`) custa 87 ms para quem existe E para
       quem não existe — diferença ZERO; o `generateLink` custa ~58 ms e só roda
       para quem existe. Resultado: as faixas não se tocavam (0,124–1,084 s
       contra 0,085–0,093 s) e UMA requisição por endereço dizia quem tem conta.
       ⛔ O comentário logo abaixo protegia a metade errada: o fire-and-forget
       cuidava do ENVIO, mas quem denunciava era esta chamada, `await`ada.
       ⭐ `after()` é o mesmo primitivo que o 9.283 instalou nesta rota: roda
       DEPOIS da resposta, então não muda o que a rota devolve nem quando.
       ⛔ Não é atraso artificial — é a mesma chamada, em outro momento.
       ⓘ O `recovery_sent_at` continua sendo gravado: o `generateLink` acontece,
       só que ~58 ms mais tarde. */

    // Fire-and-forget so the response time stays constant whether or
    // not Brevo is healthy. If we awaited here, a slow/down Brevo would
    // (a) hang the request and (b) leak whether the email exists via
    // timing (fast = unknown user/early-return, slow = email sent).
    // ⚠️ 9.309 ATUALIZOU ESTE PARÁGRAFO: o `generateLink` NÃO é mais "awaited
    // above" — ele desceu para dentro do `after()`, porque era ELE que vazava
    // o tempo. O link continua sendo cunhado do lado do Supabase, só que
    // depois da resposta; se o envio falhar, a pessoa tenta de novo e recebe
    // um link novo. ⛔ E o trade-off do parágrafo acima segue valendo: nada
    // disto virou `await` no caminho da resposta.
    const t0 = Date.now();

    /* 9.283 · O DESFECHO VAI PARA O LOG — depois da resposta, nunca antes.
       ⭐ O defeito era MAIOR do que o item dizia: `sendEmail` **nunca
       rejeita** (`lib/email.ts` tem 0 `throw` e 4 `return`, com o único
       `await` dentro do `try`), então o `.catch` daqui era **código
       morto** — nunca rodou uma vez. Quem falhava saía com a linha
       "Email enviado" e mais nada. Provado por sonda em runtime:
       `.then` roda, `.catch` não.
       ⇒ o desfecho se lê no VALOR RESOLVIDO, não numa rejeição.

       ⭐ `after()` (nativo do Next) e não promessa solta: sem ele o
       callback pode não rodar antes de a invocação congelar, e o log
       sumiria — que é justamente o que esta fatia existe para consertar.
       Ele roda DEPOIS da resposta: não altera o que a rota devolve nem
       quando ela devolve.
       ⓘ O `.catch` fica como rede de segurança para o dia em que
       `email.ts` passar a lançar — hoje é inalcançável, e está dito. */
    after(async () => {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: user.email,
        options: { redirectTo },
      });
      if (error || !data?.properties?.action_link) {
        logger.error("FORGOT-PASSWORD", "generateLink falhou — e-mail NAO SAIU", {
          reason: "generate-link",
          name: (error as { name?: string } | null)?.name || "SemNome",
          ms: Date.now() - t0,
        });
        return;
      }

      const template = passwordReset(
        user.name || "Usuário",
        data.properties.action_link
      );

      let r: Awaited<ReturnType<typeof sendEmail>> | null = null;
      let rejeitou: unknown = null;
      try {
        r = await sendEmail({
          to: { email: user.email, name: user.name },
          subject: template.subject,
          htmlContent: template.htmlContent,
        });
      } catch (err) {
        rejeitou = err;
      }
      const ms = Date.now() - t0;

      if (rejeitou !== null) {
        logger.error("FORGOT-PASSWORD", "recovery email NAO SAIU", {
          reason: "promessa-rejeitada",
          name: (rejeitou as { name?: string })?.name || "SemNome",
          ms,
        });
        return;
      }
      if (r?.success) {
        logger.info("FORGOT-PASSWORD", "recovery email aceito pelo Brevo", {
          messageId: r.messageId ?? "-",
          ms,
        });
        return;
      }
      logger.error("FORGOT-PASSWORD", "recovery email NAO SAIU", {
        reason: motivoDaFalha(r?.error),
        ms,
      });
    });

    // ⛔ A resposta é byte-idêntica em TODOS os caminhos, de propósito:
    // é anti-enumeração. Esta fatia mudou só o log.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[FORGOT-PASSWORD] Error:", err);
    return NextResponse.json({ success: true });
  }
}
