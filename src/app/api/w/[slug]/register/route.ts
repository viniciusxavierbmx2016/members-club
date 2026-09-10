import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from "@/lib/supabase-route";
import { rateLimit } from "@/lib/rate-limit";
import { generateSalt, hashPassword } from "@/lib/workspace-auth";
import { publicSignupSchema, validateBody } from "@/lib/validations";
import { logger } from "@/lib/logger";

/**
 * E4.4 etapa 2, FATIA 1 — CADASTRO PÚBLICO do workspace.
 *
 * A rota que faltava para o funil fechar: cria a conta, a credencial daquele
 * workspace e ⭐ a MARCA DE PERTENCIMENTO — a 4ª via de `hasWorkspaceAccess`,
 * que subiu vazia e até aqui não tinha NENHUM escritor. Com a marca, a vitrine
 * (`w/[slug]/init:66`) e o resgate (`courses/[id]/claim:74`) abrem sozinhos:
 * os dois já leem `allowMembership` desde o merge `a8c718a`.
 *
 * ⚠️ ESTA É UMA ROTA PÚBLICA QUE CRIA CONTA — a mesma família da
 * `/api/auth/register` que foi APAGADA em 10/set (item 9.135) por cravar
 * `role: "ADMIN"`. As defesas abaixo existem por causa dela:
 *
 *  1. `rateLimit` na PRIMEIRA linha — o proxy devolve `next()` para todo
 *     `/api/` (`proxy.ts:59-61`) e não existe `middleware.ts`: nenhum freio
 *     roda antes daqui.
 *  2. `role: "STUDENT"` é LITERAL. Não vem do corpo, não vem de cookie — foi
 *     o cookie que virou item 9.148 no `auth/callback`.
 *  3. O schema é FECHADO (`z.object` sem `.passthrough()`): campos extras são
 *     descartados no parse. ⚠️ O `registerSchema` da casa TEM `.passthrough()`
 *     (36 dos 86 schemas têm) — por isso ele não é reusado aqui.
 *  4. `workspaceId` vem do SLUG da URL, nunca do corpo.
 *
 * ⭐ Decisão do dono (10/set): e-mail já cadastrado NÃO cria nada — responde
 * "você já tem conta, faça login". ⚠️ Isso revela existência de e-mail por
 * construção; foi escolha explícita, registrada no item, e é o oposto da
 * postura do login do aluno (`w/[slug]/login:70-71`, que devolve "Senha
 * incorreta" também para e-mail inexistente).
 *
 * ⛔ NÃO manda e-mail: a pessoa acabou de escolher a senha dela (N-5 do §9.2).
 * ⛔ NÃO toca em credencial de quem já existe — o ramo que rotaciona senha
 *    (`courses/[id]/students:284-301`, item 9.136) não é atravessado aqui.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const limited = await rateLimit(request);
  if (limited) return limited;

  const params = await props.params;
  try {
    const raw = await request.json().catch(() => ({}));
    const v = validateBody(publicSignupSchema, raw);
    if (!v.success) return v.error;

    // Normalização na ESCRITA e na BUSCA, com o MESMO valor para Prisma e
    // Supabase — é a régua do `webhook-helpers.ts:44` (R-5 do §9.1). A porta
    // do aluno ainda não faz isso (item 9.151); esta faz.
    const email = v.data.email.trim().toLowerCase();
    // Mesma régua dos campos de suporte (R-7): só dígitos.
    const phone = v.data.phone.replace(/\D/g, "");
    const name = v.data.name.trim();
    const password = v.data.password;

    // ⭐ O workspace vem do SLUG. `notFound` também para inativo — a mesma
    // porta única de recusa do resto da casa, para não confirmar existência.
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
      select: { id: true, isActive: true },
    });
    if (!workspace || !workspace.isActive) {
      return NextResponse.json(
        { error: "Área de membros não encontrada" },
        { status: 404 }
      );
    }

    // O cliente que ESCREVE COOKIE: a pessoa sai daqui já logada, e é por isso
    // que o resgate (que exige sessão em `claim:38-41`) funciona no clique
    // seguinte. `email_confirm` não é passado: medido em 10/set que o projeto
    // NÃO exige confirmação — o `signUp` já devolve sessão e
    // `email_confirmed_at` preenchido.
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      const msg = error.message ?? "";
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered")
      ) {
        // Medido em 10/set: para e-mail existente o GoTrue devolve ERRO
        // explícito e `data.user` vazio — não há P2002 silencioso por aqui.
        return NextResponse.json(
          {
            error:
              "Você já tem uma conta com este e-mail. Faça login para continuar.",
            alreadyRegistered: true,
          },
          { status: 409 }
        );
      }
      logger.error("public-signup", "signUp failed", {
        slug: params.slug,
        error: msg,
      });
      return NextResponse.json(
        { error: "Não foi possível criar a conta. Tente novamente." },
        { status: 400 }
      );
    }
    if (!data.user) {
      logger.error("public-signup", "signUp sem data.user", {
        slug: params.slug,
      });
      return NextResponse.json(
        { error: "Não foi possível criar a conta. Tente novamente." },
        { status: 400 }
      );
    }

    const userId = data.user.id;

    // ⭐ role LITERAL. Este é o ponto que o 9.135 errava.
    try {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          role: "STUDENT",
          phone: phone || null,
          workspaceId: workspace.id,
        },
      });
    } catch (e) {
      // Identidade de auth sem linha Prisma é caso-borda real (há órfãs
      // medidas em produção). Sem este ramo a pessoa ficaria com sessão viva
      // e 500 na tela — a falha silenciosa que o N-8 do §9.2 proíbe.
      if ((e as { code?: string })?.code !== "P2002") throw e;
      logger.error("public-signup", "User já existia para a identidade nova", {
        slug: params.slug,
      });
    }

    // Credencial daquele workspace, pelo par da casa (scrypt + salt de 32
    // bytes). ⛔ Nunca inventar hash paralelo — é a cicatriz do BUG C.
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    await prisma.workspaceCredential.create({
      data: { userId, workspaceId: workspace.id, passwordHash, salt },
    });

    // ⭐ A MARCA. `create` + `catch P2002` + re-busca PELA UNIQUE que
    // conflitou — o molde da casa contra corrida (N-7 do §9.2). ⛔ `upsert` do
    // Prisma foi descartado por prova empírica de emulação na 5.22.
    try {
      await prisma.workspaceMembership.create({
        data: { userId, workspaceId: workspace.id, origin: "PUBLIC_SIGNUP" },
      });
    } catch (e) {
      if ((e as { code?: string })?.code !== "P2002") throw e;
      const existente = await prisma.workspaceMembership.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
        select: { id: true },
      });
      if (!existente) throw e;
    }

    return NextResponse.json({ ok: true, slug: params.slug }, { status: 201 });
  } catch (error) {
    logger.error("public-signup", "erro inesperado", {
      slug: params.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
