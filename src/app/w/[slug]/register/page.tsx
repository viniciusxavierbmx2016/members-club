import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkspaceRegisterForm } from "@/components/workspace-register-form";
import { WorkspaceRegisterVideo } from "@/components/workspace-register-video";
import { parseVideoUrl } from "@/lib/video";
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
      // 9.344 fatia 2 — os campos do modelo de cadastro.
      registerTemplate: true,
      registerVideoUrl: true,
      registerButtonDelaySec: true,
      registerButtonText: true,
      registerTitle: true,
      registerSubtitle: true,
      registerSubtitleEnabled: true,
      registerTitleAlign: true,
      registerShowBrand: true,
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

  // Texto de apoio: o interruptor manda, e ele vale nos DOIS modelos.
  const apoioLigado = workspace.registerSubtitleEnabled !== false;
  const textoDeApoio = apoioLigado ? workspace.registerSubtitle : null;

  // ⭐ QUEDA PARA O CLÁSSICO, e é deliberada: modelo "video" sem link salvo, ou
  // com link que o interpretador não reconhece, NÃO mostra caixa vazia — serve
  // a tela de hoje. Caixa vazia numa página pública de cadastro custa uma
  // conversão; a tela de sempre não custa nada.
  const video = workspace.registerVideoUrl
    ? parseVideoUrl(workspace.registerVideoUrl)
    : null;
  const usarVideo =
    workspace.registerTemplate === "video" &&
    !!video &&
    video.provider !== "unknown" &&
    !!video.videoId;

  if (usarVideo) {
    return (
      <WorkspaceRegisterVideo
        workspace={workspaceForForm}
        slug={slug}
        video={video}
        titulo={workspace.registerTitle || "Criar conta"}
        alinharTituloAoCentro={workspace.registerTitleAlign === "center"}
        textoDoBotao={workspace.registerButtonText || "Criar conta"}
        segundosAteOBotao={workspace.registerButtonDelaySec ?? 0}
        textoDeApoio={textoDeApoio}
        mostrarMarca={workspace.registerShowBrand !== false}
      />
    );
  }

  // CLÁSSICO. ⛔ Sem campo preenchido, tudo abaixo é `null`/`undefined` e o
  // formulário cai exatamente no texto de hoje — é o que o V6 prova.
  return (
    <WorkspaceRegisterForm
      workspace={workspaceForForm}
      slug={slug}
      titulo={workspace.registerTitle}
      subtitulo={textoDeApoio}
      esconderSubtitulo={!apoioLigado}
    />
  );
}
