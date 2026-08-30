// SONDA-TURNSTILE — REMOVER
//
// Página DESCARTÁVEL da E4.4 etapa 5. Não é o cadastro, não vira o cadastro.
// Existe por UM motivo só: descobrir NO NAVEGADOR quais diretivas da CSP o
// Turnstile exige. Isso não é decidível por leitura — é a cicatriz do BUG E
// (5e78edd): o SDK do Vimeo fazia XHR da página-mãe ANTES do iframe existir, o
// que é `connect-src` e não `frame-src`, e a tela ficou preta por 3 meses.
// Agrava: a CSP deste projeto NÃO tem report-uri (next.config.mjs:44-60), então
// a violação é 100% silenciosa no servidor.
//
// ⚠️ Esta rota NÃO está na allow-list de rotas públicas do proxy
// (src/proxy.ts:65-68 só isenta login|forgot-password|reset-password), então
// visitante ANÔNIMO é redirecionado para /w/{slug}/login. O gate humano
// precisa estar LOGADO. Não toquei o proxy de propósito — escopo fechado.
//
// REMOÇÃO: apagar o diretório src/app/w/[slug]/turnstile-teste inteiro,
// apagar src/app/api/sonda-turnstile e reverter o bloco marcado no next.config.mjs.
import { SondaTurnstileClient } from "./sonda-turnstile-client";

export default async function SondaTurnstilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Deliberadamente NÃO consulta o banco e NÃO usa o WorkspaceAuthShell: a
  // sonda tem de ser mínima para que qualquer violação de CSP observada seja
  // do Turnstile e não de outra coisa que a tela carregou junto.
  return <SondaTurnstileClient slug={slug} />;
}
