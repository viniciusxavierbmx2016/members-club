import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasWorkspaceAccess } from "@/lib/workspace-access";
import {
  isBlockedViewer,
  getWorkspaceBlock,
  contactOf,
  SUSPENDED_MESSAGE,
} from "@/lib/workspace-block";
import { logger } from "@/lib/logger";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const t0 = Date.now();
  try {
    const [user, workspace] = await Promise.all([
      getCurrentUser(),
      prisma.workspace.findUnique({
        where: { slug: params.slug },
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          loginBgColor: true,
          accentColor: true,
          bannerUrl: true,
          bannerPosition: true,
          vitrineWelcomeText: true,
          vitrineWelcomeTitle: true,
          vitrineWelcomeEnabled: true,
          vitrineBannerFadeEnabled: true,
          vitrineBannerFadeColor: true,
          vitrineBannerFadeOpacity: true,
          isActive: true,
          ownerId: true,
        },
      }),
    ]);
    const t1 = Date.now();

    if (!workspace || !workspace.isActive) {
      return NextResponse.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }
    if (!user) {
      logger.debug(
        `API /api/w/${params.slug}/init`,
        `auth+ws:${t1 - t0}ms total:${t1 - t0}ms (unauth)`
      );
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    // Isolation gate: every role except ADMIN must prove workspace access.
    // hasWorkspaceAccess covers enrollment + accepted collaborator + owner,
    // so the workspace owner and legitimate members pass; staff from ANOTHER
    // workspace is rejected. Mirrors the gate in the workspace login route.
    if (user.role !== "ADMIN") {
      // PORTA 2 — vitrine.
      const allowed = await hasWorkspaceAccess(user.id, workspace.id, {
        requireMemberPermission: true,
        // E4.4 §12.3 — PORTA 2, a vitrine. É o objetivo do cadastro: quem tem a
        // marca vê a LOJA do produtor. O payload daqui é catálogo, não conteúdo.
        allowMembership: true,
      });
      if (!allowed) {
        return NextResponse.json(
          { error: "Você não tem acesso a esta área de membros" },
          { status: 403 }
        );
      }
    }

    // FASE 6B fatia 2 — o recorte passou de INCLUSÃO (STUDENT‖COLLABORATOR) para
    // EXCLUSÃO (todos, menos o dono do ws e o ADMIN). Mudança de comportamento
    // deliberada: PRODUCER-aluno de outro ws e ADMIN_COLLABORATOR passam a ser
    // bloqueados. O dono e o ADMIN continuam entrando.
    // Ordem: DECIDE quem → SÓ ENTÃO consulta.
    if (isBlockedViewer(user, workspace.ownerId)) {
      const block = await getWorkspaceBlock(workspace.id);
      if (block.blocked) {
        return NextResponse.json(
          {
            suspended: true,
            error: SUSPENDED_MESSAGE,
            contact: contactOf(block.owner, null, block.workspace),
          },
          { status: 503 }
        );
      }
    }

    const [enrollments, unreadCount] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        select: { courseId: true, expiresAt: true },
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    const enrolledIds = enrollments.map((e) => e.courseId);
    const now = Date.now();
    const expiredSet = new Set(
      enrollments
        .filter((e) => e.expiresAt && e.expiresAt.getTime() < now)
        .map((e) => e.courseId)
    );
    const expiresAtMap = new Map(
      enrollments.map((e) => [e.courseId, e.expiresAt])
    );

    const isWorkspaceOwner =
      user.role === "PRODUCER" && workspace.ownerId === user.id;
    const isStaffViewer = user.role === "ADMIN" || isWorkspaceOwner;
    const canManageCourse = (ownerId: string | null | undefined) =>
      user.role === "ADMIN" ||
      isWorkspaceOwner ||
      (user.role === "PRODUCER" && ownerId === user.id);

    const [enrolledCourses, storeCourses] = await Promise.all([
      prisma.course.findMany({
        where: {
          id: { in: enrolledIds },
          isPublished: true,
          workspaceId: workspace.id,
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          thumbnailPosition: true,
          checkoutUrl: true,
          ownerId: true,
          reviewsEnabled: true,
          // ⚠️ Este select e o da loja (abaixo) são DOIS e precisam do campo nos
          // dois. Faltando num deles, o curso chega sem `showAccessBadge` e o
          // `!== false` do card cai em MOSTRAR — metade da vitrine ignoraria o
          // toggle sem erro nenhum.
          showAccessBadge: true,
          memberBgColor: true,
          memberSidebarColor: true,
          memberHeaderColor: true,
          memberCardColor: true,
          memberPrimaryColor: true,
          memberTextColor: true,
          memberWelcomeText: true,
          memberLayoutStyle: true,
          featured: true,
          category: true,
          modules: {
            select: {
              id: true,
              lessons: {
                select: {
                  id: true,
                  progress: {
                    where: { userId: user.id },
                    select: { completed: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: {
          id: { notIn: enrolledIds },
          workspaceId: workspace.id,
          ...(isStaffViewer
            ? {}
            : { isPublished: true, showInStore: true }),
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          thumbnailPosition: true,
          checkoutUrl: true,
          price: true,
          priceCurrency: true,
          /* E4.4 2-B — a etiqueta da vitrine. SÓ no select da LOJA: quem já
             tem o curso não vê etiqueta nenhuma (nem "Gratuito" nem
             "Bloqueado"), então o select dos matriculados não precisa. */
          isFree: true,
          ownerId: true,
          reviewsEnabled: true,
          // O par do select de cima — ver o aviso lá. Mesma posição relativa de
          // propósito, para os dois lerem iguais.
          showAccessBadge: true,
          memberBgColor: true,
          memberSidebarColor: true,
          memberHeaderColor: true,
          memberCardColor: true,
          memberPrimaryColor: true,
          memberTextColor: true,
          memberWelcomeText: true,
          memberLayoutStyle: true,
          featured: true,
          category: true,
        },
      }),
    ]);

    const allIds = [
      ...enrolledCourses.map((c) => c.id),
      ...storeCourses.map((c) => c.id),
    ];
    const ratings = allIds.length
      ? await prisma.review.groupBy({
          by: ["courseId"],
          where: { courseId: { in: allIds } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const ratingMap = new Map(
      ratings.map((r) => [
        r.courseId,
        { average: r._avg.rating ?? 0, count: r._count.rating },
      ])
    );
    const withRating = <
      T extends { id: string; ownerId?: string | null; reviewsEnabled?: boolean }
    >(
      c: T
    ) => {
      const { ownerId: _ownerId, ...rest } = c;
      void _ownerId;
      const showReviews = c.reviewsEnabled !== false;
      return {
        ...rest,
        ratingAverage: showReviews ? ratingMap.get(c.id)?.average ?? 0 : 0,
        ratingCount: showReviews ? ratingMap.get(c.id)?.count ?? 0 : 0,
        canManage: canManageCourse(c.ownerId),
      };
    };
    const withExpired = <T extends { id: string; ownerId?: string | null }>(
      c: T
    ) => ({
      ...withRating(c),
      isExpired: expiredSet.has(c.id),
      expiresAt: expiresAtMap.get(c.id) ?? null,
    });

    const t2 = Date.now();
    logger.debug(
      `API /api/w/${params.slug}/init`,
      `auth+ws:${t1 - t0}ms query:${t2 - t1}ms total:${t2 - t0}ms`
    );

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          points: user.points,
          level: user.level,
          role: user.role,
        },
        workspace: {
          id: workspace.id,
          slug: workspace.slug,
          name: workspace.name,
          logoUrl: workspace.logoUrl,
          loginBgColor: workspace.loginBgColor,
          accentColor: workspace.accentColor,
          bannerUrl: workspace.bannerUrl,
          bannerPosition: workspace.bannerPosition,
          vitrineWelcomeText: workspace.vitrineWelcomeText,
          vitrineWelcomeTitle: workspace.vitrineWelcomeTitle,
          vitrineWelcomeEnabled: workspace.vitrineWelcomeEnabled,
          vitrineBannerFadeEnabled: workspace.vitrineBannerFadeEnabled,
          vitrineBannerFadeColor: workspace.vitrineBannerFadeColor,
          vitrineBannerFadeOpacity: workspace.vitrineBannerFadeOpacity,
        },
        enrolled: enrolledCourses.map(withExpired),
        store: storeCourses.map(withRating),
        categories: Array.from(
          new Set(
            [...enrolledCourses, ...storeCourses]
              .map((c) => (c as { category?: string | null }).category)
              .filter((c): c is string => !!c)
          )
        ).sort(),
        notifications: { unread: unreadCount },
      },
      {
        /* E4.4 2-C — era `private, max-age=30, stale-while-revalidate=60`, e os
           30 segundos de licença ao cache do NAVEGADOR faziam a vitrine mentir
           no caminho principal do funil: o aluno resgatava um curso gratuito,
           voltava, e o curso continuava em "Outros cursos" — só migrava depois
           de um refresh forçado. MEDIDO no palco: o servidor responde certo
           IMEDIATAMENTE (o `curl`, que não tem cache, já traz o curso em
           `enrolled` no instante seguinte ao resgate). O estado velho era só a
           resposta guardada no browser.

           É o mesmo defeito do 9.118 (o menu do curso), e o mesmo remédio:
           `no-store`. Cache de leitura na frente de uma tela que a própria
           navegação MUTA é uma armadilha — nenhuma mutação consegue furá-lo,
           porque cache de navegador não é invalidável pelo servidor.

           ⚠️ Conferido antes de mexer, como o 9.118 ensinou: o ÚNICO consumidor
           desta rota é `app/w/[slug]/page.tsx:135`, a própria vitrine. Os
           outros dois "hits" do grep são strings de LOG dentro deste arquivo.
           Ninguém mais se beneficiava do cache. */
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(`GET /api/w/${params.slug}/init error:`, error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
