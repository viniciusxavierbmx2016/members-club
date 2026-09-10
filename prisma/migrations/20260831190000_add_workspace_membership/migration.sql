-- E4.4 etapa 5, FATIA 1 — A MARCA DE PERTENCIMENTO (fundação).
-- Decisões canônicas no §12 do docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md.
--
-- Tabela NOVA e VAZIA: sem backfill, sem lock relevante, sem risco de regressão
-- em dado existente. NENHUMA porta é aberta por esta migração — não existe
-- cadastro público ainda, e a leitura da marca é opt-in por call-site
-- (`allowMembership` em lib/workspace-access.ts), então os 9 call-sites que não
-- a pedem seguem com o comportamento de hoje, byte a byte.
--
-- `origin` é ENUM e NÃO tem DEFAULT, de propósito: todo escritor declara por
-- onde a pessoa entrou. O `EnrollmentOrigin` precisou de `UNKNOWN` porque
-- nasceu sobre 22 mil linhas de acervo sem origem; aqui não há passado a
-- rotular, e default silencioso é como se perde a origem.
--
-- ⚠️ RLS DESDE O NASCIMENTO — correção explícita de precedente. A migração do
-- PostAttachment (20260827120000), o exemplar recente de tabela nova, NÃO tem
-- uma linha de RLS (medido: grep "ROW LEVEL" nela = 0). Esta tabela guarda
-- QUEM PERTENCE A QUAL PRODUTOR — dado de tenancy puro, a mesma família do P0
-- da Data API. O app fala com o banco via Prisma no papel `postgres`, que
-- ignora RLS, então isto tem ZERO impacto no comportamento da aplicação: fecha
-- a leitura direta pela anon key via PostgREST. Sem policies = deny-by-default,
-- igual às outras ~60 tabelas. O REVOKE vai junto porque RLS não governa
-- TRUNCATE, que é privilégio de tabela (é a postura de 2026-08-05).

-- CreateEnum
CREATE TYPE "WorkspaceMembershipOrigin" AS ENUM ('PUBLIC_SIGNUP');

-- CreateTable
CREATE TABLE "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "origin" "WorkspaceMembershipOrigin" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- A identidade da marca E a consulta quente ("esta pessoa pertence a este
-- workspace?"). É também a defesa contra corrida: dois cadastros simultâneos
-- colidem em P2002 em vez de criar duas linhas.
-- ⓘ Não há índice separado por userId: a unique já o cobre como prefixo à
-- esquerda — mesma razão pela qual WorkspaceCredential também o omite.
CREATE UNIQUE INDEX "WorkspaceMembership_userId_workspaceId_key" ON "WorkspaceMembership"("userId", "workspaceId");

-- CreateIndex
-- FK com Cascade PRECISA de índice próprio: o Postgres não indexa FK sozinho, e
-- sem ele o delete do workspace vira varredura. Serve também à futura listagem
-- "quem pertence a este workspace".
CREATE INDEX "WorkspaceMembership_workspaceId_idx" ON "WorkspaceMembership"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRowLevelSecurity  (ver o cabeçalho: correção de precedente)
ALTER TABLE "WorkspaceMembership" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "WorkspaceMembership" FROM anon, authenticated;
