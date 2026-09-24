-- 9.366 — o interruptor da marca no topo da tela de cadastro.
--
-- ⭐ Vale SÓ no modelo "video". Padrão TRUE porque é exatamente o que a tela
-- faz hoje: quem já usa o modelo Vídeo em produção (medido: 1 workspace) não
-- vê diferença nenhuma, e as linhas existentes nascem com o valor verdadeiro.
--
-- ⛔ Aditiva, com DEFAULT: nenhuma linha muda de comportamento, e reverter o
-- código deixa a coluna inerte, sem leitor.
ALTER TABLE "Workspace" ADD COLUMN "registerShowBrand" BOOLEAN NOT NULL DEFAULT true;
