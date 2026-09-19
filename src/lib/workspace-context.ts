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

/**
 * Espelho de `clearWorkspaceContext`: REINSTALA o contexto de workspace do
 * aluno, com as MESMAS flags do gravador original
 * (`api/w/[slug]/login/route.ts:361-367`) — mesmo nome, mesmo prazo, mesmo
 * formato. Os três leitores (`src/proxy.ts:104`, `app/(dashboard)/page.tsx:76`
 * e a página da aula) continuam byte-idênticos.
 *
 * Existe por causa do 9.337: o contexto morre em 30 dias, a sessão dura 400, e
 * `src/proxy.ts:122-129` rebate o aluno autenticado da única tela que grava o
 * cookie — o gravador fica inalcançável enquanto a sessão viver.
 *
 * ⛔ SÓ chamar para ALUNO PURO (STUDENT sem colaboração aceita). O discriminador
 *    é role + vínculo, NUNCA "tem credencial" (há credenciais mortas em contas
 *    staff). Gravar contexto para staff alimenta a face B do 9.138, que segue
 *    aberta: lá o `GET /` honra o cookie sem olhar o papel da sessão.
 * ⛔ SÓ com workspace ATIVO. `app/w/[slug]/layout.tsx:36` faz `notFound()` para
 *    workspace desligado, e um cookie de 30 dias apontando para lá fixaria um
 *    404 de onde não se sai pelo `/`.
 */
export function setWorkspaceContext(res: NextResponse, slug: string): NextResponse {
  res.cookies.set("active_workspace_slug", slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
