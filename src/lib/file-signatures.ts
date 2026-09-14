/* Tipo de arquivo deduzido dos BYTES, não do que o cliente declara.

   ⭐ PROCEDÊNCIA: esta tabela e o `sniff` são CÓPIA VERBATIM de
   `api/community/upload/route.ts:21-59`, onde o padrão está em produção desde
   a etapa 2 dos anexos da comunidade. O motivo original, nas palavras de lá:
   "o allowlist antigo olhava `file.type`, que vem do FormData e é escolhido
   por quem envia: um .exe renomeado e enviado como image/png passava".

   ⚠️ POR QUE UM MÓDULO NOVO EM VEZ DE IMPORTAR DE LÁ: a rota da comunidade
   está CERTA e não foi tocada nesta fatia (gate: byte-idêntica). Este arquivo
   nasce como a fonte única para a qual ela deve convergir — a migração dela é
   item próprio, porque exige tocar numa rota de receita já provada.
   ⛔ Enquanto a convergência não acontece, existem duas cópias: qualquer
   assinatura NOVA entra nas DUAS ou em nenhuma. É a cicatriz do 9.42/9.54/9.57
   e está registrada de propósito, não esquecida.

   ⓘ `application/pdf` é a ÚNICA linha que não veio da comunidade: lá o
   allowlist é só de imagem. Ela existe porque o suporte aceita PDF desde
   sempre (`accept="image/*,application/pdf"` no widget do produtor e na tela
   do admin) e removê-lo trancaria quem hoje envia. A assinatura `%PDF-` é tão
   canônica quanto a do PNG — é UMA linha de DADO na mesma tabela, não um
   mecanismo novo. */
export type FileKind = { mime: string; ext: string };

export const SIGNATURES: {
  mime: string;
  ext: string;
  matches: (b: Buffer) => boolean;
}[] = [
  {
    mime: "image/png",
    ext: "png",
    matches: (b) =>
      b.length >= 8 &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/jpeg",
    ext: "jpg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/gif",
    ext: "gif",
    matches: (b) =>
      b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1")),
  },
  {
    // RIFF....WEBP — o tamanho mora nos bytes 4-7, por isso a checagem pula eles.
    mime: "image/webp",
    ext: "webp",
    matches: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    // %PDF- nos 5 primeiros bytes (ISO 32000-1 §7.5.2).
    mime: "application/pdf",
    ext: "pdf",
    matches: (b) => b.length >= 5 && b.subarray(0, 5).toString("latin1") === "%PDF-",
  },
];

export function sniff(buffer: Buffer): FileKind | null {
  return SIGNATURES.find((s) => s.matches(buffer)) ?? null;
}
