"use client";

import { formatFileSize, getMaterialIcon } from "@/lib/file-display";

export interface PostAttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/* Lista de anexos de um post da comunidade.

   O visual é o MESMO dos materiais de aula — mesmo cartão, mesmo selo de tipo,
   mesmo ícone de download, mesmas classes. Não é economia de esforço: um
   arquivo anexado tem de parecer um arquivo anexado em qualquer lugar do
   produto, e as duas telas agora dividem `lib/file-display.ts`.

   ⚠️ A tela NÃO decide autorização. Ela mostra o que a API devolveu, e cada
   clique bate na rota de download, que refaz o gate inteiro (acesso à
   comunidade + moderação) e assina por 900s. Anexo de post que a pessoa não
   pode ver nem chega aqui — o feed não o devolve. */
export function PostAttachments({
  attachments,
}: {
  attachments: PostAttachmentItem[];
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-3 mb-4 flex flex-col gap-2">
      {attachments.map((a) => {
        const icon = getMaterialIcon(a.mimeType);
        return (
          <a
            key={a.id}
            href={`/api/community/attachments/${a.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors"
          >
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${icon.color}`}
            >
              {icon.label}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-gray-800 dark:text-gray-100 truncate">
                {a.fileName}
              </span>
              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {formatFileSize(a.fileSize)}
              </span>
            </span>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-9v10m0 0l-4-4m4 4l4-4"
              />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
