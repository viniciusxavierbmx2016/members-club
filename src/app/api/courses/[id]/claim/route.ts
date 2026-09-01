import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { processAutomations } from "@/lib/automation-engine";
import { hasWorkspaceAccess } from "@/lib/workspace-access";

/* POST /api/courses/[id]/claim — E4.4 etapa 2.

   O aluno RESGATA o acesso a um curso gratuito. Cria uma matrícula comum
   (decisão D2 do dono: nada de caminho de acesso paralelo), com
   `origin: FREE_CLAIM`.

   ⚠️ NESTA ETAPA só quem JÁ TEM CONTA resgata. O cadastro público é a etapa 3.

   ───── O que este handler faz, e o que ele DELIBERADAMENTE não faz ─────
   O molde é `api/producer/students/[id]/enrollments`, que ao criar matrícula
   nova dispara TRÊS coisas além do upsert: notificação, e-mail de acesso e
   automações. Aqui:
     · notificação  → SIM. É o registro in-app de que o acesso existe.
     · automações   → SIM. Um `STUDENT_ENROLLED` configurado pelo produtor deve
                      valer para o aluno gratuito como vale para o pagante.
     · e-mail       → NÃO. Aquele e-mail existe para avisar alguém que NÃO
                      estava lá que ganhou acesso, e leva o link de login. Aqui
                      a pessoa está logada, acabou de clicar em "Resgatar" e
                      cai direto no curso: o e-mail seria ruído. (O template
                      aceita `tempPassword` opcional; o molde não passa, e aqui
                      também não passaria — mas o motivo de pular é o contexto,
                      não a senha.) */
export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const limited = await rateLimit(_request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    /* Uma única porta de recusa para tudo que não seja "existe, é gratuito e
       você alcança": curso inexistente, de outro workspace, não publicado ou
       PAGO saem todos com o mesmo 404. Distinguir confirmaria a existência de
       curso de outro tenant — é o mesmo padrão do `by-slug/init`, que responde
       404 e não 403 pela mesma razão. */
    const naoEncontrado = () =>
      NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        slug: true,
        isFree: true,
        isPublished: true,
        workspaceId: true,
        workspace: { select: { id: true, slug: true } },
      },
    });
    if (!course || !course.isPublished || !course.isFree) return naoEncontrado();

    // O curso tem de ser de um workspace que a pessoa alcança. Sem isto,
    // qualquer usuário logado resgataria o gratuito de qualquer produtor.
    const admin = user.role === "ADMIN";
    // E4.4 §12.3 — o RESGATE. Sem a marca aqui o cadastrado nunca converteria
    // em matrícula por conta própria: o botão "Resgatar acesso" ficaria visível
    // (course-preview.tsx:128) e responderia 404.
    if (
      !admin &&
      !(await hasWorkspaceAccess(user.id, course.workspaceId, {
        allowMembership: true,
      }))
    ) {
      return naoEncontrado();
    }

    /* IDEMPOTENTE, e com uma trava a mais: se já existe matrícula ATIVA,
       devolve sucesso sem tocar em nada. Se existe matrícula NÃO-ATIVA
       (CANCELLED/EXPIRED/REFUNDED), NÃO reativa — aquele estado foi decisão de
       alguém (produtor que removeu, reembolso que revogou), e o resgate não
       pode desfazer uma revogação por baixo. Responde 409 com frase da casa,
       e quem tem de resolver é o produtor. */
    const existente = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true, status: true },
    });
    if (existente?.status === "ACTIVE") {
      return NextResponse.json({ ok: true, alreadyEnrolled: true, slug: course.slug });
    }
    if (existente) {
      return NextResponse.json(
        { error: "Seu acesso a este curso foi removido. Fale com o produtor." },
        { status: 409 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "ACTIVE",
        origin: "FREE_CLAIM",
      },
      select: { id: true },
    });

    // Fora do caminho crítico: falhar aqui não pode desfazer o acesso que já
    // foi concedido (molde do `push fire-and-forget` da casa).
    createNotification({
      userId: user.id,
      workspaceId: course.workspace.id,
      type: "ENROLLMENT",
      message: `Você resgatou o acesso ao curso ${course.title}`,
      link: `/course/${course.slug}`,
    }).catch(() => {});

    processAutomations({
      type: "STUDENT_ENROLLED",
      workspaceId: course.workspace.id,
      courseId: course.id,
      userId: user.id,
    }).catch(() => {});

    return NextResponse.json({ ok: true, enrollmentId: enrollment.id, slug: course.slug }, { status: 201 });
  } catch (error) {
    console.error("[COURSE_CLAIM]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
