"use client";

import { type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/help-tooltip";
import { inputClass, labelClass } from "../_lib/helpers";
import type { RegisterTemplate, RegisterTitleAlign } from "../_types";

/**
 * Aba "Personalizar Cadastro" — irmã da de login, mesma estrutura de seções.
 *
 * ⛔ FATIA 1 de 2: aqui só se GRAVA. A tela do aluno (`/w/<slug>/register`)
 * ainda não lê nenhum destes campos — ela entra na fatia 2. Por isso nada do
 * que se salva nesta aba muda pixel para quem se cadastra hoje.
 *
 * ⓘ Cores, logo e imagem de fundo NÃO vivem aqui: são os campos `login*`, que
 * as quatro telas de autenticação compartilham. O cartão do fim manda para lá.
 */

/** Teto do atraso do botão: 10 minutos. Acima disso o visitante já foi embora,
 *  e um valor sem teto deixaria o produtor inutilizar o próprio cadastro. */
export const MAX_BUTTON_DELAY_SEC = 600;

interface RegisterTabProps {
  registerTemplate: RegisterTemplate;
  setRegisterTemplate: Dispatch<SetStateAction<RegisterTemplate>>;
  registerVideoUrl: string;
  setRegisterVideoUrl: Dispatch<SetStateAction<string>>;
  registerButtonDelaySec: number;
  setRegisterButtonDelaySec: Dispatch<SetStateAction<number>>;
  registerButtonText: string;
  setRegisterButtonText: Dispatch<SetStateAction<string>>;
  registerTitle: string;
  setRegisterTitle: Dispatch<SetStateAction<string>>;
  registerSubtitle: string;
  setRegisterSubtitle: Dispatch<SetStateAction<string>>;
  registerSubtitleEnabled: boolean;
  setRegisterSubtitleEnabled: Dispatch<SetStateAction<boolean>>;
  registerTitleAlign: RegisterTitleAlign;
  setRegisterTitleAlign: Dispatch<SetStateAction<RegisterTitleAlign>>;
  /** Leva para a aba "Personalizar Login" — a aba é estado do cliente, então
   *  não dá para linkar por URL; quem sabe trocar é a página. */
  onGoToLoginTab: () => void;
}

const TEMPLATES: Array<{
  key: RegisterTemplate;
  label: string;
  hint: string;
}> = [
  { key: "classico", label: "Clássico", hint: "O formulário como é hoje" },
  { key: "video", label: "Vídeo", hint: "Vídeo acima, botão que aparece depois" },
];

export function RegisterTab({
  registerTemplate,
  setRegisterTemplate,
  registerVideoUrl,
  setRegisterVideoUrl,
  registerButtonDelaySec,
  setRegisterButtonDelaySec,
  registerButtonText,
  setRegisterButtonText,
  registerTitle,
  setRegisterTitle,
  registerSubtitle,
  setRegisterSubtitle,
  registerSubtitleEnabled,
  setRegisterSubtitleEnabled,
  registerTitleAlign,
  setRegisterTitleAlign,
  onGoToLoginTab,
}: RegisterTabProps) {
  const isVideo = registerTemplate === "video";

  return (
    <div>
      {/* Modelo */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
          Modelo
          <HelpTooltip text="Escolha como a tela de cadastro aparece para quem ainda não tem conta: o formulário direto, ou um vídeo com o botão liberado depois." />
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Escolha como a tela de cadastro aparece
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRegisterTemplate(opt.key)}
              className={cn(
                "group rounded-xl p-4 transition flex flex-col items-start gap-1 text-left",
                registerTemplate === opt.key
                  ? "border-2 border-[#191919] dark:border-primary bg-primary/5"
                  : "border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20"
              )}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {opt.label}
              </span>
              <span className="text-[11px] text-gray-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vídeo */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
          Vídeo
          <HelpTooltip text="Aceita YouTube, Vimeo, Panda Video e VTurb — os mesmos provedores das aulas." />
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {isVideo
            ? "O vídeo aparece acima do formulário"
            : "Preencha para usar no modelo Vídeo — no Clássico estes campos ficam guardados e não aparecem"}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Link do vídeo</label>
            <input
              type="text"
              value={registerVideoUrl}
              onChange={(e) => setRegisterVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              maxLength={2000}
              className={inputClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              YouTube, Vimeo, Panda ou VTurb
            </p>
          </div>
          <div>
            <label className={labelClass}>Botão aparece depois de</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={MAX_BUTTON_DELAY_SEC}
                value={registerButtonDelaySec}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setRegisterButtonDelaySec(
                    Number.isFinite(n)
                      ? Math.min(Math.max(n, 0), MAX_BUTTON_DELAY_SEC)
                      : 0
                  );
                }}
                className={inputClass}
              />
              <span className="text-xs text-gray-500 shrink-0">segundos</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              0 = aparece junto com a página · máx. {MAX_BUTTON_DELAY_SEC}
            </p>
          </div>
          <div>
            <label className={labelClass}>Texto do botão</label>
            <input
              type="text"
              value={registerButtonText}
              onChange={(e) => setRegisterButtonText(e.target.value)}
              placeholder="Criar conta"
              maxLength={40}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Textos */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
          Textos
          <HelpTooltip text="Título e texto de apoio da tela de cadastro. Em branco, a tela usa os textos padrão." />
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Mensagens que aparecem na tela de cadastro
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              value={registerTitle}
              onChange={(e) => setRegisterTitle(e.target.value)}
              placeholder="Criar conta"
              maxLength={80}
              className={inputClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Em branco = o texto padrão de hoje
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={cn(labelClass, "mb-0")}>
                Texto abaixo do título
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={registerSubtitleEnabled}
                aria-label="Mostrar o texto abaixo do título"
                onClick={() => setRegisterSubtitleEnabled((v) => !v)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors shrink-0",
                  registerSubtitleEnabled
                    ? "bg-primary"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    registerSubtitleEnabled
                      ? "translate-x-[16px]"
                      : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <input
              type="text"
              value={registerSubtitle}
              onChange={(e) => setRegisterSubtitle(e.target.value)}
              placeholder="Preencha seus dados para acessar a área de membros"
              maxLength={120}
              disabled={!registerSubtitleEnabled}
              className={cn(
                inputClass,
                !registerSubtitleEnabled && "opacity-50 cursor-not-allowed"
              )}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {registerSubtitleEnabled
                ? "Em branco = o texto padrão de hoje"
                : "Desligado — nada aparece abaixo do título"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Alinhamento do título</label>
            <div className="flex gap-2">
              {(
                [
                  { key: "left", label: "Esquerda" },
                  { key: "center", label: "Centro" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRegisterTitleAlign(opt.key)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium transition",
                    registerTitleAlign === opt.key
                      ? "border-2 border-[#191919] dark:border-primary bg-primary/5 text-gray-900 dark:text-white"
                      : "border border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-400 dark:hover:border-white/20"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Vale só no modelo Vídeo — no Clássico o título segue centralizado
            </p>
          </div>
        </div>
      </div>

      {/* De onde vêm as cores */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          As cores, o logo e a imagem de fundo da tela de cadastro vêm da aba{" "}
          <button
            type="button"
            onClick={onGoToLoginTab}
            className="font-medium text-gray-900 dark:text-primary hover:underline"
          >
            Personalizar Login
          </button>
          {" "}— são os mesmos campos das telas de login, recuperação e
          redefinição de senha.
        </p>
      </div>
    </div>
  );
}
