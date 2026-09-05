export function darkenHex(hex: string, amount = 0.15): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (
    "#" +
    [r, g, b]
      .map((c) =>
        Math.max(0, Math.round(c * (1 - amount)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

const DARK_TEXT = "#0a0a0a";
const LIGHT_TEXT = "#ffffff";

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * A1 · Cor de texto legível SOBRE `hex`, por MAX-CONTRASTE: mede o contraste
 * WCAG contra o escuro e contra o claro e devolve o que der MAIOR.
 *
 * ⚠️ NÃO é limiar de luminância — e isso é o achado, não um detalhe. A regra
 * por limiar foi REFUTADA na medição A0 (05/set/26): reusando o `0.6` do
 * `workspace-auth-shell.tsx:74` ela acertava **10 dos 72** cursos de produção,
 * porque a fronteira real do critério 4,5 fica em BT.601 ≈ 0,469 e o
 * `#3b82f6` — fallback de 58 dos 72 — mede 0,478 e cai na fresta: o limiar
 * escolhe CLARO (3,68 🔴) quando o ESCURO media 5,38 ✅. A comparação acerta
 * 72/72. Ver `docs/REBRANDING-2026.md` §14.
 *
 * ⓘ O limiar 0,6 não está errado no `auth-shell`: lá ele decide a CAIXA, não
 * o critério de 4,5. Copiá-lo para cá é que seria o erro.
 *
 * Entrada inválida devolve `#ffffff` — o valor cravado de hoje nos 25 pontos,
 * então quem não tem marca própria não muda um pixel.
 */
export function contrastingTextColor(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return LIGHT_TEXT;
  const bg = relativeLuminance(hex);
  return contrastRatio(bg, relativeLuminance(DARK_TEXT)) >=
    contrastRatio(bg, relativeLuminance(LIGHT_TEXT))
    ? DARK_TEXT
    : LIGHT_TEXT;
}
