import type { NextResponse } from "next/server";

/**
 * Apaga o cookie de contexto de workspace da identidade ANTERIOR.
 *
 * Molde: `api/auth/logout/route.ts:22-25`, que já faz exatamente esta limpeza
 * no logout. Aqui ela passa a rodar em toda porta de SERVIDOR que instala
 * identidade — sem isso o `active_workspace_slug` (30 dias, gravador único em
 * `api/w/[slug]/login/route.ts:361-367`) sobrevive à troca de conta e
 * `src/proxy.ts:98-110` sequestra o `GET /` para o workspace da conta velha.
 * É a face A do 9.138.
 *
 * ⚠️ NÃO é gate de acesso: este cookie só decide DESTINO. Quem autoriza são as
 * rotas e as páginas — `src/proxy.ts:30-43` sequer valida a sessão.
 * ⛔ NÃO chamar em `api/w/[slug]/login/route.ts` — aquela rota é a única que
 * GRAVA o cookie; limpar lá tiraria o caminho `/` de todo aluno.
 */
export function clearWorkspaceContext(res: NextResponse): NextResponse {
  res.cookies.set("active_workspace_slug", "", { maxAge: 0, path: "/" });
  return res;
}
