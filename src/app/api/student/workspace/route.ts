import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // ORDEM DE PREFERÊNCIA — a de antes, preservada, e agora DECLARADA:
    //   (1) matrícula ACTIVE mais recente  ← era a única via que este resolvedor
    //       conhecia;
    //   (2) matrícula EXPIRED mais recente;
    //   (3) a marca de pertencimento do cadastro público.
    // As três são as vias de ALUNO que a porta da vitrine aceita
    // (`lib/workspace-access.ts:80-91`, ligada em `api/w/[slug]/init/route.ts:66`
    // com `allowMembership`). Sem (2) e (3) este resolvedor dizia 404 — e a tela
    // afirmava "sua conta não tem acesso a nenhuma área" — para quem a vitrine
    // aceita. 9.337.
    // ⛔ As vias de STAFF daquela mesma porta — colaborador aceito e DONO do
    //    workspace — ficam de fora DE PROPÓSITO: esta rota responde "onde fica a
    //    área de ALUNO desta pessoa", e devolver o workspace de um produtor
    //    alimentaria a face B do 9.138.
    // ⭐ `workspace: { isActive: true }` alinha com o irmão canônico
    //    (`lib/student-workspaces.ts:41`). Sem o filtro, o slug podia apontar
    //    para o `notFound()` de `app/w/[slug]/layout.tsx:36`.
    const porMatricula = async (status: "ACTIVE" | "EXPIRED") =>
      prisma.enrollment.findFirst({
        where: {
          userId: user.id,
          status,
          course: { workspace: { isActive: true } },
        },
        orderBy: { createdAt: "desc" },
        select: {
          course: {
            select: {
              workspace: {
                select: { slug: true, name: true },
              },
            },
          },
        },
      });

    let ws =
      (await porMatricula("ACTIVE"))?.course?.workspace ?? null;
    if (!ws) ws = (await porMatricula("EXPIRED"))?.course?.workspace ?? null;
    if (!ws) {
      const marca = await prisma.workspaceMembership.findFirst({
        where: { userId: user.id, workspace: { isActive: true } },
        orderBy: { createdAt: "desc" },
        select: { workspace: { select: { slug: true, name: true } } },
      });
      ws = marca?.workspace ?? null;
    }

    if (!ws?.slug) {
      return NextResponse.json({ error: "Nenhum workspace encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      slug: ws.slug,
      name: ws.name,
    });
  } catch (error) {
    console.error("GET /api/student/workspace error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
