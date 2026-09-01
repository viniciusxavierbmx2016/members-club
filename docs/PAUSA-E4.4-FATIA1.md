# ⏸️ PAUSA — E4.4, etapa 5, fatia 1 (a marca de pertencimento)

**Congelada em 31/ago/26 para dar lugar ao rebranding.**
Nada foi corrigido, nada foi escolhido, nada foi mesclado, nada foi migrado em produção.

Este documento existe para que a retomada não dependa de memória. Quem voltar
lê daqui, confere os vigias do §1, e só então mexe em código.

---

## 1. Estado congelado

| | |
|---|---|
| `main` | `d5349ca docs: registra as DECISÕES da marca de pertencimento (§12) e abre 9.183-9.188` |
| branch da fatia | `feat/e4.4-fatia1-marca` @ `7d57c40` (local **e** remota) |
| tag de selo | **`e4.4-fatia1-congelada`** → `7d57c40` (empurrada; `git ls-remote --tags origin` confirma) |
| mesclada? | **NÃO.** `git branch --merged main \| grep -i e4.4` = vazio |
| migração | aplicada **só no staging** (`db push`). **Produção nunca foi tocada.** |

A tag é a proteção: mesmo que a branch seja apagada por engano, `e4.4-fatia1-congelada`
segura o commit.

### Vigias em produção — baseline medido em 31/ago/26

Alvo provado antes de cada query: `host aws-1-sa-east-1.pooler.supabase.com`,
`usuário postgres.wyamxwmdgbvqrfcqfbyh`. Somente `SELECT`.

| # | Sonda | Valor em 31/08 |
|---|---|---|
| a | `to_regclass('public."WorkspaceMembership"')` | **`null`** — a tabela não existe em produção |
| b | `count(Course where isFree = true)` | **0** |
| c | `count(Enrollment where origin = 'FREE_CLAIM')` | **0** |
| d | `count(Course)` / `count(Course where isPublished = false)` | **66 / 5** |

Controles que impedem leitura vazia: `to_regclass('public."Enrollment"')` devolveu
`"Enrollment"` (a sonda **enxerga** tabela existente), e as tabelas consultadas em (b)
e (c) têm **66 cursos** e **29.018 matrículas** — os zeros são zeros de verdade, não
artefato de tabela vazia.

**Na retomada, remedir os quatro.** Se (a) deixar de ser `null`, alguém migrou produção
fora deste plano. Se (b) ou (c) deixarem de ser 0, o funil gratuito nasceu por outro
caminho e as premissas da etapa 5 mudaram.

---

## 2. ⭐ LISTA DE COLISÃO — os 7 arquivos que a fatia toca

**O rebranding precisa consultar esta lista antes de encostar em qualquer coisa.**
Saída literal de `git diff --name-status main..feat/e4.4-fatia1-marca`:

```
A   prisma/migrations/20260831190000_add_workspace_membership/migration.sql
M   prisma/schema.prisma
M   src/app/api/courses/[id]/claim/route.ts
M   src/app/api/producer/students/[id]/tags/route.ts
M   src/app/api/w/[slug]/init/route.ts
M   src/app/api/w/[slug]/login/route.ts
M   src/lib/workspace-access.ts
```

Mexer em qualquer um destes na `main` durante o rebranding **cria conflito** no dia da
retomada. Os dois de maior risco de colisão são `prisma/schema.prisma` (qualquer campo
novo no rebranding cai no mesmo arquivo) e `src/lib/workspace-access.ts` (helper com
13 chamadores).

⚠️ **`src/app/api/w/[slug]/init/route.ts` e `src/app/api/w/[slug]/login/route.ts` são
superfície de RECEITA** — é por onde o aluno entra e vê a loja. Se o rebranding precisar
tocá-los, é melhor fazê-lo **depois** do merge da fatia, não antes.

---

## 3. Gate humano — o placar

| Item | Resultado |
|---|---|
| 1 · login com a marca | ✅ verde |
| 2 · vitrine com a marca | ✅ verde |
| 3 · clicar no curso **gratuito** | 🔴 **vermelho** — quica de volta, em silêncio |
| 4 · clicar no curso **pago** (página de venda) | 🔴 **vermelho** — mesmo quique |
| 5 · **controle negativo** (`sem-marca-f1` barrado) | ✅ **verde** |
| 6 · regressão do aluno matriculado | ✅ verde |

O item 5 é o que sustenta a fatia: as duas contas são idênticas — conta, credencial,
zero matrículas, zero colaborações, zero workspaces próprios — e **só a linha da marca
difere**. Login 200 vs 403, vitrine 200 vs 403, tags 200 vs 404, resgate 201 vs 404.
**A marca é, de fato, o que decide o acesso.**

⭐ E a rota de resgate **já funciona**: `POST /api/courses/[id]/claim` devolveu **201 com
`enrollmentId`** para quem tem a marca. O defeito **não está no resgate** — está em
*chegar* na tela que oferece o botão.

---

## 4. Causa provada

**`src/app/api/courses/by-slug/[slug]/init/route.ts:120-126`** — é aqui que a decisão
nasce:

```ts
const allowedInTenant =
  user.role === "ADMIN" || isCourseOwnerEarly ||
  (await hasWorkspaceAccess(user.id, course.workspace.id, { requireMemberPermission: true }));
```

`allowMembership` **não é passado**. Em `src/lib/workspace-access.ts:73-78` a consulta da
marca vira `Promise.resolve(null)` e a 4ª via de `:91` nunca dispara. Sendo `STUDENT`,
`ADMIN` e `isCourseOwnerEarly` (que exige `role === "PRODUCER"`) também são falsos.

`:127-132` **só transforma a decisão em resposta** — o 404. O fix, quando houver, mexe em
`:124`, não em `:127`.

**Todas as saídas da rota**, para não sobrar dúvida: `:54-56` (401 sem usuário) ·
`:99-104` (404 slug inexistente) · **`:127-132` (404 fora do tenant)** · `:214-227`
(404 do `scope=module`) · `:279-304` (200) · `:305-308` (500).

### O código é PRÉ-EXISTENTE. O que a fatia criou foi o PRINCIPAL.

Nenhum arquivo do fluxo está no diff da fatia: a rota `courses/by-slug/[slug]/init`, a
página `(course)/course/[slug]/page.tsx`, os dois layouts, `course-preview.tsx`,
`course-card.tsx` e `w/[slug]/page.tsx` estão **todos intactos**. E a mudança em
`workspace-access.ts` é **byte-a-byte neutra** para os 7 chamadores que não passam o
parâmetro (a condição do ternário precede o acesso à propriedade; `Promise.resolve(null)`
nunca rejeita; a contagem de queries continua 3).

**Mas neutralidade nos 7 não é "a fatia não introduziu nada".** A fatia cria uma classe
de principal que antes não podia existir: **portador de marca sem matrícula, sem
colaboração e sem posse**. Antes dela ninguém chegava à vitrine sem uma das 3 vias — logo
ninguém clicava num card e quicava. **A falha é velha; a alcançabilidade por navegação
normal é nova.** É a lição *"feature inofensiva pode CRIAR o vetor"*, na variante em que
a feature não cria o furo: ela cria quem passa por ele.

⚠️ **Cuidado com a ambiguidade que já me pegou:** existem **duas** rotas chamadas `init`.
A que **mudou** é `src/app/api/w/[slug]/init/route.ts` (a vitrine, PORTA 2). A que
**barra** é `src/app/api/courses/by-slug/[slug]/init/route.ts` (PORTA 3).

---

## 5. As 8 opções — NENHUMA FOI ESCOLHIDA

| | Opção | O que abre | O que arrisca | Tamanho |
|---|---|---|---|---|
| **A** | `allowMembership: true` no `:124` | a PORTA 3 inteira | 🔴 entrega `sections` + `modules` + `lessons` (título, descrição, duração) de **qualquer** curso do workspace, **sem filtro de `isPublished`** | 1 arquivo, 1 linha |
| **B** | abrir só para `isFree && isPublished` | o curso gratuito | 🟡 ignora `showInStore` (item **9.190**) | 1 arquivo, ~4 linhas |
| **C** | o card da vitrine chama `/claim` direto | o resgate do gratuito | 🟢 mais forte no eixo do não-publicado — **mas NÃO resolve o item 4**: o CTA pago é link externo (`course-preview.tsx:199-201`) e exige a **página** de venda, não uma API | 2 arquivos |
| **D** | rota/payload novo, só de venda | a venda, com recorte próprio | 🟡 risco silencioso: quem escrever copia a query de `:58-97` e herda a ausência do filtro | ≥2 arquivos |
| **E** | uma rota, **dois payloads** — abrir e PODAR conforme a via | a venda, sem o excesso | 🟢 ataca a causa do vazamento; molde já no arquivo (`:82-92`, do 9.174) e contrato pronto (`PreviewCourse`, `course-preview.tsx:30-53`) | 1 arquivo, mais linhas |
| **F** | dar **escopo** à marca (guardar o curso de entrada) | só aquele curso | 🟡 exige migração — e o portão do §12.6 | ≥3 arquivos + migração |
| **G** | a matrícula nasce no cadastro (fatia 2) | tudo, pela 1ª via do helper | 🔴 **só adia**: §12.2 diz que cancelar não apaga a marca, e são **516 pares** nessa situação | 0 arquivos aqui |
| **H** | frase honesta no lugar do teletransporte | nada — corrige a experiência | 🟢 vale sozinha, escolha-se o que se escolher (item **9.189**) | 1-2 arquivos |

### Controles negativos, opção por opção

| Opção | `sem-marca-f1` | cross-tenant | matrícula CANCELADA que manteve a marca |
|---|---|---|---|
| A | ✅ barrado (`:91` exige a linha) | ✅ helper é por `workspaceId`; marca é `@@unique([userId, workspaceId])` | 🔴 lê a árvore de todo curso do ws, inclusive os **5 não publicados** (69 módulos, 345 aulas) |
| B | ✅ | ✅ | 🟡 só gratuitos — e produção tem **0** cursos gratuitos |
| C | ✅ (nem chega à vitrine) | ✅ `claim:73` é por workspace | 🟡 idem B; `claim:63` re-checa `isPublished && isFree` |
| D | ✅ | ✅ se copiar o gate | 🟡 depende do recorte |
| E | ✅ | ✅ | 🟡 títulos ainda saem, o resto não |
| F | ✅ | ✅ (mais apertado) | ✅ só o curso de entrada |
| G | ✅ | ✅ | 🔴 **não resolve** — é exatamente essa população |
| H | ✅ | ✅ | ✅ |

**População do 3º controle, medida em produção (31/08):** **516 pares** (pessoa, workspace)
cuja única matrícula é `CANCELLED` — **515** excluindo colaboradores e donos —, **500
pessoas**, **16 workspaces**. ⚠️ Desarme honesto: a tabela da marca **não existe em
produção e nasce vazia**, então esses 516 só seriam atingidos por um *backfill* futuro.

⭐ **O que precisa ser dito em voz alta antes de escolher:** o resgate é a **escalada**.
`src/app/api/courses/[id]/claim/route.ts:100-108` cria `Enrollment { status: "ACTIVE",
origin: "FREE_CLAIM" }`. Uma linha `Enrollment` passa nos **13** chamadores do helper sem
opt-in, **incluindo escrita** (`src/app/api/lives/[id]/messages/route.ts:112` chama o
helper sem opts logo antes de gravar no chat). A marca passa em **6**. Um clique converte
6 portas em 13.

---

## 6. Os dois efeitos transversais

Decidem tanto quanto a porta que se escolher.

**1 · O cache de 30 s.** `by-slug/[slug]/init/route.ts:299-303` responde
`private, max-age=30, stale-while-revalidate=60`. O ciclo do resgate refaz o **mesmo GET
da mesma URL** segundos depois (`course-preview.tsx:128` → `:137` `window.location.reload()`
→ `page.tsx:289`). A casa **já mediu este erro um arquivo ao lado**: a rota da vitrine
tinha o mesmo header e virou `no-store` no E4.4 2-C. E o remédio **não transfere** — lá
havia um consumidor; aqui são três. Item **9.191**.

**2 · Duas escritas depois do gate, numa rota de leitura.** `ensureMenuDefaults(course.id)`
em `:134` (cria `MenuItem` no curso do produtor, `:39-41`) e `prisma.user.update({
lastAccessAt })` em `:244`. Afrouxar o gate multiplica quem dispara escrita num `GET`.
Item **9.192**.

---

## 7. Autocorreções do relatório — para não repetir o erro na volta

1. **516 pares, não 505.** O número citado no comando era 505; a medição de 31/08 dá
   **516** (515 excluindo colaboradores e donos).
2. **O "200 catálogo-only" era medição VAZIA.** Eu havia afirmado que a PORTA 3 devolve
   catálogo sem conteúdo, com `modulos: 0`. Medi em `curso-pago-palco`, que tem **0
   módulos de verdade** (`curso-teste` tem 2 módulos e 4 aulas). Lendo o arquivo inteiro:
   entre `:134` e `:304` **não existe ramo que filtre por `hasAccess`** — `:281-287`
   espalha `...course`, que traz `sections` e `modules` com `lessons`. **O 200 entrega a
   árvore.** Só `videoUrl` foi podado (9.174).
3. **Existem DUAS rotas `init`.** A que mudou é `w/[slug]/init`; a que barra é
   `courses/by-slug/[slug]/init`. Dizer "a rota init está intacta" era ambíguo.

---

## 8. Pendências de painel — **NÃO MEXER na pausa**

Estão registradas aqui só para não se perderem. Nenhuma é para esta janela.

- **`TURNSTILE_SECRET_KEY` está vazia na Vercel** e **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  não existe lá**. O widget v2 não está ligado em produção.
- **O widget v1 do Cloudflare precisa ser excluído** — item **9.170**. As rotações dele
  não efetivavam (o mesmo valor voltava 3×, e a chave pré-rotação seguia aceita), que foi
  o motivo de nascer o v2.
- **Duas linhas de CSP voltam junto com o widget**, em `next.config.mjs`:
  `script-src` e `frame-src` com `challenges.cloudflare.com`. Sem elas o widget é
  bloqueado **em silêncio** — a CSP é enforcing e **não tem `report-uri`**.

---

## 9. O palco de staging

**Alvo:** `wxynnsyartxcvglqwmdw`. Prova discriminante da receita: `/w/staging-teste/login`
tem de renderizar `<title>Login · Staging Teste</title>` **e** um slug real de produção
(`applyfy-cursos`, `applyfy-cursos-internos`, `orion-academy`) tem de dar **404**.

### Personas — senha de todas: `Staging@2026!`

| Persona | Papel no roteiro |
|---|---|
| `marca-only-f1@staging.test` | ⭐ o sujeito: **só a marca**, zero matrículas/colaborações/posse |
| `sem-marca-f1@staging.test` | ⭐ controle negativo: idêntica, **sem** a marca |
| `aluno-staging@staging.test` | regressão: matrícula ACTIVE em `curso-teste` e `curso-teste-2` |
| `producer-staging@staging.test` | regressão: dono do workspace |
| `aluno-b@staging.test` | regressão cross-tenant (workspace `workspace-b-staging`) |

### Cursos em `staging-teste`

| Slug | `isFree` | `isPublished` | conteúdo |
|---|---|---|---|
| `curso-teste` | false | true | 2 módulos, 4 aulas |
| `curso-teste-2` | false | false | vazio |
| `curso-pago-palco` | false | true | **vazio** ⚠️ foi ele que produziu a medição vaga do §7.2 |
| `curso-corrida-923` | **true** | true | vazio |

### Sujeira conhecida, deixada de propósito

- tag **`sonda-f1`** no workspace `staging-teste`
- post **`sonda-controle-positivo-f1`** em `curso-teste` (criado por `aluno-staging` como
  controle positivo de "a sonda consegue devolver 201")

⚠️ **As personas do palco têm `User.workspaceId = NULL`, e 0 de 27.289 STUDENTs reais de
produção são assim.** O elenco **não espelha** produção. Consequência medida: o quique do
item 3 chegou à vitrine pelo cookie `active_workspace_slug`, não pelo `backHref` (que
seria `/`, porque `backHref` lê `workspace?.slug` do store, populado por
`src/app/api/auth/me/route.ts:60-65` a partir de `User.workspaceId`). **A fatia 2 terá de
decidir se o cadastro escreve `User.workspaceId`.**

⚠️ **O Supabase de staging é Free e pausa após ~7 dias ocioso.** Na retomada,
provavelmente será preciso **Restore** antes de qualquer coisa.

⚠️ **`next start` serve o `.next` já construído** — trocar de branch **não** muda o que o
palco serve. Se houver palco de pé na retomada, ele estará servindo o build de `7d57c40`,
não a árvore de trabalho.

---

## 10. CHECKLIST DE RETOMADA — nesta ordem

- [ ] **(a) Reconferir os 4 vigias do §1** em produção (`SELECT`, com alvo impresso e
      controle positivo). Esperado: `null` · 0 · 0 · 66/5. **Qualquer divergência muda as
      premissas — investigar antes de seguir.**
- [ ] **(b) Trazer a `main` de volta para a branch** e resolver a colisão, consultando a
      lista do §2. `git checkout feat/e4.4-fatia1-marca && git merge main`. Atenção
      especial a `prisma/schema.prisma` e `src/lib/workspace-access.ts`.
- [ ] **(c) Reconstruir o palco pela receita do §9**: Restore do staging se preciso →
      derrubar a porta 3000 e **provar morto** → `rm -rf .next` → build de staging →
      subir → prova de alvo discriminante → conferir as 2 personas por `SELECT`.
      ⚠️ Com palco de pé, **nunca** rodar build.
- [ ] **(d) ESCOLHER a opção** entre as 8 do §5, com os controles negativos na mão. É
      decisão do dono, não do chat.
- [ ] **(e) Só então, código** — e, se a escolha tocar banco, o runbook de migração:
      arquivo na branch → staging `db push` → validação completa → merge → **produção
      `migrate deploy` ANTES do `git push`**.

---

## Onde está o resto

- Decisões canônicas da marca: **§12** de [PLANO-E4.4-MINI-CURSO-GRATUITO.md](PLANO-E4.4-MINI-CURSO-GRATUITO.md)
- Itens abertos por esta investigação: **9.189**, **9.190**, **9.191**, **9.192** e o
  refino do **9.174** em [PLANO-MESTRE.md](PLANO-MESTRE.md)
- Itens já abertos que a etapa 5 esbarra: **9.174** (metade do gate), **9.186**, **9.187**,
  **9.188**
- Histórico com SHA: [DIARIO-EXECUCAO.md](DIARIO-EXECUCAO.md)
