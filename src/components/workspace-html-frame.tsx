"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A MOLDURA ISOLADA do HTML próprio (9.352).
 *
 * ⛔ `sandbox="allow-scripts"` e NADA MAIS, por decisão do dono. Cada permissão
 * ausente foi medida em laboratório, nos dois motores:
 *   · sem `allow-same-origin` → o HTML do produtor não lê `document.cookie`,
 *     não alcança `parent.document`, e a requisição que ele fizer para o nosso
 *     domínio NÃO leva o cookie de sessão (no WebKit nem sai: `TypeError`).
 *     ⭐ É esta a permissão que separa "moldura" de "mesma origem" — com ela,
 *     o script do produtor lê a sessão de quem estiver vendo a página.
 *   · sem `allow-forms`    → nenhum formulário do produtor é enviado.
 *   · sem `allow-popups`   → nenhuma janela nova.
 *   · sem `allow-top-navigation-by-user-activation` → nem com clique o
 *     visitante é levado para fora.
 * A política de segurança da página é HERDADA aqui dentro (medido: script
 * embutido roda, script de fora é bloqueado), então o vídeo fica restrito aos
 * provedores que `frame-src` já libera — sem código nosso para isso.
 */

/** Teto de altura: o produtor não empurra a página para fora da tela. */
const ALTURA_MAXIMA = 5000;
const ALTURA_INICIAL = 320;

/**
 * ⭐ O NOSSO script vai no INÍCIO do documento, por decisão do dono, e escuta o
 * clique em fase de CAPTURA. Assim ele não depende de o HTML do produtor estar
 * bem formado nem de fechar as tags: o ouvinte já está instalado antes de
 * qualquer coisa dele ser interpretada, e o clique é visto na descida, antes
 * de qualquer `stopPropagation` que ele tenha escrito.
 *
 * ⛔ O produtor NÃO escreve JavaScript. Ele só põe `data-mc-cadastro` no
 * elemento que quer usar como botão; este script é nosso e é o único caminho
 * da moldura para a página de cima.
 */
const NOSSO_SCRIPT = `
(function () {
  function avisa(acao, valor) {
    try { parent.postMessage({ tipo: "mc-html", acao: acao, valor: valor }, "*"); } catch (e) {}
  }
  document.addEventListener("click", function (ev) {
    var alvo = ev.target && ev.target.closest && ev.target.closest("[data-mc-cadastro]");
    if (alvo) { ev.preventDefault(); avisa("abrir-cadastro"); }
  }, true);
  function mandaAltura() {
    var h = 0;
    try { h = Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 0); } catch (e) {}
    if (h > 0) avisa("altura", h);
  }
  if (document.readyState === "complete") mandaAltura();
  window.addEventListener("load", mandaAltura);
  setTimeout(mandaAltura, 300);
  setTimeout(mandaAltura, 1200);
})();
`;

interface Props {
  /** O HTML que o produtor escreveu. Vai inteiro, sem sanitização: quem contém é a moldura. */
  html: string;
  /** O que fazer quando o botão marcado é clicado. No painel é um aviso; no aluno, abrir o cadastro. */
  aoPedirCadastro: () => void;
  className?: string;
  title?: string;
}

export function WorkspaceHtmlFrame({
  html,
  aoPedirCadastro,
  className,
  title = "Conteúdo do produtor",
}: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [altura, setAltura] = useState(ALTURA_INICIAL);

  // O nosso script PRIMEIRO, o HTML do produtor depois.
  const documento = `<!doctype html><html><head><meta charset="utf-8"><script>${NOSSO_SCRIPT}<\/script></head><body>${html}</body></html>`;

  useEffect(() => {
    function aoReceber(ev: MessageEvent) {
      // ⭐ A validação é por `ev.source`, NUNCA por `ev.origin`.
      // Medido nos dois motores: uma moldura sem `allow-same-origin` tem origem
      // OPACA, e `ev.origin` chega como a string "null" — que é idêntica para
      // qualquer outra moldura sandboxed da página. Duas molduras lado a lado
      // foram indistinguíveis por origem e perfeitamente distinguíveis por
      // `source`. Comparar com a janela do nosso próprio iframe é o que amarra
      // a mensagem a ESTA moldura.
      if (!ref.current || ev.source !== ref.current.contentWindow) return;
      const dado = ev.data as { tipo?: string; acao?: string; valor?: unknown };
      if (!dado || dado.tipo !== "mc-html") return;

      if (dado.acao === "abrir-cadastro") {
        aoPedirCadastro();
        return;
      }
      if (dado.acao === "altura") {
        const v = dado.valor;
        // Só inteiro, e com teto: o valor vem de dentro da moldura, então é
        // entrada de terceiro como qualquer outra.
        if (typeof v === "number" && Number.isInteger(v) && v > 0) {
          setAltura(Math.min(v, ALTURA_MAXIMA));
        }
      }
    }
    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, [aoPedirCadastro]);

  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-scripts"
      srcDoc={documento}
      className={className}
      style={{ width: "100%", height: altura, border: 0, display: "block" }}
    />
  );
}
