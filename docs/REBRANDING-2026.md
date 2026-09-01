# 🎨 REBRANDING 2026 — documento vivo da frente

**Branch de integração:** `feat/rebranding` (aberta de `main @ d388389`).
A `main` só recebe com **aprovação explícita do dono**.

Este documento é a fonte de verdade da frente. **Nenhuma fatia fecha sem
atualizá-lo** — ver §10.

---

## 1. Objetivo e a REGRA CENTRAL

Logo e paleta novas. **O domínio NÃO muda.**

> **A nova identidade é o novo DEFAULT.**
> **A personalização REAL do produtor tem prioridade absoluta.**
> **Quem nunca personalizou recebe a nova identidade.**

⚠️ E a parte difícil, que é onde a regra pode ser traída sem ninguém perceber:

> **Valor salvo ≠ personalização.**

Não é teoria. Medido em produção em 31/ago/26: dos **14** `User.themeConfig`
preenchidos, **3 são byte-idênticos ao padrão**. Aquelas 3 pessoas *têm um valor
salvo* e *não personalizaram nada*. Tratar "tem valor" como "personalizou"
congelaria o azul velho para gente que deveria receber a identidade nova.

O critério tem de ser medido campo a campo, e ele **não é uniforme** — ver **D6**.

---

## 2. Fonte de verdade da marca

### Modo escuro (o padrão do painel hoje)

| Papel | Hex |
|---|---|
| `bg/base` | `#191919` |
| `bg/surface` | `#202020` |
| `bg/elevated` | `#262626` |
| `text/primary` | `#F6F6F2` |
| `brand/primary` | `#EFFF20` |

### Modo claro

| Papel | Hex |
|---|---|
| `bg/base` | `#FFFFE6` |
| `bg/surface` | `#FEFFE6` |
| `bg/elevated` | `#FBFFC2` |
| `text/primary` | `#191919` |

### Escala Lime

| Token | Hex |
|---|---|
| `lime/300` | `#F5FF58` |
| **`lime/500`** | **`#EFFF20`** ← `brand/primary` |
| `lime/600` | `#D6E600` |

**Off-white:** `#FFFFE6`

### 🔴 A regra do guia que governa toda a F3

> **`brand/primary` só em CTA, seleção e destaque.**

Não é cor de fundo de página, não é cor de superfície, não é cor de texto
corrido. Lime é a cor que **chama atenção** — usá-la fora disso mata o próprio
efeito e cria o problema de contraste do §8.

---

## 3. Inventário (medido em 31/ago/26 e 01/set/26)

Números, não impressões. A investigação completa está no histórico; aqui fica o
que decide trabalho.

| O quê | Medida |
|---|---|
| Hex cravado em `src/` | **772** ocorrências em **73** arquivos — `#3b82f6` sozinho aparece **140×** |
| Utilitários Tailwind `*-blue-N` | **770** em **92** arquivos (`bg` 325 · `text` 204 · `border` 129 · `ring` 70) |
| `bg-primary` | **239** em **58** arquivos |
| `rgb(`/`rgba(` | **185** em **17** arquivos (`hsl` = 0) |
| **Pares "fundo de marca + texto claro"** | **188** na mesma linha (91 `bg-primary`, 97 `bg-blue-*`) — ver §8 |
| Namespaces de tema | **2**: `--producer-*` e `--member-*`. **A vitrine reusa `--producer-*`** (`w/[slug]/layout.tsx:38`) — não existe `--vitrine-*` |
| Fallbacks de `--member-primary` no `globals.css` | **12 hexes diferentes** — azuis **e** verdes. Não existe "um" padrão |
| Workspaces | **39** · **21 sem personalização alguma** nas 4 áreas |
| Cursos | **66** · **18** com alguma `member*Color` |
| `User.themeConfig` | **27.406** de **27.420** vazios (`'{}'`) · 14 preenchidos · **3 deles idênticos ao padrão** |
| Templates de e-mail | **16** · **10 cravam "Members Club"** · 71 hex, 13 cores |
| Manifests | **2** — estático `public/manifest.json` e dinâmico `api/manifest/[slug]/route.ts` |
| Service worker | `public/sw.js:29` **sai cedo em tudo que não é navegação** ⇒ **não cacheia imagem**; bumpar `SW_VERSION` não resolve ícone velho |
| Ícones PWA | os **9** têm dimensão real ≈ **1,30×** a declarada (`icon-192x192.png` é 250×250) |
| SVG inline | **525** em 138 arquivos, mas só **6** têm cor literal — **519 usam `currentColor`** |
| Favicon | **não existe `favicon.ico`**; é decidido em runtime por `PlatformSettings.faviconUrl` (`dynamic-favicon.tsx:25`), fallback `/logo.png` |

⭐ **A boa notícia escondida nesses números:** o `globals.css` já **remapeia**
`bg-blue-*` para as variáveis de tema — mas só dentro de `.producer-layout`,
`.course-customized` e `.vitrine-customized`. **Fora desses três escopos o azul
é literal**: ~42 linhas (27 no `/admin` + 15 em páginas soltas) que nenhuma
variável alcança.

---

## 4. Decisões

### D1 — Vale o hex do GUIA · 01/set/26
Os SVGs entregues foram normalizados para o guia: `#F2FF3A` → **`#EFFF20`**,
`#1C1C1C` → **`#191919`**, `#FCFFD8` → **`#FFFFE6`**. O `#EEEEEE` da versão mono
clara virou **`#F6F6F2`** — é o único valor do material que não tinha
equivalente no guia, e foi resolvido para `text/primary`.
**Motivo:** duas fontes de verdade para a mesma cor é como a divergência nasce
invisível. O guia manda.

### D2 — Ícones gerados do próprio vetor, com NOME NOVO · 01/set/26
Gerados a partir do símbolo circular isolado, com fundo `#191919` embutido, e
**arte própria para `maskable`** (hoje o manifest declara o mesmo PNG como `any`
e `maskable`, sem safe-zone).
⭐ **ARQUIVO COM NOME NOVO — nunca sobrescrever os atuais.**
**Motivo:** o navegador e o SO cacheiam ícone por URL. Sobrescrever
`icon-192x192.png` deixa gente com o ícone velho por tempo indeterminado, e
`public/sw.js:29` **não** ajuda (ele nem toca em imagem). Nome novo é a única
invalidação garantida.
⚠️ **Ressalva registrada:** a 16px as listras do símbolo borram. Aceito para
ícone de app; para favicon, conferir no gate.

### D3 — Branch de integração · 01/set/26
Tudo desemboca em `feat/rebranding`. A `main` só recebe com aprovação explícita
do dono.

### D4 — Gate LOCAL, sem Preview na Vercel · 01/set/26
Build de staging + `next start` + **prova de alvo discriminante** (ref de
staging ≥ 1 **e** ref de produção = 0 no HTML + chunks).
🔴 **Preview está PROIBIDO** até três coisas serem conferidas por humano no
painel da Vercel: (1) as variáveis estão escopadas por Production/Preview/
Development? (2) qual `DATABASE_URL` um Preview receberia? (3) qual é o Build
Command exato? **`vercel.json` não tem `buildCommand`** — ele vive no painel,
fora do repo. Se for `prisma migrate deploy && npm run build` e o Preview herdar
a env de produção, **um preview roda `migrate deploy` contra a produção**.

### D5 — Sem mudança em `prisma/schema.prisma` · 01/set/26
**Motivo:** o schema é um dos 7 arquivos da fatia 1 do E4.4, congelada em
`7d57c40` com uma migração ainda não aplicada em produção. Mexer nele aqui cria
conflito na retomada. Ver `docs/PAUSA-E4.4-FATIA1.md` §2.

### D6 — 🔴 PENDENTE: os 5 campos de login com `@default` · **TRAVA A F3**
`Workspace.loginBgColor`, `loginPrimaryColor`, `loginBoxColor`, `loginSideColor`
e `loginLinkColor` têm `@default` no schema ⇒ **a cor é gravada na ESCRITA**.
Medido: `loginPrimaryColor` tem **0 NULL** e **25 de 39** exatamente em
`#6366f1` — **indistinguíveis** entre "nunca abriu a tela" e "escolheu esse
índigo". É exatamente o caso que a regra central proíbe presumir.
*(E há uma inconsistência dentro do próprio grupo: `loginBgColor` tem
`@default("#0a0a1a")` mas **zero** linhas com esse valor e 14 NULL.)*

| Opção | O que é | Custo |
|---|---|---|
| **A** | não encostar nos 5 — login fica azul | zero risco, identidade fica pela metade |
| **B** | migrar no banco (`UPDATE` dos que estão no default) | escrita irreversível em 39 workspaces; erra e apaga escolha real |
| **C** ⭐ | *shim* de leitura: tratar "== default antigo" como "não personalizado" no ponto de leitura | **zero escrita, zero schema, reversível por `git revert`** |

**Recomendada: C.** Decisão do dono, ainda **não tomada**.

### D7 — Os 12 fallbacks de `--member-primary` ficam para a F4 · 01/set/26
Unificá-los **muda pixel para quem não personalizou** — é mudança visual real,
não refactor. Não entra junto com outra coisa.

### D8 — `public/images/applyfy-logo.png` é marca de TERCEIRO
Logo do gateway. **Não rebrandear.** Consumida em
`producer/settings/integrations/page.tsx` e `admin/integrations/page.tsx`.

### D9 — 🔴 NÃO TOCAR (campo minado, um a um)

| O quê | file:line | Por quê |
|---|---|---|
| `"members-club-salt"` | [encryption.ts:15](../src/lib/encryption.ts) | **Sal do AES-256-GCM.** Mudar torna **indecifrável** tudo que já foi criptografado |
| `/api/webhooks/members-club` | `app/api/webhooks/members-club/route.ts` | Caminho **configurado fora do painel** (`sidebar.tsx:203`); mudar derruba webhook de venda |
| `mymembersclub.com.br` | 33 ocorrências | O domínio **não muda** nesta frente |
| `noreply@mymembersclub.com.br` | [email.ts:6](../src/lib/email.ts) | Endereço fixo, com DKIM da Brevo no domínio |
| `friendlyName: "Members Club Auth"` | `api/auth/mfa/enroll/route.ts:40` | Nome do emissor TOTP no app autenticador |

---

## 5. Plano de fatias

| Fatia | O que é | Muda pixel? |
|---|---|---|
| **F0** | fonte única dos defaults do painel (`theme-constants.ts`) | **NÃO** |
| **F1** | assets: logo, ícones PWA com nome novo, favicon, OG | **SIM** |
| **F2** | tokens: os hexes do guia entram como constantes, ainda sem trocar nada | **NÃO** |
| **F3** | a troca: defaults do painel passam a apontar para a paleta nova | **SIM** — bloqueada por **D6** |
| **F4** | fallbacks do CSS (`globals.css`) e os 12 de `--member-primary` | **SIM** |
| **F5** | superfícies fora do app: e-mail, certificado, landing | **SIM** |
| **F6** | varredura do azul literal fora dos 3 escopos remapeados (~42 linhas) | **SIM** |

⚠️ A ordem acima é a sequência lógica, **não** um compromisso. Cada fatia abre
com investigação própria.

---

## 6. Registro por fatia

| Fatia | O que entrou | Arquivos | SHA | Prova de máquina | Gate humano | Data |
|---|---|---|---|---|---|---|
| **F0** | 4 cópias dos defaults do painel viraram 1 (`src/lib/theme-constants.ts`); consumidores ganharam 1 linha de alias cada. **Zero mudança de valor.** | **5** (1 novo + 4 modificados), −40/+8 | `caebebc` | diff de valor contra `git show HEAD:` → **8/8 idênticos** · literais antigos nos 4 alterados → **0** · `tsc --noEmit` **exit 0** · build de staging verde (`UgE92EXkbvYifZDfTatVj`) · alvo: ref staging **1**, ref produção **0** · `git status` = exatamente 5 linhas | ⏳ **PENDENTE** | 01/set/26 |

### O que o gate humano da F0 precisa ver

Palco local em `http://localhost:3000/producer/login`, senha `Staging@2026!`.

1. **Sem personalização** — `producer-staging@staging.test` (`themeConfig = '{}'`,
   medido): painel idêntico ao de antes.
2. Alternar **claro ↔ escuro** nesse estado.
3. **Criar** a personalização em `/producer/settings`, salvar, recarregar.
4. Alternar **claro ↔ escuro** já personalizado.
5. **Reset** — tem que voltar exatamente ao passo 1.

⚠️ **Nenhuma das 16 contas que abrem o painel no staging tem personalização** —
todas com `themeConfig = '{}'` (medido). O caso "COM personalização" **precisa
ser criado pela tela**, e isso é melhor que semear: o ato exercita
`PUT /api/producer/theme`, que é um dos 4 arquivos alterados. O passo 5 exercita
o `DELETE` (`route.ts:113`).

---

## 7. F0.9 — o objeto compartilhado

Centralizar transformou 4 objetos em 1, compartilhado por 4 módulos. Fui atrás
de mutação antes de seguir.

### ✅ Veredito: NÃO existe mutação. Nenhum spread é necessário hoje.

- As **duas** únicas escritas do conjunto são `route.ts:88` (`merged.mode = …`)
  e `:90` (`merged[key] = …`), e `merged` é **cópia-de-cópia**:
  `parseTheme` espalha nos **três** caminhos de retorno (`:32`, `:35`, `:37`),
  `existing` recebe essa cópia (`:85`), e `merged = { ...existing }` (`:86`).
- Todo `setTheme` recebe objeto novo: `d.theme`/`data.theme` vêm de `JSON.parse`
  de resposta HTTP; `next` é `{ ...theme, [key]: value }`.
- `useProducerTheme()` tem **um** consumidor (`settings/page.tsx:28`) e ele
  desestrutura **só `refresh`**, nunca `theme`.
- Os quatro objetos **já eram de escopo de módulo** antes — medido por
  profundidade de chaves em `HEAD` e `HEAD~1`. O que mudou é **cardinalidade**,
  não tempo de vida (ver §9).
- ⭐ `producer/layout.tsx` é **Server Component**; a prop `initialTheme` (`:103`)
  atravessa para o Client **serializada**. Esse caminho é imune **por
  construção**, não por disciplina.

### Os 3 pontos de risco latente — conserto pronto, não aplicado

| file:line | Hoje | Se um dia mutarem |
|---|---|---|
| `components/producer-theme-provider.tsx:54` | `useState(initialTheme \|\| DEFAULTS)` | `{ ...PRODUCER_THEME_DEFAULTS }` |
| `app/producer/settings/page.tsx:30` | `useState(DEFAULTS)` | idem |
| `components/producer-theme-provider.tsx:27` | valor-padrão do contexto | idem |

---

## 8. Riscos abertos da frente

**🔴 Legibilidade — a maior.** Hoje a marca é azul e é fundo com texto **claro**
por cima. Lime é claro e exige texto **escuro**. São **188 pares** medidos na
mesma linha (mais os casos em que fundo e texto estão em linhas diferentes:
`confirm-modal.tsx:51`+`:103`, `course-support-widget.tsx:236-238` aplicado em
4 lugares, `workspace-switcher.tsx:106-107`).
⭐ A variável certa **existe** — `--producer-button-text`, default `#ffffff`,
salva em `api/producer/theme/route.ts` e editável em `producer/settings` — e é
**consumida na interface em UM lugar só**: `notifications-bell.tsx:132`. Todo o
resto escreve `text-white` na mão.
E não há precedente: procurei fundo de marca com texto escuro em todo o `src/` —
o único acerto é `bg-blue-50` (tinta clara, não a marca). Só a landing já
sobreviveria (`landing/page.tsx:628`, `color:#06060a`).
⚠️ **Tag é o caso invertido:** fundo a 8% com texto **na mesma cor** — lime a 8%
com texto lime fica ilegível por outro motivo.

**🔴 O que não muda mais.** E-mail **já enviado** e certificado **já emitido**
carregam a marca velha para sempre. O certificado ainda crava `"Members Club"`
duas vezes (`certificate-pdf.ts:52` e `:117`) em `#2563EB` e **não lê nada do
workspace** — o produtor não consegue tirar a marca do PDF do aluno dele.

**🟠 CSP.** `img-src 'self' data: blob: https://*.supabase.co
https://*.supabase.in` ([next.config.mjs:50](../next.config.mjs)) e
`images.remotePatterns` só aceita supabase. **Asset de marca em CDN de terceiro
é bloqueado em silêncio** — a CSP é enforcing e **não tem `report-uri`**.

**🟠 Colisão com a fatia congelada.** `src/app/api/w/[slug]/init/route.ts` tem
**20 referências de cor/marca** — mas são **nomes de campo** (`logoUrl`,
`loginBgColor`, `accentColor`, os 6 `member*Color` em dois selects), **não
hex**. Só colide se a frente mudar *como a cor trafega*, não se mudar *qual é a
cor*.

---

## 9. Lição nova — centralizar troca CARDINALIDADE, não tempo de vida

Ao juntar as 4 cópias eu perguntei "isto vira compartilhado?". A pergunta certa
era mais fina, e a medição mostrou por quê: **os quatro objetos já eram
singletons de módulo**. Não havia "novo a cada execução" virando "compartilhado"
— o tempo de vida era o mesmo antes e depois.

**O que realmente mudou foi a cardinalidade: 4 → 1.** O comportamento é
idêntico, mas o **raio de dano** de um erro futuro **quadruplicou**: antes, uma
mutação acidental no módulo A corromperia só a cópia de A; agora corromperia os
quatro.

**Como aplicar:** ao centralizar um valor, medir o escopo do ANTES (profundidade
de chaves, não indentação), e **registrar os pontos de consumo que guardam a
referência** — eles são onde o bug vai nascer. Isso é parte do trabalho de
centralizar, não um extra.

---

## 10. Regra da frente

**Nenhuma fatia fecha sem atualizar ESTE documento:**
1. linha nova na tabela do **§6** (com SHA e prova de máquina);
2. decisões novas numeradas no **§4**, com data e motivo;
3. lições no **§9**.

Fatia sem registro aqui vira item-fantasma — a casa já pagou por isso.
