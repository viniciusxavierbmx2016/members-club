"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", `/api/manifest/${slug}`);
    return () => {
      const l = document.querySelector('link[rel="manifest"]');
      if (l) l.setAttribute("href", "/manifest.json");
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setJaTemConta(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/w/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ⛔ SÓ os 4 campos. Nada de role, workspaceId ou origin — o servidor
        // os descartaria, mas o cliente também não os inventa.
        // 🔵 FATIA 3 — o token do Turnstile entra AQUI, como 5º campo, quando o
        //    widget for montado. O ponto fica marcado de propósito; hoje
        //    `turnstile` tem 0 ocorrências em todo o src/.
        body: JSON.stringify({ name, email, phone, password }),
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
          <button type="submit" disabled={loading} className={authSubmitCls}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      )}
    </WorkspaceAuthShell>
  );
}
