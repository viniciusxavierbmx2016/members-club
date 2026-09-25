"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getLoginTheme,
  type WorkspaceAuthInfo,
} from "@/components/workspace-auth-shell";
import { WorkspaceRegisterPopup } from "@/components/workspace-register-popup";
import { VideoPlayer } from "@/components/video-player";
import type { ParsedVideo } from "@/lib/video";

/**
 * Modelo VÍDEO da tela de cadastro (9.344, fatia 2).
 *
 * ⛔ NÃO duplica o formulário: o popup monta o MESMO
 * `<WorkspaceRegisterForm semMoldura>` — mesmo estado, mesma rota, mesmo
 * submit. A moldura das outras telas não entra aqui porque este modelo tem
 * layout próprio (vídeo em cima, botão embaixo), aprovado no quadro.
 *
 * ⛔ Nenhuma cor, fonte ou logo é cravada: tudo vem de `getLoginTheme`, que é
 * o MESMO cálculo que as quatro telas de autenticação já usam.
 */
interface Props {
  workspace: WorkspaceAuthInfo;
  slug: string;
  video: ParsedVideo;
  titulo: string;
  alinharTituloAoCentro: boolean;
  textoDoBotao: string;
  segundosAteOBotao: number;
  textoDeApoio: string | null;
  /** ⭐ A linha do logo e do nome no topo. Padrão VERDADEIRO: com ela ligada
   *  a tela é byte a byte a de hoje — provado por comparação com a foto do
   *  antes. Só desligando é que algo some, e só esta linha some. */
  mostrarMarca: boolean;
}

export function WorkspaceRegisterVideo({
  workspace,
  slug,
  video,
  titulo,
  alinharTituloAoCentro,
  textoDoBotao,
  segundosAteOBotao,
  textoDeApoio,
  mostrarMarca,
}: Props) {
  const theme = getLoginTheme(workspace);

  // ⭐ O tempo conta do CARREGAMENTO DA PÁGINA, por decisão do dono: recarregar
  // zera. Não há estado guardado — quem recarrega espera de novo, e isso é
  // aceitável porque o atraso é recurso de conversão, não trava de segurança
  // (a trava de verdade é o captcha, no servidor).
  const [botaoVisivel, setBotaoVisivel] = useState(segundosAteOBotao <= 0);
  // Sem transição para quem pediu menos movimento — padrão da casa, o mesmo do
  // carrossel de banner (`course-banner-carousel.tsx`).
  const [menosMovimento, setMenosMovimento] = useState(false);
  const [popupAberto, setPopupAberto] = useState(false);

  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMenosMovimento(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (segundosAteOBotao <= 0) return;
    const id = setTimeout(
      () => setBotaoVisivel(true),
      segundosAteOBotao * 1000
    );
    return () => clearTimeout(id);
  }, [segundosAteOBotao]);

  function aoFechar() {
    setPopupAberto(false);
    botaoRef.current?.focus();
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-10"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Logo e nome do workspace — some inteiro quando o produtor desliga.
            ⛔ Nada mais se move: o `gap-6` do container é quem dava o espaço,
            e sem este filho ele simplesmente não existe. */}
        {mostrarMarca && (
        <div className="flex items-center justify-center gap-3">
          {theme.logoUrl ? (
            <Image
              src={theme.logoUrl}
              alt={theme.name}
              width={44}
              height={44}
              className="rounded-lg object-contain"
              unoptimized
            />
          ) : (
            <span
              className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.buttonTextColor,
              }}
              aria-hidden="true"
            >
              {theme.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-base font-medium">{theme.name}</span>
        </div>
        )}

        <h1
          className="text-2xl sm:text-3xl font-bold leading-tight"
          style={{
            color: theme.textColor,
            textAlign: alinharTituloAoCentro ? "center" : "left",
          }}
        >
          {titulo}
        </h1>

        {/* O vídeo, pelo player da casa — 16:9 por dentro (`aspect-video`). */}
        <div
          className="w-full rounded-xl overflow-hidden"
          role="region"
          aria-label={`Vídeo de apresentação de ${theme.name}`}
        >
          <VideoPlayer video={video} />
        </div>

        {/* ⭐ ANTES DO TEMPO O BOTÃO NÃO EXISTE NO HTML — não é `display:none`.
            Esconder por CSS deixaria o alvo acessível a quem inspeciona, e o
            combinado é que ele nasce depois. A região abaixo tem `aria-live`
            educado para que leitores de tela anunciem a chegada. */}
        <div
          aria-live="polite"
          className="flex flex-col items-center gap-3 min-h-[3rem]"
        >
          {botaoVisivel && (
            <>
              <button
                ref={botaoRef}
                type="button"
                onClick={() => setPopupAberto(true)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.buttonTextColor,
                  transition: menosMovimento ? "none" : "opacity 200ms ease-out",
                  animation: menosMovimento
                    ? undefined
                    : "fadeIn 200ms ease-out",
                }}
              >
                {textoDoBotao}
              </button>
              {textoDeApoio && (
                <p
                  className="text-sm text-center"
                  style={{ color: theme.textColorMuted }}
                >
                  {textoDeApoio}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* O POPUP, agora em componente próprio (9.371) e compartilhado com o
          modelo HTML próprio. ⛔ A extração NÃO mudou nada aqui: mesmo
          diálogo, mesmo formulário montado só na abertura, mesmas formas de
          fechar e o mesmo retorno de foco — quem devolve o foco continua
          sendo o `aoFechar` daqui, porque só esta tela sabe qual botão abriu. */}
      <WorkspaceRegisterPopup
        workspace={workspace}
        slug={slug}
        aberto={popupAberto}
        aoFechar={aoFechar}
      />
    </div>
  );
}
