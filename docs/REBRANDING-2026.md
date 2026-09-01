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

> ⚠️ **CORRIGIDA em 01/set/26 pela P0.** A versão anterior escolhia entre **três
> opções que partiam de uma premissa não medida** — *"a cor salva é a única
> evidência de que a pessoa personalizou"*. A P0 recusou a premissa (Q1), apontou
> evidência não medida (Q2) e achou saída fora do código (Q3). As opções A/B/C
> ficam abaixo como **histórico**, e o que vale agora é o **processo**.

📐 **A medição do passo 1 já foi feita — ver §12 (D6 — a arqueologia).** Números
finais: **16 esmagador · 12 personalizou o login · 13 ambíguo**, corte 01/set/26.

**O problema.** `Workspace.loginBgColor`, `loginPrimaryColor`, `loginBoxColor`,
`loginSideColor` e `loginLinkColor` têm `@default` no schema ⇒ **a cor é gravada
na ESCRITA**. Medido: `loginPrimaryColor` tem **0 NULL** e **25 de 39**
exatamente em `#6366f1`. *(E há inconsistência dentro do próprio grupo:
`loginBgColor` tem `@default("#0a0a1a")` mas **zero** linhas com esse valor e 14
NULL.)*

#### O PROCESSO (é isto que vale)

**1. MEDIR — read-only, primeiro passo da F3.** Antes de qualquer escolha:
   - **cruzar os 5 campos de login** com `themeConfig`, `logoUrl`, cor de vitrine
     e cor de e-mail — quem personalizou de verdade tende a ter mexido em mais
     de uma coisa;
   - **`updatedAt`** de cada linha;
   - **a data em que o `@default` entrou no schema** × a data de criação de cada
     workspace — quem nasceu *antes* do default não pôde tê-lo recebido no
     INSERT.
   **Saída exigida:** quantos dos 25 têm **evidência esmagadora** e quantos são
   **ambíguos de verdade**. Sem esse número, nada avança.

**2. APLICAR só nos esmagadores**, por **shim de LEITURA** — zero escrita, zero
   schema, **atrás de uma constante única que desliga tudo**.

**3. NÃO ENCOSTAR no resíduo ambíguo.** Fica com a aparência de hoje.

**4. AVISAR os 39 antes de publicar.** Quem salvar a cor no painel **trava a
   aparência atual e resolve a própria ambiguidade** — é a Q3 da P0 em ação:
   quando o dado não distingue, pergunta-se ao dono do dado.

**5. MEDIR DEPOIS.** Quantos produtores mexeram na cor em **2 semanas**. É o
   sinal de acerto *ou de erro* que a Q5 exige.

**6. REGISTRAR o conserto de raiz** — parar de persistir o padrão no INSERT —
   para **depois do descongelamento do E4.4**. É schema, hoje bloqueado pela
   **D5**.

#### Histórico — as três opções superadas

| Opção | O que era | Por que foi superada |
|---|---|---|
| **A** | não encostar nos 5 | trata os 25 como bloco único; nem tenta separar quem é evidente |
| **B** | migrar no banco (`UPDATE`) | escrita irreversível sobre 39 workspaces, decidida por adivinhação |
| **C** | shim de leitura para todos os 25 | a forma certa aplicada ao conjunto errado — **sobrevive como o passo 2**, agora restrito aos esmagadores |

**Decisão do dono, ainda não tomada.** O que mudou é que agora ela é tomada
**depois** do passo 1, não antes.

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
| **F0** ✅ | 4 cópias dos defaults do painel viraram 1 (`src/lib/theme-constants.ts`); consumidores ganharam 1 linha de alias cada. **Zero mudança de valor.** | **5** (1 novo + 4 modificados), −40/+8 | `caebebc` → merge **`546c167`** | diff de valor contra `git show HEAD:` → **8/8 idênticos** · literais antigos nos 4 alterados → **0** · `tsc --noEmit` **exit 0** · build de staging verde (`UgE92EXkbvYifZDfTatVj`) · alvo: ref staging **1**, ref produção **0** · `git status` = exatamente 5 linhas | ✅ **PASSOU 7/7** — 01/set/26 | 01/set/26 |
| **F1** ✅ | **1 linha** — `ui/button.tsx:17`, variante `primary`: `text-white` → `text-[var(--producer-button-text,#ffffff)]`. Alcança **6 dos 11** `<Button>`. | **1** | `16fc628` → merge **`d8f57e2`** | portão 4/4 (14/14 branco, 0 chave ausente · `/admin` 0 com controle positivo 10 · 0 importadores fora de `/producer` e `/admin` · 6 de 11) · regra CSS provada lado a lado · `tsc` exit 0 · `text-white` 1068→1067 · build `Ib4Zx6sQXgzhC_CPsvurT`, alvo 1/0 | ⚠️ **PARCIAL — 3 de 6**, declarado suficiente pelo dono | 01/set/26 |

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

#### ✅ Resultado do gate — 01/set/26, **7/7**, merge `546c167`

**A evidência decisiva:** após salvar `#FF6600` e depois **resetar**, as **6
variáveis `--producer-*` voltaram idênticas** ao estado inicial — medidas por
**`getComputedStyle`**, não por descrição de aparência. É a prova de que o
caminho `DELETE → { ...DEFAULTS }` (`api/producer/theme/route.ts:113`), agora
alimentado pelo arquivo novo, devolve exatamente o que devolvia antes.

**Como o gate foi executado, para quem for repetir:**
- por **agente de navegador**, com a **sessão já autenticada** — o passo de
  login não foi exercitado nesta rodada;
- a medição foi por **`getComputedStyle`**, não por captura de tela nem por
  julgamento visual. Isso importa: aparência descrita é opinião; valor computado
  é medida.

**Contaminação do palco, medida depois (`SELECT`, alvo staging impresso):**
`producer-staging@staging.test` está de volta em `themeConfig = '{}'`, **0**
contas com `#FF6600` remanescente, e **15 de 15** contas que abrem o painel
estão em `'{}'`.

ⓘ **Correção de contagem:** o baseline dizia "16 contas". São **15 pessoas** —
4 staff + 11 híbridos distintos. O 16 vinha de contar **linhas de
`Collaborator`**, e `colab-duplo@staging.test` tem **2**. Nenhuma conta sumiu.

⚠️ **Armadilha do palco, registrada:** **2 dos 3 cursos** de `staging-teste`
(`curso-pago-palco` e `curso-corrida-923`) têm **0 módulos**. Isso já contaminou
uma medição anterior desta frente — um "0 módulos" foi lido como recorte de
payload quando era só curso vazio. Quem medir conteúdo no palco tem de escolher
`curso-teste` (2 módulos, 4 aulas).

### F1 — o botão da casa lê a variável

**O que mudou:** uma linha. `src/components/ui/button.tsx:17`, só a variante
`primary`. A forma foi **copiada, não escolhida**: a casa já escreve
`text-[var(--producer-button-text,#ffffff)]` literalmente em
`components/notifications-bell.tsx:132`, e usa a mesma forma para o mesmo
propósito em `components/workspace-auth-shell.tsx:461`.

**Alcance: 6 dos 11 `<Button>`** — os outros 5 são 4 `secondary` e 1 `danger`.

#### Prova de pixel por máquina

```
.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}
.text-\[var\(--producer-button-text\,\#ffffff\)\]{color:var(--producer-button-text,#fff)}
```

Sem a variável, o navegador resolve `var(--producer-button-text,#fff)` → **`#fff`**,
o mesmo pixel. ⚠️ **Armadilha registrada:** procurei o fallback como `#ffffff` na
regra e obtive **0**, que se leria como falha — **o minificador encurtou para
`#fff`**. E a única diferença entre as duas regras é o `--tw-text-opacity`, que
aqui não muda nada: `text-opacity` tem **0** ocorrências em todo o `src/` e nenhum
`<Button>` usa `text-white/N`.

#### O modal enxerga a variável — três provas independentes

1. o `<style>` do provider usa o seletor **`:root`** (`producer-theme-provider.tsx:84`);
2. `applyTheme` escreve em **`document.documentElement`** (`:36`);
3. **nenhum** dos 7 arquivos com `<Button>` usa portal. ⭐ Controle: `createPortal`
   **existe** no projeto (`producer/automations/page.tsx:4,115`), num arquivo que
   não tem `<Button>` — a sonda enxerga, o zero é real. E **0 bibliotecas de modal**
   no `package.json`.

Confirmado no HTML servido do palco:
`:root{--producer-primary:#3b82f6;…;--producer-button-text:#ffffff;}`. `:root` é o
`<html>`; custom property herda para todo descendente, **portal incluído**.

#### Gate humano — **3 de 6**, sem arredondar

| # | Uso | Tela | Rótulo | Visto? |
|---|---|---|---|---|
| 1 | `producer/students:584` | `/producer/students` | Liberar | ✅ **desabilitado** |
| 2 | `producer/automations/tags:155` | `/producer/automations/tags` | Criar | ✅ **desabilitado** |
| 3 | `admin/producers:129` | `/admin/producers` | Buscar | ✅ habilitado, cor plena |
| 4 | `admin/producers/[id]:317` | `/admin/producers/<id>` | Ativar/Desativar | ❌ |
| 5 | `subscription:341` | `.../subscription` | Criar assinatura | ❌ |
| 6 | `subscription:574` | `.../subscription` | Confirmar | ❌ |

**Por que os 3 restantes não foram vistos — todos exigem estado:**
- **#4** só é `primary` quando **todos os workspaces do produtor estão inativos**
  (`variant={allInactive ? "primary" : "danger"}`); com ws ativo ele renderiza vermelho;
- **#5** só aparece com produtor **sem assinatura** (`subscription/page.tsx:285`
  `{!sub ? …`), e nasce `disabled` até escolher um plano;
- **#6** só aparece **dentro do modal**, depois de clicar numa ação do cartão.

⚠️ **E 2 dos 3 que passaram estavam `disabled`** (`button.tsx:15` aplica
`disabled:opacity-50`). Só o **#3** foi visto em cor plena.

#### Por que o gate parcial foi declarado suficiente — 01/set/26

Decisão do dono, com o argumento que a mede: **os 3 não vistos passam pela MESMA
linha e caem nos MESMOS dois escopos já provados por olho.** A variável vive em
`:root` e nenhum dos 7 arquivos com `<Button>` usa portal — logo não existe um
terceiro comportamento possível a descobrir. #4, #5 e #6 são o caminho do
fallback (`/admin`), que o #3 já provou em cor plena.

⚠️ Fica escrito o que **não** foi visto, para não virar prova retroativa: nenhum
dos 3 foi olhado, e 2 dos 3 que passaram estavam desabilitados.

#### ⭐ Duas correções do que eu mesmo tinha escrito

**(a) Contagem errada.** Eu havia registrado `admin/producers/[id]/page.tsx:317`
como "1 default primary". **Está errado**: ele tem variante **condicional**
(`allInactive ? "primary" : "danger"`). O total de 6 continua certo; a natureza
de dois deles não estava.

**(b) As telas 4 e 5 do roteiro original não provavam nada.** O que o olho mediu
lá foram peças que a F1 **nunca tocou**: *"Login como produtor"*
(`admin/producers/[id]/page.tsx:304-316`) é `<button>` **solto** com `bg-blue-600
text-white` **cravado**; *"Trocar plano"* e *"Estender"*
(`subscription/page.tsx:413-426`) são `<button>` soltos com
`variantCls("blue")` = **outline** (`text-blue-600` sobre transparente). **A falha
foi do meu roteiro, não do código.**

#### O achado de contraste — e por que ele NÃO entrou na F1

Branco sobre o azul de marca `#3b82f6` dá **3,68:1** — **abaixo do WCAG AA**
(4,5:1 para texto normal). Preto daria 5,71:1. **Isso já é verdade hoje**, não é
criado pelo lime.

Mas aplicar uma **conta automática de contraste** mudaria **140 de 380 campos
preenchidos em produção (36,8%)** — medido sobre 87 cores distintas. Por isso ela
**não entrou na F1**: a F1 é pixel-neutra por construção, e mudar 36,8% dos campos
é decisão de produto, não refactor. **Essa decisão vive na D6.**

### O que sobrou do balde A — 216 de 217

A F1 tocou **1** ocorrência: `src/components/ui/button.tsx:17`. Sobram **216**.
Contagem medida (não estimada) para a próxima rodada **não recontar**:

| Lote | Ocorrências | Arquivos | via (i) | via (ii) | via (iii) |
|---|---|---|---|---|---|
| **Painel do produtor** — escopo que emite a variável | **90** | 38 | 2 | 0 | **88** |
| **Componentes compartilhados** | **65** | 35 | **48** | 5 | 10 |
| **Curso e vitrine** | **17** | 8 | 15 | 0 | 2 |
| **`/admin`** ⭐ | **26** | 12 | 0 | **26** | 0 |
| Outros (raiz, auth, invite, landing, `globals.css`) | **18** | 12 | 0 | 16 | 2 |
| **TOTAL** | **216** | | | | |

Conferência: **216 + 1 = 217** = o balde A inteiro. ✅

⭐ **O `/admin` SAI da F1 e vai para a F5.** O motivo não é tamanho, é natureza:
**lá não existe produtor**. O fundo daquelas telas é a marca da **PLATAFORMA**, e
o texto certo é o da **paleta nova** — não a preferência de cor de um cliente.
Amarrar o `/admin` a `--producer-button-text` seria dar a um produtor qualquer o
poder de pintar o painel interno da plataforma.

E o dado sustenta a separação: as **26** ocorrências do `/admin` são **todas via
(ii)** — azul literal fora dos três escopos remapeados. De **47** via (ii) em todo
o balde A, **26 estão no `/admin`**; as outras 21 se espalham por componentes (5)
e telas soltas (16).

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

**✅ FECHADO (01/set/26) — o toggle claro/escuro do painel: é INTENCIONAL, não
botão morto.** Observado no gate da F0: a classe do
`<html>` muda de `dark` para `light` e **o painel continua igual**.

🔴 **NÃO é efeito da F0**, e isto está provado, não suposto: o diff da F0 é
**−40/+8 só de literais**, com **igualdade de valor 8/8** contra
`git show HEAD:`. O comportamento é anterior à fatia.

**Por que entra nos riscos desta frente:** a paleta nova tem **metade clara**
(`bg/base #FFFFE6`, `surface #FEFFE6`, `elevated #FBFFC2`, `text/primary
#191919`). Se o toggle não muda as `--producer-*`, **essa metade pode não ter
destino no painel**.

#### O veredito, medido

| Sonda | Resultado |
|---|---|
| `--producer-*` **definida** no `globals.css` | **0** |
| `--producer-*` **usada** (`var(`) no `globals.css` | **62** ⭐ controle: a sonda enxerga |
| Blocos `dangerouslySetInnerHTML` no provider | **1** |
| Esse bloco contém `.dark`? | **0** |
| No HTML servido: `:root{--producer-` / `.dark{--producer-` | **1 / 0** |

As 15 linhas com `.dark` + `--producer-` no `globals.css` são **uso, não
definição** — `--producer-xxx:` fora de `var()` dá **0** ali. São regras como
`.dark .producer-layout .dark\:text-blue-400 { color: var(--producer-primary, …) }`.

⇒ **Existe UM ÚNICO conjunto de `--producer-*`.** Não há par claro/escuro. O
toggle troca a classe do `<html>` (`next-themes`, `attribute="class"`,
`theme-provider.tsx:9`) e as variáveis permanecem — **por construção**.
E a chave `mode` do `themeConfig` **não muda cor nenhuma**: em
`producer-theme-provider.tsx:65-66` e `producer/settings/page.tsx:63-64` ela só
chama `setNextTheme(mode)` — persiste qual classe o `next-themes` põe, nada mais.

**Não é botão morto:** ele funciona, e as centenas de utilitários `dark:` do app
respondem. O que não responde são as `--producer-*`, e isso é o desenho.

#### 🔴 A consequência — decisão PENDENTE da F3

A metade clara da paleta (`bg/base #FFFFE6` · `surface #FEFFE6` · `elevated
#FBFFC2` · `text/primary #191919`) **não tem destino automático no painel do
produtor**. Com um conjunto único, ela só entra por um de dois caminhos:

1. **virar o novo default do conjunto único** — e aí o painel fica **claro para
   todos que não personalizaram**;
2. **criar um segundo conjunto** `.dark`/`.light` para as `--producer-*` — o que
   **hoje não existe** e é **mudança de arquitetura**, não troca de valor.

**Nenhum dos dois foi escolhido.**

**🟡 As duas leis não se referenciam.** A skill do repo —
`.claude/skills/membersclub-engineering/SKILL.md`, **35.283 B** — **não cita
`docs/DEV-BRABO.md`** (0 ocorrências, medido). As duas leis convivem sem
ponteiro entre si, então quem lê uma pode não saber que a outra existe — e a
**P0 mora só no DEV-BRABO**. ⚠️ A skill do **repo** é a canônica; a cópia
instalada no claude.ai **pode divergir** e não é verificável daqui. Registrado
como arrumação; **não editei a skill**.

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

**P0 — Régua da Empresa Grande: ver [docs/DEV-BRABO.md](DEV-BRABO.md)** (o texto vive lá, e só lá).

**Nenhuma fatia fecha sem atualizar ESTE documento:**
1. linha nova na tabela do **§6** (com SHA e prova de máquina);
2. decisões novas numeradas no **§4**, com data e motivo;
3. lições no **§9**.

Fatia sem registro aqui vira item-fantasma — a casa já pagou por isso.

---

## 11. BASELINE MEDIDO (pré-virada)

**Data:** 01/set/26 · **`BUILD_ID`: `UgE92EXkbvYifZDfTatVj`** · palco local
(`next start`, alvo staging provado: ref staging ≥ 1, ref produção 0).

⚠️ **Por que este baseline vale como "antes da virada de cor", mesmo tendo sido
medido sobre o build da F0:** a F0 provou **igualdade de valor 8/8** contra
`git show HEAD:` — nenhum dos 8 defaults mudou. O que a F0 alterou foi de onde o
valor vem, não qual ele é. Se algum tivesse mudado, este baseline estaria
contaminado e não serviria.

⇒ **A partir daqui, F3 e F4 comparam CONTRA ESTES NÚMEROS, não contra memória.**

### (a) Páginas públicas — variáveis de tema emitidas no HTML

| Página | `<style>` | `--producer-*` | `--member-*` |
|---|---|---|---|
| `/w/staging-teste` → **307** → `/w/staging-teste/login` | 1 | **0** | **0** |
| `/producer/login` | **0** | **0** | — |

**Discriminado, para o zero não ser lido como defeito:**
- A vitrine emite **0** porque `staging-teste` tem **0 de 7** campos de
  personalização preenchidos (`accentColor`, os 5 `vitrine*Color` e `logoUrl`,
  todos `NULL` — medido por `SELECT` no staging). É **o esperado**: a emissão é
  condicional (`w/[slug]/layout.tsx:40-48`). Confirma a afirmação da F0.
- `/producer/login` tem **0 blocos `<style>`** porque
  `app/producer/layout.tsx:19-21` retorna `<>{children}</>` quando não há
  usuário — **o `ProducerThemeProvider` nem monta na tela de login**.

### (b) Chunks CSS servidos — 4 arquivos, **156.468 B**

⭐ Controle de vacuidade: **1.065** ocorrências de `color` nos mesmos arquivos —
a sonda enxerga conteúdo, os zeros abaixo seriam zeros de verdade.

| Cor | Ocorrências |
|---|---|
| **`#3b82f6`** (o azul da marca) | **126** |
| `#ffffff` | 76 |
| `#10b981` | 40 |
| `#111827` | 25 |
| `#0a0a1a` | 12 |
| `#1a1e2e` | 7 |

**Utilitários `*-blue-N` nos CSS servidos: 87 ocorrências**

| Prefixo | bg | text | border | to | from | ring | shadow | accent |
|---|---|---|---|---|---|---|---|---|
| Ocorrências | 31 | 18 | 13 | 8 | 7 | 5 | 4 | 1 |

**Variáveis de tema referenciadas nos CSS**

| Variável | Ocorrências |
|---|---|
| `--producer-primary` | **77** |
| `--member-primary` | **61** |
| `--member-bg` | 7 |
| `--producer-bg` | 5 |
| `--producer-card` | 3 |
| `--vitrine-*` | **0** ← confirma que o namespace não existe |

### Como reproduzir

```
curl -sL http://localhost:3000/w/staging-teste          # e /producer/login
CSS=(.next/static/chunks/*.css)                          # 4 arquivos
cat "${CSS[@]}" | grep -o -F "#3b82f6" | wc -l
cat "${CSS[@]}" | grep -oE "\.(bg|text|border|ring|from|via|to|shadow|fill|stroke|divide|accent)-blue-[0-9]+" | wc -l
cat "${CSS[@]}" | grep -o -F -e "--producer-primary" | wc -l
```

⚠️ Duas armadilhas que me pegaram ao montar isto, registradas para quem repetir:
`.next/static/css/` **não existe** (o CSS vive em `.next/static/chunks/`), e
`grep -o -F "--producer-primary"` **falha** — o `--` vira opção; é preciso
`-e` ou `--`. Nos dois casos o erro devolve **0**, que se lê como "limpo".

---

## 12. D6 — a arqueologia

**Medido em 01/set/26. Data de corte de toda contagem desta seção: 01/set/26.**
Nenhuma decisão tomada aqui — esta seção existe para que a decisão do dono seja
tomada sobre números, não sobre premissa.

### 12.1 As cinco migrações

Datas **reais de aplicação**, lidas de `_prisma_migrations` em produção:

| Migração | Aplicada | O que fez |
|---|---|---|
| `20260413120000_add_workspace` | **13/04 03:44** | `loginBgColor TEXT` — **SEM default** |
| `20260414030000_workspace_login_customization` | 14/04 23:14 | `loginBgColor` → `#0f172a` · `loginPrimaryColor` → `#3b82f6` |
| `20260414040000_workspace_login_box_colors` | 14/04 23:43 | `loginBoxColor` → `#1e293b` · `loginSideColor` → `#0f172a` |
| `20260414050000_workspace_login_link_color` | 15/04 00:07 | `loginLinkColor` → `#3b82f6` |
| `20260415010000_workspace_login_default_theme` | **15/04 14:36** | trocou os 5 para os defaults **atuais** |

### 12.2 A migração de 15/04 NÃO reescreveu linha nenhuma

O arquivo tem 6 linhas, todas `ALTER TABLE … ALTER COLUMN … SET DEFAULT`.
**`SET DEFAULT` não retroage** — linha existente fica como estava.

⚠️ **Armadilha do grep, registrada:** `grep -ci update` no arquivo devolve **1**,
e o 1 é o **comentário da linha 1** (*"Update workspace login theme defaults…"*).
Controle: `UPDATE "` existe em **2 outras** migrações (`20260413120000_add_workspace`
e `20260718000000_add_gateway_dimension`), então a sonda enxerga — o zero aqui é real.

### 12.3 🔴 A CORREÇÃO DA PREMISSA

A versão anterior desta decisão dizia: *"25 workspaces carregam `#6366f1` em
`loginPrimaryColor` e são indistinguíveis"*. **A régua estava errada.**

Ela comparava contra o default **atual**. A régua certa é **"fora de TODO default
histórico"** — porque um valor que já foi default em algum momento **não é escolha**.

Distribuição real de `loginBgColor` (41 workspaces):

| Valor | Qtd | O que é |
|---|---|---|
| **`#0f172a`** | **17** | o default de 14/04 — **não é escolha** |
| `(NULL)` | **15** | nasceu antes de o campo ter default |
| 8 valores distintos | 9 | escolha real (`#3b2418`, `#49834d`, `#1c0f0d`, `#121212`, `#1b1b1f`, `#07090f`, `#ffffff`, `#000000`×2) |

Nos outros quatro, mesmo padrão: `loginPrimaryColor` 27 atual + **5 antigo** + 9;
`loginBoxColor` 28 + **4** + 9; `loginSideColor` 33 + **6** + 2; `loginLinkColor`
27 + **6** + 8.

⇒ **17 dos que pareciam escolha são resíduo de `#0f172a`.**

### 12.4 ⭐ E há uma TERCEIRA fonte de verdade: a UI diverge do schema

`src/app/producer/workspaces/[id]/edit/_lib/helpers.ts:44-49` tem defaults
**próprios**, e são os **de 14/04** — ninguém os atualizou quando a migração de
15/04 trocou os do banco:

| Campo | SCHEMA | UI (`helpers.ts`) | coincide? |
|---|---|---|---|
| `loginBgColor` | `#0a0a1a` | `#0f172a` | 🔴 |
| `loginPrimaryColor` | `#6366f1` | `#3b82f6` | 🔴 |
| `loginBoxColor` | `#1a1a2e` | `#1e293b` | 🔴 |
| `loginSideColor` | `#0a0a1a` | `#0f172a` | 🔴 |
| `loginLinkColor` | `#818cf8` | `#3b82f6` | 🔴 |

**Os 5 divergem.** Consequência: quando o produtor abre a aba de login e **salva
sem mexer em nada**, o formulário grava `#0f172a`/`#3b82f6`/`#1e293b`. Aqueles
valores **não são resíduo histórico — são default de UI ATIVO, gravado hoje**.

E o `@default` de `loginBgColor` é **letra morta**: `api/workspaces/route.ts:73`
faz `v.data.loginBgColor ?? null` e `:96` grava o campo, então um `INSERT` com
`NULL` explícito **anula o default do schema**. Prova viva: dos 2 workspaces
criados em **01/09**, um nasceu com `#0f172a` e o outro com **`null`** — nenhum
com o `#0a0a1a` do schema.

### 12.5 Os três grupos — e a pergunta certa

⚠️ **Corrigi minha própria régua no meio da medição.** A primeira versão
classificava por "quantas famílias tocou", e isso punha em *ambíguo* gente com
`themeConfig` contendo `#ffca10` ou `#5900ff` — cores que **decidem sozinhas**.
A pergunta da D6 não é *"quem personalizou algo"*, é **"para quem posso trocar o
login sem risco"**.

**Critério final:** o login está em algum default histórico? E há sinal de escolha
nas outras 4 famílias (`themeConfig` fora do histórico · logo/favicon/banner ·
5 cores de vitrine · 3 de e-mail)?

| Grupo | Qtd | Definição |
|---|---|---|
| **A · ESMAGADOR** | **16** | login em default histórico **e** zero sinal nas outras 4 — **10 deles com `updatedAt = createdAt`** (nunca salvaram nada) |
| **B · PERSONALIZOU O LOGIN** | **12** | valor fora de todo default histórico — inequívoco |
| **C · AMBÍGUO** | **13** | login em default, **mas** personalizou noutra família |
| | **41** | |

Os 13 ambíguos: 8 só por `themeConfig`, 3 só por logo, 1 por tema+logo, 1 por
tema+vitrine. Todos com o login intocado.

⭐ **Controle contra vacuidade:** `Ebenézer 2.0` (0 sinais, `updatedAt = createdAt`)
e `3N Trader` (os 5 campos de login fora de qualquer default, mais tema, logo,
vitrine e e-mail). **A régua separa os dois extremos.**

ⓘ **Sobre o `themeConfig`:** dos **15** preenchidos, **14 são inequivocamente
diferentes** (`#ffca10`, `#E53935`, `#42db00`, `#5900ff`, `#d968b0`…) e **1 é
idêntico a um default histórico** (`Funil Oculto`) — este último não conta como
escolha. O `themeConfig` também teve defaults históricos: `primaryColor` era
`#6366F1` até `6c55aa1` (25/04, *"indigo→blue sweep"*) e `cardColor` era
`#0a0e19` até `19a85bc` (17/05).

### 12.6 O alvo é móvel

**41 workspaces, não 39** — o baseline de 31/08 já está desatualizado: `Desdobra` e
`Digital Academy` nasceram em **01/09**.

| Janela | Criados |
|---|---|
| últimos 7 dias | **2** |
| últimos 30 dias | **8** |

Um workspace criado hoje entra direto no grupo **A** ou **C** — nasce com os
defaults e ninguém tocou em nada. **É argumento de PRAZO, não de pressa:** cada
dia adiciona casos, e qualquer corte precisa de **data de referência explícita**.
A desta seção é **01/set/26**.
