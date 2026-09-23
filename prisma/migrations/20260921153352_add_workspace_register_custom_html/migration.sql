-- 9.352 fatia 1 — a coluna do HTML próprio da tela de cadastro.
--
-- ⭐ UMA coluna só, por decisão do dono. Não há `registerUseCustomHtml`: quem
-- decide se o HTML é usado é `registerTemplate = 'html'`, e só ele. Dois
-- interruptores para a mesma coisa é convite a divergirem.
--
-- ⛔ Aditiva e anulável: nenhuma linha existente muda, e enquanto o modelo do
-- workspace não for 'html' a coluna não tem leitor. Reverter o código deixa a
-- coluna inerte, sem quebrar nada.
ALTER TABLE "Workspace" ADD COLUMN "registerCustomHtml" TEXT;
