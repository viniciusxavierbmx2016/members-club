-- E4.4 etapa 1 — a chave gratuito/pago do curso e a marca de ORIGEM da matrícula.
-- ADITIVA: cria um enum e duas colunas com DEFAULT. Nenhuma coluna existente é
-- alterada, nenhuma linha é reescrita além do preenchimento do default.
--
-- Course.isFree = false para todo o acervo: nenhum curso vira gratuito por esta
-- migração. Campo NOVO e não reuso de `showInStore`/`checkoutUrl`/`price` — a
-- medição em produção mostrou 20 de 60 cursos sem checkoutUrl (33%) e 32 sem
-- preço (53%), que estão assim por outros motivos e virariam gratuitos de graça.
--
-- Enrollment.origin = UNKNOWN para o acervo, e a escolha é deliberada: as linhas
-- existentes NÃO são todas compra (há importação, produtor à mão e automação
-- misturados) e não há dado que os separe depois do fato. Carimbar PURCHASE
-- seria inventar um passado — mesmo princípio do `updatedAt` deste model.
-- NOT NULL com default preenche o acervo na própria migração, sem backfill,
-- como o `accessEmailPending` fez.
--
-- ⚠️ Esta fatia é SCHEMA-ONLY: nenhum dos cinco escritores de Enrollment grava
-- a origem ainda. Até a fatia seguinte, linha nova também nasce UNKNOWN — o que
-- é honesto (a origem de fato não está registrada) e detectável por `createdAt`.

-- CreateEnum
CREATE TYPE "EnrollmentOrigin" AS ENUM ('PURCHASE', 'PRODUCER_MANUAL', 'IMPORT', 'PRODUCER_PANEL', 'AUTOMATION', 'FREE_CLAIM', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "origin" "EnrollmentOrigin" NOT NULL DEFAULT 'UNKNOWN';
