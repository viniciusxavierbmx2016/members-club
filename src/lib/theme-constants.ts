/**
 * REBRANDING · FATIA F0 — fonte única dos defaults do TEMA DO PAINEL.
 *
 * ⚠️ Estes são os valores da identidade ATUAL (azul), byte a byte os mesmos que
 * já viviam espalhados. Esta fatia NÃO muda cor nenhuma: ela só junta as quatro
 * cópias num lugar só. **A troca de paleta acontece na F3.** Se algum valor aqui
 * divergir do que estava antes, a F0 falhou.
 *
 * De onde vieram (medidos antes de escrever, os 4 idênticos: 8 chaves, mesmos
 * valores):
 *   · `components/producer-theme-provider.tsx:18-27`
 *   · `app/api/producer/theme/route.ts:17-26`
 *   · `app/producer/layout.tsx:8-17`
 *   · `app/producer/settings/page.tsx:22-31`
 *
 * ⚠️ ESCOPO: isto é SÓ o painel do produtor (`--producer-*`). A VITRINE
 * (`app/w/[slug]/layout.tsx:40-48`) e a ÁREA DE MEMBROS
 * (`app/(course)/course/[slug]/layout.tsx:139-145`) NÃO passam por aqui — elas
 * emitem cada CSS var condicionalmente, só quando o produtor personalizou, e
 * não têm fallback em TypeScript (zero hex nos dois arquivos, medido). Quem
 * cobre o resto lá é o fallback do CSS. Trazer estes defaults para elas mudaria
 * comportamento, e não é o que esta fatia faz.
 */

export interface ProducerThemeConfig {
  mode: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  headerColor: string;
  sidebarColor: string;
  cardColor: string;
  buttonTextColor: string;
}

/**
 * ⓘ Sem `as const` DE PROPÓSITO: `app/producer/layout.tsx:72` faz
 * `let initialTheme = THEME_DEFAULTS` e depois reatribui com spread. Um tipo
 * readonly quebraria essa atribuição — e o objetivo da F0 é não mudar nada.
 */
export const PRODUCER_THEME_DEFAULTS: ProducerThemeConfig = {
  mode: "dark",
  primaryColor: "#3b82f6",
  secondaryColor: "#1a1e2e",
  bgColor: "#0a0a1a",
  headerColor: "#0a0a1a",
  sidebarColor: "#0a0a1a",
  cardColor: "#111827",
  buttonTextColor: "#ffffff",
};
