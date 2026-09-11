/**
 * E4.4 etapa 2, FATIA 3 — verificação do Cloudflare Turnstile no SERVIDOR.
 *
 * Só o cadastro público usa isto. ⛔ Nenhuma outra tela ganhou widget — login,
 * esqueci-a-senha e redefinir ficam como estão.
 *
 * ⭐ POR QUE O RESULTADO É DISCRIMINADO, e não um booleano: é o item 9.171.
 * Hoje "captcha ausente por configuração errada" e "captcha ausente porque a
 * Cloudflare está fora" produzem EXATAMENTE o mesmo silêncio — a CSP não tem
 * `report-uri`, então nada no servidor acusa. As consequências são opostas (um
 * é bug nosso que precisa de deploy; o outro é indisponibilidade de terceiro
 * que passa sozinha), e quem lê o log precisa saber qual dos dois aconteceu.
 * Por isso `reason` tem quatro valores e cada um vira uma linha de log própria.
 *
 * ⚠️ `fetch` falha de DOIS jeitos e os dois estão cobertos aqui:
 *   1. REJEITA (rede caiu, DNS, timeout) — não existe `res`; só o try/catch pega.
 *   2. RESOLVE com `!res.ok` (500 da Cloudflare) — o `try` não dispara.
 * Um helper que só olhasse `res.ok` seria cego ao primeiro.
 *
 * ⛔ O secret NUNCA sai daqui: não vai para log, não vai para a resposta. Os
 * `error-codes` da Cloudflare são públicos e podem ser logados.
 */

const SITEVERIFY =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Além do teto, o cadastro inteiro fica esperando a Cloudflare. 5s é o dobro
 *  largo dos 210 ms medidos pela sonda de 30/08 (§10.2 do PLANO-E4.4). */
const TIMEOUT_MS = 5000;

export type TurnstileFailure =
  /** `TURNSTILE_SECRET_KEY` não está no ambiente — BUG NOSSO, precisa de deploy. */
  | "not-configured"
  /** O corpo chegou sem token — o widget não renderizou, ou é um bot direto na API. */
  | "missing-token"
  /** A Cloudflare respondeu e RECUSOU — token falso, expirado ou já gasto. */
  | "invalid-token"
  /** Não houve resposta utilizável da Cloudflare — INDISPONIBILIDADE DE TERCEIRO. */
  | "unreachable";

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: TurnstileFailure; codes: string[] };

export async function verifyTurnstile(
  token: unknown
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: "not-configured", codes: [] };

  if (typeof token !== "string" || token.trim().length === 0) {
    return { ok: false, reason: "missing-token", codes: [] };
  }

  let res: Response;
  try {
    res = await fetch(SITEVERIFY, {
      method: "POST",
      // ⛔ Sem header de Content-Type explícito de propósito: com
      // `URLSearchParams` o runtime já põe
      // `application/x-www-form-urlencoded;charset=UTF-8`, e declarar um
      // segundo por cima é como nasce divergência silenciosa.
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    // MODO 1 do fetch: rejeitou. Distinguir timeout de rede ajuda a ler o log.
    const nome = (e as { name?: string })?.name ?? "erro";
    return {
      ok: false,
      reason: "unreachable",
      codes: [nome === "TimeoutError" ? "timeout" : `fetch-${nome}`],
    };
  }

  // MODO 2 do fetch: resolveu, mas não com sucesso.
  if (!res.ok) {
    return { ok: false, reason: "unreachable", codes: [`http-${res.status}`] };
  }

  const data = (await res.json().catch(() => null)) as {
    success?: boolean;
    "error-codes"?: string[];
  } | null;

  // Corpo ilegível é indisponibilidade, não recusa: a Cloudflare não disse
  // "não" — ela não disse nada que se entenda. ⛔ Não tratar como sucesso.
  if (!data || typeof data.success !== "boolean") {
    return { ok: false, reason: "unreachable", codes: ["corpo-ilegivel"] };
  }

  if (data.success) return { ok: true };

  return {
    ok: false,
    reason: "invalid-token",
    codes: data["error-codes"] ?? [],
  };
}
