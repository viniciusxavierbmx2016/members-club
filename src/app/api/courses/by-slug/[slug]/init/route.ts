import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isEnrollmentActive } from "@/lib/auth";
import { hasWorkspaceAccess } from "@/lib/workspace-access";
import {
  collaboratorCanActOnCourse,
  MEMBER_AREA_PERMISSION,
} from "@/lib/collaborator";
import { getAutomationLocks } from "@/lib/automation-locks";
import { logger } from "@/lib/logger";

const MENU_DEFAULTS = [
  { label: "Home", icon: "home", url: "/course/:slug", isDefault: true },
  {
    label: "Continuar assistindo",
    icon: "play",
    url: "/course/:slug#continue",
    isDefault: true,
  },
  {
    label: "Comunidade",
    icon: "message",
    url: "/course/:slug/community",
    isDefault: true,
  },
];

async function ensureMenuDefaults(courseId: string) {
  const count = await prisma.menuItem.count({
    where: { courseId, isDefault: true },
  });
  if (count >= MENU_DEFAULTS.length) return;
  for (let i = 0; i < MENU_DEFAULTS.length; i++) {
    const d = MENU_DEFAULTS[i];
    const exists = await prisma.menuItem.findFirst({
      where: { courseId, isDefault: true, label: d.label },
    });
    if (!exists) {
      await prisma.menuItem.create({
        data: { ...d, courseId, order: i },
      });
    }
  }
}

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  // 9.172 — quem pede a TELA DE MÓDULO se identifica. Ver a régua lá embaixo.
  const scope = new URL(request.url).searchParams.get("scope");
  const t0 = Date.now();
  try {
    const user = await getCurrentUser();
    const t1 = Date.now();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        workspace: {
          select: { id: true, slug: true, name: true, logoUrl: true, ownerId: true },
        },
        sections: { orderBy: { order: "asc" } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              // 9.174 — PODA. `include` puro devolvia TODOS os escalares de
              // Lesson, `videoUrl` inclusive, para todo mundo que passasse no
              // gate de TENANT — inclusive quem não comprou ESTE curso.
              // Molde da casa: `lessons/[id]/view/route.ts:204` ("Masked
              // payload — never expose raw videoUrl") e o recorte condicional
              // de `courses/[id]/route.ts:239-246`.
              // ⚠️ `select` e não delete-no-map DE PROPÓSITO: coluna nova em
              // Lesson deixa de vazar sozinha. Cobertura provada contra o
              // `information_schema` de produção — 9 colunas reais, 9
              // decididas: as 8 abaixo entram, `videoUrl` sai. Nenhum cliente
              // do payload de ESTRUTURA lê `videoUrl` (o editor do produtor lê,
              // mas por `courses/[id]`, que tem recorte próprio).
              select: {
                id: true,
                title: true,
                description: true,
                hideYoutubeChrome: true,
                duration: true,
                order: true,
                daysToRelease: true,
                moduleId: true,
                progress: { where: { userId: user.id } },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    // Gate de TENANT. Antes, qualquer autenticado recebia módulos, aulas e
    // metadados de QUALQUER curso da plataforma — `hasAccess` abaixo era campo
    // da resposta, não parede.
    // ⚠️ O gate é por WORKSPACE, não por matrícula: a página faz
    // `if (!hasAccess) return <CoursePreview>` ((course)/course/[slug]/page.tsx:391)
    // — o NÃO-matriculado é caminho LEGÍTIMO (é a tela de venda do curso).
    // Exigir matrícula aqui quebraria o checkout. hasWorkspaceAccess cobre
    // aluno do ws (ACTIVE **ou EXPIRED** — preserva a tela de expirado),
    // colaborador ACCEPTED e dono do ws; o ADMIN e o dono do próprio curso
    // entram explicitamente porque o helper não os contempla.
    // 404 (não 403) para não confirmar a existência de curso de outro tenant.
    const isCourseOwnerEarly =
      user.role === "PRODUCER" &&
      (course.ownerId === user.id || course.workspace.ownerId === user.id);
    const allowedInTenant =
      user.role === "ADMIN" ||
      isCourseOwnerEarly ||
      // PORTA 3 — estrutura do curso (o que a página do curso carrega).
      (await hasWorkspaceAccess(user.id, course.workspace.id, {
        requireMemberPermission: true,
      }));
    if (!allowedInTenant) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    await ensureMenuDefaults(course.id);

    const [
      enrollment,
      overrideRows,
      agg,
      myReview,
      menuItems,
      enrollmentCount,
    ] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      }),
      prisma.enrollmentOverride
        .findMany({
          where: {
            enrollment: { userId: user.id, courseId: course.id },
            released: true,
          },
          select: { moduleId: true, lessonId: true },
        })
        .catch(() => []),
      prisma.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      }),
      prisma.menuItem.findMany({
        where: { courseId: course.id },
        orderBy: { order: "asc" },
      }),
      course.showStudentCount
        ? prisma.enrollment.count({
            where: { courseId: course.id, status: "ACTIVE" },
          })
        : Promise.resolve(0),
    ]);

    // viewerWorkspace reflects the workspace of THIS course, not User.workspaceId —
    // this is what populates useUserStore.workspace and drives "Voltar à vitrine".
    const viewerWorkspace = {
      slug: course.workspace.slug,
      name: course.workspace.name,
      logoUrl: course.workspace.logoUrl,
    };

    const filteredMenu = menuItems.filter((m) => {
      if (!course.communityEnabled && m.label === "Comunidade") return false;
      return true;
    });

    const isCourseOwner =
      user.role === "PRODUCER" &&
      (course.ownerId === user.id || course.workspace.ownerId === user.id);
    const isStaffViewer = user.role === "ADMIN" || isCourseOwner;
    const hasAccess = isStaffViewer || isEnrollmentActive(enrollment);
    // ───────────────────────────────────────────────────────────────────
    // 9.172 — RÉGUA DA TELA DE MÓDULO. Abre: matrícula ATIVA · produtor dono ·
    // ADMIN · colaborador COM ESTE curso no escopo. Matrícula VENCIDA vê a
    // vitrine mas NÃO abre o curso — mudança de comportamento DELIBERADA.
    //
    // ⚠️ POR QUE UM PARÂMETRO, e por que ele NÃO é bypass: esta rota serve
    // DUAS telas com regras diferentes. A PÁGINA DE VENDA (`course/[slug]/
    // page.tsx:392` → `<CoursePreview>`) depende de o não-matriculado receber
    // 200 — está escrito no gate de tenant acima, e quebrar isso quebra o
    // checkout. A TELA DE MÓDULO não tem contraparte de receita: seu único
    // link nasce com `hasAccess === true` (`page.tsx:154`). Omitir o parâmetro
    // não destrava nada — devolve a MESMA resposta da página de venda, que
    // quem passou no gate de tenant já podia pedir. O parâmetro só FECHA.
    //
    // ⚠️ `hasAccess` é reusado como as 3 primeiras vias porque é literalmente
    // a mesma fórmula (`isStaffViewer || isEnrollmentActive`), com o
    // short-circuit de ADMIN/dono ANTES do vínculo (lição 9.63). A 4ª via é o
    // colaborador: `collaboratorCanActOnCourse` já embute a guarda
    // cross-tenant e o escopo por curso (`collaborator.ts:20-26`).
    // ⓘ `courseIds` vazio significa "todos os cursos do workspace" — semântica
    // existente da casa, não decisão desta mudança.
    if (scope === "module" && !hasAccess) {
      const collabOnThisCourse = await collaboratorCanActOnCourse(
        user.id,
        course.id,
        [MEMBER_AREA_PERMISSION]
      );
      if (!collabOnThisCourse) {
        // 404 e não 403, pelo mesmo motivo do gate de tenant acima.
        return NextResponse.json(
          { error: "Curso não encontrado" },
          { status: 404 }
        );
      }
    }

    const isExpired =
      !!enrollment &&
      enrollment.status === "ACTIVE" &&
      !!enrollment.expiresAt &&
      enrollment.expiresAt.getTime() < Date.now();

    const releasedModules = overrideRows
      .filter((o) => o.moduleId)
      .map((o) => o.moduleId as string);
    const releasedLessons = overrideRows
      .filter((o) => o.lessonId)
      .map((o) => o.lessonId as string);

    const automationLocks = isStaffViewer ? {} : await getAutomationLocks(course.id, user.id);

    prisma.user.update({ where: { id: user.id }, data: { lastAccessAt: new Date() } }).catch(() => {});

    const lessonIdsInCourse = course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id)
    );
    const lastAccess = lessonIdsInCourse.length
      ? await prisma.lessonProgress.findFirst({
          where: {
            userId: user.id,
            lessonId: { in: lessonIdsInCourse },
            lastAccessedAt: { not: null },
          },
          orderBy: { lastAccessedAt: "desc" },
          select: { lessonId: true },
        })
      : null;
    const firstLessonId = course.modules[0]?.lessons[0]?.id ?? null;
    const lastAccessedLesson = lastAccess?.lessonId ?? firstLessonId;

    const modulesWithResume = course.modules.map((m) => {
      const sorted = [...m.lessons].sort((a, b) => a.order - b.order);
      const firstIncomplete = sorted.find(
        (l) => !l.progress?.some((p) => p.completed)
      );
      const firstIncompleteLesson =
        firstIncomplete?.id ?? sorted[0]?.id ?? null;
      return { ...m, firstIncompleteLesson };
    });

    const t2 = Date.now();
    logger.debug(
      `API /api/courses/by-slug/${params.slug}/init`,
      `auth:${t1 - t0}ms query:${t2 - t1}ms total:${t2 - t0}ms`
    );

    return NextResponse.json(
      {
        course: {
          ...course,
          modules: modulesWithResume,
          ratingAverage: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
          enrollmentCount: course.showStudentCount ? enrollmentCount : 0,
        },
        hasAccess,
        isStaffViewer,
        isExpired,
        enrollment,
        myReview,
        viewerWorkspace,
        overrides: { modules: releasedModules, lessons: releasedLessons },
        automationLocks,
        lastAccessedLesson,
        menu: filteredMenu,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error(`GET /api/courses/by-slug/${params.slug}/init error:`, error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
