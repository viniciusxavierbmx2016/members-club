-- TELA DE CADASTRO PERSONALIZADA (fatia 1/2) — só as colunas.
--
-- NENHUM ALUNO MUDA DE TELA com esta migração. Os padrões abaixo reproduzem o
-- comportamento de hoje: `registerTemplate = 'classico'` é a tela atual, e os
-- textos nascem NULL, o que faz a tela cair nos literais que ela já usa
-- (`workspace-register-form.tsx`). Esta fatia nem sequer toca a tela do aluno.
--
-- NOT NULL com DEFAULT é seguro numa tabela com linhas: o Postgres preenche
-- todas com o default sem reescrever a tabela (default não-volátil, PG 11+).
-- Medido antes de escrever: 47 workspaces em produção, 43 ativos.
--
-- ⛔ As colunas do HTML PRÓPRIO (registerCustomHtml / registerUseCustomHtml)
-- NÃO entram aqui: por decisão do dono aquele modelo vai para fatia separada,
-- e o desenho mudou — o HTML do produtor passará a renderizar dentro de
-- moldura isolada, não sanitizado na nossa origem.
ALTER TABLE "Workspace" ADD COLUMN "registerTemplate" TEXT NOT NULL DEFAULT 'classico';
ALTER TABLE "Workspace" ADD COLUMN "registerVideoUrl" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "registerButtonDelaySec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Workspace" ADD COLUMN "registerButtonText" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "registerTitle" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "registerSubtitle" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "registerSubtitleEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Workspace" ADD COLUMN "registerTitleAlign" TEXT NOT NULL DEFAULT 'left';
