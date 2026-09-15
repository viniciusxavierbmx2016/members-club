# RUNBOOK — alguém perdeu o autenticador de 2FA

> **Para quem:** o dono da plataforma. **Quando:** uma pessoa com verificação em
> duas etapas perdeu o celular/app e não consegue entrar.
> **Item:** [9.111](PLANO-MESTRE.md) · **Escrito em** 15/set/2026.

⚠️ **Leia o passo 1 antes de qualquer outra coisa.** Ele resolve sem ninguém
mexer em nada — e **fecha com o tempo**.

---

## 0) O que está acontecendo

Quem tem 2FA ativo e perde o autenticador fica **trancado fora**, e o sistema
não oferece saída:

- trocar a senha **não remove** o 2FA — a pessoa troca e continua sendo
  desafiada (`api/auth/reset-password`, o próprio código avisa disso);
- desativar o 2FA **exige o código** que ela perdeu (`api/auth/mfa/unenroll`
  devolve 403 sem o segundo fator);
- **não existem códigos de backup** nesta plataforma;
- a tela do desafio **não diz nada** sobre o que fazer — só "código inválido".

**Hoje (15/set/26) são 2 pessoas com 2FA ativo: 1 ADMIN e 1 PRODUTOR.**

---

## 1) ⭐ PRIMEIRO: a saída que não precisa de ninguém

**Se a pessoa ainda estiver logada em ALGUM aparelho** — outro computador, o
celular, uma aba aberta —, **ela mesma resolve, sozinha, em 30 segundos**:

> **Diga a ela, nesta ordem:**
> 1. **⛔ NÃO saia da conta em lugar nenhum. Não clique em "sair". Não limpe os
>    cookies do navegador.** Cada logout pode fechar a última porta.
> 2. Procure qualquer aparelho onde ela ainda esteja logada.
> 3. Nesse aparelho: **Configurações → Segurança → desativar a verificação em
>    duas etapas.**
> 4. Depois de desativar, **entrar de novo e reativar o 2FA** com o
>    autenticador novo.

**Por que funciona:** a sessão que já passou pelo desafio continua valendo, e
naquele aparelho a pessoa tem permissão para desligar o próprio 2FA.

⚠️ **E funciona por tempo limitado.** Medido em produção: a mesma pessoa é
desafiada de novo, em média, a **cada ~22 horas**. ⇒ **a janela é de horas, não
de dias. Aja hoje.**

⚠️ **Não é garantia do fornecedor.** É o que os dados desta plataforma mostram
(39 desafios em 22 dias distintos, ao longo de 119 dias — o desafio acontece no
*login*, não a toda hora), não uma promessa escrita do Supabase. **Tente
primeiro — pode não funcionar.** Se não funcionar, siga para o passo 2.

⭐ **Esta saída é a melhor de todas** também porque a plataforma **registra**
quem desativou (`AuditLog`, ação `mfa_disabled`). Nenhuma das outras registra.

---

## 2) Confirmar que é mesmo a pessoa

⛔ **NUNCA remova o 2FA só porque chegou um pedido por e-mail.** Quem tomou a
caixa postal da pessoa manda esse e-mail igual. **Remover 2FA é, por definição,
um jeito de burlar o 2FA** — se você errar aqui, você entrega a conta.

**Confira, por um canal DIFERENTE de onde veio o pedido.** Se o pedido veio por
e-mail, ligue. Se veio por WhatsApp, confirme por outro meio.

**O que a plataforma sabe e você pode comparar** (e só isto — não invente):

| conferir | onde está |
|---|---|
| **Telefone cadastrado** | `User.phone` — as duas contas com 2FA têm telefone |
| **Data de criação da conta** | `User.createdAt` |
| **Workspaces e cursos que a pessoa possui** | `Workspace.ownerId` / `Course.ownerId` — peça para ela citar |
| **Histórico de uso** | `AuditLog` da conta — últimas ações, datas |
| **Quando ativou o 2FA** | `auth.mfa_factors.created_at` |

⭐ **A regra prática:** ligue para o **telefone que está cadastrado** — não para
o número que veio no pedido. Se os dois forem diferentes, **pare**: isso por si
só é motivo para desconfiar.

⚠️ **Se qualquer coisa não bater, não remova.** É melhor a pessoa esperar do que
a conta virar de outro.

---

## 3) Remover o fator — só o dono executa

⚠️ **Precisa da chave de serviço de produção** (`SUPABASE_SERVICE_ROLE_KEY`) ou
de acesso ao banco. **Não existe botão no painel `/admin` para isso** — nenhum
administrador consegue remover o 2FA de outra pessoa pela interface. **Não
delegue: quem tem a chave é o dono.**

**Caminho recomendado — API admin do Supabase:**

```js
// 1) achar o fator da pessoa (userId = User.id)
const { data } = await admin.auth.admin.mfa.listFactors({ userId });

// 2) remover
await admin.auth.admin.mfa.deleteFactor({ userId, id: factorId });
```

**Alternativa — SQL no painel do Supabase (projeto de PRODUÇÃO):**

```sql
DELETE FROM auth.mfa_factors WHERE user_id = '<uuid>';
```

⚠️ **Confira o `user_id` duas vezes antes de rodar.** Um `DELETE` sem `WHERE`
correto tira o 2FA de todo mundo.

**Depois de remover:** avise a pessoa para **entrar e reativar o 2FA
imediatamente**, com o autenticador novo. Enquanto não reativar, a conta está
protegida só pela senha.

---

## 4) ⭐ O registro manual — obrigatório

🔴 **A remoção feita pelos caminhos do passo 3 NÃO fica registrada em lugar
nenhum.** Medido: o `AuditLog` da plataforma só é escrito pelo código das rotas,
e o log de auditoria do próprio Supabase (`auth.audit_log_entries`) está
**vazio**. ⇒ **se você não escrever, não existe.**

**Anote, no lugar onde a equipe encontra depois** (e-mail para você mesmo,
documento fixo, o que for — mas sempre no mesmo lugar):

```
RECUPERAÇÃO DE 2FA
Data/hora (UTC): ..............................
Quem pediu (papel + conta): ...................
Por onde pediu: ...............................
Como confirmei a identidade: ..................
  (canal usado, telefone comparado, o que conferi)
Quem executou: ................................
Caminho usado: (API admin / SQL)
A pessoa reativou o 2FA? ( ) sim  ( ) não — quando: ....
```

---

## ⛔ O que NÃO fazer

- **Não remover por pedido de e-mail sozinho.** Sempre um segundo canal.
- **Não remover sem registrar.** Sem o registro, ninguém consegue auditar depois.
- **Não delegar** para quem não é o dono — a chave de serviço abre muito mais
  que o 2FA.
- **Não mandar a pessoa "criar outra conta"** — ela perde workspaces, cursos e
  histórico.
- **Não usar recuperação por e-mail como substituto do 2FA.** Se a caixa postal
  bastasse, o 2FA não serviria para nada.

---

## O que ainda falta (por que o 9.111 continua aberto)

Este runbook dá um **caminho**; ele não **resolve** o problema:

- ⛔ **depende do dono estar disponível.** Se ele não puder atender, a pessoa
  espera — e é essa a dívida real, não a quantidade de gente com 2FA;
- ⛔ **não escala.** Com 139 produtores, se o 2FA for oferecido a todos, isto
  vira fila;
- ⛔ **a remoção continua sem rastro automático.**

**O conserto de verdade são códigos de backup na ativação do 2FA** — que o SDK
do Supabase **não oferece pronto** (não há `backup`/`recovery` em
`supabase.auth.mfa`) e precisariam ser construídos: tela, armazenamento cifrado,
consumo de uso único. Está registrado no **9.111**.
