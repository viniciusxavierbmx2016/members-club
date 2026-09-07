-- VIRADA DA IDENTIDADE (fatia 1/N) — o interruptor por workspace.
--
-- NASCE DESLIGADO: `DEFAULT false` cobre as linhas existentes e as novas.
-- Nenhum workspace muda de aparência com esta migração — ela só cria o campo.
--
-- NOT NULL com DEFAULT é seguro numa tabela com linhas: o Postgres preenche
-- todas com `false` sem reescrever a tabela (default não-volátil, PG 11+).
ALTER TABLE "Workspace" ADD COLUMN "memberBrandDefault" BOOLEAN NOT NULL DEFAULT false;
