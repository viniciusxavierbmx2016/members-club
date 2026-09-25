"use client";

import { useEffect, useRef } from "react";
import {
  getLoginTheme,
  type WorkspaceAuthInfo,
} from "@/components/workspace-auth-shell";
import { WorkspaceRegisterForm } from "@/components/workspace-register-form";

/**
 * O POPUP DE CADASTRO — extraído de `workspace-register-video.tsx` (9.371).
 *
 * ⛔ NADA aqui é invenção desta fatia: o diálogo, o jeito de abrir e fechar, o
 * clique no fundo, o X e o formulário montado só na abertura vieram do modelo
 * Vídeo linha por linha. A extração existe para que o modelo HTML próprio use
 * o MESMO popup em vez de um segundo diálogo — e o juiz é a captura: o modelo
 * Vídeo tem de sair byte-idêntico ao de main.
 *
 * ⛔ Quem guarda o estado de aberto/fechado é quem USA o popup, e quem devolve
 * o foco também: só o dono sabe qual elemento abriu o diálogo. Aqui dentro só
 * existe o `<dialog>` e a sincronia com a prop.
 */
interface Props {
  workspace: WorkspaceAuthInfo;
  slug: string;
  /** Verdadeiro = o diálogo está aberto. Quem manda é quem usa. */
  aberto: boolean;
  /** Disparado pelo `close` do próprio `<dialog>` — é o ÚNICO caminho de
   *  volta, e vale igual para o X, para o Esc e para o clique no fundo. */
  aoFechar: () => void;
}

export function WorkspaceRegisterPopup({
  workspace,
  slug,
  aberto,
  aoFechar,
}: Props) {
  const theme = getLoginTheme(workspace);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ⭐ `showModal()` do <dialog> NATIVO: ele traz de graça o topo da pilha, o
  // fundo escurecido (::backdrop), a armadilha de foco e o Esc. O `close` do
  // próprio elemento é quem devolve o foco ao botão — um só caminho de volta,
  // valendo para o X, para o Esc e para o clique no fundo.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    /* O POPUP. ⭐ O formulário só é MONTADO quando o diálogo abre e some ao
       fechar: assim o widget de verificação nasce junto com a tela que a
       pessoa vai usar, em vez de ficar de pé desde o carregamento — e um
       token do captcha vale uma vez só. */
    <dialog
      ref={dialogRef}
      onClose={aoFechar}
      onClick={(e) => {
        // Clique no FUNDO fecha: o alvo do clique é o próprio <dialog> só
        // quando se acerta o ::backdrop, nunca quando se acerta o conteúdo.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-label={`Criar conta em ${theme.name}`}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl p-0 backdrop:bg-black/60"
      style={{ backgroundColor: theme.boxColor, color: theme.textColor }}
    >
      {aberto && (
        <div className="p-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none"
              style={{ color: theme.textColorMuted }}
            >
              ×
            </button>
          </div>
          <WorkspaceRegisterForm
            workspace={workspace}
            slug={slug}
            semMoldura
          />
        </div>
      )}
    </dialog>
  );
}
