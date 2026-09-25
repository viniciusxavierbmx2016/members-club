import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkspaceRegisterForm } from "@/components/workspace-register-form";
import { WorkspaceRegisterVideo } from "@/components/workspace-register-video";
import { WorkspaceRegisterHtml } from "@/components/workspace-register-html";
import { parseVideoUrl } from "@/lib/video";
import { inspecionarHtmlDeCadastro } from "@/lib/validations";
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
      // 9.372 — o HTML do produtor. A tela do aluno precisa dele para montar a
      // moldura isolada; sem isto no `select`, o campo some em silêncio.
      registerCustomHtml: true,
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

  // ⭐ RESERVA PARA O CLÁSSICO no modelo HTML, e a tela CONFERE POR CONTA
  // PRÓPRIA — não confia em o salvar ter validado, porque o valor pode ter
  // entrado por outro caminho ou a régua pode ter mudado depois. São três
  // casos, decididos pelo dono:
  //   (a) modelo "html" sem HTML salvo (nulo ou só espaço);
  //   (b) HTML que não passa na MESMA régua do salvar — inclusive o caso "sem
  //       elemento com data-mc-cadastro", que deixaria a pessoa numa página
  //       bonita e sem nenhum jeito de se cadastrar;
  //   (c) qualquer falha ao MONTAR a moldura — essa é do componente, numa
  //       fronteira de erro, porque só ela vê o filho não montar.
  // ⛔ Nada é sanitizado nem reescrito: a régua é a do salvar, lida de novo.
  const htmlSalvo = (workspace.registerCustomHtml ?? "").trim();
  const usarHtml =
    workspace.registerTemplate === "html" &&
    htmlSalvo.length > 0 &&
    inspecionarHtmlDeCadastro(htmlSalvo).ok;

  // O CLÁSSICO montado uma vez só: é o que a página devolve por padrão E é a
  // reserva que o modelo HTML recebe para o caso (c).
  const classico = (
    <WorkspaceRegisterForm
      workspace={workspaceForForm}
      slug={slug}
      titulo={workspace.registerTitle}
      subtitulo={textoDeApoio}
      esconderSubtitulo={!apoioLigado}
    />
  );

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

  if (usarHtml) {
    return (
      <WorkspaceRegisterHtml
        workspace={workspaceForForm}
        slug={slug}
        html={htmlSalvo}
        reserva={classico}
      />
    );
  }

  // CLÁSSICO. ⛔ Sem campo preenchido, tudo acima é `null`/`undefined` e o
  // formulário cai exatamente no texto de hoje — é o que o V6 prova.
  return classico;
}
