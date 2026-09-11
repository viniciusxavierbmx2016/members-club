"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  WorkspaceAuthShell,
  WorkspaceAuthInfo,
  getLoginTheme,
  authInputCls,
  authLabelCls,
  authErrorCls,
  authSubmitCls,
} from "@/components/workspace-auth-shell";

/**
 * O objeto que o script da Cloudflare instala em `window`. Só o que se usa.
 * ⛔ Não é `any`: o tipo é a documentação do contrato com o terceiro.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

interface WorkspaceRegisterFormProps {
  workspace: WorkspaceAuthInfo;
  slug: string;
}

/**
 * E4.4 etapa 2, fatia 2 — o formulário de cadastro público.
 *
 * Molde: `workspace-forgot-form.tsx`, o irmão mais próximo (também posta e
 * também trata erro). Herda o shell, as 4 classes exportadas, o `useEffect` do
 * manifest e o rodapé com link para o login. ⛔ Nenhum estilo novo.
 *
 * ⚠️ Os 4 campos são os decididos: nome, e-mail, WhatsApp (D7, OBRIGATÓRIO) e
 * senha. A rota descarta qualquer outro no parse (schema fechado), então mandar
 * mais daqui não teria efeito — e não mandamos.
 */
export function WorkspaceRegisterForm({
  workspace,
  slug,
}: WorkspaceRegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Separado do `error` de propósito: o 409 não é uma falha, é um desvio de
  // caminho — a pessoa já tem conta e precisa de um LINK, não de uma frase
  // vermelha sem saída. É a lição do §8(c) do PLANO-E4.4, onde o 401 do resgate
  // aparecia cru "sem nenhum caminho para o login".
  const [jaTemConta, setJaTemConta] = useState(false);
  const [loading, setLoading] = useState(false);
  // ⭐ FATIA 3 — o token do captcha. Vazio = a pessoa ainda não passou pela
  // porta. O servidor recusa de qualquer jeito (defesa em profundidade); isto
  // aqui é só para não gastar uma requisição que já se sabe que vai falhar.
  const [turnstileToken, setTurnstileToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", `/api/manifest/${slug}`);
    return () => {
      const l = document.querySelector('link[rel="manifest"]');
      if (l) l.setAttribute("href", "/manifest.json");
    };
  }, [slug]);

  // ⭐ O WIDGET. Renderização EXPLÍCITA (`render=explicit`), não a implícita
  // por `class="cf-turnstile"`: em React a implícita depende de o script achar
  // o nó no momento certo do ciclo de vida, e o callback teria de ser uma
  // função global.
  //
  // ⚠️ O `remove` no cleanup não é zelo: em dev o StrictMode monta o efeito
  // DUAS vezes, e sem ele o segundo `render` empilha um widget órfão. É a
  // mesma família da lição do YouTube reinstalando a legenda — quem instala o
  // estado é um TERCEIRO, e repetir só é seguro pela PROTEÇÃO, não por
  // idempotência presumida.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | undefined;
    let vivo = true;

    function render() {
      if (!vivo || !captchaRef.current || !window.turnstile) return;
      if (widgetId) return;
      widgetId = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setTurnstileToken(t),
        // Token do Turnstile vale UMA vez e expira. Zerar o estado nos dois
        // casos evita mandar ao servidor um token que ele vai recusar.
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    }

    if (window.turnstile) {
      render();
      return () => {
        vivo = false;
        if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      };
    }

    let script = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => {
      vivo = false;
      script?.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setJaTemConta(false);
    // ⛔ Sem token não se manda. Isto NÃO é a defesa — a defesa é o servidor,
    // que recusa com 403 (`register/route.ts`). Isto poupa uma ida ao servidor
    // que já se sabe perdida, e dá à pessoa uma frase que explica a espera em
    // vez de um erro seco vindo da API.
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(
        "Aguarde a verificação de segurança concluir e tente novamente."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/w/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ⛔ SÓ os 4 campos. Nada de role, workspaceId ou origin — o servidor
        // os descartaria, mas o cliente também não os inventa.
        // ⭐ FATIA 3 — o 5º campo é o token do captcha. O schema da rota é
        //    FECHADO, então ele é lido e descartado no parse: nunca vira dado.
        body: JSON.stringify({ name, email, phone, password, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      // ⚠️ `fetch` falha de DOIS jeitos: rejeita (rede) e resolve com !ok. O
      // catch cobre o primeiro; este ramo, o segundo.
      if (!res.ok) {
        if (res.status === 409 && data.alreadyRegistered) {
          setJaTemConta(true);
        } else {
          setError(data.error || `Não foi possível criar a conta (${res.status})`);
        }
        setLoading(false);
        return;
      }
      // A rota já deixou a sessão no cookie (o `signUp` roda pelo cliente que
      // escreve cookie), então a vitrine abre direto — sem passar pelo login.
      // `location.href` e não `router.push`: o cookie novo precisa valer para o
      // servidor na próxima navegação.
      window.location.href = `/w/${slug}`;
    } catch {
      setError("Erro ao conectar com o servidor");
      setLoading(false);
    }
  }

  const theme = getLoginTheme(workspace);

  return (
    <WorkspaceAuthShell
      ws={workspace}
      title={
        workspace.loginTitle
          ? `${workspace.loginTitle} · Criar conta`
          : "Criar conta"
      }
      subtitle="Preencha seus dados para acessar a área de membros"
      footer={
        <p className="mt-6 text-center text-sm text-white/70">
          Já tem conta?{" "}
          <Link
            href={`/w/${slug}/login`}
            className="hover:underline font-medium transition-colors"
            style={{ color: theme.linkColor }}
          >
            Entrar
          </Link>
        </p>
      }
    >
      {error && <div className={authErrorCls}>{error}</div>}

      {jaTemConta ? (
        <div className="text-center text-sm text-white/80">
          <p className="mb-4">
            Você já tem uma conta com este e-mail nesta área de membros.
          </p>
          <Link
            href={`/w/${slug}/login`}
            className={authSubmitCls}
            style={{ display: "block", textAlign: "center" }}
          >
            Fazer login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={authLabelCls}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className={authInputCls}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className={authLabelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              className={authInputCls}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className={authLabelCls}>WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={8}
              maxLength={20}
              autoComplete="tel"
              className={authInputCls}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label className={authLabelCls}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              className={authInputCls}
              placeholder="Mín. 6 caracteres"
            />
          </div>
          {/* ⭐ O nó do captcha. O widget v2 é MANAGED e a sonda de 30/08 mediu
              `metadata.interactive: false` — para a pessoa real ele não pede
              clique nenhum. ⛔ Este é o ÚNICO lugar do app com widget: login,
              esqueci-a-senha e redefinir seguem sem ele. */}
          <div ref={captchaRef} className="flex justify-center" />

          <button type="submit" disabled={loading} className={authSubmitCls}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      )}
    </WorkspaceAuthShell>
  );
}
