"use client";

import { Component, useCallback, useRef, useState, type ReactNode } from "react";
import { WorkspaceHtmlFrame } from "@/components/workspace-html-frame";
import { WorkspaceRegisterPopup } from "@/components/workspace-register-popup";
import type { WorkspaceAuthInfo } from "@/components/workspace-auth-shell";

/**
 * Modelo HTML PRÓPRIO da tela de cadastro do aluno (9.372).
 *
 * ⭐ A página do produtor ocupa a TELA INTEIRA, sem moldura nossa em volta e
 * sem nenhuma marca desenhada por cima — decisão do dono. O que existe aqui é
 * a moldura isolada de sempre (`sandbox="allow-scripts"` e nada mais) e o
 * popup de cadastro, que é o MESMO do modelo Vídeo (`workspace-register-popup`).
 *
 * ⛔ O interruptor de logo e nome no topo NÃO vale neste modelo: o topo da
 * página é do produtor, e não desenhamos nada ali.
 *
 * ⛔ O HTML não é sanitizado nem reescrito aqui. Quem contém é a moldura; a
 * régua de conteúdo é a do salvar, e a página já a reconferiu antes de montar
 * este componente.
 */

/**
 * ⭐ A RESERVA de último caso (terceiro caso da decisão do dono): qualquer
 * falha que impeça MONTAR a moldura cai no Clássico, nunca em página em branco.
 *
 * Fronteira de erro é a única forma de o React avisar que um filho não montou.
 * Sem ela a falha subiria para o `error.tsx` da rota e a pessoa veria a tela de
 * erro do aplicativo — numa página PÚBLICA de cadastro, isso é uma venda
 * perdida. Os outros dois casos (sem HTML salvo, e HTML que não passa na régua)
 * são decididos antes, no servidor, em `w/[slug]/register/page.tsx`.
 */
class ReservaSeAMolduraFalhar extends Component<
  { reserva: ReactNode; children: ReactNode },
  { caiu: boolean }
> {
  state = { caiu: false };

  static getDerivedStateFromError() {
    return { caiu: true };
  }

  render() {
    return this.state.caiu ? this.props.reserva : this.props.children;
  }
}

interface Props {
  workspace: WorkspaceAuthInfo;
  slug: string;
  /** O HTML do produtor, já conferido pela régua do salvar no servidor. */
  html: string;
  /** A tela Clássica pronta, para o caso de a moldura não montar. */
  reserva: ReactNode;
}

export function WorkspaceRegisterHtml({
  workspace,
  slug,
  html,
  reserva,
}: Props) {
  const [popupAberto, setPopupAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  // `useCallback` porque a moldura tem este retorno nas dependências do efeito
  // que escuta as mensagens (`workspace-html-frame.tsx:109`): uma função nova a
  // cada render religaria o ouvinte sem necessidade.
  const abrirCadastro = useCallback(() => setPopupAberto(true), []);

  function aoFechar() {
    setPopupAberto(false);
    // O botão que abriu vive DENTRO da moldura e é inalcançável daqui — a
    // origem é opaca por desenho, e é isso que nos protege. O destino honesto
    // do foco é a própria moldura: a pessoa volta para o documento de onde saiu.
    caixaRef.current?.querySelector("iframe")?.focus();
  }

  return (
    <ReservaSeAMolduraFalhar reserva={reserva}>
      {/* ⛔ Sem padding, sem largura máxima, sem cor nossa: nada de moldura em
          volta. ⭐ O `min-h-screen` na própria moldura resolve a altura nos dois
          sentidos, porque em CSS o `min-height` vence a `height` inline quando é
          maior: HTML curto enche a tela (sem espaço morto embaixo) e HTML alto
          passa do limite e a página rola. */}
      <div ref={caixaRef} className="min-h-screen w-full">
        <WorkspaceHtmlFrame
          html={html}
          className="min-h-screen"
          title={`Página de cadastro de ${workspace.name}`}
          aoPedirCadastro={abrirCadastro}
        />
      </div>

      {/* O MESMO popup do modelo Vídeo — nada foi duplicado. */}
      <WorkspaceRegisterPopup
        workspace={workspace}
        slug={slug}
        aberto={popupAberto}
        aoFechar={aoFechar}
      />
    </ReservaSeAMolduraFalhar>
  );
}
