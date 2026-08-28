"use client";

import { useRef, useState } from "react";
import {
  COMMUNITY_ATTACHMENT_ALLOWED_TYPES,
  COMMUNITY_ATTACHMENT_MAX_FILE_SIZE,
  COMMUNITY_ATTACHMENT_MAX_PER_POST,
} from "@/lib/community-attachments-constants";
import { formatFileSize, getMaterialIcon } from "@/lib/file-display";
import type { PostAttachmentItem } from "@/components/post-attachments";

/* Anexar arquivo a um post da comunidade — a ponta de tela das etapas 2 a 4.

   O FLUXO, e por que ele tem três passos em vez de um: o arquivo NÃO passa
   pelo nosso servidor (a função da Vercel corta o corpo em ~4,5 MB e o teto
   aqui é 50 MB). Então:
     1. `authorize` — o servidor confere vínculo, tipo, tamanho e a cota do
        workspace, e devolve um token de upload para UM caminho que ele mesmo
        montou;
     2. o browser sobe DIRETO para o Storage com esse token;
     3. `confirm` — o servidor pergunta ao Storage o que de fato chegou e
        compara com o que foi anunciado. Só aí o anexo existe.

   O `accept` do input sai da MESMA allow-list que o servidor usa. Isso é
   conveniência, não barreira: o `accept` é só uma dica ao seletor de arquivos
   do sistema, e quem quiser burlar burla. A recusa de verdade é a do servidor,
   e é a mensagem DELE que aparece na tela.

   ⚠️ A tela não inventa frase de erro. Régua do E3.12: o que o servidor
   respondeu é o que o usuário lê — recusa por tipo, por tamanho e por cota
   chegam inteiras. A única mensagem nossa é a de falha de REDE, onde não há
   resposta do servidor para mostrar. */

const ACCEPT = [...COMMUNITY_ATTACHMENT_ALLOWED_TYPES].join(",");

export function PostAttachmentPicker({
  courseId,
  attachments,
  onChange,
  disabled,
}: {
  courseId: string | undefined;
  attachments: PostAttachmentItem[];
  onChange: (next: PostAttachmentItem[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const cheio = attachments.length >= COMMUNITY_ATTACHMENT_MAX_PER_POST;
  const bloqueado = !!disabled || !!enviando || cheio || !courseId;

  async function anexar(file: File) {
    setErro("");
    if (!courseId) return;

    /* Barreiras de tela ANTES da rede — não substituem o servidor, poupam uma
       ida inútil e, no caso do teto de 5, evitam que a mensagem CRUA do Zod
       ("Too big: expected array to have <=5 items") chegue ao usuário. O
       servidor tem a frase da casa para o mesmo caso, e ela também é tratada
       abaixo, caso um dia a tela deixe passar. */
    if (attachments.length >= COMMUNITY_ATTACHMENT_MAX_PER_POST) {
      setErro(`Um post aceita no máximo ${COMMUNITY_ATTACHMENT_MAX_PER_POST} anexos.`);
      return;
    }
    if (file.size > COMMUNITY_ATTACHMENT_MAX_FILE_SIZE) {
      setErro("Arquivo muito grande (máx. 50MB)");
      return;
    }
    if (!COMMUNITY_ATTACHMENT_ALLOWED_TYPES.has(file.type)) {
      setErro("Formato não permitido.");
      return;
    }

    setEnviando(file.name);
    try {
      // 1) autorizar
      const rAuth = await fetch("/api/community/attachments/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      if (!rAuth.ok) {
        const d = await rAuth.json().catch(() => ({}));
        setErro(d.error || "Não foi possível enviar o arquivo.");
        return;
      }
      const { attachmentId, path, token } = await rAuth.json();

      // 2) subir DIRETO para o Storage, com o token
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const rUp = await fetch(
        `${base}/storage/v1/object/upload/sign/community-attachments/${path}?token=${token}`,
        { method: "PUT", headers: { "Content-Type": file.type }, body: file }
      );
      if (!rUp.ok) {
        setErro("Falha ao enviar o arquivo. Tente de novo.");
        return;
      }

      // 3) confirmar — é aqui que o servidor confere o que chegou
      const rConf = await fetch("/api/community/attachments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId }),
      });
      if (!rConf.ok) {
        const d = await rConf.json().catch(() => ({}));
        setErro(d.error || "Não foi possível confirmar o arquivo.");
        return;
      }
      const { attachment } = await rConf.json();
      onChange([...attachments, attachment]);
    } catch {
      /* `fetch` falha de DOIS jeitos, e este ramo é o primeiro: rede caiu, CORS,
         servidor fora — não existe `res` nenhum, e só o try/catch pega. Sem
         isto o aluno leria "Failed to fetch" (lição 9.79/E3.12). */
      setErro("Não foi possível enviar o arquivo. Verifique sua conexão e tente de novo.");
    } finally {
      setEnviando(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) anexar(f);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={bloqueado}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          {enviando ? "Enviando…" : "Anexar arquivo"}
        </button>

        {/* Só aparece quando é informação: silêncio enquanto há espaço. */}
        {cheio && !enviando && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Limite de {COMMUNITY_ATTACHMENT_MAX_PER_POST} anexos por post.
          </span>
        )}
        {enviando && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="truncate max-w-[180px]">{enviando}</span>
          </span>
        )}
      </div>

      {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}

      {/* Os anexos JÁ confirmados, antes de publicar. Cada um pode sair da
          lista: o arquivo continua no Storage por até 24h e a rotina de órfãos
          o recolhe — remover aqui não pode chamar rota destrutiva nenhuma. */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {attachments.map((a) => {
            const icon = getMaterialIcon(a.mimeType);
            return (
              <div
                key={a.id}
                className="flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-lg"
              >
                <span className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${icon.color}`}>
                  {icon.label}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-gray-800 dark:text-gray-100 truncate">
                    {a.fileName}
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                    {formatFileSize(a.fileSize)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(attachments.filter((x) => x.id !== a.id))}
                  aria-label={`Remover ${a.fileName}`}
                  className="p-1 -m-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
