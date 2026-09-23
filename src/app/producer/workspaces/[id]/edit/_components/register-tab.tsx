"use client";

import { type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/help-tooltip";
import { inputClass, labelClass } from "../_lib/helpers";
import type { RegisterTemplate, RegisterTitleAlign } from "../_types";
import { useMemo, useState } from "react";
import { WorkspaceHtmlFrame } from "@/components/workspace-html-frame";

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
  registerCustomHtml: string;
  setRegisterCustomHtml: Dispatch<SetStateAction<string>>;
  /** Leva para a aba "Personalizar Login" — a aba é estado do cliente, então
   *  não dá para linkar por URL; quem sabe trocar é a página. */
  onGoToLoginTab: () => void;
}

/** As cinco regras do quadro aprovado, no texto exato decidido pelo dono. */
const REGRAS_DO_HTML: Array<{ titulo: string; detalhe: string }> = [
  {
    titulo: "Um botão com data-mc-cadastro",
    detalhe:
      "É ele que abre o popup de cadastro. Pode haver mais de um na página.",
  },
  {
    titulo: "Vídeo só destes quatro",
    detalhe:
      "YouTube, Vimeo, Panda e VTurb. Player de outro domínio é bloqueado pelo navegador, e a página fica com um buraco no lugar dele.",
  },
  {
    titulo: "Sem script de fora",
    detalhe:
      "Pixel, chat e rastreador de outro domínio não carregam aqui. Deixe para a sua página de vendas.",
  },
  {
    titulo: "Sem formulário e sem campo de senha",
    detalhe:
      "Os campos, a senha e a verificação são nossos. Se o HTML tiver formulário ou campo de senha, o salvar recusa.",
  },
  {
    titulo: "Links não abrem",
    detalhe:
      "A página é só para o cadastro. Link para fora fica desativado, para o aluno não sair antes de criar a conta.",
  },
];

const TEMPLATES: Array<{
  key: RegisterTemplate;
  label: string;
  hint: string;
}> = [
  { key: "classico", label: "Clássico", hint: "O formulário como é hoje" },
  { key: "video", label: "Vídeo", hint: "Vídeo acima, botão que aparece depois" },
  { key: "html", label: "HTML próprio", hint: "Você cola o HTML da página" },
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
  registerCustomHtml,
  setRegisterCustomHtml,
  onGoToLoginTab,
}: RegisterTabProps) {
  const isVideo = registerTemplate === "video";
  const isHtml = registerTemplate === "html";
  const [avisoDoBotao, setAvisoDoBotao] = useState("");

  /**
   * O indicador usa o parser do PRÓPRIO NAVEGADOR (`DOMParser`), que é o mesmo
   * que vai montar a moldura — então ele enxerga exatamente o que o aluno verá.
   * ⚠️ A régua que DECIDE é a do servidor (`inspecionarHtmlDeCadastro`), e ela
   * lê por `sanitize-html`. Os dois foram confrontados em 6 amostras (maiúsculas,
   * espaços, quebra de linha, sem aspas, aspas simples) com o mesmo veredito nas
   * 6; se algum dia divergirem, o servidor vence e a mensagem dele aparece aqui
   * em cima, no mesmo lugar dos outros erros de salvar.
   */
  const achouBotao = useMemo(() => {
    if (!registerCustomHtml.trim()) return false;
    try {
      const doc = new DOMParser().parseFromString(
        registerCustomHtml,
        "text/html"
      );
      return doc.querySelector("[data-mc-cadastro]") !== null;
    } catch {
      return false;
    }
  }, [registerCustomHtml]);

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

      {/* ⭐ A tela mostra só o que vale para o modelo escolhido. Esconder NÃO
          apaga: os campos dos outros modelos continuam gravados e voltam
          inteiros quando o produtor trocar de volta — daí este aviso, para que
          ninguém pense que trocar de modelo perdeu o que já tinha escrito. */}
      <p className="text-[11px] text-gray-500 -mt-6 mb-8">
        Os campos dos outros modelos continuam guardados: trocar de modelo não
        apaga nada.
      </p>

      {/* HTML próprio — só quando este modelo está escolhido. */}
      {isHtml && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
            HTML próprio
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Você cola o HTML da página. O cadastro abre em popup quando o aluno
            clica no seu botão.
          </p>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Seu HTML</label>
              <textarea
                value={registerCustomHtml}
                onChange={(e) => setRegisterCustomHtml(e.target.value)}
                rows={16}
                spellCheck={false}
                maxLength={50000}
                placeholder={'<div>\n  <h1>Entre para a turma</h1>\n  <button data-mc-cadastro>Quero me inscrever</button>\n</div>'}
                className={cn(
                  inputClass,
                  "font-mono text-[12px] leading-relaxed resize-y"
                )}
              />
              <p
                className={cn(
                  "text-[11px] mt-1",
                  achouBotao ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {achouBotao
                  ? "Achamos o botão. Pode salvar."
                  : "Não achamos nenhum botão com data-mc-cadastro."}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {registerCustomHtml.length} de 50.000 caracteres
              </p>
            </div>

            <div>
              <label className={labelClass}>Pré-visualização</label>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white">
                {/* A MESMA moldura que a tela do aluno vai usar: sandbox só com
                    allow-scripts. ⭐ Aqui o clique no botão marcado NÃO abre o
                    cadastro de verdade — mostra o aviso, porque esta é a tela do
                    produtor, não a do aluno. */}
                <WorkspaceHtmlFrame
                  html={registerCustomHtml}
                  title="Pré-visualização do HTML do produtor"
                  aoPedirCadastro={() =>
                    setAvisoDoBotao(
                      "Botão reconhecido — no aluno, este botão abre o cadastro."
                    )
                  }
                />
              </div>
              {avisoDoBotao && (
                <p className="text-[11px] text-emerald-600 mt-2">
                  {avisoDoBotao}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              O que o seu HTML precisa ter
            </p>
            <ol className="space-y-2">
              {REGRAS_DO_HTML.map((r, i) => (
                <li key={r.titulo} className="flex gap-2">
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <span>
                    <span className="text-[12px] font-medium text-gray-900 dark:text-white">
                      {r.titulo}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      {r.detalhe}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Vídeo — só no modelo que a usa. ⛔ Esconder NÃO limpa: o valor
          segue no estado e continua sendo enviado no salvar, então quem
          volta para o modelo Vídeo reencontra o link como deixou. */}
      {isVideo && (
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
          Vídeo
          <HelpTooltip text="Aceita YouTube, Vimeo, Panda Video e VTurb — os mesmos provedores das aulas." />
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {isVideo
            ? "O vídeo aparece no topo da página. O cadastro abre em popup quando o aluno clica no botão."
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
      )}

      {/* Textos — no HTML próprio quem escreve os textos é o próprio HTML,
          então estes campos não valem ali. Continuam guardados. */}
      {!isHtml && (
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
                Texto de apoio
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={registerSubtitleEnabled}
                aria-label="Mostrar o texto de apoio"
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
                ? "No Clássico aparece abaixo do título; no Vídeo, abaixo do botão. Desligado, some da tela — o texto continua salvo."
                : "No Clássico aparece abaixo do título; no Vídeo, abaixo do botão. Desligado, some da tela — o texto continua salvo."}
            </p>
          </div>
          {isVideo && (
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
          )}
        </div>
      </div>
      )}

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
