import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasWorkspaceAccess } from "@/lib/workspace-access";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
      select: { id: true, isActive: true },
    });

    if (!workspace || !workspace.isActive) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 404 });
    }

    // Isolation gate: every role except ADMIN must prove workspace access.
    // hasWorkspaceAccess covers enrollment + accepted collaborator + owner.
    // NOTE: only the ACCESS gate changes here — the COURSE_ONLY content
    // filter below stays STUDENT-scoped (owner/collaborator/admin see all
    // lives, which is the existing, intended behavior).
    if (user.role !== "ADMIN") {
      const allowed = await hasWorkspaceAccess(user.id, workspace.id);
      if (!allowed) {
        return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
      }
    }

    const allLives = await prisma.live.findMany({
      where: {
        workspaceId: workspace.id,
        status: { in: ["SCHEDULED", "LIVE", "ENDED"] },
      },
      orderBy: [
        { status: "asc" },
        { scheduledAt: "desc" },
      ],
      // 9.177 — `select` explícito no lugar do `include`. O `include` sem
      // `select` no topo devolvia TODOS os 20 escalares de `Live`, incluindo
      // `externalUrl` (o link da transmissão, NOT NULL em todas) e `embedUrl`.
      // A tela desta rota (`app/w/[slug]/lives/page.tsx:9-21`) declara 11
      // campos e NÃO usa nenhum dos dois (grep: 0 ocorrências).
      // ⚠️ `recordingUrl` FICA: a tela o usa em `:150`, ainda que só como
      // booleano ("Gravação disponível"). Trocá-lo por um booleano muda o
      // contrato e o tipo da página — vira item próprio.
      // ⓘ `visibility` e `courseId` entram porque o FILTRO abaixo depende
      // deles; são estruturais, não credenciais.
      select: {
        id: true,
        title: true,
        description: true,
        platform: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        recordingUrl: true,
        thumbnailUrl: true,
        visibility: true,
        courseId: true,
        course: { select: { id: true, title: true } },
      },
    });

    let lives = allLives;

    if (user.role === "STUDENT") {
      const courseOnlyLives = allLives.filter((l) => l.visibility === "COURSE_ONLY" && l.courseId);
      if (courseOnlyLives.length > 0) {
        const courseIds = Array.from(new Set(courseOnlyLives.map((l) => l.courseId!)));
        const enrollments = await prisma.enrollment.findMany({
          where: {
            userId: user.id,
            courseId: { in: courseIds },
            status: "ACTIVE",
          },
          select: { courseId: true },
        });
        const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

        lives = allLives.filter((l) => {
          if (l.visibility !== "COURSE_ONLY") return true;
          return l.courseId ? enrolledCourseIds.has(l.courseId) : false;
        });
      }
    }

    return NextResponse.json({ lives });
  } catch (error) {
    console.error("GET /api/w/[slug]/lives error:", error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
