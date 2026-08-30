// SONDA-TURNSTILE — REMOVER
//
// Rota DESCARTÁVEL da E4.4 etapa 5. Recebe o token do widget e chama o
// siteverify da Cloudflare.
//
// ⚠️ ESTE É O PRIMEIRO `fetch()` DE SERVIDOR DO REPOSITÓRIO. Medido no
// levantamento: `grep -rn "fetch(" src/app/api` → 0 ocorrências (contra 363 em
// src/, que é o controle de que o grep não estava cego). Toda chamada a
// terceiro da casa passa por SDK. Como não há padrão de `fetch` cru, uso o
// ÚNICO molde de timeout sobre chamada de rede que existe: o Promise.race de
// src/lib/rate-limit.ts:81-89 (lição serverless L15 — toda chamada externa com
// timeout, senão a lambda congela até o maxDuration).
//
// ⛔ A secret NUNCA é impressa, logada nem devolvida. Só a presença é reportada.
// ⓘ A sonda devolve o corpo CRU do siteverify de propósito: o objetivo é medir,
//    não decidir. Nenhuma decisão de autorização acontece aqui.
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export async function POST(request: Request) {
  // Padrão da casa para rota pública (23 call-sites): rateLimit na 1ª linha.
  const limited = await rateLimit(request);
  if (limited) return limited;

  const t0 = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json(
        { sonda: true, erro: "token ausente no corpo" },
        { status: 400 }
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      // Molde de env ausente: src/app/api/upload/route.ts:23-30 devolve 500
      // ("servidor mal configurado"). Aqui a sonda diz isso EXPLICITAMENTE para
      // que o humano distinga "CSP quebrou" de "env não carregou".
      return NextResponse.json(
        {
          sonda: true,
          erro: "TURNSTILE_SECRET_KEY ausente no ambiente",
          dica: "a medição de CSP no cliente segue válida mesmo assim",
        },
        { status: 500 }
      );
    }

    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);

    // Timeout à mão — molde src/lib/rate-limit.ts:81-89.
    const resposta = (await Promise.race([
      fetch(SITEVERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("siteverify-timeout")), TIMEOUT_MS)
      ),
    ])) as Response;

    // fetch falha de DOIS jeitos: REJEITA (rede) e RESOLVE com !ok. O catch
    // pega o primeiro; este bloco tem de olhar o segundo.
    const texto = await resposta.text();
    let json: unknown = null;
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }

    return NextResponse.json({
      sonda: true,
      secretPresente: true, // presença, nunca o valor
      httpDoSiteverify: resposta.status,
      okDoSiteverify: resposta.ok,
      corpo: json ?? texto.slice(0, 500),
      duracaoMs: Date.now() - t0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        sonda: true,
        erro: "falha ao chamar o siteverify",
        detalhe: err instanceof Error ? err.message : String(err),
        duracaoMs: Date.now() - t0,
      },
      { status: 502 }
    );
  }
}
