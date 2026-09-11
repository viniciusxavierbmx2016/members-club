import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkspaceRegisterForm } from "@/components/workspace-register-form";
import type {
  LoginLayout,
  WorkspaceAuthInfo,
} from "@/components/workspace-auth-shell";

/**
 * E4.4 etapa 2, fatia 2 — a TELA de cadastro público do workspace.
 *
 * Molde: `w/[slug]/forgot-password/page.tsx`, copiado campo a campo — mesmo
 * `select` de 19 colunas, mesmo `notFound()` para workspace ausente OU inativo,
 * mesmo cast de `loginLayout`. ⛔ Nada foi inventado aqui.
 */
export default async function WorkspaceRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      isActive: true,
      loginLayout: true,
      loginBgImageUrl: true,
      loginBgColor: true,
      loginPrimaryColor: true,
      loginLogoUrl: true,
      loginTitle: true,
      loginSubtitle: true,
      loginBoxColor: true,
      loginBoxOpacity: true,
      loginSideColor: true,
      loginLinkColor: true,
      loginTextColor: true,
      loginSecondaryTextColor: true,
      accentColor: true,
    },
  });

  // Mesma porta única de recusa das irmãs: ausente e inativo saem iguais.
  if (!workspace || !workspace.isActive) {
    notFound();
  }

  const workspaceForForm: WorkspaceAuthInfo = {
    ...workspace,
    loginLayout: workspace.loginLayout as LoginLayout | null,
  };

  return <WorkspaceRegisterForm workspace={workspaceForForm} slug={slug} />;
}
