-- Anexos de post da comunidade — ETAPA 1/4 (fundação). Só metadado: nenhuma
-- rota consome esta tabela ainda, e nada em produção muda de comportamento.
--
-- postId é NULÁVEL de propósito. O upload é DIRETO ao Storage (a função da
-- Vercel corta o corpo em ~4,5 MB e o teto pedido é 50 MB), então o objeto
-- chega ANTES de o post existir: a linha nasce PENDING e sem post, e só vira
-- CONFIRMED quando um post a adota. É a trava do item 9.104, que mediu 10
-- objetos órfãos no bucket `materials` justamente porque lá o objeto é gravado
-- antes do registro e ninguém confere depois.
--
-- storagePath guarda o PATH PURO, nunca a URL — lição do item 9.97, em que
-- `LessonMaterial.fileUrl` nasceu com `getPublicUrl(...)` e, depois do flip do
-- bucket para privado, virou um path disfarçado de URL que dois lugares
-- desmontam por regex.
--
-- Tabela NOVA e vazia: sem backfill, sem lock relevante, sem risco de
-- regressão em dado existente.

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateTable
CREATE TABLE "PostAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "userId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- postId: lista os anexos de um post E é a chave de junção da soma por
-- workspace (PostAttachment -> Post.courseId -> Course.workspaceId, os dois já
-- indexados). Índice em FK que faz Cascade não é luxo: o Postgres não indexa FK
-- sozinho, e sem ele o delete em cascata vira varredura.
CREATE INDEX "PostAttachment_postId_idx" ON "PostAttachment"("postId");

-- CreateIndex
CREATE INDEX "PostAttachment_userId_idx" ON "PostAttachment"("userId");

-- CreateIndex
-- Acha os PENDING velhos para limpar — a consulta da futura rotina de órfãos.
CREATE INDEX "PostAttachment_status_createdAt_idx" ON "PostAttachment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PostAttachment" ADD CONSTRAINT "PostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttachment" ADD CONSTRAINT "PostAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
