"use client";

// SONDA-TURNSTILE — REMOVER
//
// O carregamento do script segue o MOLDE DA CASA para código de terceiro,
// copiado de src/components/video-player.tsx:63-98 (loadYouTubeAPI):
//   promise-singleton em módulo · guarda de `window === undefined` ·
//   guarda de "já carregado" · createElement + async + appendChild(head) ·
//   callback global ENCADEADO (prev?.() antes do resolve).
// A única adição em relação ao molde é `script.onerror` + timeout — o molde da
// casa não os tem, e sem eles um script BLOQUEADO PELA CSP deixaria a promise
// pendurada para sempre, que é exatamente o que esta sonda precisa detectar.

import { useCallback, useEffect, useRef, useState } from "react";

// Site key PÚBLICA (por desenho vai no HTML). A secret NUNCA aparece aqui.
//
// ⚠️ VEM DE ENV, e SÓ de env. A chave é DIFERENTE em cada ambiente (a de
// staging não vale em produção), então literal no código é errado por
// construção — e o cadastro real vai exigir a env do mesmo jeito.
//
// ⭐ POR QUE ISTO NÃO É DETALHE: a parte 2 desta sonda custou uma ida-e-volta
// inteira porque a chave tinha sido transcrita à mão e estava errada — um "A" a
// mais no prefixo e a cauda inteira trocada, 25 chars em vez de 35. O sintoma
// foi error-callback 400020 = "Invalid sitekey", que se PARECE com "Cloudflare
// fora do ar" e tem consequência OPOSTA. Chave literal no código é o que torna
// esse erro invisível até alguém abrir o painel.
// ⓘ Nenhuma chave é reproduzida literalmente aqui: valor errado ao lado do certo
// é exatamente como o errado volta a ser copiado.
//
// 🔴 SEM FALLBACK LITERAL, E O MOTIVO É UM ACHADO DE SEGURANÇA (parte 3):
// numa das idas ao painel, o campo lido foi a SECRET em vez da site key — as
// duas ficam lado a lado e as duas começam com `0x4AAAAAA`. Um literal aqui
// teria publicado a secret no bundle do navegador.
//
// ⭐ O TESTE QUE DISTINGUE AS DUAS (rodar SEMPRE antes de colar uma chave):
//   curl -s -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
//     -d "secret=<CANDIDATO>" -d "response=x"
//   invalid-input-secret   → é SITEKEY  → pode ir ao cliente
//   invalid-input-response → é SECRET   → NUNCA aqui, só TURNSTILE_SECRET_KEY
// O teste discrimina de verdade: sitekeys reais e documentadas
// (1x00000000000000000000AA, 2x00000000000000000000AB) são recusadas como
// secret, e uma secret real passa. Foi assim que a troca foi detectada — e é
// assim que a chave em uso hoje foi verificada antes de entrar.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";
const SCRIPT_TIMEOUT_MS = 15000;

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      "error-callback"?: (code?: string) => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
    }
  ) => string | undefined;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

// ---- Singleton loader (molde video-player.tsx:63-82) ----
let turnstileScriptPromise: Promise<void> | null = null;
function loadTurnstileAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const prev = window.onloadTurnstileCallback;
    window.onloadTurnstileCallback = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    // ADIÇÃO DA SONDA (o molde não tem): sem isto, script bloqueado pela CSP
    // deixa a promise pendurada e a tela não conta nada ao humano.
    script.onerror = () =>
      reject(new Error("onerror do <script> — provável bloqueio de script-src"));
    document.head.appendChild(script);
    setTimeout(
      () => reject(new Error(`timeout de ${SCRIPT_TIMEOUT_MS}ms sem onload`)),
      SCRIPT_TIMEOUT_MS
    );
  });
  return turnstileScriptPromise;
}

type Violacao = {
  em: string;
  diretiva: string;
  bloqueado: string;
  disposition: string;
};

export function SondaTurnstileClient({ slug }: { slug: string }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const jaRenderizou = useRef(false);

  const [script, setScript] = useState("carregando…");
  const [widget, setWidget] = useState("aguardando o script");
  const [token, setToken] = useState<string | null>(null);
  const [servidor, setServidor] = useState("aguardando token");
  const [corpoServidor, setCorpoServidor] = useState<string | null>(null);
  const [violacoes, setViolacoes] = useState<Violacao[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const anota = useCallback((linha: string) => {
    const t = new Date().toISOString().slice(11, 23);
    setLog((L) => [...L, `${t}  ${linha}`]);
  }, []);

  // ⭐ O CORAÇÃO DA SONDA. A CSP não tem report-uri, mas o navegador dispara
  // `securitypolicyviolation` no document para CADA violação. Capturar aqui é o
  // que transforma "100% silencioso" em lista na tela — sem depender de o
  // humano ler o console.
  useEffect(() => {
    const onViol = (e: SecurityPolicyViolationEvent) => {
      setViolacoes((V) => [
        ...V,
        {
          em: new Date().toISOString().slice(11, 23),
          diretiva: e.violatedDirective || e.effectiveDirective || "?",
          bloqueado: e.blockedURI || "?",
          disposition: e.disposition || "enforce",
        },
      ]);
    };
    document.addEventListener("securitypolicyviolation", onViol);
    return () => document.removeEventListener("securitypolicyviolation", onViol);
  }, []);

  const validarNoServidor = useCallback(
    async (tk: string) => {
      setServidor("chamando /api/sonda-turnstile…");
      anota("POST /api/sonda-turnstile");
      try {
        const res = await fetch("/api/sonda-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tk }),
        });
        const texto = await res.text();
        setCorpoServidor(texto);
        setServidor(`HTTP ${res.status}`);
        anota(`servidor respondeu HTTP ${res.status}`);
      } catch (err) {
        // fetch REJEITA (rede) e RESOLVE com !ok — a lição das duas falhas.
        setServidor("FALHOU (rejeição de rede)");
        setCorpoServidor(String(err));
        anota(`servidor: rejeição de rede — ${String(err)}`);
      }
    },
    [anota]
  );

  useEffect(() => {
    let vivo = true;
    anota("montou; pedindo o script do Turnstile");
    loadTurnstileAPI()
      .then(() => {
        if (!vivo) return;
        setScript("✅ carregou (window.turnstile existe)");
        anota("script OK");
        if (!window.turnstile || !boxRef.current) {
          setWidget("❌ API carregou mas window.turnstile/container ausente");
          return;
        }
        if (jaRenderizou.current) return;
        jaRenderizou.current = true;
        try {
          window.turnstile.render(boxRef.current, {
            sitekey: SITE_KEY,
            callback: (tk: string) => {
              setWidget("✅ renderizou e resolveu");
              setToken(tk);
              anota(`token recebido (${tk.length} chars)`);
              void validarNoServidor(tk);
            },
            "error-callback": (code?: string) => {
              setWidget(`❌ error-callback do widget: ${code ?? "(sem código)"}`);
              anota(`error-callback: ${code ?? "(sem código)"}`);
            },
            "expired-callback": () => anota("token expirou"),
            "timeout-callback": () => anota("timeout-callback do widget"),
          });
          setWidget("⏳ render() chamado, aguardando o desafio");
          anota("turnstile.render() chamado");
        } catch (err) {
          setWidget(`❌ render() lançou: ${String(err)}`);
          anota(`render() lançou: ${String(err)}`);
        }
      })
      .catch((err) => {
        if (!vivo) return;
        setScript(`❌ NÃO carregou — ${String(err?.message ?? err)}`);
        setWidget("❌ impossível: o script não carregou");
        anota(`script FALHOU: ${String(err?.message ?? err)}`);
      });
    return () => {
      vivo = false;
    };
  }, [anota, validarNoServidor]);

  const cell: React.CSSProperties = {
    padding: "6px 10px",
    borderBottom: "1px solid #2a2a3e",
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        background: "#0a0a1a",
        color: "#e6e6f0",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: 18, margin: "0 0 4px", color: "#fbbf24" }}>
        SONDA-TURNSTILE — REMOVER · workspace: {slug}
      </h1>
      <p style={{ margin: "0 0 18px", color: "#9aa0b4" }}>
        Página descartável. Mede quais diretivas da CSP o Turnstile exige. Deixe
        o console aberto e reporte a tabela de violações abaixo.
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 18 }}>
        <tbody>
          {/* ADIÇÃO DA PARTE 3: a rodada anterior queimou uma ida-e-volta inteira
              sem que ninguém pudesse VER qual chave estava em uso. Uma sonda de
              diagnóstico que esconde o próprio insumo não é diagnóstico. */}
          <tr>
            <td style={{ ...cell, width: 210, color: "#9aa0b4" }}>0. site key EFETIVA</td>
            <td style={cell}>
              {SITE_KEY ? (
                <>
                  <code>{SITE_KEY}</code> ({SITE_KEY.length} chars) · origem: env
                  NEXT_PUBLIC_TURNSTILE_SITE_KEY ✅
                </>
              ) : (
                <span style={{ color: "#f87171" }}>
                  ❌ AUSENTE — a env NEXT_PUBLIC_TURNSTILE_SITE_KEY não chegou ao
                  bundle. A sonda não vai renderizar o widget. Ver o relatório da
                  parte 3: o valor recebido como &quot;site key&quot; foi medido e é
                  uma SECRET KEY, então não pode entrar aqui.
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, width: 210, color: "#9aa0b4" }}>1. script de terceiro</td>
            <td style={cell}>{script}</td>
          </tr>
          <tr>
            <td style={{ ...cell, color: "#9aa0b4" }}>2. widget (iframe)</td>
            <td style={cell}>{widget}</td>
          </tr>
          <tr>
            <td style={{ ...cell, color: "#9aa0b4" }}>3. token no cliente</td>
            <td style={cell}>
              {token ? `✅ ${token.slice(0, 28)}… (${token.length} chars)` : "—"}
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, color: "#9aa0b4" }}>4. validação no servidor</td>
            <td style={cell}>{servidor}</td>
          </tr>
          <tr>
            <td style={{ ...cell, color: "#9aa0b4" }}>resposta crua do servidor</td>
            <td style={cell}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {corpoServidor ?? "—"}
              </pre>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: 15, margin: "0 0 6px", color: "#f87171" }}>
        ⭐ VIOLAÇÕES DE CSP CAPTURADAS ({violacoes.length})
      </h2>
      <p style={{ margin: "0 0 8px", color: "#9aa0b4" }}>
        A CSP não tem report-uri, então isto vem do evento
        <code> securitypolicyviolation </code> do próprio navegador. Se aparecer
        <code> connect-src </code> aqui, a leitura estava incompleta e a cicatriz
        do Vimeo se repetiu.
      </p>
      {violacoes.length === 0 ? (
        <div style={{ padding: 10, background: "#12122a", borderRadius: 6 }}>
          nenhuma violação capturada até agora
        </div>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ color: "#9aa0b4", textAlign: "left" }}>
              <th style={cell}>hora</th>
              <th style={cell}>diretiva violada</th>
              <th style={cell}>URI bloqueada</th>
              <th style={cell}>modo</th>
            </tr>
          </thead>
          <tbody>
            {violacoes.map((v, i) => (
              <tr key={i}>
                <td style={cell}>{v.em}</td>
                <td style={{ ...cell, color: "#f87171" }}>{v.diretiva}</td>
                <td style={{ ...cell, wordBreak: "break-all" }}>{v.bloqueado}</td>
                <td style={cell}>{v.disposition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 15, margin: "18px 0 6px", color: "#9aa0b4" }}>
        widget renderiza aqui ↓
      </h2>
      <div
        ref={boxRef}
        style={{
          minHeight: 90,
          padding: 10,
          background: "#12122a",
          border: "1px dashed #2a2a3e",
          borderRadius: 6,
        }}
      />

      <h2 style={{ fontSize: 15, margin: "18px 0 6px", color: "#9aa0b4" }}>log</h2>
      <pre
        style={{
          background: "#12122a",
          padding: 10,
          borderRadius: 6,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {log.join("\n") || "—"}
      </pre>
    </div>
  );
}
