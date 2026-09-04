/**
 * REBRANDING · fonte única dos defaults do TEMA DO PAINEL.
 *
 * ⭐ **A VIRADA ACONTECEU — F3.5, 04/set/26.** Estes são os valores da paleta
 * NOVA (lime sobre neutro escuro). Antes desta fatia eram os da identidade azul
 * (`#3b82f6` / `#0a0a1a` / `#111827` / `#1a1e2e` / `#ffffff`), reunidos aqui
 * pela F0 sem trocar cor nenhuma.
 *
 * ⚠️ A virada foi a ÚLTIMA fatia da F3 de propósito: as F3.1–F3.4 e a F3.3b
 * prepararam 237 pontos (texto, ícone, borda, anel, knob e as pistas próprias
 * da D13) **com o azul ainda no lugar**, para que cada gate tivesse UMA variável.
 * Ver `docs/REBRANDING-2026.md` §5 (plano de fatias) e §6 (registro por fatia).
 *
 * ⓘ `buttonTextColor` é escuro por força da **D15/D12**: o que fica SOBRE a marca
 * acompanha a marca, e lime é claro — texto branco sobre lime dá 1,11:1.
 *
 * De onde vieram os valores ANTIGOS (medidos antes de escrever, os 4 idênticos:
 * 8 chaves, mesmos valores):
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
  primaryColor: "#EFFF20",
  secondaryColor: "#262626",
  bgColor: "#191919",
  headerColor: "#191919",
  sidebarColor: "#191919",
  cardColor: "#202020",
  buttonTextColor: "#191919",
};
