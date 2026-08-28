/* Anexos de post da comunidade — allow-list, tetos e bucket.
   Fonte ÚNICA, importável pelo servidor E pelo client (não puxa o service-role),
   espelhando `materials-constants.ts`. Etapa 1/4 (fundação): este arquivo é só
   dado — nenhuma rota o consome ainda.

   ───── DECISÕES DO DONO (27/08/26), registradas aqui porque explicam os valores
   1. QUALQUER usuário da comunidade pode anexar (não só staff). Difere do molde
      de `LessonMaterial`, que é do produtor.
   2. 50 MB por arquivo.
   3. Upload DIRETO ao Storage (signed upload URL). A função da Vercel corta o
      corpo em ~4,5 MB, então 50 MB só existe fora dela.
   4. SEM .zip e sem executáveis.
   5. Teto de 2 GB por WORKSPACE, visível ao produtor.

   ───── ⚠️ BURACO ASSUMIDO E REGISTRADO, não esquecido
   Indo direto ao Storage, o servidor NUNCA VÊ OS BYTES — nem antes nem depois
   (medido na investigação de 27/08: nenhum dos 3 moldes existentes inspeciona
   bytes de upload direto, e o SDK 2.105.3 não expõe download por `range`).
   Logo, ESTA LISTA NÃO É UMA BARREIRA DE CONTEÚDO: ela filtra o que o cliente
   DECLARA. Um executável renomeado passa por ela.
   A mitigação aceita não é a lista — é o trio:
     · bucket PRIVADO (nada é servido por URL pública e eterna);
     · link TEMPORÁRIO (signed URL de vida curta, emitida sob gate);
     · download FORÇADO (`?download=`, para o navegador não renderizar nada).
   Ver o item 9.130, que registra a rota de anexo de suporte caindo justamente
   por confiar no tipo declarado — o molde a NÃO copiar. */

/** MIME types aceitos. É o que o cliente DECLARA — ver o buraco assumido acima. */
export const COMMUNITY_ATTACHMENT_ALLOWED_TYPES = new Set([
  // Documentos
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/csv",
  "text/plain",
  // Imagens — as MESMAS quatro que a comunidade já aceita hoje
  // (`api/community/upload/route.ts:16-50` reconhece PNG/JPEG/GIF/WebP por
  // assinatura). "image/jpg" entra porque é o que alguns navegadores enviam;
  // `materials-constants.ts:19` faz igual.
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);

/* ⛔ FORA, por decisão do dono: `application/zip`, `application/x-zip-compressed`,
   `application/x-rar-compressed`, `application/vnd.rar` — todos PRESENTES no
   allow-list de materiais (`materials-constants.ts:13-16`). A divergência é
   intencional: lá quem sobe é o produtor, aqui é qualquer aluno, e arquivo
   compactado esconde o conteúdo de qualquer inspeção futura. */

/** 50 MB por arquivo. ⚠️ Esta é a validação da DECLARAÇÃO; a parede real é o
    `fileSizeLimit` do bucket, que o Storage aplica no upload direto. Os dois
    têm de andar juntos — mudar aqui sem mudar o bucket não muda nada. */
export const COMMUNITY_ATTACHMENT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/** 2 GB por workspace, somando os anexos CONFIRMED.
    O caminho da soma foi conferido antes de escolher (e é por isso que NÃO há
    campo denormalizado neste desenho): PostAttachment → Post.courseId
    (`schema.prisma:487`) → Course.workspaceId, que é obrigatório
    (`schema.prisma:62`) e indexado (`@@index([workspaceId])`). Com o
    `@@index([postId])` do model novo, a cadeia inteira é indexada. */
export const COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES = 2 * 1024 * 1024 * 1024;

/** MIME validado -> extensão que o SERVIDOR grava no path.

    Por que existe: o molde de materiais monta o path com
    `sanitizeFileName(fileName)` e, com isso, **o cliente escolhe a extensão**
    gravada no bucket — é exatamente a queixa (2) do item 9.130 contra a rota
    de anexo de suporte. Aqui a extensão sai do mimeType JÁ VALIDADO contra a
    allow-list acima, então nenhum byte do nome enviado decide o sufixo.
    ⚠️ Isto não torna o arquivo confiável (o mimeType ainda é declaração — ver
    o buraco assumido no topo); torna o CAMINHO previsível e sem surpresa. */
export const COMMUNITY_ATTACHMENT_EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/csv": "csv",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Bucket PRIVADO, exclusivo destes anexos. Não reusa `thumbnails` (público, e
    compartilhado por 6 rotas) nem `materials` (do produtor, teto e allow-list
    diferentes). Mesmo valor de `COMMUNITY_ATTACHMENTS_BUCKET` em
    `supabase-admin.ts`, exportado daqui para o client poder importar sem puxar
    o service-role — o mesmo motivo de `materials-constants.ts:31`. */
export const COMMUNITY_ATTACHMENTS_BUCKET_NAME = "community-attachments";
