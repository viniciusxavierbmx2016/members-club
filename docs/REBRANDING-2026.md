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

⭐ **REFINAMENTO DA D6 (04/set/26) — o passo 1 muda, o processo NÃO.** O item
**9.216** provou que **"ter `themeConfig` salvo" ≠ "ter personalizado"**: um clique
em *Salvar tema*, **sem alterar nada**, grava as 8 chaves e congela o padrão do
momento. Foi assim que nasceram os **3 workspaces com `primaryColor` = `#3b82f6`**
que a arqueologia da D6 já tinha achado sem explicar.
⇒ **A medição do passo 1 tem de distinguir "salvou sem mexer" de "escolheu cor"** —
comparando chave a chave contra os defaults **da época**, não só verificando se o
campo existe. Isso **não invalida** o processo de 6 passos da D6: refina o critério
de entrada dele.

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

### D10 — O painel do produtor continua **ESCURO** · 01/set/26
Decidido pelo dono a partir de **maquete comparativa** das duas opções.

**Motivo registrado:** o painel tem **um conjunto único** de `--producer-*` (ver o
veredito do toggle no §8), então a escolha não é "claro *ou* escuro por
preferência do usuário" — é **qual conjunto único existe**. Escuro preserva a
estrutura atual, e o lime como destaque sobre neutro escuro é **o uso que o guia
prescreve** (`brand/primary` só em CTA, seleção e destaque). Na versão clara,
`#EFFF20` e `#FFFFE6` são vizinhos na mesma família — **o destaque se dissolve no
fundo**, e painel é tela de trabalho densa.

⭐ **ESCOPO:** a decisão vale para o **PAINEL DO PRODUTOR**. A metade clara da
paleta (`#FFFFE6` · `#FEFFE6` · `#FBFFC2`) **segue sem destino definido** —
landing, e-mail e certificado são **F5**, decisão separada.

⚠️ **A maquete NÃO é o produto.** Ela foi montada a partir dos valores medidos;
**quem prova a tela real é o gate da F3**.

### D11 — Manter o toggle claro/escuro e CONSERTAR o modo claro ANTES da F3 · 01/set/26

Quando a medição da F3 perguntou "o modo claro de hoje funciona?", a resposta
foi **parcialmente quebrado**: as telas-núcleo passam (alunos, cursos, dashboard
= 17,74:1), mas **4 features + 1 família transversal** têm texto entre **1,00 e
2,59:1** no claro — Lives inteira, chat de suporte, editores rich-text/e-mail,
cards de recursos do curso, e ~18 pontos de `gray-400` cru. Inventário completo,
ponto a ponto com contraste medido, nos itens **9.197-9.201** do PLANO-MESTRE.

**A decisão do dono (01/set/26):** manter o toggle e **consertar o claro antes
da virada de cor**. A alternativa — desligar o toggle e declarar o painel
escuro-somente — foi apresentada e **recusada**.

**Consequência medida, sem suavizar:** a frente CRESCE. O conserto é de **bug
pré-existente** (nenhum dos pontos nasceu do rebranding — 125/125 staff no
escuro em produção é o motivo de ninguém ter visto), e entra na frente porque a
F3 o tornaria pior: lime sobre branco = 1,11:1 nos mesmos lugares onde o azul
ainda dá 3,3-3,7. Estimativa: **~3 rodadas de conserto** (1 para a causa C2 — as
4 regras de `globals.css:318-321` explicam ~20 pontos sozinhas; 1 para Lives; 1
para a família difusa + e-mail) **+ 1 gate humano do claro**, antes do que já
estava planejado.

**✅ STATUS FINAL (03/set/26): o conserto do modo claro está CONCLUÍDO, em 3 etapas.**
**A** (alavanca C2: guarda `.dark` nas 4 regras + 8 pares, 19+8 pontos) — merge `5051949` ·
**B** (Lives, 34 pontos) — merge `48629c8` ·
**C** (família gray-400 + faixas C3, 73 pontos em 46 trocas) — merge `8ac4d28`.
**Total: ~134 pontos** de contraste consertados no claro, com o escuro provado
byte-idêntico nas três etapas (comparação de CSS servido na A; tabelas
antes/depois por família na B e C) e gates humanos 12/12 · 22/22 · 34/34.

**O QUE FICOU DE FORA — registrado para não virar prova retroativa:**
- **editor de e-mail** (item **9.205**): exige `dark:prose-invert`, 0 usos na casa — decisão de padrão pendente;
- **hover vermelho** de `lives/page.tsx:353` (item **9.203**): sem molde `dark:hover:text-red-*`, dono decidiu ficar;
- **família inversa do escuro** (item **9.204**): placeholders e a família `text-gray-500` crua (3,69–4,05 no escuro);
- **badge amarelo** `courses/page.tsx:291` (no 9.201): quebra nos DOIS modos — outra família.

⭐ **A régua de prioridade que fica:** a família inversa (9.204) é a ÚNICA
pendência que atinge os **125 de 125 HOJE** — todo o resto desta frente
consertou (ou adiou) um modo que ninguém usa ainda. Quando o dono priorizar,
o 9.204 vem antes de qualquer refinamento adicional do claro.

**A ORDEM NOVA da frente:**
1. conserto do modo claro (9.197-9.201) + horário do chat (9.196);
2. decisão de padrão dos **189** `*-primary` em superfície clara (§13);
3. aplicação do padrão (2-3 lotes, molde F2b);
4. gate humano (claro E escuro);
5. **F3** — a virada de cor.

### D12 — PRIMEIRO PLANO TEM PAR CLARO/ESCURO · 03/set/26

No modo claro, texto e ícone que hoje usam a marca viram **neutro escuro
(`#191919`)**; no escuro, seguem **lime (`#EFFF20`)**.

**Motivo medido:** valor único é **matematicamente impossível** — exigiria
luminância ≤0,183 contra branco E ≥0,223 contra `#0a0a1a`; a janela é vazia.
E é o que o guia prescreve: `brand/primary` só em CTA, seleção e destaque.
**Cobertura (medição PP):** 134 de 160 pontos sem exceção nenhuma; +23 perdem
ênfase, não informação (pista redundante no próprio elemento).

**Forma:** o par da casa é `text-emerald-600 dark:text-emerald-400` (**15
usos**). ⚠️ **NÃO copiar o par azul**: dentro do `.producer-layout` ele é
**sequestrado pelos remaps** de `globals.css:269` e `:287`, que viram AS DUAS
metades para `var(--producer-primary)`.

### D13 — OS 3 PONTOS ONDE A COR É A ÚNICA PISTA GANHAM PISTA PRÓPRIA · 03/set/26

`side-panel.tsx:69` e `mobile-flow-editor.tsx:71` (card de trigger
selecionado — borda+tinta são a única distinção; o ícone é primary nas DUAS
pernas) e `settings/page.tsx:266` (chip de funcionalidade habilitada — cor
única no elemento; o toggle vizinho é pista externa).
**Solução:** sinal não-cromático na perna selecionada (ícone de check e/ou
`font-medium`).
⭐ **Motivo que vale além do rebranding:** hoje a informação depende SÓ de
cor — **já é ruim para daltônicos, nos dois modos**. A pista própria melhora
o estado atual, não só o futuro.

### D14 — BORDA E ANEL USAM PAR, NÃO TOM ÚNICO · 03/set/26

Existe janela (L 0,13–0,30) para um tom único servir nos dois modos, porque o
limiar de componente é 3:1. **Recusado assim mesmo:** o tom único criaria uma
TERCEIRA cor — nem marca, nem neutro — espalhada em **112 lugares**. Par custa
mais e é previsível.

### D15 — O KNOB DO TOGGLE ESCURECE QUANDO O TRILHO É A MARCA · 03/set/26

Bolinha branca sobre trilho lime dá **1,11:1** e o estado "ligado" desaparece.
Mesma lógica do `buttonTextColor`: **o que está sobre a marca acompanha a
marca**.

⚠️ **REGISTRO SEM SUAVIZAR:** as decisões D12–D15 são de **DESIGN SYSTEM, não
de rebranding** — regem a interface além do lime. Foram tomadas com base em
contraste medido e no guia da marca, que é critério correto **mas não o
único**; **não passaram por revisão de design**.

---

## 5. Plano de fatias

| Fatia | O que é | Muda pixel? |
|---|---|---|
| **F0** | fonte única dos defaults do painel (`theme-constants.ts`) | **NÃO** |
| **F1** ✅ | assets: logo, ícones PWA com nome novo, favicon, OG | **SIM** — **FEITA em 04/set/26** (ver §6, linha "F2·assets") |
| **F2** | tokens: os hexes do guia entram como constantes, ainda sem trocar nada | **NÃO** — ⚠️ **não executada**; a paleta entrou direto pelos valores da F3.5 |

⚠️ **DIVERGÊNCIA DE NOMENCLATURA, registrada para não ficar invisível:** a tabela
acima chama a fatia de **assets** de `F1` e a de **tokens** de `F2`. Na execução,
o dono chamou de "F1" a fatia do *molde da casa* (`ui/button.tsx`, que lê a
variável) e de "F2" a de **assets**. **O que vale é o §6**, que registra o que
cada fatia executada realmente fez, com SHA e prova. A `F2·tokens` do plano
original **nunca foi executada** — os hexes do guia entraram direto nos valores
da **F3.5**, sem passar por uma camada de constantes.
| **F3** | a troca: defaults do painel passam a apontar para a paleta nova | **SIM** — bloqueada por **D6** e pela ordem do **D11** (conserto do claro primeiro) |
| **F4** | fallbacks do CSS (`globals.css`) e os 12 de `--member-primary` | **SIM** |
| **F5** | superfícies fora do app: e-mail, certificado, landing | **SIM** |
| **F6** | varredura do azul literal fora dos 3 escopos remapeados (~42 linhas) | **SIM** |

🔴 **CORREÇÃO DA ORDEM (01/set/26) — medida, não opinada.** A ordem original punha
a **F3 antes** da varredura das 216 ocorrências do balde A. **A medição do §13
refuta:** `#ffffff` sobre `#EFFF20` dá **1,11:1**. Com **216 lugares ainda cravando
`text-white`** (a F1 tocou 1 das 217), virar `primaryColor` para lime **apagaria o
texto do botão primário nesses 216 lugares**.

⇒ **A varredura do balde A passa a ser PRÉ-REQUISITO da F3**, não fatia paralela.
Ela é o novo **F2b**, entre a F2 e a F3:

| Fatia | O que é | Muda pixel? |
|---|---|---|
| **F2b** ⭐ | varredura do balde A — as 216 restantes passam a ler `--producer-button-text` | **NÃO** (pixel-neutro, como a F1) |
| **F3.0** ✅ | as 4 decisões do dono (D12–D15) e este plano | **NÃO** (só docs) |
| — | ⭐ **F3 FECHADA (04/set/26): F3.0 ✅ · F3.1 ✅ · F3.2 ✅ · F3.3 ✅ · F3.3b ✅ · F3.4 ✅ · [9.208 medido] · F3.5 ✅ A VIRADA.** Total preparado antes da virada: **237 pontos** (75 texto/ícone + 3 pistas da D13 + 100 borda/anel + 7 knobs + 52 foco no escuro). ⭐ **A ordem foi o que tornou isso possível:** a virada por ÚLTIMO, uma variável por gate — cada fatia foi verificável sozinha com o azul ainda no lugar. | — |
| **[9.208]** ⭐ | **medição da família `/N` morta do token `primary`** — inserida ANTES da virada **por decisão do dono (01/set/26)** | **NÃO** (medição) |
| **F3.1** | par de primeiro plano: texto/ícone da marca ganham par claro/escuro (~83 pontos) | **SIM — só no CLARO** (escuro fica idêntico: metade dark preserva o azul de hoje até a F3.5) |
| **F3.2** | pista própria nos 3 pontos da D13 (check/`font-medium`) | **SIM — nos DOIS modos** (acrescenta glifo/peso; melhora acessibilidade já no azul) |
| **F3.3** | borda e anel: par claro/escuro (112 pontos) | **SIM — só no CLARO** |
| **F3.4** | knob do toggle acompanha a marca (5 toggles, D15) | **NÃO no azul** (knob branco sobre azul segue; a diferença só aparece com o lime na F3.5) |
| **F3.5** ⭐ | **A VIRADA** — os 5 valores novos em `theme-constants.ts` | **SIM — nos DOIS modos** (é o rebranding em si) |

⭐ **Por que a virada é a ÚLTIMA fatia:** com o azul ainda no lugar, cada fatia
F3.1–F3.4 é verificável **sozinha** (o gate compara "azul antes ↔ azul depois"
no modo intocado e mede só o claro). Virando a cor primeiro, **todo gate teria
duas variáveis mudando ao mesmo tempo** — nunca se saberia se uma quebra veio
do par novo ou do valor novo.

⭐ **Por que a medição do 9.208 entra ANTES da virada** — decisão do dono
(01/set/26): a família `/N` do token `primary` é classe morta hoje, então
**~48 tintas não renderizam**. Se o token for consertado **DEPOIS** da virada,
essas 48 tintas **apareceriam de uma vez, já em lime, em lugares que ninguém
nunca viu com lime — e sem gate nenhum cobrindo**. Medir antes mantém a regra
da frente: **uma variável por gate**.

#### F2b · Lote 1 — painel do produtor (01/set/26)

##### ✅ Gate — 19/19, merge `d4e0d66`

**19 leituras por `getComputedStyle`, 19 × `rgb(255,255,255)` sobre `rgb(59,130,246)`.**
Nenhuma descrição de aparência — só valor computado.

⚠️ **O que NÃO foi visto**, escrito para não virar prova retroativa:

- **Os TOASTS não foram vistos como caixa.** O *"Copiado!"* que apareceu é o **próprio
  botão trocando de texto**, não o toast. **O toast de sucesso segue sem prova visual** —
  está coberto apenas pela prova de pixel no CSS servido.
- **Vários botões foram lidos em estado `disabled`** (opacidade 0,4–0,5). A cor computada
  é a mesma, mas **o olho os viu esmaecidos**.
- **Leitura sem escrita:** o agente **não salvou curso, não persistiu automação e não
  finalizou cadastro**. Nenhum caminho de escrita foi exercitado.

#### F2b · Lote 2 — componentes compartilhados (01/set/26)

##### ⚠️ Gate — 14 leituras válidas, e o que ficou SEM prova

**14 × `rgb(255,255,255)` sobre `rgb(59,130,246)`**, por `getComputedStyle`.

🔴 **O que NÃO foi provado**, escrito para não virar prova retroativa:

- **A 4ª ocorrência do `import-students-modal` (`:554`, "Baixar CSV com acessos")
  não foi vista.** Ela vive atrás de `{downloadCsv && (` (`:551`), e `downloadCsv`
  vem da resposta da API (`:141`). A rota devolve o CSV **sempre no caminho de
  sucesso** (`api/producer/students/import/route.ts:459-462`, sem guarda) ⇒
  **é alcançável, mas exige concluir uma importação de verdade** — subir um `.csv`
  válido e chegar ao passo 3. As 3 vistas foram `:215` (indicador de passo),
  `:331` ("Próximo"/"Importar") e `:381` ("Importar" do passo 2).
- **Os 2 pontos com `text-white/70` seguem SEM a variável, de propósito** — item
  **9.196**. Se o agente ler o horário do balão, vai encontrar
  `rgba(255,255,255,0.7)`, e isso está **correto**.
- **`banner-upload`, `course-menu-manager` e `date-picker-single` não foram vistos**
  (1 ocorrência cada).

##### O falso reprovado — e por que foi do roteiro, não do código

Os botões **H2 / H3 / B / I / U** do editor de e-mail vieram `rgb(156,163,175)`
sobre transparente, e isso foi lido como reprovação. **Não é.**
`rgb(156,163,175)` = `#9ca3af` = **`text-gray-400`** — a cor nativa deles
(`email-editor.tsx:148-150`, componente `TBtn`, dentro de uma barra
`bg-gray-900/80`). **A única troca naquele arquivo é `:206`**, o botão
`Salvar`/`Inserir`. Os botões de formatação **nunca estiveram no lote**.

⭐ **A LIÇÃO — roteiro de gate tem de sair do CÓDIGO, não de uma lista de rótulos.**
O roteiro citava "os botões do editor" de forma ampla, e o agente leu elementos que
a fatia nunca tocou. Rótulo colhido de lista pode nomear coisa que não está no lote
— e o critério *"PASSA se `color = rgb(255,255,255)`"* então gera **falso reprovado**.
O rótulo tem de vir do código, **com a condição de renderização junto**.


🔴 **O lote 2 é 21, não 65.** Dois cortes, ambos medidos:

**1 · A reclassificação do zero deu 61 no balde A, não 66.** 327 ocorrências em
`src/components/`, 3 agentes independentes, **concordância de 97,9%** com a lista
antiga. As **7 diferenças**, uma a uma: 4 em `course-support-widget.tsx`
(`:247` `:340` `:455` `:527`) saíram para **B** — é o **mesmo padrão** já aprovado
em `customize/page.tsx:653`: `buttonStyle` = `buttonColor || var(--member-primary,…)`,
cor **arbitrária do produtor** com fallback de outro namespace; `notifications-bell.tsx:132`
e `ui/button.tsx:17` saíram do grep (o primeiro já usava a classe, o segundo foi a F1);
e `confirm-modal.tsx:103` **entrou**, porque o agente novo leu o `variant = "info"`
default em `:25` e viu que o fundo padrão é `bg-blue-600`.

**2 · Dos 61, só 23 renderizam SÓ no painel** — e desses, 2 foram excluídas pelo
sufixo de opacidade (item **9.196**). **Lote final: 21 em 11 arquivos.**

| Classe | Arquivos | Ocorr. | Destino |
|---|---|---|---|
| **P · só painel — ENTRAM** | **11** | **23 → 21** | `app/producer` |
| M · misto | 11 | 17 | saem |
| C · área de curso | 9 | 14 | saem |
| V · vitrine | 3 | 6 | saem |
| R · raiz/auth/invite | 1 | 1 | saem |

**Os 38 que saem:** `avatar-uploader` · `change-password-form` · `confirm-modal` ·
`context-lock-notice` · `course-card` · `date-range-selector` · `mini-calendar` ·
`rich-text-editor` · `sidebar` · `ui/avatar` · `workspace-switcher` (M) ·
`autoplay-countdown` · `course-preview` · `course-sidebar` · `course-support-widget` ·
`lesson-comments` · `lesson-quiz` · `post-card` · `reviews-section` · `terms-modal` (C) ·
`install-prompt` · `push-opt-in` · `workspace-auth-shell` (V) · `auth-provider` (R).

⭐ **O motivo da fronteira:** `--producer-button-text` é a variável **do produtor**, e
ela só é emitida em **dois** lugares — no **painel** (`producer-theme-provider.tsx:84`,
sempre) e na **vitrine** (`w/[slug]/layout.tsx:47`, **só se** `vitrineTextColor`). Em
`(course)`, `/admin` e na raiz ela **nunca** é emitida (0 ocorrências de `--producer-`
em cada). Trocar lá cairia sempre no fallback — inócuo, mas sem sentido — e na
**vitrine** carregaria a cor de outro dono. Ver o item **9.195**.

⭐ **O ACHADO DO GRAFO — e a lição.** Montei o grafo de imports por script para provar
o destino de cada componente. A primeira versão dava **3 falsos órfãos**
(`rich-text-editor`, `support-chat-widget`, `email-editor`): eles são carregados por
**`dynamic(() => import(…))`**, que um regex de `from "…"` não captura. A v2 incluiu
`import()` e ganhou **+27 arestas (1340 → 1367)**. **Lição: grafo de imports que ignora
import dinâmico classifica componente errado** — e aqui teria posto 3 arquivos no balde
errado, um deles com 7 ocorrências.

#### O que vira a fatia da COR LEGÍVEL

Os **38 que saem** não são descarte: são a fatia seguinte. A regra do dono, registrada:

> **Onde o produtor escolheu, respeita. Onde ninguém escolheu, cor legível calculada.**

⚠️ **Hoje ela NÃO é executável.** `src/lib/color-utils.ts` tem **16 linhas e só
`darkenHex`** — **não existe conta de contraste no código**. E aplicá-la mudaria
**140 de 380 campos preenchidos em produção (36,8%)**, o que é decisão de produto.

##### 🔴 A conta do balde A depois do lote 2 — 101, e a aritmética que fecha

| | |
|---|---|
| **Denominador medido hoje** | **211** = 61 (outros, nunca remedidos) + 89 (`producer/`, medido antes do lote 1) + 61 (`components/`, medido antes do lote 2) |
| Feitas **dentro do denominador** | **110** = 89 (lote 1) + 21 (lote 2) |
| **Restantes** | **101** |

**Conferência: 110 + 101 = 211** ✅

⚠️ **O plano esperava 105, e o medido é 101. Não ajustei.** A diferença de 4 tem
duas causas, ambas aritméticas:

1. **O denominador caiu de 216 para 211** — `components/` foi de 66 para **61** na
   reclassificação do zero (−5).
2. **A F1 saiu do denominador** (+1): `components/` foi remedido **depois** dela, e
   `ui/button.tsx:17` já tinha a classe nova, então não entrou no grep de `text-white`.

`216 − 5 = 211` · `111 − 1 = 110` · `211 − 110 = **101**`.

⇒ **A F1 continua feita; ela só não está mais no denominador.** Total histórico de
trocas: **111** (1 + 89 + 21).

| Lote restante | Ocorr. | Arq. | Por quê ainda não |
|---|---|---|---|
| **Componentes** (classes M/V/C/R) | **40** | 25 | 38 saem por destino fora do painel + **2 pelo `/70`** (9.196) |
| **`/admin`** | **26** | 12 | vai para a **F5** — lá não existe produtor |
| **Outros** (raiz, auth, invite, landing, `globals.css`) | **18** | 12 | fora do escopo da variável do produtor |
| **Curso e vitrine** | **17** | 8 | `--producer-*` nunca é emitida em `(course)`; na vitrine carregaria cor de outro dono |
| **TOTAL** | **101** | | |

ⓘ Os **2 pontos do `/70`** seguem contados entre os restantes, e não são "pendência
de trabalho": são exclusão **permanente** enquanto o mecanismo for esse.

##### Sujeira do palco, medida (02/set/26)

O gate deixou rastro, e ele fica **registrado, não apagado** — controle negativo
contaminado já mordeu esta casa uma vez:

| O quê | Onde |
|---|---|
| **1 ticket** `"Teste QA - relatorio"` (status `OPEN`, **1 mensagem**), 02/09 02:02 | `SupportTicket` |
| tag **`sonda-f1`** | única tag do palco |
| post **`sonda-controle-positivo-f1`** | 1 de 39 posts |
| live **`Live gate B @staging.test`** (status `LIVE`, **0 mensagens de chat**), 03/09 01:43 — do gate da etapa B | `Live` (1 de **2** no palco; a outra é `Live de Teste E3.12`, 18/08, pré-existente) |
| automação **`Reengajar alunos inativos`** (`active=true`), 03/09 03:51 — do gate da etapa C | `Automation` (única do palco) |
| secret de gateway **hubla · label "Principal"**, 03/09 03:54 — do gate da etapa C. ⭐ **Inerte, com prova**: `lastUsedAt=NULL`; o POST de `hubla-secrets/route.ts:62` não faz chamada externa nem e-mail (grep: zero `fetch`/brevo); o secret só valida webhook DE ENTRADA (adapter), que exigiria a Hubla chamar o staging — não registrado — e falharia fail-closed com token falso | `WorkspaceGatewaySecret` (único do palco) |

⭐ Controle: 39 posts, 1 tag, 1 ticket, 2 lives, 1 automação, 1 secret — a sonda distingue.

##### 🔴 A conta do balde A — e uma divergência de 1 que NÃO ajustei

| | |
|---|---|
| Total original da classificação | **217** |
| ⭐ **Total corrigido** | **216** — `customize/page.tsx:653` saiu do A (ver acima) |
| Feitas | **90** = 1 (F1) + 89 (lote 1) |
| **Restantes** | **126** |

**Conferência: 90 + 126 = 216** ✅ — a aritmética fecha.

⚠️ **O plano desta rodada esperava 127 restantes, e o medido é 126.** Não ajustei nada:
a diferença é **exatamente a mesma correção** aprovada nesta rodada — a conta de 127
partia do total antigo (217 − 90), e a de 126 parte do total corrigido (216 − 90).
**Não é achado novo; é a correção se propagando.**

| Lote restante | Ocorrências | Arquivos |
|---|---|---|
| **Componentes compartilhados** | **65** | 35 |
| **`/admin`** ⭐ | **26** | 12 |
| **Outros** (raiz, auth, invite, landing, `globals.css`) | **18** | 12 |
| **Curso e vitrine** | **17** | 8 |
| **TOTAL** | **126** | |

⭐ **O `/admin` (26) segue FORA da F2b — vai para a F5.** O motivo é natureza, não
tamanho: lá não existe produtor, o fundo é a marca da **plataforma**, e amarrá-lo a
`--producer-button-text` daria a um produtor o poder de pintar o painel interno.


**89 ocorrências em 38 arquivos**, todas em `src/app/producer/`. Via **(iii)** em 87
(`bg-primary`) e via **(i)** em 2 (`bg-blue-*` remapeado por `.producer-layout`).

🔴 **O lote é 89, não 90 — e a lista original estava errada.** Ela classificava
`producer/courses/[id]/customize/page.tsx:653` como balde A, e **não é**: `previewColor`
(`:358-361`) é `supportBtn.color` — **cor arbitrária escolhida pelo produtor** para o
botão de suporte — e, no fallback, é **`var(--member-primary)`**, namespace da área de
membros, que este lote não governa. **Dois motivos independentes para ficar fora.**

⭐ **A LIÇÃO — reclassificar do zero, não reciclar lista antiga.** A lista tinha dias de
idade e **um erro real**; reciclá-la teria propagado o erro para dentro do código. A
reclassificação independente (**3 agentes, 443/443, concordância de 99,3%**) encontrou
exatamente a única divergência, e ela era substantiva. **O custo de refazer foi uma
rodada; o de reciclar seria um bug em produção.**

**Como a troca foi aplicada:** por **número de linha**, não por âncora de texto — **7
padrões de linha se repetiam** (um deles 9×), então âncora por conteúdo não seria única
em nenhum. Cada ponto foi verificado antes (exatamente 1 `text-white` na linha) e depois
(desfazer a troca reproduz a linha original, byte a byte).


⚠️ A ordem acima é a sequência lógica, **não** um compromisso. Cada fatia abre
com investigação própria.

---

## 6. Registro por fatia

| Fatia | O que entrou | Arquivos | SHA | Prova de máquina | Gate humano | Data |
|---|---|---|---|---|---|---|
| **F0** ✅ | 4 cópias dos defaults do painel viraram 1 (`src/lib/theme-constants.ts`); consumidores ganharam 1 linha de alias cada. **Zero mudança de valor.** | **5** (1 novo + 4 modificados), −40/+8 | `caebebc` → merge **`546c167`** | diff de valor contra `git show HEAD:` → **8/8 idênticos** · literais antigos nos 4 alterados → **0** · `tsc --noEmit` **exit 0** · build de staging verde (`UgE92EXkbvYifZDfTatVj`) · alvo: ref staging **1**, ref produção **0** · `git status` = exatamente 5 linhas | ✅ **PASSOU 7/7** — 01/set/26 | 01/set/26 |
| **F1** ✅ | **1 linha** — `ui/button.tsx:17`, variante `primary`: `text-white` → `text-[var(--producer-button-text,#ffffff)]`. Alcança **6 dos 11** `<Button>`. | **1** | `16fc628` → merge **`d8f57e2`** | portão 4/4 (14/14 branco, 0 chave ausente · `/admin` 0 com controle positivo 10 · 0 importadores fora de `/producer` e `/admin` · 6 de 11) · regra CSS provada lado a lado · `tsc` exit 0 · `text-white` 1068→1067 · build `Ib4Zx6sQXgzhC_CPsvurT`, alvo 1/0 | ⚠️ **PARCIAL — 3 de 6**, declarado suficiente pelo dono | 01/set/26 |
| **F2b·1** ✅ | **89 pontos** em `src/app/producer/` passam a ler `--producer-button-text`, fallback `#ffffff`. Pixel-neutro. | **38** (+89/−89) | `f50c8cd` → merge **`d4e0d66`** | `text-white` 1067→**978** (−89 exato) · classe nova 2→**91** (+89) · 0 arquivos fora de `src/app/producer/` · **word-diff: único token trocado** · `tsc` exit 0 · build `-5xCnXaNwdyLRSG4vvGYg`, alvo 1/0 · regra CSS resolve para `#fff` sem a variável | ✅ **19/19 por `getComputedStyle`** | 01/set/26 |
| **F2b·2** ✅ | **21 pontos** em `src/components/` (11 arquivos que só renderizam no painel) passam a ler `--producer-button-text`. Pixel-neutro. | **11** (+21/−21) | `337951f` → merge **`b1fb9cb`** | `text-white` 978→**957** (−21) · classe nova 91→**112** (+21) · 0 fora de `src/components/` · **word-diff: token único** (aspa normalizada nos 2 lados) · `tsc` exit 0 · build `ZdqOo7tcLUTBmyVlzvB9i`, alvo 1/0 | ⚠️ **14/14 válidas por `getComputedStyle`** — cobertura parcial | 01/set/26 |
| **Claro·A** ✅ | Guarda `.dark` nas 4 regras de superfície (`globals.css:318-321`, forma copiada dos irmãos de membros `:335-336`) + os **8 pares rebaixados** no mesmo commit (`settings:267` · `chat:287/:311` · blockquote `globals:561` no molde `.tiptap :154/:158` · `rte:187` · placeholders `rte:306/:318/:609`). 19 pontos C2 saem de 1,00-2,59:1 para 4,83-17,74:1 no claro. ⭐ **Decisão de método:** onde a metade escura já era `gray-500`, ela foi **mantida** em vez do par clássico `dark:text-gray-400` — o molde diria gray-400, mas isso mudaria o escuro, e a promessa (byte-idêntico) vencia o molde. | **4** (+17/−13) | `abbc6df` → merge **`5051949`** | **CSS servido congelado ANTES e comparado DEPOIS**: 42→42 regras `.producer-layout`, diff = só os 4 prefixos; arquivo inteiro 5 saem/6 entram, todas computando no escuro o valor de hoje · `tsc` exit 0 · build `a024bUe1LGutqLgKkp6p8`, alvo prod 0/staging 2 | ✅ **12/12 nos dois modos**; no escuro os valores lidos foram `#0a0a1a` e `#111827` — os de hoje | 02/set/26 |
| **Claro·B** ✅ | Lives legível no claro: **34 pontos** (37 trocas) nos 6 arquivos de `lives/` — títulos `text-white`→par (1,00→17,74), secundários (2,54→4,83), gray-300 (1,47→10,31), badges de status no molde do import-modal com a **duplicata inline do `:401`** (1,48-2,53→4,76-6,87), input do chat da sala (1,00→17,74). ⚠️ **34, não 26**: o inventário GG não contava os badges (helpers `:15-17` + `:401`), o 3º botão de ícone, o "Enviando…" e linhas finas dos modais. **Saíram com motivo:** 12 linhas nos modais `bg-gray-950` da sala (escuros nos 2 modos DE PROPÓSITO) · 10 de cor semântica sólida (red/green/gray-600) · 3 overlays `bg-black/60` · 2 de mídia. ⭐ **A regra que venceu o molde de novo:** metade escura mantida LITERAL em todos os 34 (dark:text-gray-400/300, dark:bg-\*-500/20, dark:hover:text-white). | **6** (+34/−34) | `037ec2f` → merge **`48629c8`** | escuro **8/8 famílias idênticas** antes→depois (19,60·7,72·13,30·20,13·5,81·8,94·6,42·17,86) · `tsc` exit 0 · sufixo `/N`: 0 candidatos · build `Umq0DzAOfgQri083Fl6nh`, alvo prod 0/staging 2 | ✅ **22/22 nos dois modos**, com `document.documentElement.className` conferido antes de cada leitura (regra do 9.202) | 03/set/26 |
| **Claro·C** ✅ | Família gray-400 + faixas fixas: **73 pontos em 46 trocas** — e não os ~18 do 9.201, porque **as constantes multiplicam** (`labelCls` ×24 + `stepCls` ×6 = 30 pontos em 2 trocas) e a sonda anterior (limitada a 10 casos) não enumerou os eixos dos gráficos do analytics (×6), lesson-materials (×4), lessons-manager (×3) e course-form (×2). ⭐ **Achado C3 novo:** `modules-manager.tsx:656`, faixa `bg-gray-950/40` sem `dark:` atrás dos campos do módulo expandido. **Saíram com motivo:** modais escuros-propositais de Lives (6) · `preview-modal`/`flow-editor`/mini-canvas (fixos escuros) · `whatsapp-link:28` (disabled, isento) · badge amarelo (C4, quebra nos 2 modos) · família inversa 9.204 (é do escuro) · **o EDITOR DE E-MAIL inteiro** (→ item 9.205: `dark:prose-invert` tem 0 usos na casa). ⭐ **Registro de honestidade do executor:** a 1ª varredura dos 25 componentes prefixou o caminho EM DOBRO e não varreu nada — o `2>/dev/null` engoliu o erro, detectado pelo VAZIO IMPLAUSÍVEL, não pelo retorno. **Lição: retorno de sucesso não é prova de execução.** | **24** (+45/−45) | `40e2e43` → merge **`8ac4d28`** | escuro **5/5 famílias idênticas** (7,04 · 9,29 · 12,12 · 20,13 · faixa por token literal) · `tsc` exit 0 · `/N`: 0 · zero arquivo fora do lote · build `aVOCvLOjbg0ftu64AjsKM`, alvo prod 0/staging 2 | ✅ **34/34 nos dois modos**, `className` conferido antes de cada leitura (9.202); os 2 pontos "sem par" vistos no gate (`appearance-tab:209/:235` e o chip de categoria `workspaces/page.tsx:171`) foram conferidos: **pré-existentes e intocados pelo diff** (hunks: só 212/238/384), membros da família inversa 9.204 | 03/set/26 |
| **F3.1** ✅ | **Par de primeiro plano (D12): 75 pontos em 31 arquivos** — `text-primary` → `text-[#191919] dark:text-primary` (86 substituições de token no diff; 9 metades escuras pré-existentes mantidas LITERAIS). ⭐ **`.text-primary` PRESERVADA de propósito** para os 13 nunca-claro (login/register/flow-editor/mini-canvas, escuros nos 2 modos — lá a marca segue como está). ⭐ **A fatia consertou contraste PRÉ-EXISTENTE, não só preparou o lime**: no claro, vários destaques já estavam abaixo de AA com o azul (3,12–3,68) e foram a 14,91–17,58. Fora do lote com prova: borda/anel 102 (F3.3) · tintas/preenchimento · toggles (F3.4) · os 3 da D13 (F3.2) · 13 nunca-claro · 4 condicionais. | **31** (+75/−75) | `1860b72` → merge **`82a5d8f`** | **Portão do escuro por comparação de declarações no CSS servido** (congelado antes): 5 variantes geradas (`base`/`hover`/`hover-hover`/`group-title`/`group`) com `color:var(--producer-primary…)` **idêntico** à regra antiga, na forma `:is(.dark *)` que o Tailwind da casa emite · `tsc` exit 0 · build `bjpm2BBjK4Gkgf1fWgzs1`, alvo prod 0/staging 2 · aplicador com asserção tripla (a 1ª rodada ABORTOU INTEIRA sem escrever por falha do próprio verificador de reversibilidade — refeito, desfazer reproduz byte a byte) | ✅ **22/22 nos dois modos**, `className` conferido antes de cada leitura. No claro, `rgb(25,25,25)` em todos os destaques; no escuro, `rgb(59,130,246)` — idêntico. **Duas observações:** ⭐ (a) **leitura por TEXTO capturou o nó ERRADO** no seletor de gatilho — há dois nós com "Aluno inativo" (canvas de fundo escuro-fixo + card do painel); corrigido filtrando por posição. **Lição para os próximos gates: em tela com canvas atrás, ler por posição ou seletor, nunca só por texto.** (b) **o D13 confirmado na prática**: no escuro, card selecionado e não-selecionado do gatilho têm a MESMA cor de texto (`rgb(209,213,219)` nos dois) — só a borda distingue; é exatamente o que a F3.2 vai tratar. | 03/set/26 |
| **F3.2** ✅ | **Pista própria nos 3 pontos da D13** — check condicional na perna SELECIONADA dos cards de trigger (side-panel + gêmeo mobile, **duplicação confirmada: zero import entre eles**) e no chip de funcionalidade habilitada (`relative` + badge absoluto no canto). ⭐ **A solução COMPÔS dois moldes da casa** (check `M5 13l4 4L19 7`, 20 usos; posicionamento absoluto de badge do bell/dropzone) — **não inventou padrão novo**. ⭐ **Prova estrutural**: o check é `{condição && <svg>}` — o nó **NÃO EXISTE no DOM** da perna não-selecionada; não é esconder por CSS, é ausência. ⭐ **Valor além do rebranding**: no escuro de HOJE, com o azul, os dois cards já tinham a MESMA cor de texto (`rgb(209,213,219)`) e só a borda distinguia — a fatia melhora o estado ATUAL para quem não distingue cores bem. `aria-selected`/`pressed` ausente → item 9.206 (não tocado, é semântica). | **3** (+4/−1) | `5387c7b` → merge **`0c969ac`** | render condicional provado no diff · `tsc` exit 0 · build `vbM45WC6hOcdcmBPy6HZc`, alvo prod 0/staging 2 | ✅ **COMPLETO nos dois modos, desktop E mobile**: migração do check verificada POR CLIQUE nos cards; chip com toggle ao vivo (check aparece/some junto); ⭐ mobile em **390×844** — ali o grid vira 2 COLUNAS e o comportamento se mantém, **coisa que a leitura de código não provaria**; `className` conferido antes de cada leitura (9.202), nós filtrados por posição/seletor (lição da F3.1) | 03/set/26 |
| **F3.3** ✅ | **Par claro/escuro em borda e anel (D14): 100 tokens em 95 linhas / 43 arquivos** — `(border\|ring)-primary(/N)` → `(border\|ring)-[#191919](/N) dark:(border\|ring)-primary(/N)`; 5 metades escuras pré-existentes mantidas literais. **Lote 100, não 112**: 6 nunca-claro, 4 condicionais e **2 da D13** saíram do bruto. **Papéis: FOCO 71 · DECORAÇÃO 17 · SELEÇÃO 12.** ⭐ **O ganho real medido: 51 pontos de foco que NÃO tinham indicação NENHUMA passaram a ter no claro** — não era "foco fraco", era **ausente** (ver item **9.208**: a família `/N` do token `primary` nunca gerou regra). Relocalização de linhas feita contra o código ATUAL (a F3.2 inserira linhas). | **43** (+95/−95) | `2ff14b0` → merge **`e02bacd`** (que levou junto `771ffd5`, o doc da lição 9-B) | **Portão do escuro por comparação de declarações no CSS servido**: **6/6 plenos casados** (`border-color`/`--tw-ring-color: var(--producer-primary,#3b82f6)`, forma `:is(.dark *)`); as gêmeas `dark:*/N` são **mortas dos dois lados (0 = 0)** — byte-idêntico literal, e ficam prontas se o token um dia virar canais · `tsc` exit 0 · build `C_I0gjfJCu4KhKO0fvX-T`, alvo prod 0/staging 2 · ⚠️ duas sondas minhas deram falso-vazio por escape de regex; o grep cru desmentiu (vazio implausível → re-sondar) | ✅ **COMPLETO**: ⭐ **primeira vez na frente que se testou navegação por TECLADO** — anel de foco por Tab conferido nos dois modos — mais o **mobile 390×844**. Roteiro reescrito antes do gate (rodada WW) porque 2 rótulos meus não existiam; a aba real é **"Email de Acesso"** e seus 5 campos **nunca aparecem juntos** (ternário do toggle *HTML personalizado*) | 03/set/26 |
| **F3.4** ✅ | **Knob do toggle lê `--producer-button-text` (D15): 7 pontos**, e **não 5** — ⭐ os dois extras **não seriam achados por busca da classe `bg-primary`**: `course-form.tsx:61` tem trilho `bg-blue-600`, que dentro de `.producer-layout` é **remapeado** para `var(--producer-primary)` por `globals.css:263` (viraria lime sozinho), e `settings/page.tsx:137` (o toggle de **modo claro/escuro**) pinta o trilho por **`style` inline com `theme.primaryColor`**. ⚠️ Achados só porque a sonda foi refeita: `grep translate-x` deu 36 falsos positivos e o primeiro filtro deu **2** — vazio implausível → re-sonda pelo **ternário do trilho**. **Reuso:** `--producer-button-text` serviu pela semântica exata da D15 (*o que está sobre a marca acompanha a marca*) — **nada criado**. **A conta:** hoje 3,68 · virada SEM a fatia **1,11** (o "ligado" some) · virada COM a fatia **16,05**. ⓘ Nenhum dos 7 trilhos usa `bg-primary/N` — a família morta do **9.208** não afeta esta fatia. | **6** (+7/−7) | `b47cee7` → merge **`a6de241`** | ⭐ **Pixel-neutro provado em DOIS eixos:** (1) a regra servida é `background-color:var(--producer-button-text,#fff)`; (2) **SELECT em produção** (ref impresso) → `buttonTextColor = #ffffff` em **14/14** dos que salvaram config ⇒ **125/125 contas resolvem para branco hoje** · `tsc` exit 0 · build `7c_YJEuI49mI4DAXEVyQh`, alvo prod 0/staging 2 | ✅ **7/7 nos dois modos, com clique testado em cada e estado restaurado**. ⚠️ **Foi gate de NÃO-REGRESSÃO, com todas as letras: o GANHO desta fatia só é verificável na F3.5** — hoje o trilho é azul e a bolinha branca já contrasta | 03/set/26 |
| **F3.3b** ✅ | **Foco visível no modo ESCURO: 52 ocorrências em 47 linhas / 23 arquivos** — `dark:focus:(border\|ring)-primary/N` → `…-white/N`, espelhando a F3.3 (que resolveu o lado claro com hex literal). ⚠️ **52 e não 45**: aquele número contava só `border/50`; o lote soma **border/50 ×45 + ring/20 ×6 + ring/50 ×1**. **Molde:** `border-white/N`, porque a casa já usa (**188** de `/10`, 158 de `/5`, 82 de `[0.08]`) — **cinza novo foi recusado**. ⭐ **O `ring/20` ficou fraco (1,78) DE PROPÓSITO**, por simetria com o claro (1,53): **espelhar, não melhorar por conta própria** — o ganho do elemento vem da borda `/50` (5,27), no mesmo input. **Exclusões, ambas provadas automáticas** (nenhuma tem prefixo `dark:focus:`): `register:313` (ali o `focus:ring-1` **já pinta** pelo `--tw-ring-color` default do Tailwind — acordar o `/20` **pioraria**) e os 5 de cor-sobre-a-própria-matiz. | **23** (+47/−47) | `893022c` → merge **`ad95414`** | ⭐ **A prova que salvou a fatia, feita ANTES de aplicar:** `border-white/10` já existia no bundle como `#ffffff1a` — `white` é cor **real** do Tailwind e o alpha funciona, ao contrário do token `primary` (`var()` crua). **Sem essa checagem, a fatia poderia trocar uma classe morta por outra e o gate passaria como "sem mudança".** Depois: **3 regras nasceram (antes 0)** — `border-color:#ffffff80`, `--tw-ring-color:#fff3`, `#ffffff80` · **Portão do claro:** regras `[#191919]` da F3.3 **idênticas** (2/2 e 3/3) · `tsc` exit 0 · build `pvMbRp9bkQIEIFwZYXQVf`, alvo prod 0/staging 2 | ⚠️ **GATE PARCIAL — escrito como parcial, não como provado:** **11 pontos vistos** por teclado em 3 telas (workspaces→Email de Acesso, integrations/hubla, modal Solicitar integração). **Os 7 do `/producer/login` NÃO foram vistos** — o agente de navegador não faz logout; provados **apenas por CSS/HTML** (classe presente no HTML servido, regra presente no bundle). ⭐ **Caso NOVO medido ali, reportado e não consertado:** o login tem fundo `#060612` **FIXO**, então no modo **claro** vale a metade clara (`[#191919]/50`) sobre superfície escura = **1,06 🔴**; no escuro, **5,27 ✅**. **Não é regressão** — antes da F3.3 aquele ponto não tinha foco em modo nenhum: é ganho no escuro e permanência do nada no claro | 04/set/26 |
| **F3.5** ⭐✅ | **A VIRADA — a paleta nova entra no painel.** 7 valores em `theme-constants.ts`: `primaryColor` **`#3b82f6` → `#EFFF20`** · `bgColor`/`headerColor`/`sidebarColor` **`#0a0a1a` → `#191919`** (chapa única) · `cardColor` **`#111827` → `#202020`** · `secondaryColor` **`#1a1e2e` → `#262626`** · `buttonTextColor` **`#ffffff` → `#191919`** (D15). `mode` segue `dark` (D10). Nenhum outro arquivo tocado. | **1** (+22/−14) | `6d0028e` → merge **`3c65e69`** | ⭐ **Prova no ARTEFATO COMPILADO** (determinística): o objeto literal aparece virado no `.next/server`, e **`primaryColor:"#3b82f6"` = 0 no servidor** — o azul sobrevive só como *fallback* de `var()`, que é o desenho · hexes antigos **0/6 no bloco do objeto** (as 5 ocorrências restantes são o comentário que documenta a origem, provado por linha) · `tsc` exit 0 · build `_U3ZjsaYtQjJZwYvOgnEE`, alvo prod 0/staging 2 | ✅ **Aprovado pelo dono no palco.** ⭐ **A conferência que só a virada tornou possível — todos os pares preparados PASSARAM:** botão primário **15,90** (era **3,68**, sub-AA no azul) · knob sobre trilho lime **15,90** · marca como texto **15,90** (bg) e **14,74** (card) · borda e anel **15,90** · foco branco/50 **5,23** · texto do guia `#F6F6F2` **13,97–16,23**. Nada abaixo do limiar | 04/set/26 |
| **F2·assets** ✅ | *(= a `F1` da tabela do §5 — ver a nota de nomenclatura lá)* **22 arquivos do kit com NOME NOVO (D2, sufixo `-v2`)**: 8 ícones PWA, **2 maskable com ARTE PRÓPRIA** (antes o manifest reusava o mesmo PNG do `any`), apple-touch-icon, `favicon.ico`, `favicon.svg`, logo, og-image e 7 SVGs em `public/brand/`. **5 consumidores apontados:** `manifest.json` (11 srcs + `theme_color`/`background_color` **`#0a0a1a` → `#191919`**), `layout.tsx` (`icons` svg+ico+png e os 4 `apple-touch-icon`), a rota de manifest dinâmica (4 srcs de fallback + theme), `sw.js` (precache, push, badge e ⭐ **`SW_VERSION` 2.3.0 → 2.4.0**, que é o que invalida o precache do ícone velho) e a landing (`IMAGES.logo` → `/brand/simbolo-lime.svg`, escolhido por medição: lime **15,93–18,30** nos 4 fundos `--mc-g*`, o escuro daria 1,00–1,15). | **5 código + 22 novos** (+128/−30) | `59f02a8` → merge **`e955f9d`** | ⭐ **Prova da D2 por SHA-256:** os **13 antigos INTACTOS**, nenhum sobrescrito — `images/applyfy-logo.png` (marca de terceiro, **D8**) **byte-idêntico** (`268f6a97…` antes e depois). ⭐ **Defeito histórico corrigido:** os 9 ícones antigos tinham dimensão real **1,30×** a declarada; os novos conferem **10/10**. 🔴 **E o portão pegou um erro meu ANTES do gate:** a entrada `180x180` apontava para `icon-180x180-v2.png`, **que não existe** (no kit o 180 vem como `apple-touch-icon.png`) — corrigido; depois, **11/11 entradas existem em disco E a dimensão declarada bate com a real** · `tsc` exit 0 · build `CXsdMtk6LtDkJPfOVA2Ca`, alvo prod 0/staging 2 · manifest servido com `theme_color #191919` e todos os srcs `-v2` | ✅ **4/4, com HEAD 200 nas 11 URLs.** ⚠️ Ficou explícito no roteiro: **favicon e logo da plataforma vêm do BANCO** (`PlatformSettings`, preenchido em produção desde 20/abr) — **não mudam com esta fatia**; muda o fallback, os ícones PWA, o apple-touch, o og e a landing. **3 itens abertos:** 9.209 (favicon borra a 16px), 9.210 (og-image), 9.211 (`--mc-accent`) | 04/set/26 |
| **9.213 camaleões** ✅ | **7 pontos** que **já pintavam branco sobre lime na integração** — o único defeito ATIVO que a frente tinha. `text-white` → `text-[var(--producer-button-text,#ffffff)]` (a string idêntica do `ui/button.tsx:17`) em `date-range-selector:358/:419`, `mini-calendar:123/:126`, `rich-text-editor:353/:431/:641`. ⚠️ **7 e não 14**: dos 79 brutos, 67 não alcançam o painel, 1 tem sufixo `/N` e ⭐ **5 saíram por alcançarem a VITRINE** (lá a var carrega `vitrineTextColor`; no FHO a troca iria de **1,54 → 1,00**, piorando o 9.195). 🔴 **Pendência registrada:** 4 pontos que a varredura por CLASSE não vê — **gradiente** (`sidebar:419`) e **`style` inline** (`workspace-switcher:106`), mais 2 de `bg-primary`+vitrine. | **3** (+7/−7) | `d273eb4` → merge **`4351708`** | `text-white` 957→**950** · classe nova 112→**119** · **word-diff em token único** com aspas normalizadas e controle de não-vacuidade · asserção tripla com inverso byte a byte · prova nos 3 destinos (painel 1,11→**15,90**; `/admin` e `(course)` **idênticos**, pois a var não é emitida lá) · `tsc` exit 0 · build `bO1F8bIy7MEy4kwGKDbas` | ✅ **Nos DOIS contextos**: `rgb(239,255,32)` \| `rgb(25,25,25)` no painel e `rgb(37,99,235)` \| `rgb(255,255,255)` no `/admin` — **o mesmo componente com os dois valores certos**, que é a prova de que `#191919` literal teria quebrado o `/admin`. ⚠️ O gate **reprovou por engano na 1ª tentativa** (conta contaminada — ver lição **9-D** e item **9.216**) | 04/set/26 |
| **F5.1 landing** ✅ | **6 tokens de accent + og-image ×2.** `--mc-accent` `#3b82f6`→**`#EFFF20`** · `-2` `#60a5fa`→**`#F5FF58`** · `-3` `#93c5fd`→**`#D6E600`** (os três do guia, **D1**) e os 3 rgba viram `rgba(239,255,32,·)` com os mesmos alfas. A landing é **100% token** (0 classes Tailwind de cor): 6 linhas reacendem **79 usos** na página **+ 33** nos mockups. Fecha os itens **9.210** (og-image) e **9.211** (o halo do logo, que era azul em volta do símbolo lime). | **2** (+8/−8) | `fb69e9a` → merge **`8347816`** | ⭐ **A ARMADILHA DO `styled-jsx`, e ela custou 3 sondas:** os tokens **não aparecem no HTML nem no CSS servido** — o bloco é `<style jsx global>` e **compila para dentro do chunk JS**; lá o minificador ainda **reescreve as formas** (`rgba(239,255,32,.10)` → `#efff201a`, hex em minúsculas). Três greps deram **falso-negativo** e quase viraram um laudo de defeito inexistente; a **busca frouxa** achou o chunk (`19_wvo73k5pn4.js`, HTTP 200) com o `.mc-root` correto e **0 ocorrências de azul** · `tsc` exit 0 · build `BwWL_fn78PCWmZcEUH1RE`, alvo prod 0/staging 2 | ✅ **Aprovado**: landing percorrida inteira, **0 azul residual**, os **3 gradientes** conferidos pelo dono. 🔴 **2 defeitos ESPERADOS confirmados no gate** (item **9.217**): o badge "★ Mais escolhido" e o "Começar agora" do mockup — **já reprovavam no azul** (3,68), o lime só tornou visível | 04/set/26 |

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

### 6-E. Sessão de 04/set/26 (noite) — o portão do `/admin` e a varredura dos 3 padrões

**⭐ O `/admin` é uma frente DIFERENTE, e o número que prova: 0.** Zero
`--producer-*`, zero `.producer-layout`, zero token `primary` — ele é **100%
Tailwind literal**. No painel a virada foi **1 arquivo**; ali serão **184
substituições**, e com par claro/escuro, porque o `/admin` usa **os dois modos**
(704 classes `dark:` + o `<ThemeToggle/>` do Header). Inventário e sequência no
item **9.219**; o foco que **já falha hoje** (1,85 claro / 2,13 escuro) virou o
item **9.218**. ⚠️ **23 CTAs acoplados**, não 18 — a estimativa anterior era baixa.

⭐ **E uma diferença fina que só a medição mostra:** no painel o foco era **classe
morta** (9.208 — não gerava regra); no `/admin` as classes são `blue-500`, cor real
do Tailwind, então **geram**: lá o foco **não existia**, aqui ele **existe e é
fraco**. Defeitos diferentes, consertos diferentes.

**A varredura dos TRÊS padrões — a dívida de método do 9.213, paga.** A varredura
por CLASSE é cega a **gradiente** e a **`style` inline**; refiz com os três padrões
em todo o `src/`: **87 linhas**, das quais **13 alcançam o painel**. Delas, **6
saem pela vitrine** (item 9.195), **4 já estavam corretas** (`settings:229/248` já
usam `theme.buttonTextColor`; `:213` é preview da cor; `:137` é o trilho, que deve
ser a marca mesmo), **1 é falso positivo** (`students:325` usa `from-blue-600`, que
**não** está nos remaps) — e **2 eram defeito real**, corrigidos na branch
`feat/rebranding-camaleoes-2` (`ddf6eff`): `sidebar.tsx:419` (**gradiente**
`from-blue-500 to-blue-600`) e `workspace-switcher.tsx:106` (**`style` inline**).

ⓘ **O balde A restante NÃO foi tocado, e é decisão consciente:** os **14** pontos
de `raiz/auth/invite` **não quebram hoje** — estão fora do painel, o fundo segue
azul e o branco está certo. Trocá-los antes da virada daquelas superfícies seria
**mudar pixel sem ganho**. Eles entram junto com a F5 de cada área.

---

### 6-D. Sessão de 04/set/26 (tarde) — 3 branches prontas e o número do 9.216

**O certificado ganhou prova visual sem tocar no banco.** A rota exige 100% de
progresso e **nenhum aluno do palco chega lá** (o único curso com aulas tem o
melhor aluno em **1/4**), então gerei **dois PDFs por script fora da rota**, com
dados fictícios: `/tmp/cert-gate/certificado-NOVO.pdf` e `…-ANTIGO.pdf`.
⭐ **A prova está DENTRO do PDF, e quase escapou:** procurei os operadores `rg`/`RG`
e o `(25,25,25)` **não apareceu** — parecia defeito. A causa: **o jsPDF converte
cinza puro (R=G=B) para o operador `g`/`G`**, que o regex de `rg` não pega. Com a
sonda certa: o NOVO tem **`0.098 g` = cinza 25 = `#191919`** e **zero azul**; o
ANTIGO tem `rgb(37,99,235)`/`rgb(38,99,235)`. *(Lição irmã da 9-E: o valor pode
estar em outra FORMA, não só em outro arquivo.)*

**Duas fatias de uma linha e uma de duas linhas, todas em branch própria:**

| branch | o que faz | prova |
|---|---|---|
| `feat/rebranding-config-marca` (`e7e5fb8`) | **9.214** `meta theme-color` `#0a0a1a`→`#191919` (varredura: é a **única** do projeto) · **9.215** fallback do favicon `/logo.png`→`/logo-v2.png` | ⭐ **Recusei o SVG com evidência:** o `DynamicFavicon` **rasteriza tudo num canvas 64×64** (`:43-45`, `toDataURL`) — o SVG não traria ganho e adicionaria risco. PNG é o formato certo ali |
| `feat/rebranding-f5-1b-gemeos` (`83d57a5`) | **9.217** o badge "★ Mais escolhido" (`page.tsx:462`) e o "Começar agora" do mockup SVG (`landing-mockups.tsx:257`): **1,11 → 15,90** | ⭐ **Valor literal é o certo aqui, e provei:** a landing tem **0** ocorrências de `--producer-*`/`--member-*` e não monta em shell de produtor — é o **oposto dos camaleões**, que exigiam a variável |
| `feat/rebranding-f5-4-certificado` (`7fa5d8d`) | **F5.4**, já pronta desde a madrugada | os 2 PDFs acima |

⭐ **O NÚMERO DO 9.216, que separa "personalizou" de "clicou em Salvar":** comparei
os 14 `themeConfig` de produção contra os **5 conjuntos de defaults que já
existiram** (levantados por `git show`, incluindo o **índigo `#6366F1`** de abr/26).
**3 são congelados sem querer** — byte-idênticos ao conjunto azul — e **11
personalizaram de verdade**. ⇒ **O estrago real é 3 contas, não 14**, e os 3 são
exatamente os que a **D6** havia achado sem explicar.

---

### 6-C. ⭐ O PORTÃO DA F5 — medido na sessão de 04/set/26 (madrugada)

**A conclusão que organiza tudo:** cada superfície restante precisa da **mesma
sequência que o painel teve** — preparar os pares e as pistas **com o azul no
lugar**, e só então virar. Aplicar 183 pontos do `/admin` de uma vez, sem gate,
repetiria exatamente o erro que a ordem da F3 provou ser errado. Por isso a
sessão **aplicou só o que era inequívoco** e **parou** no resto, com a medição
registrada.

| sub-fatia | tamanho medido | natureza | estado |
|---|---|---|---|
| **F5.1 landing** | 6 tokens de accent + og-image ×2 · **74 usos**, **0 classes Tailwind de cor** (100% token — a superfície mais isolada do sistema) | token + arquivo | ✅ **APLICADA**, branch `feat/rebranding-f5-1-landing` (`fb69e9a`) — **aguardando gate** |
| **F5.4 certificado** | 5 chamadas `setTextColor/setDrawColor(37,99,235)` | token (RGB, não hex) | ✅ **APLICADA**, branch `feat/rebranding-f5-4-certificado` (`76c4c7b`) — **aguardando gate** |
| **F5.3 e-mail** | 73 hex em `email-templates.ts` + **2ª cópia** em `email-tab.tsx` (34 hex) | token + texto | 🔴 **PULADA** — pergunta aberta, item **9.212** |
| **F5.2 /admin** | **183** azuis literais em **15 arquivos** | token | ⏸️ **NÃO aplicada** — precisa de sequência própria (ver abaixo) |
| **F5.5 outros** | 25 `text-white` sobre `bg-blue` em raiz/auth/invite · 77 hex azuis em `globals.css` (a maioria é *fallback* de `var()`, que é o desenho) | token | ⏸️ **NÃO aplicada** — mesma razão |

⭐ **Por que o `/admin` não foi feito nesta noite — com o número:** ele tem
**704 classes `dark:`**, ou seja **usa os dois modos**, e **nunca passou pelas
fatias preparatórias** (F3.1–F3.4) que o painel teve. Seus `text-white` sobre
`bg-blue-600` ainda estão crus: **23 pontos** que virariam 1,11:1 no instante em
que o azul de lá virasse lime. É uma frente do tamanho de F3.1+F3.3 juntas, com
gate próprio — não uma sub-fatia de madrugada.

⭐ **E o certificado ensinou uma coisa que vale para a F5 inteira:** ele tem
**fundo CLARO** (`#FAF9F5`). O lime ali daria **1,05:1** e o texto sumiria do PDF
impresso; por isso recebeu **`#191919`** (16,69), que é a **D12 aplicada
literalmente**. **A regra da F5 não é "trocar azul por lime"** — é *"sobre
escuro, lime; sobre claro, neutro"*. O e-mail é escuro (lime funciona, 15,43–17,73);
o certificado é claro (lime não funciona).

⭐ **O FAN-OUT DAS 6 ÁREAS voltou depois do fecho da sessão** (6/6, **149 pontos
catalogados**) e trouxe o que a medição manual não tinha alcançado:

- 🔴 **14 pontos JÁ QUEBRAM na branch de integração** — item **9.213**. Não é
  previsão: `theme-constants` já vale `#EFFF20` e o remap de `globals.css:263`
  já está ativo, então `bg-blue-600 + text-white` na mesma string **hoje** pinta
  branco sobre lime (1,11:1). Escaparam da F2b porque são **camaleões** (rodam
  no painel *e* no `/admin`/dashboard), e os dois lotes dela eram "só painel".
  **É o item mais urgente da frente.**
- **`/admin` medido de verdade: 189 pontos** (184 classes + 5 strings), com os
  papéis contados — fill de CTA **43** · foco **45** · texto **50** · tinta **29**
  · borda **17**. ⚠️ **18 CTAs têm `text-white` na MESMA string do `bg`** (trocar
  só o fundo dá 1,11) e **o foco de lá JÁ falha hoje** (1,85 claro / 2,13 escuro)
  — com lime pioraria para 1,11. Confirma que o `/admin` é frente própria.
- **CSP: hipótese de quebra REFUTADA** — `'self'` cobre `/brand/*.svg` e
  `/icons/*-v2.png`, e o `logoUrl` do Supabase **já passa** por `*.supabase.co`
  na `img-src` (`next.config.mjs:50`). **Nada a mudar ali.** Os achados reais de
  config foram outros dois: **9.214** (`meta theme-color` desatualizado) e
  **9.215** (o `DynamicFavicon` sobrescrevendo com o logo antigo).
- **Certificado, detalhe que muda o custo do logo:** o jsPDF **tem** `addImage`,
  mas **`doc.svg` é `undefined`** — os 7 SVGs de `public/brand/` **são inúteis
  para o PDF**; o caminho é `public/logo-v2.png`, e só com `compression:'FAST'`
  (+11,8 KB; sem ela **+786 KB** por certificado).
- **Landing:** trocar as 6 linhas reacende **79 usos** na página **+ 33 nos
  mockups** — e ⚠️ **dois gêmeos pintam texto BRANCO sobre a marca**
  (`page.tsx:462` e `landing-mockups.tsx:257`), que **já reprovam hoje** (3,68) e
  com lime viram 1,11. **A F5.1 aplicada NÃO os cobriu** — ficam para o gate.

⚠️ **Fora do escopo desta medição, registrado:** `text-white` sobre cor
**semântica** (`bg-red`/`emerald`/`green`/`amber`) tem **46 ocorrências** e
**não deve entrar em lote nenhum** — ali o branco está certo.

---

### 6-B. ⭐ O PLACAR HONESTO DA FRENTE (04/set/26)

**FEITO** — tudo em `feat/rebranding`, **nada em produção**:
`F0` (fonte única dos defaults) · `F1` (o molde da casa lê a variável) ·
`F2b` lotes 1 e 2 (110 pontos passam a ler `--producer-button-text`) ·
**conserto do modo claro** (etapas **A**, **B**, **C**) ·
**F3 completa** (`F3.0` decisões · `F3.1` · `F3.2` · `F3.3` · `F3.3b` · `F3.4` ·
medição do `9.208` · **`F3.5` a virada**).

**FALTA:**
- ~~**F2** — logo, favicon, ícones PWA e OG.~~ ✅ **FEITA em 04/set/26**
  (merge `e955f9d`) — 22 arquivos com nome versionado, 5 consumidores
  apontados, gate 4/4. Deixou 3 itens: **9.209** (o favicon borra a 16px —
  conserto de DESIGN), **9.210** (og-image da landing) e **9.211**
  (`--mc-accent` ainda azul).
- **F5** — as outras superfícies: **`/admin`** (26 azuis literais, fora dos
  escopos remapeados), **e-mail**, **certificado**, **landing**, os
  **manifests**, `theme_color` e a **CSP**.
- **A MAIN** — **nada foi para produção.** Todo o trabalho vive na branch de
  integração; o merge para `main` e o deploy são decisão do dono.

⚠️ **O QUE ESTA FRENTE CONSERTOU SEM SER REBRANDING** — é a maior parte do
custo e precisa estar visível:
- **~134 pontos** de contraste do **modo claro**, que estava quebrado em 4
  features inteiras (Lives, chat de suporte, editores, cards de recursos) e numa
  família transversal. Pré-existente; ninguém tinha visto porque **125 de 125**
  contas de staff rodam no escuro.
- **52 pontos de foco** que **não existiam** no modo escuro (a família `/N` do
  token `primary` nunca gerou regra — item **9.208**).
- **O contraste do botão primário**, que estava **sub-AA no azul** (3,68) e foi
  a **15,90** com a virada.
- **A pista não-cromática** dos 3 pontos onde a cor era a única informação
  (**D13** / F3.2) — melhora para daltônicos **já no azul**, não só no futuro.
- **20 itens abertos** no PLANO-MESTRE (**9.189 a 9.208**), todos com causa
  provada e file:line — de defeitos de tema a achados de arquitetura.

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

### 9-B. Rótulo de tela NÃO sobrevive a passar por texto — TRÊS ocorrências

Toda vez que um rótulo foi escrito **de memória** em vez de extraído do código,
ele chegou errado ao dono. Três casos nesta frente:

1. **"Baixar CSV" (F2b)** — botão citado no roteiro que **não existia** naquela tela.
2. **"Modal de e-mail" nos gateways e "abas do profile" (F3.3)** — nenhum dos dois
   existe: `hubla/page.tsx` tem **0** modais e **0** menções a e-mail; `profile/page.tsx`
   tem **41 linhas** e nenhuma aba. O rótulo certo é o modal **"Solicitar integração"**
   (`integrations/page.tsx:416`), que contém um campo de e-mail — foi essa contração
   ("modal que tem campo de e-mail" → "modal de e-mail") que nasceu **no relatório do
   executor** e o dono só replicou.
3. **"Assunto do email" vs "Título" (F3.3)** — ⚠️ **e aqui a correção é mais fina do que
   parecia**: os DOIS existem. `email-tab.tsx` tem um **ternário** em `config.emailUseCustomHtml`
   — a perna LIGADA mostra *Assunto do email* + *HTML personalizado* (`:180`/`:194`), a
   perna DESLIGADA (padrão) mostra *Título* + *Corpo da mensagem* + *Rodapé*
   (`:276`/`:291`/`:306`). Não era rótulo errado: era **metade da tela**. O nome real da
   aba é **"Email de Acesso"** (`_lib/tabs.tsx:35`), não "aba E-mail".
   ⭐ **Consequência prática para o gate:** os 5 pontos daquela aba **nunca aparecem
   juntos** — quem testar precisa **alternar o toggle "HTML personalizado"**, ou 2 dos 5
   campos jamais são vistos.

### 9-E. `styled-jsx`: o valor não está no HTML nem no CSS — está no chunk JS

Na F5.1, três sondas seguidas deram **falso-negativo** ao procurar os tokens da
landing: `grep` no HTML servido → 0; `grep` no CSS servido → 0; `grep` por
`rgba(239,255,32)` no chunk → 0. Por um instante pareceu que **o build não tinha
pegado a fatia**.

**Duas causas somadas:** (1) o bloco é `<style jsx global>` — **styled-jsx compila
o CSS para dentro do bundle JS**, não para o `.css` nem para o HTML; (2) dentro do
chunk, o **minificador reescreve as formas**: `rgba(239,255,32,.10)` vira
`#efff201a` e os hex ficam **minúsculos**.

**REGRA:** ao provar um valor de CSS em artefato, **procurar pelo VALOR em várias
formas** (hex maiúsculo/minúsculo, `rgba()`, hex de 8 dígitos) **e em todos os
artefatos** (HTML, `.css`, chunks JS) — e, ao achar zero, **repetir com busca
frouxa antes de concluir**. Um zero só é evidência quando a sonda pode produzir
não-zero: aqui, o **controle** que salvou foi procurar o azul antigo — também 0 —
e o `.mc-root` completo, que apareceu inteiro e correto.

### 9-D. A conta do gate pode estar CONTAMINADA — verificar a saída antes de ler

O gate da fatia dos camaleões **reprovou por engano**: reportou botão azul e
`--producer-button-text: #ffffff` com o build correto servindo. A causa não era o
código nem o palco — era **a conta**: `producer-staging@staging.test` tem
`themeConfig` gravado **8/8 byte-idêntico aos defaults antigos** (item **9.216**),
e por isso **não recebe o rebranding** — exatamente como manda a regra central
(*personalização vence o padrão*). O gate estava, sem saber, testando a regra em
vez da fatia.

**REGRA, em duas partes:**
1. **A conta:** gates visuais desta frente usam **`dono-b@staging.test`** — a única
   com `themeConfig` **vazio** *e* com workspace/curso/aluno. ⚠️ **Ressalva medida:**
   ela tem **1 curso e 1 aluno** contra 4 e 18 da outra — telas que dependem de
   massa de dados podem aparecer vazias, e isso **não** é defeito da fatia.
   *(`admin-staging` é ADMIN e não abre `/producer`; `sem-vinculo` não tem workspace.)*
2. **A verificação de saída:** antes de qualquer leitura, conferir no console que
   **`getComputedStyle(document.documentElement).getPropertyValue('--producer-primary')`
   é `#EFFF20`**. Se vier `#3b82f6`, a conta está congelada e **o gate não é válido** —
   junto com o `document.documentElement.className` (regra do 9.202), são as duas
   perguntas que precedem qualquer leitura de pixel.

### 9-C. Elemento com `transition`: ler o computed style DUAS vezes

No gate da **F3.3b**, a primeira leitura de `getComputedStyle` **logo após o Tab**
capturou o valor **PRÉ-TRANSIÇÃO** — opacidade `0.1` em vez de `0.5` — em **3 de 4**
campos. Uma **segunda leitura, sem nova ação**, estabilizou nos valores corretos.

**REGRA:** em elemento com `transition` (todos os inputs da casa têm
`transition-colors`), **ler duas vezes**. A primeira leitura pode pegar o **estado de
origem da animação** e **reprovar a fatia por engano** — o defeito estaria no relógio
do teste, não no código.

### 9-B (continuação) — a regra do rótulo

**REGRA:** todo roteiro de gate **extrai o rótulo do código** (parser que junte linhas —
`<label>` multi-linha derrota `grep` de uma linha, como derrotou duas vezes aqui) **E
prova a string no bundle servido** antes de ir para o dono — com **controle negativo**
(uma string inventada tem de dar 0). Verificado assim, o lote da F3.3 rendeu 10/10
strings presentes e 0 para a inventada.

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

---

## 13. F3 — o mapa de-para (medido, não aplicado)

**01/set/26. Nada foi trocado.** Esta seção é o que a F3 vai executar.

### 13.1 As 8 chaves, valor a valor

| Chave | HOJE | NOVO proposto | Fonte do valor novo |
|---|---|---|---|
| `mode` | `"dark"` | `"dark"` | **D10** — não é cor, não muda |
| `primaryColor` | `#3b82f6` | **`#EFFF20`** | guia · `brand/primary` |
| `bgColor` | `#0a0a1a` | **`#191919`** | guia · `bg/base` |
| `headerColor` | `#0a0a1a` | **`#191919`** | ✅ **RESOLVIDA** — chapa única |
| `sidebarColor` | `#0a0a1a` | **`#191919`** | ✅ **RESOLVIDA** — chapa única |
| `cardColor` | `#111827` | **`#202020`** | ✅ **RESOLVIDA** — `bg/surface` |
| `secondaryColor` | `#1a1e2e` | **`#262626`** | ✅ **RESOLVIDA** — `bg/elevated` |
| `buttonTextColor` | `#ffffff` | **`#191919`** | guia · `text/primary` do modo claro — **obrigatório**, ver 13.2 |

### ✅ As 4 pendências, RESOLVIDAS pelo dono em 01/set/26

- **`bgColor` · `headerColor` · `sidebarColor` → `#191919`** — **CHAPA ÚNICA**: os três
  continuam **iguais entre si**, como hoje. Usar os três níveis do guia mudaria a
  **estrutura** da tela, não só a cor. Fica como possibilidade futura, e é
  **reversível por 2 valores**.
- **`cardColor` → `#202020`** (`bg/surface`) — o card segue **um degrau acima** do fundo.
- **`secondaryColor` → `#262626`** (`bg/elevated`) — ela pinta **chip, estado
  desabilitado e trilho de switch** (§13.2b): superfície inativa.
- **`buttonTextColor` → `#191919`** — **obrigatório**: branco sobre lime dá **1,11:1**.
- **`primaryColor` → `#EFFF20`**.

**Efeito medido:** o painel **sobe de patamar 2,7×** (fundo de `L=0,00356` para
`L=0,00972`) e o contraste do texto **cai de 19,60:1 para 16,23:1** — ainda **muito
acima de AA**. A ordem de elevação é **preservada**: fundo < card < secundária.

⚠️ **Estes valores NÃO estão aplicados no código.** É registro; quem os aplica é a
**F3**, que depende da **F2b**.

### 13.2 🔴 O contraste — e o risco concreto da F3

Controles: `#000000`/`#ffffff` = **21,00:1** (bom) · `#777777`/`#888888` = **1,26:1** (ruim). A fórmula discrimina.

| Par | Contraste | AA (4,5:1) |
|---|---|---|
| **HOJE** `#ffffff` sobre `#3b82f6` | **3,68:1** | 🔴 **já falha hoje** |
| **PROPOSTO** `#191919` sobre `#EFFF20` | **15,90:1** | ✅ **a troca CONSERTA** |
| 🔴 `#ffffff` sobre `#EFFF20` | **1,11:1** | 🔴 **praticamente invisível** |
| `#F6F6F2` sobre `#191919` | 16,23:1 | ✅ |
| `#F6F6F2` sobre `#202020` | 15,04:1 | ✅ |
| `#F6F6F2` sobre `#262626` | 13,97:1 | ✅ |
| `#EFFF20` sobre `#191919` (lime como destaque) | 15,90:1 | ✅ |
| `#EFFF20` sobre `#262626` | 13,69:1 | ✅ |

⭐ **A linha do meio é o risco da F3, e ele é grande:** trocar `primaryColor` para
lime **sem** trocar `buttonTextColor` produz **1,11:1** — texto branco sobre fundo
lima, ilegível. E lembrar que a **F1 tocou 1 das 217** ocorrências do balde A: as
outras **216 ainda cravam `text-white`** e **não leem** `--producer-button-text`.

⇒ **A F3 não pode ser feita antes da varredura do balde A**, ou o botão primário
de 216 lugares fica ilegível. Isso é constatação medida, não escolha de ordem.

### 13.2b Onde cada variável é realmente consumida

Medido por `var(--nome`, separando `globals.css` do resto:

| Variável | `globals.css` | resto de `src/` | total |
|---|---|---|---|
| `--producer-primary` | 47 | 8 | **55** ⭐ controle: a sonda acha uso |
| `--producer-text` | 11 | 0 | **11** ⚠️ ver abaixo |
| `--producer-bg` | 1 | 4 | 5 |
| `--producer-primary-hover` | 4 | 0 | 4 |
| `--producer-header` | 0 | 2 | 2 |
| `--producer-sidebar` | 0 | 2 | 2 |
| `--producer-card` | 2 | 0 | 2 |
| `--producer-button-text` | 0 | 2 | 2 |
| **`--producer-secondary`** | **1** | **0** | **1** |

⭐ **`--producer-secondary` NÃO é campo morto**, embora tenha um só ponto de uso.
`globals.css:321` remapeia a classe `dark:bg-[#1a1e2e]`, e essa classe tem **3
usos reais**, todos em `producer/courses/[id]/settings/page.tsx`: um chip em
`:228`, o **estado desabilitado** em `:267` e o **trilho do switch desligado** em
`:326`. ⇒ ela pinta **superfícies secundárias e inativas**. A pendência continua
sendo "qual valor", não "existe?".

⚠️ **`--producer-text` tem 11 usos e o painel NUNCA a define** — o provider emite
8 variáveis e ela não está entre elas; quem a define é só a **vitrine**
(`w/[slug]/layout.tsx:48`). No painel, os 11 usos caem sempre no fallback.

### 13.2c A hierarquia — a proposta preserva a ordem, mas sobe o patamar

| Superfície | HOJE | L | PROPOSTA | L |
|---|---|---|---|---|
| fundo / header / sidebar | `#0a0a1a` (os **três iguais**) | 0,00356 | `#191919` (`bg/base`) | 0,00972 |
| card | `#111827` | 0,00919 | `#202020` ou `#262626` | 0,01444 / 0,01938 |
| secondary | `#1a1e2e` | 0,01345 | sem par | — |

✅ **A ordem é preservada:** mais escuro no fundo, mais claro conforme eleva.
⚠️ **Mas o patamar sobe 2,7×** — o fundo vai de `L=0,00356` para `L=0,00972`. O
painel novo é **mais claro que o de hoje**, ainda que continue escuro.
ⓘ O contraste do texto cai de **19,60:1** (`#ffffff` sobre `#0a0a1a`) para
**16,23:1** (`#F6F6F2` sobre `#191919`) — segue muito acima de AA.

⭐ **E isso reformula uma das pendências:** hoje `bg = header = sidebar` são o
**mesmo valor** — o painel é uma chapa única. O guia oferece **três níveis**. A
decisão do dono não é só "qual hex", é **se quer manter a chapa única (tudo
`#191919`) ou usar os três níveis**.

### 13.3 ⭐ As fontes de verdade — são QUATRO, não três

| # | Fonte | Governa | Quem lê |
|---|---|---|---|
| **1** | `src/lib/theme-constants.ts` | **o PAINEL** (`--producer-*`) | `producer/layout.tsx` · `producer/settings/page.tsx` · `api/producer/theme/route.ts` · `producer-theme-provider.tsx` — **4, todas do painel** |
| **2** | `prisma/schema.prisma:83-91` (`@default` dos 5) | o valor gravado no INSERT de workspace novo | **o Postgres** — nenhuma leitura em código |
| **3** | `producer/workspaces/[id]/edit/_lib/helpers.ts:44-49` | o **formulário** de edição do login | `edit/page.tsx` · `edit/_components/login-tab.tsx` |
| **4** | `components/workspace-auth-shell.tsx:26-30` | a **tela de login do aluno**, renderizada | `/w/[slug]/login` · `forgot-password` · `reset-password` |

**A fonte 4 não estava no mapa e diverge da 3:**

| | 3 · formulário | 4 · tela real | 2 · schema |
|---|---|---|---|
| BG | `#0f172a` | **`#0a0a1a`** | `#0a0a1a` |
| PRIMARY | `#3b82f6` | `#3b82f6` | **`#6366f1`** |
| BOX | `#1e293b` | **`#1a1a2e`** | `#1a1a2e` |
| SIDE | `#0f172a` | **`#0a0a1a`** | `#0a0a1a` |
| OPACITY | 0.8 | **0.85** | 0.85 |

⚠️ O produtor abre a aba de login e o seletor mostra `#0f172a`; a tela dele, se o
campo for NULL, pinta `#0a0a1a`. **Formulário e render discordam.**

### 13.4 ⭐ Resposta do X4: para o PAINEL, UMA fonte basta

**Sim — trocar só `src/lib/theme-constants.ts` tem efeito completo no painel.**
Provado por quem lê o quê, não por suposição: as **4 leitoras são todas do
painel**, e `--producer-*` é **definida 0 vezes** no `globals.css` (§8) — não há
segunda origem.

**As fontes 2, 3 e 4 NÃO governam o painel** — governam a **tela de login do
workspace**, que é superfície do **aluno**. Elas pertencem à **D6** (2 e 3) e a uma
fatia própria da tela de login (4). **Não entram na F3.**

### Os números da medição final (rodadas OO e PP, 03/set/26)

- **Os "189" viraram 160 linhas alcançáveis** (178 tokens): **13 NUNCA-CLARO**
  (login/register `#060612` fixo, flow-editor, mini-canvas — provado que a
  guarda da etapa A não os vira: 0 usos das 4 classes) e **4 CONDICIONAIS**
  (borda que coincide com o próprio `bg-primary`).
- 🔴 **REFUTAÇÃO REGISTRADA, não apagada:** a hipótese anterior do dono —
  *"a marca como TEXTO sobre fundo claro é o problema inteiro"* — foi testada
  e **refutada a 43%** (76 de 178 pontos; borda/anel sozinho é MAIOR: 102). A
  hipótese seguinte ("no claro a marca não é primeiro plano") passou a 98%,
  com as 3 exceções da D13 nomeadas. **A refutação foi o resultado mais útil
  da rodada** — encolheu a decisão errada antes de ela virar código.
- **A superfície clara do guia NÃO ajuda:** lime sobre `#FFFFE6`/`#FEFFE6`/
  `#FBFFC2` dá **1,09 / 1,09 / 1,06** — pior que sobre branco (1,11). Trocar o
  chão claro não compra contraste nenhum. *(Controles: 21,00 · 1,26.)*
- **Tintas e toggles (46):** dos 17 que sinalizam estado, **13 têm pista
  redundante** no elemento (texto do badge, borda-presença, posição do knob),
  **2 são os trigger cards da D13**, 1 é nunca-claro (wizard do register) e 1
  sobrevive por presença (a barrinha da aba do analytics).
- **Valor único de primeiro plano: impossível** (janela de luminância vazia —
  ver D12); para contorno a janela L 0,13–0,30 existia e foi **recusada na D14**.
