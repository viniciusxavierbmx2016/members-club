import { notFound } from "next/navigation";
import { getCourseMeta } from "@/lib/course-meta";
import {
  getCurrentUser,
  isEnrollmentActive,
  getCollaboratorContext,
} from "@/lib/auth";
import {
  isBlockedViewer,
  getWorkspaceBlock,
  contactOf,
} from "@/lib/workspace-block";
import { WorkspaceSuspendedNotice } from "@/components/workspace-suspended-notice";
import { prisma } from "@/lib/prisma";
import { CourseShell } from "@/components/course-shell";
import { CourseSupportWidget } from "@/components/course-support-widget";
import { WorkspaceThemeLock } from "@/components/workspace-theme-lock";
import { contrastingTextColor } from "@/lib/color-utils";
import { PRODUCER_THEME_DEFAULTS } from "@/lib/theme-constants";
import type { EnrollmentStatus } from "@prisma/client";

export default async function CourseSlugLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const { children } = props;

  const course = await getCourseMeta(slug);
  if (!course) {
    notFound();
  }

  // Buscar forceTheme do workspace para WorkspaceThemeLock.
  // Cosmetic-only query — on failure we fall back to no force (user's
  // own theme wins) instead of crashing the whole course tree.
  let forceTheme: string | null = null;
  // VIRADA · o interruptor por workspace. Entra no MESMO select do forceTheme —
  // zero query nova. FAIL-SAFE: qualquer falha deixa `false`, ou seja, o tema de
  // hoje. Um soluço de rede nunca vira a identidade de ninguém.
  let viradaLigada = false;
  try {
    const ws = await prisma.workspace.findUnique({
      where: { id: course.workspace!.id },
      select: { forceTheme: true, memberBrandDefault: true },
    });
    forceTheme = ws?.forceTheme ?? null;
    viradaLigada = ws?.memberBrandDefault ?? false;
  } catch (err) {
    console.error("[COURSE_LAYOUT] workspace theme query failed", err);
    forceTheme = null;
    viradaLigada = false;
  }

  // Verificar acesso (ADMIN | PRODUCER dono do curso/workspace | enrollment ativo)
  let hasAccess = false;
  let isStudentAccess = false; // F2: only enrolled students get the support widget
  // ⚠️ COSMÉTICO. Só governa a classe `.course-customized` no modo preview —
  // nunca `hasAccess`. Existe porque as `--member-*` vão para todos, mas as ~109
  // regras de override vivem na classe, que só existia no shell completo: o
  // colaborador sem matrícula via o fundo do produtor com cards e acentos crus.
  let themeInPreview = false;
  const user = await getCurrentUser();
  if (user) {
    const isCourseOwner =
      user.role === "PRODUCER" &&
      (course.ownerId === user.id || course.workspace!.ownerId === user.id);
    const isStaffViewer = user.role === "ADMIN" || isCourseOwner;

    if (isStaffViewer) {
      hasAccess = true;
    } else {
      // FAIL CLOSED: if the DB didn't confirm enrollment, we treat it as
      // no access. A transient Prisma blip must NEVER grant a non-paying
      // viewer the enrolled-student UI. isEnrollmentActive(null) is
      // defined to return false, so the fallback chain is type-safe.
      let enrollment: { status: EnrollmentStatus; expiresAt: Date | null } | null = null;
      try {
        enrollment = await prisma.enrollment.findFirst({
          where: { userId: user.id, courseId: course.id },
          select: { status: true, expiresAt: true },
        });
      } catch (err) {
        console.error(
          "[COURSE_LAYOUT] enrollment query failed — failing closed (no access)",
          err
        );
        enrollment = null;
        // O ACESSO segue fail-closed (acima) — isto não o afrouxa. Mas o TEMA
        // não precisa ser punido por um soluço de rede: "não confirmei sua
        // matrícula" é diferente de "você não tem", e apagar as cores do
        // produtor para um aluno legítimo é regressão visível causada por erro
        // transitório. Só a classe cosmética sobrevive; o shell, não.
        themeInPreview = true;
      }
      hasAccess = isEnrollmentActive(enrollment);
      isStudentAccess = hasAccess;

      // Colaborador aceito DESTE workspace: entra na comunidade do curso para
      // moderar (as APIs já o autorizam) e merece ver o curso com as cores do
      // produtor, não com o Tailwind cru. `getCollaboratorContext` é por userId
      // e cache()d — cego ao role, então cobre o híbrido do C5.
      // ⚠️ Escopo deliberado: NÃO se aplica a visitante sem vínculo. Um `.
      // course-customized` incondicional aqui mudaria a cara da PÁGINA DE VENDA
      // de todo curso customizado, que é superfície de receita e não foi pedida.
      if (!hasAccess && !themeInPreview) {
        try {
          const ctx = await getCollaboratorContext(user.id);
          themeInPreview = ctx?.workspaceId === course.workspace!.id;
        } catch (err) {
          console.error("[COURSE_LAYOUT] collaborator lookup failed (cosmetic)", err);
          themeInPreview = false;
        }
      }
    }
  }

  // FASE 6B fatia 2 — bloqueio por plano do produtor. Cobre página do curso,
  // módulo, aula e comunidade de uma vez (o layout envolve as 4 rotas).
  // ⚠️ SSR: protege o RENDER. A API do player (/api/lessons/[id]/view) tem o
  // mesmo bloqueio — bloquear só um deixa o outro servindo.
  // ⚠️ Contato: getCourseMeta NÃO traz supportEmail/supportWhatsapp (só
  // showLessonSupport e as cores do botão), e esta fatia não toca a peça
  // compartilhada — aqui o contato é o do DONO. Trazer o suporte do curso ao
  // meta é candidato próprio.
  if (isBlockedViewer(user, course.workspace!.ownerId)) {
    const block = await getWorkspaceBlock(course.workspace!.id);
    if (block.blocked) {
      return (
        <WorkspaceSuspendedNotice
          contact={contactOf(block.owner, null, block.workspace)}
        />
      );
    }
  }

  const personalizou = !!(
    course.memberBgColor ||
    course.memberSidebarColor ||
    course.memberHeaderColor ||
    course.memberCardColor ||
    course.memberPrimaryColor ||
    course.memberTextColor
  );

  // VIRADA · a marca EFETIVA. Com o interruptor desligado (o estado de hoje em
  // 44 de 44 workspaces) isto é `memberPrimaryColor ?? null` — o valor de sempre.
  //
  // ⛔ O BANCO DO CURSO NÃO É TOCADO: `memberPrimaryColor` continua NULL. O
  // produtor segue distinguindo "nunca escolhi" de "escolhi esta cor", e a
  // virada vive só aqui.
  //
  // ⭐ Regra A (decisão do dono): quem não tem MARCA recebe o padrão, mesmo que
  // tenha personalizado OUTRO campo — são 4 cursos com `memberBgColor` e sem
  // marca. A alternativa deixaria fundo personalizado com acento azul enquanto
  // o resto do produto é lime.
  //
  // ⓘ A cor vem de `lib/theme-constants.ts` para não nascer um segundo hex da
  // mesma marca (a família hardcode-vs-tema). ⚠️ O comentário de escopo daquele
  // arquivo (`:24-30`) diz que a área de membros não passa por ali — deixa de
  // valer com esta fatia, e a correção é item próprio.
  const marca =
    course.memberPrimaryColor ??
    (viradaLigada ? PRODUCER_THEME_DEFAULTS.primaryColor : null);

  const hasCustomization = personalizou || !!marca;

  // CSS vars SSR — só inclui campos customizados (fallbacks cobrem o resto)
  const memberVars = [
    course.memberBgColor && `--member-bg: ${course.memberBgColor}`,
    course.memberSidebarColor && `--member-sidebar: ${course.memberSidebarColor}`,
    course.memberHeaderColor && `--member-header: ${course.memberHeaderColor}`,
    course.memberCardColor && `--member-card: ${course.memberCardColor}`,
    marca && `--member-primary: ${marca}`,
    // A1 · calculada da marca por max-contraste; NÃO emitida sem marca própria
    marca && `--member-button-text: ${contrastingTextColor(marca)}`,
    // FATIA 1/3 · a marca ESCURECIDA, para servir de TINTA no modo claro.
    // ⚠️ NADA a consome ainda — as regras de `html:not(.dark)` são a fatia 2/3.
    //
    // ⭐ `color-mix` e não `darkenHex`: a função do repo recebe um `amount`
    // PRONTO, e o repo não tem quem CALCULE o amount necessário por marca
    // (medido: −0% no `#000000`, −54% no `#ffffff`). `color-mix` já é o
    // mecanismo da casa — 63 regras no `globals.css` — e resolve sem código.
    //
    // ⭐ 45% é SUFICIENTE PARA QUALQUER MARCA, e a prova é o limite: nenhuma
    // cor tem luminância maior que a do branco, e `#ffffff` a 45% vira
    // `#737373` = 4,74 sobre branco. Varredura de 4096 cores: 0 falham.
    marca && `--member-ink: color-mix(in srgb, ${marca} 45%, black)`,
    course.memberTextColor && `--member-text: ${course.memberTextColor}`,
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <WorkspaceThemeLock forceTheme={forceTheme}>
      {memberVars && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${memberVars}}`,
          }}
        />
      )}
      <CourseShell
        course={{
          id: course.id,
          slug: course.slug,
          title: course.title,
          bannerUrl: course.bannerUrl,
          workspace: course.workspace!,
          termsContent: course.termsContent,
          termsFileUrl: course.termsFileUrl,
        }}
        hasAccess={hasAccess}
        hasCustomization={hasCustomization}
        themeInPreview={themeInPreview}
      >
        {children}
      </CourseShell>
      {/* F2 — Per-course support widget. Only for enrolled students (the API
          would 403 staff anyway) and only when the producer hasn't disabled
          showLessonSupport for this course. */}
      {isStudentAccess && course.showLessonSupport && (
        <CourseSupportWidget
          courseId={course.id}
          courseTitle={course.title}
          buttonColor={course.supportButtonColor}
          buttonImage={course.supportButtonImage}
        />
      )}
    </WorkspaceThemeLock>
  );
}
