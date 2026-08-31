# DIÁRIO DE EXECUÇÃO — Members Club

> Registro **cronológico** do que foi feito, quando, e com que prova.
> A ordem e as camadas vivem no [ROADMAP-EXECUCAO.md](ROADMAP-EXECUCAO.md); o registro por
> item vive no [PLANO-MESTRE.md](PLANO-MESTRE.md). Aqui é a linha do tempo.

**Nenhuma etapa fecha sem entrada aqui** — é o que impede o item-fantasma (item fechado no
código e aberto no papel, ou o contrário; as duas faces já aconteceram).

**Regra de ouro:** este arquivo registra **fato**, não intenção. Nada entra como "vai ser
feito"; só entra o que **já foi**.

**Ordem das entradas:** mais recente no topo.

---

## Formato obrigatório de cada entrada

Copie o bloco abaixo e preencha todos os campos. Campo sem resposta = etapa não fechada.

```
## [DATA] — CAMADA X, ETAPA X.Y — <nome>

**Estado antes:** main em <sha>
**O que foi feito:** <2–5 linhas, o essencial>
**Arquivos tocados:** <lista>
**Como foi provado:** <matriz de staging + validação humana, com o resultado colado>
**SHA do merge:** <sha>  ·  **Rollback:** git revert -m 1 <sha>
**Mudou em produção para quem:** <§21 — quem sente a mudança, quem avisar>
**Ficou aberto:** <itens novos criados, com número>
**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅
```

---

<!-- As entradas começam abaixo desta linha, da mais recente para a mais antiga. -->

## 2026-08-31 — CAMADA 3, GRUPO E3.42 — 9.172 FECHADO (rota irmã REMOVIDA) + a poda do 9.174

**Estado antes:** main em `5660aae`

**O que foi feito:** a rota `courses/by-slug/[slug]` tinha `getCurrentUser()` → 401 e **nada
mais**: qualquer conta autenticada da plataforma lia módulos, aulas e `videoUrl` de **qualquer
curso, cross-tenant**. Ela **não foi gateada — foi REMOVIDA**, porque a gêmea `/init` é
**superconjunto estrito** do seu único consumidor. ⭐ **Fix por REMOÇÃO: 4 arquivos, +74/−160.**
Junto veio a **poda** do 9.174: o `include` puro em `Lesson` virou `select` explícito **sem
`videoUrl`**.

**Arquivos tocados:** `src/app/api/courses/by-slug/[slug]/route.ts` (**apagado**, 156 linhas) ·
`src/app/api/courses/by-slug/[slug]/init/route.ts` (poda + régua) ·
`src/app/(course)/course/[slug]/module/[moduleId]/page.tsx` (repontada) ·
`src/app/(course)/course/[slug]/page.tsx` (declaração morta de `videoUrl`). **Zero migração.**

**Como foi provado:**
- **9/9 provas por API**, rodadas **duas vezes** — no palco de dev e **de novo no build de
  produção** (`next build` + `next start` com env de staging), porque é o artefato que sobe:
  (a) aluno ATIVO abre e `hasAccess=true` · (b) aluno **VENCIDO** não abre (404) · (c) colaborador
  **com** o curso no escopo abre · (d) o **mesmo** colaborador **sem** o outro curso no escopo
  toma 404 · (e) dono e ADMIN abrem · (f) conta do workspace B toma 404 · (g) rota antiga 404 e
  deslogado 401 · (h) `videoUrl` ausente dos dois payloads · (i) página de venda intacta.
- ⭐ **Os pares que DISCRIMINAM**, e são o que dá valor às provas: em (c)/(d) muda **só o curso**,
  mesma persona; em (b) muda **só o parâmetro**, mesma persona e mesmo instante — módulo **404**,
  venda **200**.
- **Prova de alvo discriminante** em todo palco: `Login · Staging Teste` (nome vindo do **banco**)
  **e** 404 em dois slugs **reais de produção**. **REF nos chunks: produção 0 / staging 2.**
- **Cobertura da poda** contra o `information_schema` de produção: `Lesson` tem **9 colunas
  reais**, **9 decididas**, 8 mantidas, `videoUrl` fora. (A lição *"include → select remove em
  silêncio"*: campo esquecido não dá erro, dá tela quebrada.)
- **Gate humano: 4 blocos, verde (31/08)** — rodado em **build de produção**, depois que um
  artefato visual apareceu no palco de **dev** (ver o achado abaixo).
- **Sanidade pós-deploy em produção:** rota removida **404** · gêmea **401** *"Não autenticado"* ·
  `/`, `/producer/login` e `/w/combo-presets` **200**. ⭐ **O sinal do deploy foi a própria
  transição `401 → 404`** da rota removida — ela discrimina sozinha: a rota existia e exigia auth;
  agora não existe.

**SHA do merge:** **`b140e50`** (`--no-ff`) · papelada em commit separado.
**Rollback:** `git revert -m 1 b140e50`.

**Mudou em produção para quem:**
- **Aluno com matrícula VENCIDA** — ⚠️ **mudança deliberada, aprovada pelo dono**: continua vendo a
  vitrine e a **página de venda**, mas **não abre mais o curso**. Antes ele abria e — pior — via
  tudo destravado (ver a armadilha).
- **Colaborador** sem aquele curso no escopo deixa de abrir a tela de módulo (menor privilégio).
- **Qualquer conta autenticada** deixa de ler estrutura de curso alheio. **Aluno, dono e ADMIN
  legítimos: nada muda.**

**Ficou aberto:** **9.174** na **metade do gate** (só a poda fechou) · **9.173** · **9.175** ·
**9.176** · **9.177** · e **dois itens novos**: **9.178** e **9.179**.

**⭐ O ARCO — e é a lição "conferir a rota IRMÃ", agora com SEGUNDO caso:** esta rota é a irmã
daquela que o fix **`ee032e5`** (item 9.62) fechou — e aquele commit **tocou só o `/init`**. A
primeira vez que a lição apareceu (9.109) era o par *conceder × revogar*; aqui é outra forma:
**duas rotas que servem o MESMO payload, e só uma foi gateada** — e a irmã **nunca teve** gate, não
é que tenha perdido. `grep -F "by-slug/[slug]/route.ts" docs/` dava **0**: nenhuma auditoria a
tinha olhado. ⇒ **Regra que isso acrescenta: ao fechar um gate, `ls` o DIRETÓRIO do recurso e
comparar os PAYLOADS, não os nomes; e o commit do fix tem de dizer QUAIS irmãos conferiu.**

**⭐ COMO MÓDULO E PÁGINA DE VENDA FORAM SEPARADOS:** a gêmea serve **duas telas com regras
opostas**. A página de venda **precisa** que o não-matriculado receba 200 (`init:83-89`: *"exigir
matrícula aqui quebraria o checkout"*). A tela de módulo não tem contraparte de receita — seu único
link nasce com `hasAccess === true` (`page.tsx:154`). A separação é por **parâmetro**: a tela de
módulo pede `?scope=module`, e só nesse caminho a régua estrita roda. **Por que não é bypass:**
omitir o parâmetro **não destrava nada** — devolve exatamente a resposta da página de venda, que
quem passou no gate de tenant já podia pedir. **O parâmetro só FECHA.**

**🔴 A ARMADILHA, para quem mexer nessa tela no futuro:** em
`module/[moduleId]/page.tsx:179`, `const locked = hasAccess && !released`. Com `hasAccess` **falso o
cadeado NUNCA roda** — todas as aulas viram links. ⇒ **zerar ou omitir `hasAccess` no payload faria
o cadeado de drip SUMIR para o aluno matriculado.** O campo continua sendo devolvido com o mesmo
valor de hoje; **quem barra é o status HTTP, nunca o campo.**

**⚠️ LIÇÃO NOVA, de ferramenta:** `git add` com um pathspec de arquivo **já removido por `git rm`**
**aborta o comando INTEIRO** — não é parcial. O commit saiu com **1 arquivo em vez de 4**, deixando
a página apontando para rota inexistente, e **só o `git status` pós-commit denunciou**. É a família
do *"N-1 é o sinal"*, terceira ocorrência, em forma nova. **Gate que passa a valer:**
`git diff --cached HEAD~1 --name-only | wc -l` **antes** de commitar — contra `HEAD~1`, não contra o
índice (a primeira régua que escrevi contou errado e me barrou sozinha).

**Regras conferidas:** §17 respondido ✅ · **zero migração** (conferido com controle positivo) ✅ ·
palco derrubado e **provado morto** antes de todo build ✅ · prova de alvo discriminante em toda
rodada ✅ · `tsc --noEmit` e `npm run build` verdes **antes** do push ✅ · `merge --no-ff` ✅ ·
faxina do staging provada (matrícula restaurada, elenco intacto) ✅ · gate humano ✅ · papelada no
mesmo fôlego ✅

---

## 2026-08-31 — CAMADA 4, ETAPA E4.4 (etapa 5) — OS FUROS PRÉ-EXISTENTES DO VÍNCULO: REGISTRADOS, ZERO FIX

**Estado antes:** main em `9b93a2f`

**O que foi feito:** a investigação read-only do **vínculo sem matrícula** perguntou *"se a
pessoa vir a vitrine sem matrícula, ela alcança conteúdo de curso pago?"*. **Alcança** — e o
achado que reordena a fila é que **os dois piores furos NÃO são criados pela mudança: já valem
hoje para qualquer conta autenticada da plataforma.** Esta rodada **só registra**: 6 itens
novos (**9.172 · 9.173 · 9.174 · 9.175 · 9.176 · 9.177**), o grupo **E3.42** no ROADMAP e a
**§11** do plano da E4.4 com a decisão do dono e as opções descartadas.
⛔ **NENHUM FIX — decisão explícita do dono.** Zero código, zero banco, zero produção.

**Arquivos tocados:** só documentação — `docs/PLANO-MESTRE.md` (os 6 itens) ·
`docs/ROADMAP-EXECUCAO.md` (grupo E3.42) · `docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md` (§11) ·
`docs/DIARIO-EXECUCAO.md`.

**Como foi provado:**
- 🔴 **O achado de maior gravidade, e ele é PRÉ-EXISTENTE (9.172):**
  `courses/by-slug/[slug]/route.ts` — **156 linhas lidas inteiras** — tem `getCurrentUser()` →
  401 em `:9-11` e **nenhuma outra checagem**. O `include` (`:16-34`) devolve módulos, aulas e
  `videoUrl`; o `enrollment` de `:44` só alimenta `hasAccess` (`:54`), que é **campo da
  resposta** (`:132`). ⭐ **É a rota IRMÃ daquela que o `ee032e5` fechou** — aquele commit
  tocou só o `/init`. A lição *"conferir a rota IRMÃ"*, de novo, agora com um irmão que
  **nunca teve** gate. E `api/search:31-42` entrega o `slug` sem escopo de workspace, então
  nem adivinhar é preciso (calibrado: `LIMIT 5` e mínimo 2 chars ⇒ **oráculo de enumeração,
  não dump**).
- ⭐ **O item que quase nasceu contradizendo um laudo anterior (9.173):** `PLANO-MESTRE:161-162`
  registrou em **04/07** que *"o GET de quiz vaza `isCorrect`" era FALSO*. Fui conferir antes
  de escrever: **continua falso** — o `select` das opções em `:23` é `{ id, text, sortOrder }`,
  sem `isCorrect`. O laudo antigo usou *"já é gated"* no sentido de **autenticado**; o item
  novo é sobre a ausência de **tenant e matrícula**, e sobre o **POST**, que aquela
  investigação não examinou — e o POST devolve **`correctOptionId`** (`:104`), grava tentativa
  (`:113-121`) e dispara `QUIZ_PASSED` (`:127-134`). **Não é contradição, é outra pergunta** —
  e o item diz isso por escrito, para o próximo leitor não achar que um dos dois está errado.
- **Medição SELECT-only em produção** (`SUPABASE_REF wyamxwmdgbvqrfcqfbyh` **impresso antes de
  cada conexão**, scripts fora do repo, `grep` de `INSERT|UPDATE|DELETE|DROP|ALTER` = **0**):
  **2.526** aulas, **2.526** com `videoUrl` (100%) · **15** quizzes · **5** lives (3 `PUBLIC`,
  2 `COURSE_ONLY`, **0** gravações) · cursos por workspace: mediana **1**, máx **8**, média
  **1,9**, em **35** workspaces · **1.336** credenciais sem matrícula = **1.177** pessoas em
  **15** workspaces, **679** sem matrícula em lugar nenhum, **5** com `resetToken`.
  ⭐ **A dimensão CORRIGIU a gravidade para baixo em dois pontos:** as lives são 5 e sem
  gravação, e a mediana de 1 curso por workspace significa que o 9.174 muitas vezes não tem
  curso extra a vazar. **O furo é estrutural; a exposição de hoje é modesta** — e isso está
  escrito nos itens, não só aqui.
- **Numeração com controles** (a lição do E3.40, que quase virou item-fantasma por notação de
  intervalo): cada número conferido por `grep -F` **literal e enumerado um a um** — 9.172, 9.173,
  9.174, 9.175, 9.176 e 9.177, **todos com 0 ocorrências** antes de escrever; **controle
  positivo** `9.144` → **8** e **controle negativo** `9.999` → **0**. Idem para o grupo:
  `E3.42` → 0 antes, **controle negativo** `E3.99` → 0.
- **Recap-pelo-repo antes de numerar:** `grep -F` de cada rota em `docs/` — `by-slug/[slug]/route.ts`
  → **0** (inédito), `lessons/[id]/quiz` → **2** (o laudo de 04/07, tratado acima),
  `module/[moduleId]` → **3** (tabelas de rota, não itens), com **controle positivo**
  `workspace-access.ts` → 4 e **negativo** `rota-que-nao-existe.ts` → 0.

**SHA do merge:** — **não houve merge: docs-only, commit direto na `main`**, como a casa faz.
O registro é o commit **`aa7aafd`**. **Rollback:** `git revert aa7aafd`.

**Mudou em produção para quem:** **ninguém.** Zero código, zero banco, zero deploy.

**Ficou aberto:** os **6** itens acima, todos `- [ ]`. ⛔ **A ordem é obrigatória e está no
§11.3 do plano:** **9.172**, **9.173** e **9.174** fecham **ANTES** do cadastro público —
*hoje esses furos exigem uma conta na plataforma; depois do cadastro público exigiriam apenas
um cadastro grátis.* A mudança não cria os furos; **derruba o preço de entrada** deles.
Segue sem medição humana: se `videoUrl` vazado vira vídeo assistível (depende do provedor) ·
se há WAF na frente de `forgot-password` · o que `/api/student/workspace/route.ts` devolve.

**⭐ A DECISÃO DE DESENHO QUE ESTA RODADA FIXOU:** o vínculo será uma **marca própria**. As
outras três opções caíram **por medição**, e o §11.1 guarda a prova de cada uma: credencial
daria pertencimento retroativo a **1.177 pessoas** e **exclui staff por construção**
(`webhook-helpers.ts:144`) · matrícula vazia é **impossível** (`courseId NOT NULL` + unique
composta, conferido no `information_schema` de produção) · `Collaborator` nulo **nem resolve o
403** (`workspace-access.ts:49-54`) e trocaria o regime de auth de **679** pessoas.
⚠️ **E a assimetria que o desenho terá de respeitar (§11.2):** dos **13** call-sites em **10**
arquivos, **9** perguntam *"posso entrar?"* e **4** perguntam *"esta pessoa é gente daqui?"*
sobre um terceiro. Uma 4ª via **dentro** do helper move as duas de uma vez — e nas 4 do
terceiro **concede poder ao recém-cadastrado** (elegibilidade a moderador de live, que tem
`DELETE` de mensagem). É *"feature inofensiva pode CRIAR o vetor"*, literal.

**Regras conferidas:** §17 respondido ✅ · read-only na investigação, docs-only no registro ✅ ·
prova de alvo impressa antes de **cada** conexão ao banco, SELECT-only ✅ · numeração enumerada
com controle positivo e negativo ✅ · recap-pelo-repo antes de criar item ✅ · laudo anterior
conferido antes de contradizê-lo ✅ · nenhum fix ✅ · papelada no mesmo fôlego ✅

---

## 2026-08-30 — CAMADA 4, ETAPA E4.4 (grupo E3.41) — 9.169 FECHADO: WIDGET v2, A ROTAÇÃO PELA RAIZ

**Estado antes:** main em `48be03e`

**⚠️ CORREÇÃO DE REGISTRO feita neste commit:** a entrada anterior (a sonda) estava datada
**31/08/26** — data que ainda não existe. O commit `48be03e` é de **2026-08-30 21:49 -0300**
(`git log`), logo a sonda foi encerrada em **30/08**. Datas ajustadas em 4 pontos: cabeçalho
e corpo daquela entrada, `PLANO-MESTRE` (bloco da sonda), `PLANO-E4.4` (§10) e `ROADMAP`
(linha da E4.4). Registrado aqui para a correção não parecer adulteração silenciosa.

**O que foi feito:** o 9.169 pedia **rotacionar** a `TURNSTILE_SECRET_KEY`, que havia
circulado fora do contrato de segredo. A rotação simples **não fechou o item, e medir
mostrou por quê**: no widget v1 o painel da Cloudflare **devolvia sempre o mesmo valor** a
cada rotação. Solução **pela raiz**: **widget v2** — *"Members Club - Cadastro v2"*, modo
**managed**, mesmos 3 hostnames — com par de chaves novo. O `.env.staging` passou a
carregar **sitekey v2 (24 chars)** e **secret v2 (35 chars)**, cada uma no seu slot,
**as duas provadas pelo discriminador** antes de entrar. Zero código, zero banco, zero
produção: a mudança inteira é **um arquivo gitignored** + esta papelada.

**Arquivos tocados:** `.env.staging` (fora do repo — 2 linhas de chave + bloco de
comentário reescrito). Na `main`, só documentação: `docs/PLANO-MESTRE.md` (9.169 fechado)
· `docs/ROADMAP-EXECUCAO.md` (E3.41) · `docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md` (§10.3 e
§10.7) · `docs/DIARIO-EXECUCAO.md`.

**Como foi provado:**
- ⭐ **A MEDIÇÃO QUE VIROU O ITEM DE CABEÇA PARA BAIXO:** três rodadas seguidas em que o
  dono rotacionou e o valor entregue pelo painel era **byte a byte o mesmo** (mesmo
  `sha256`, comparado por prefixo registrado). E o discriminador mostrava a **secret v1
  pré-rotação ainda ACEITA** pelo `siteverify` — se a Cloudflare guarda **um** *previous
  secret*, uma rotação real teria expulsado aquela na hora. ⇒ **a rotação não estava
  efetivando**, e a chave vazada era a que estava **EM VIGOR**. Nenhuma dessas três
  rodadas gravou nada: o **7º gate (ineditismo)** barrou as três.
- **O gate da FASE 1 no fecho — enumerado, porque placar não é prova** (todos passaram):
  (1) clipboard não-vazio · (2) secret com **35** chars · (3) sem espaço nem quebra de
  linha · (4) charset válido · (5) discriminador da secret = `invalid-input-response` ·
  (6) **controle com o resultado OPOSTO** presente (`invalid-input-secret` na sitekey) ·
  (7) **ineditismo** contra as **4** chaves já vistas na frente · (8) sitekey v2 com **24**
  chars **medidos** — o agente havia reportado *25*, e só a régua pegou · (9) sitekey v2 ≠
  sitekey v1.
- **Escrita atômica** (`mkstemp` + `fsync` + `chmod` + `os.replace`) com **rollback armado
  em memória** e verificação estrutural antes de considerar boa: cabeça e cauda do arquivo
  **byte-idênticas**, só as 2 linhas de chave e o bloco de comentário mudaram.
- **Prova relendo do DISCO** (não da variável): comprimentos **35 / 24** · discriminador
  com **os dois resultados opostos** · **as duas secrets do v1** (a pré-rotação e a
  queimada) **ausentes** do arquivo · **0** temporários
  deixados para trás.
- **Varredura por PADRÃO** `0x4AAAAAA[A-Za-z0-9_-]*` em `src/ .next/ docs/ scripts/
  next.config.mjs .env public/ prisma/ .env.staging`, **classificada por comprimento** —
  que é o que o gate manda fazer, porque o total cru não diz nada: **2 chaves no
  `.env.staging`** (sitekey 24 + secret 35, cada uma no seu slot) **+ 2 sitekeys v1 de 24
  chars em `docs/`** + as menções do **prefixo de 9 chars em prosa**. ⭐ **O zero que
  importa: 0 valores de 35 chars fora do `.env.staging`.** Também **0** ocorrências da
  secret queimada em qualquer alvo, e `git grep` **da secret** em `HEAD` → **0** (controle
  positivo do `git grep`: 15 arquivos).
  ⚠️ **DECLARAÇÃO, porque a próxima varredura vai achar isto e a linha-base não pode
  mentir:** as 2 sitekeys v1 em `docs/` **foram escritas por esta papelada, de propósito**
  (item 9.170 no PLANO-MESTRE e §10.3 do PLANO-E4.4), para identificar **qual widget
  excluir**. **Sitekey é pública por desenho** — vai no bundle do navegador —, então **não
  é vazamento**; mas é a primeira chave completa do Turnstile a entrar no histórico do git,
  e por isso fica declarado em vez de descoberto depois.
- **Clipboard limpo** ao final (`pbcopy < /dev/null`, `pbpaste` → **0** bytes). A secret
  v2 existe agora **só** no `.env.staging`.

**SHA do merge:** — **não houve merge: é docs-only, commit direto na `main`**, como a casa
faz (mesma decisão do encerramento da sonda). A papelada é o commit **`8358575`**.
**Rollback:** `git revert 8358575`.

**Mudou em produção para quem:** **ninguém.** Zero código, zero banco, zero deploy. A
`.env` de produção não tem linha `TURNSTILE` nenhuma (conferido: **0** ocorrências).

**Ficou aberto:**
- **9.170** 🟢 — **excluir o widget v1** no painel da Cloudflare quando nada mais o
  referenciar. Ele continua existindo, e **a secret dele está queimada**.
- **Verificação humana na Vercel** (não é lida daqui): `TURNSTILE_SECRET_KEY` deve estar
  **vazia**, e **não pode** existir um `NEXT_PUBLIC_TURNSTILE_SITE_KEY` com **35** chars.
- A sitekey de **produção** ainda é a do v1 no papel — quando o widget entrar, o par de
  produção tem de ser o do **v2** (ou um terceiro widget), nunca o v1.
- **9.171** 🟢 — a alínea que **não** fechou, agora com número próprio: com **fail-open** e
  a CSP **sem `report-uri`**, *"captcha ausente por configuração errada"* e *"captcha
  ausente porque a Cloudflare caiu"* são **indistinguíveis**. Antes vivia dentro do 9.169, e
  nenhuma varredura de `- [ ]` a encontrava.

**⚠️ O ARCO HONESTO — a chave circulou DUAS vezes, e a segunda foi minha:** (1) a secret do
v1 foi colada em conversa durante a sonda, o que criou o 9.169; (2) na verificação do
9.169 **eu imprimi** o valor de um slot `NEXT_PUBLIC_…` tratando o **nome do slot como
prova** de que o conteúdo era público — e ali havia uma secret. ⭐ **A lição, agora regra:
o nome do slot é uma alegação sobre para onde o valor VAI, não sobre o que ele É. O
discriminador roda ANTES de qualquer impressão, inclusive de valor tido como público.**
⭐ **Segunda lição, de método:** *medir o dado que chega, mesmo quando vem confirmado* —
pela **quarta** vez nesta frente um valor chegou "confirmado no painel" e estava errado.

**Gate humano:** a rotação é **100% manual no painel da Cloudflare** — o dono executou e
reportou a cada rodada. ⚠️ **E é exatamente aqui que o gate humano falhou como PROVA:** nas
três rodadas o retorno foi *"rotacionei, a chave nova está no clipboard"*, e a **medição
desmentiu as três** (mesmo `sha256`). O que fechou o item **não foi o relato — foi a
régua**. É o exemplo mais limpo desta frente de *"medir o dado que chega, mesmo quando vem
confirmado"*.

**Regras conferidas:** §17 respondido ✅ · escrita restrita a `.env.staging` (gitignored) ✅
· escrita atômica com rollback armado ✅ · controles positivos em toda varredura ✅ ·
clipboard limpo ✅ · papelada no mesmo fôlego ✅ ·
❌ **"nenhum valor de secret impresso" — REGRA VIOLADA NESTA FRENTE.** Um ✅ aqui seria
mentira: a secret do v1 **foi impressa** na verificação do 9.169 (ver o arco honesto acima),
e foi essa violação que obrigou o widget v2. Da correção em diante a regra foi cumprida —
mas o checklist registra o que **aconteceu**, não o que passou a valer depois.

---

## 2026-08-30 — CAMADA 4, ETAPA E4.4 (etapa 5) — SONDA DO TURNSTILE: FEITA, MEDIDA E REMOVIDA

**Estado antes:** main em `d97e902` (a sonda nunca esteve na main — viveu só na branch)

**O que foi feito:** o dono decidiu que a proteção anti-robô do cadastro público é **limite
por IP + Cloudflare Turnstile** (captcha **fail-open**, widget **managed**). Como *"quais
diretivas da CSP o Turnstile exige"* **não é decidível por leitura** — é a cicatriz do
**BUG E** (`5e78edd`), em que o SDK do Vimeo fazia XHR da página-mãe e o defeito era de
`connect-src`, não de `frame-src` — foi construída uma **sonda descartável**, medida no
navegador por gate humano, e **removida**. **O código saiu; o conhecimento ficou.**
⭐ **GATE HUMANO VERDE (30/08):** site key vinda da env · script carregou · widget
renderizou e **resolveu** · token de **773 chars** · servidor **HTTP 200** com
`success:true`, `hostname:"localhost"`, `error-codes:[]`, **`metadata.interactive:false`**,
**210ms** · **VIOLAÇÕES DE CSP = 0**.

**Arquivos tocados:** **nenhum de código na `main`.** Na branch `sonda/turnstile-csp`: os 3
arquivos da sonda criados e depois **apagados**, e o `next.config.mjs` alterado e depois
**revertido byte-idêntico**. Na `main`, só documentação:
`docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md` (§10 novo) · `docs/PLANO-MESTRE.md` (bloco de
conhecimento + item 9.169) · `docs/ROADMAP-EXECUCAO.md` (grupo E3.41 + linha da E4.4) ·
`docs/DIARIO-EXECUCAO.md`.

**Como foi provado:**
- ⭐ **A medição que a sonda existia para fazer:** a CSP **não tem `report-uri`**, então
  violação é 100% muda no servidor. A sonda contornou escutando o evento
  **`securitypolicyviolation` do `document`** e listando **na tela**. Resultado: **0
  violações** com o ciclo inteiro funcionando ⇒ **`script-src` + `frame-src` bastam,
  `connect-src` NÃO é necessário.** Segundo argumento independente: na rodada da chave
  errada o widget **recebeu um 400 da Cloudflare** — requisição que sai e é respondida
  **prova** que a CSP não a bloqueou.
- **Prova de alvo do palco** em toda rodada: build de staging com **REF nos chunks
  `produção 0 / staging 2`**, `curl -L` rendendo `Login · Staging Teste` (nome vindo do
  BANCO) e **404** num slug real de produção.
- **As 4 contagens no bundle servido** ao fechar a chave: site key nova **1** · antiga **0**
  · secret **0** · **controle positivo do grep 2** (sem ele, três zeros não provariam nada).
- **Prova determinística de que a env entrou no build**: o ramo morto do ternário
  (`"AUSENTE…"`) **não existe no artefato** — o minificador só o colapsa se a env existia.
- **Remoção provada:** `SONDA-TURNSTILE` → **0** no código · `turnstile` em `src/` → **0**
  (com controle positivo: `useEffect` → 336) · rotas fora dos manifests · `tsc --noEmit`
  **exit 0** · build de staging **verde** · **`git diff main..sonda` VAZIO**.
- **Segredo:** `git grep` da secret em `HEAD` → **0**; `grep` em `src/ .next/ docs/ scripts/
  .env` → **0**. Vive só em `.env.staging` (gitignored), no slot correto.

**SHA do merge:** — **não houve merge, e é o ponto**: a sonda saiu inteira, `git diff
main..sonda` é **vazio**, então não sobrou código para mesclar. Os docs entraram na `main`
por **commit direto**, como a casa faz com docs-only. A branch `sonda/turnstile-csp` fica
como **ARQUIVO** (`da9697e` = a sonda · `56bac2f` = chave corrigida · `5ea03e2` = remoção),
referenciada por SHA nos docs. **Rollback:** `git revert <sha do commit de docs>`.

**Mudou em produção para quem:** **ninguém.** Zero código na `main`, zero banco, zero
deploy de runtime. A `.env` de produção nunca foi tocada (mtime de 17/jul).

**⚠️ DUAS DECISÕES DECLARADAS NO ENCERRAMENTO:**
**(1) As 2 liberações de CSP SAÍRAM.** Motivo: **menor privilégio (DEV-BRABO §3)**. A CSP é
global (`source: "/(.*)"`), então manter `challenges.cloudflare.com` alargaria a plataforma
inteira por um host que **nada carrega** até o cadastro existir — permissão sem consumidor é
a família que a FASE 1 da auditoria gastou 14 itens removendo. As strings exatas e a prova
ficam no **§10.1** do plano da E4.4 e **voltam no mesmo commit que trouxer o widget**.
**(2) `NEXT_PUBLIC_TURNSTILE_SITE_KEY` FICOU** no `.env.staging` (gitignored, fora do repo).
Motivo: é chave **pública**, custa zero, e reobtê-la do painel é **exatamente a operação que
falhou duas vezes**. O comentário foi reescrito para não dizer mais "sonda" e para carregar
o discriminador.

**Ficou aberto:** **9.169** 🟠 (grupo **E3.41**) — rotacionar a Secret Key **e** o gate de
configuração que a troca exige.
🔴 **O ACHADO QUE MAIS IMPORTA, e não estava previsto:** site key e secret **se parecem**
(mesmo prefixo `0x4AAAAAA`, campos vizinhos no painel) e só o formato difere — **24 × 35
chars**. **Trocá-las publica a SECRET no bundle do navegador — e "quase funciona", porque a
secret valida no servidor.** Um gate que pergunte só *"a env existe?"* **NÃO pega**. O
discriminador que pega está no **§10.4**.

**⚠️ O HISTÓRICO HONESTO — a sonda custou 4 rodadas, e o erro é de INTERFACE:** (1) sonda
construída; (2) widget falhou com `400020` — a hipótese lia isso como "domínio", mas a doc
diz **"Invalid sitekey"** (domínio é `110200`), e a chave tinha **um "A" a mais**; (3) ao
voltar ao painel foi lida a **SECRET** por engano — **detectada pelo discriminador antes do
commit**, com expurgo do bundle local e **nada commitado**; (4) chave certa, **verificada
antes de entrar**, gate verde. ⭐ **Lição de método: medir o dado que chega, mesmo quando
vem confirmado** — nas rodadas 2 e 3 ele veio "confirmado no painel" e estava errado.
⭐ **Lição de produto: a sonda só ficou diagnosticável quando passou a mostrar NA TELA qual
chave estava em uso.**

**Regras conferidas:** §17 respondido ✅ · §22 (Regra de Parada) **acionada e respeitada na
rodada 3** ✅ · palco derrubado antes de todo build ✅ · prova de alvo em toda rodada ✅ ·
gate humano ✅ · `git add` explícito ✅ · numeração com controle positivo e negativo ✅ ·
papelada no mesmo fôlego ✅

---

## 2026-08-30 — CAMADA 4, ETAPA E4.4 (etapa 5, cadastro público) — INVESTIGAÇÃO READ-ONLY + REGISTRO DOS ACHADOS

**Estado antes:** main em `7228afc`

**O que foi feito:** duas rodadas no mesmo dia, e **nenhuma linha de código em nenhuma delas**.
**(1) A investigação** da etapa de MAIOR RISCO do projeto — a única que abre uma porta pública —
respondendo às 11 perguntas do comando sobre o molde do cadastro: como uma conta nasce hoje, as
variáveis do e-mail, o vínculo, corrida e falha parcial, rate-limit e abuso, o molde da tela
pública, workspace inválido e o telefone. **(2) O registro**: os achados viraram **25 itens
(9.144–9.168)** no `PLANO-MESTRE`, **6 grupos novos (E3.35–E3.40)** no ROADMAP, e uma seção nova
**§9 "REQUISITOS PROVADOS PARA O CADASTRO"** no plano da E4.4.
⛔ **NADA FOI CORRIGIDO — decisão explícita do dono.** Nenhum fix, nenhuma migração, nenhuma
escrita em banco. Tudo volta **depois que a feature do funil fechar**. O registro agora é o que
impede o item-fantasma (a lição que custou 4 dias no 9.42).
⭐ **O achado que reordena a fila é o 9.144 🔴**: o import de alunos por CSV entrega a
**`masterPassword` do workspace** ao aluno (`import/route.ts:255` → e-mail `:401` → coluna "Senha"
do CSV `:431`), contradizendo a rota irmã, que diz *"never leaves the server"*
(`students/route.ts:273-274`). **A exposição CRESCE a cada importação** — não é dívida estática, e
é esse o critério que o põe à frente.

**Arquivos tocados:** **NENHUM de código.** Só documentação: `docs/PLANO-MESTRE.md` ·
`docs/ROADMAP-EXECUCAO.md` · `docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md` · `docs/DIARIO-EXECUCAO.md`.

**Como foi provado:** a investigação, não um gate humano (não houve o que testar).
- **16 agentes** — 8 leitores (um por dimensão do comando) + **8 verificadores adversariais** que
  reabriram os arquivos citados para **REFUTAR**. 2,4M tokens, 820 tool calls, 0 erros. Os
  verificadores **corrigiram os leitores em 9 pontos** (o mais grave: a família
  `requireMemberAccess` da comunidade, um QUARTO caminho de vínculo que o leitor não viu).
- **12 conferências minhas** nos arquivos de maior risco, sem intermediário:
  `workspace-access.ts` · `webhook-helpers.ts` · `rate-limit.ts` · `workspace-auth.ts` ·
  `proxy.ts` · as 4 rotas de `api/w/[slug]` · `manifest/[slug]` · `claim` ·
  `producer/students/[id]/enrollments`.
- ⭐ **REFUTEI uma afirmação dos agentes, e está registrado no 9.146**: o verificador alegou que o
  `DELETE` de `producer/students/[id]/enrollments` apagava matrícula sem checar workspace —
  **`:106` chama `assertCanManageCourse(staff, courseId)`**, e o `courseId` é a dimensão correta.
  Não há furo. *(Prova por leitura, não por plausibilidade.)*
- **4 rodadas de medição SELECT-only em PRODUÇÃO**, com **prova de alvo DISCRIMINANTE impressa
  antes de cada uma** (`wyamxwmdgbvqrfcqfbyh` × o staging `wxynnsyartxcvglqwmdw` como controle):
  constraints reais por `pg_constraint`/`pg_indexes` (não o que o schema "parece dizer") ·
  duplicidade de e-mail · multi-workspace · personas por role · formatos de telefone ·
  identidades órfãs do `auth.users` · master password · estado de workspace e subscription.
  **Duas queries falharam no caminho** (`isExempt`→`exempt`; `text = uuid` sem cast) e foram
  corrigidas — **nenhuma escrita em nenhum momento**.
- ⭐ **A medição respondeu 6 incertezas que a leitura tinha deixado em aberto** — entre elas o
  teto do `listUsers` (4.000 contra **27.342** identidades, com **4 das 5 órfãs fora de qualquer
  janela**) e a inexistência de índice case-insensitive em `User.email`.
- **Numeração conferida por `grep -F` literal, com controle positivo E negativo**, antes de
  escrever (ver a seção do relatório).
- **Read-only provado**: `git status` limpo em `7228afc` no fim da investigação, **0 sujos**.

**SHA do merge:** — **não houve merge: a etapa não produziu código.** O registro entrou por commit
direto de documentação sobre `7228afc`, como as duas entradas anteriores da E4.4.
**Rollback:** `git revert <sha do commit de docs>` — reverte **só documentação**, nada de runtime.

**Mudou em produção para quem:** **ninguém.** Zero código, zero banco, zero deploy de runtime.

**Ficou aberto:** **25 itens novos, todos sem fix e por decisão do dono.**
🔴 **E3.35 — PRIORIDADE DE RETOMADA, marcada para "assim que a E4.4 fechar":** **9.144** (a
master password no CSV; **MEDIDO: 10 de 39 ws têm master configurada** ⇒ vivo) e **9.135** (a rota
pública que cria ADMIN — **adendo anexado, veredito SEGUE EM ABERTO**: medir a exposição exige
ESCRITA em produção e ordem própria do dono).
🟠 **14 itens** em E3.36 (e-mails que erram destinatário e template: 9.145·9.146·9.152) · E3.37
(superfícies públicas sem guarda: 9.147·9.148·9.155·9.156) · E3.38 (a falha invisível do fluxo de
compra: 9.149·9.150·9.153·9.157) · E3.39 (normalização e escopo do dual-auth:
9.151·9.154·9.158).
🟢 **10 itens** em E3.40 (9.159–9.168).
**E o que a etapa 5 ainda deve:** o **desenho** do cadastro, que só começa depois das **11
perguntas do §9.3 do PLANO-E4.4** — as que só a medição humana responde.
⭐ **VIGIA da E4.4 reconferida hoje: 0 cursos `isFree`, 0 matrículas `FREE_CLAIM`, 28.929
`UNKNOWN`.** Segue limpa.

**Regras conferidas:** §17 respondido ✅ · investigação read-only com PROIBIDO respeitado ✅ ·
`file:line` em toda afirmação ✅ · nenhuma proposta de fix dentro da investigação ✅ · prova de
alvo impressa antes de **cada** rodada de banco ✅ · numeração com controle positivo e negativo ✅
· papelada no mesmo fôlego ✅

---

## 2026-08-30 — CAMADA 4, ETAPA E4.4 (linha 4 da tabela) — Vitrine + cadeado: FECHADA SEM CÓDIGO

**Estado antes:** main em `2f0aabb`

**O que foi feito:** uma **investigação read-only** das 8 combinações de acesso (deslogado ×
logado-sem-matrícula × logado-com-matrícula × produtor/staff, para curso gratuito e pago) — e o
veredito da mesa foi **fechar a etapa sem fix**. Nenhuma linha de código, nenhuma migração, nenhum
toque em banco. **O que a etapa investigava já está correto**: a vitrine é fechada em **3 camadas
independentes** (proxy `:75-86` → checagem própria da página `w/[slug]/page.tsx:172-179` → 401 da
API `init:49`), e a cascata do checkout (`course-preview.tsx:199-234`) cobre **todos** os casos —
inclusive a célula que preocupava, os **20 de 66** cursos de produção **sem `checkoutUrl`**: `null`
e `""` são falsy no mesmo ternário, o `<a>` não é construído e o lugar cai em "Entre em contato".
⭐ **O que a investigação achou foram 3 BLOQUEIOS — e nenhum é da vitrine.** Todos são
pré-requisitos do **cadastro público** (linha 2), e migraram para lá como requisitos obrigatórios
de desenho (§8 do plano): **(a) o VÍNCULO** — `hasWorkspaceAccess` exige matrícula, colaboração ou
posse, e o recém-cadastrado não tem nenhuma; `by-slug/init:101-106` e `claim:68` devolvem **404**.
⚠️ **A trava está CORRETA** (`claim:65-66`: *"sem isto, qualquer usuário logado resgataria o
gratuito de qualquer produtor"*), então quem muda é o cadastro: **o vínculo tem de nascer nele**.
**(b) a PORTA** — `/course/[slug]` deslogado cai em `/producer/login` (`proxy.ts:84`), login de
produtor para um aluno, com o slug perdido; e o proxy **não consulta banco**, então não sabe qual
`/w/{slug}/login` seria o certo. **(c) a MENSAGEM** — o modal do resgate tem um só ramo genérico
(`course-preview.tsx:124-145`): um 401 apareceria como **"Não autenticado"**, sem caminho para o
login.

**Arquivos tocados:** **NENHUM de código.** Só documentação: `docs/PLANO-MESTRE.md` ·
`docs/ROADMAP-EXECUCAO.md` · `docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md` · `docs/DIARIO-EXECUCAO.md`.

**Como foi provado:** a investigação, não um gate humano (não houve o que testar).
- **Varredura de 11 agentes** (7 leitores + 4 verificadores adversariais) sobre as 8 perguntas do
  comando, com `file:line` obrigatório — e **as afirmações de maior risco reconferidas por mim**.
- ⭐ **Dois furos do proxy MEDIDOS EM PRODUÇÃO por discriminação** (item **9.139**):
  `/w/<slug>/lives/x` → **307**, `/w/<slug>/lives/x.json` → **200** (só o sufixo muda — o matcher
  `proxy.ts:126` isenta `.json`); e `Cookie: sb-fake-auth-token=1` → **200** onde sem cookie dá 307
  (`hasSessionCookie:30-43` conta o cookie, nunca o valida).
  ⚠️ **Gravidade calibrada pela própria medição**: baixei o corpo dos dois 200 — vem **branding e
  esqueleto, ZERO curso** (`Meus cursos`=0, `Outros cursos`=0, `course/`=0). As camadas 2 e 3
  seguram, e o nome do workspace já é público por desenho em `/w/<slug>/login`. **Não é vazamento
  de dado; é que o proxy não é parede.**
- **Duas correções minhas, registradas**: (1) afirmei que `isFree` "não chega" ao dashboard — a
  verificação me refutou e **confirmei no arquivo** que a query da loja não tem `select` e
  `withRating` faz `...c`, então o campo viaja; (2) minha simulação da cadeia de ternários do proxy
  **omitiu o retorno antecipado do `/api/`** (`:59-61`), o que invalidava uma linha do resultado.
- **Read-only provado**: `git status` no fim da investigação = `2f0aabb`, **0 sujos**.

**SHA do merge:** — (não houve merge; a etapa não produziu código)  ·  **Rollback:** não se aplica

**Mudou em produção para quem:** **ninguém.** Zero código, zero banco, zero deploy de runtime.

**Ficou aberto:** **9.139** 🟠 (os 2 furos do proxy — ⚠️ **leitura obrigatória antes do cadastro
público**) · **9.140** 🟢 (card do dashboard sem `isFree`; ⚠️ **é código morto** — a rota `/` nunca é
servida — e **contradiz o 9.42**, que trata o dashboard como superfície viva; a contradição fica
registrada, não resolvida) · **9.141** 🟢 (bloco morto após o `return` antecipado) · **9.142** 🟢
(cascata do checkout duplicada desktop/mobile, **pré-existente**) · **9.143** 🟢 (`checkoutUrl` sem
validação no servidor). Grupo **E3.34** no ROADMAP. Adendo de família no **9.118**: `/api/courses`
serve `max-age=60` e tem **3 consumidores reais**, todos telas do painel.

**Regras conferidas:** §17 respondido ✅ · investigação read-only com PROIBIDO respeitado ✅ ·
`file:line` em toda afirmação ✅ · nenhuma proposta de fix dentro da investigação ✅ · papelada ✅

---

## 2026-08-30 — CAMADA 4, ETAPA E4.4 (linha 3 da tabela + a etiqueta da linha 4) — Resgate de curso gratuito

**Estado antes:** main em `80c3bb2`

**O que foi feito:** três fatias numa entrega, todas sobre os campos que a etapa 1 já pusera em
produção — **zero migração**. (1) **O resgate**: `POST /api/courses/[id]/claim`, arquivo novo de
124 linhas, o **primeiro caminho de matrícula iniciado pelo ALUNO**; grava `origin: "FREE_CLAIM"`,
o primeiro escritor a carimbar a origem. (2) **A etiqueta**: curso gratuito sem matrícula deixa de
exibir "Bloqueado" e passa a "Gratuito" + "Resgatar acesso", no próprio `CourseCard`. (3) **O
cache**: o `no-store` no init da vitrine, que é o que faz o curso migrar de "Outros cursos" para
"Meus cursos" sem refresh forçado.
⭐ **A regra nova**: o resgate **NÃO reativa** matrícula cancelada — **409**. Os 5 caminhos
existentes reativam porque partem do produtor ou de uma compra; este parte do aluno, e um clique
não pode desfazer uma revogação por baixo. Já `ACTIVE` → **200 `alreadyEnrolled`** (idempotente).
E **não envia e-mail**: os moldes enviam porque entregam SENHA, e aqui a pessoa já está logada.
⚠️ **A ordem executada trocou as linhas 2 e 3 do plano** — o **cadastro público segue ABERTO**, e
por isso o resgate hoje **exige sessão**. Está escrito no plano e no ROADMAP para não virar
item-fantasma.

**Arquivos tocados:** `api/courses/[id]/claim/route.ts` (novo) · `components/course-preview.tsx` ·
`(course)/course/[slug]/page.tsx` · `components/course-card.tsx` · `w/[slug]/page.tsx` ·
`api/w/[slug]/init/route.ts` · `docs/PLANO-MESTRE.md` · `docs/ROADMAP-EXECUCAO.md`
— **8 arquivos, +268/−6**.

**Como foi provado:**
- **Gates humanos: 6/6 (resgate) · 4/4 (etiqueta) · 2/2 (cache)**, colados nos comandos.
- **Cache — causa MEDIDA, não deduzida** (3 hipóteses, 2 refutadas no palco): por `curl` (sem cache
  HTTP) o servidor já respondia certo no instante seguinte ao resgate, e a página refaz a busca ao
  voltar. Sobrou o header `private, max-age=30, stale-while-revalidate=60` — cache de **navegador**.
  Header servido depois do fix: **`cache-control: no-store`**. ⚠️ E `curl` não guarda cache, então
  essa prova mostra que o **servidor** está certo; **quem prova a cura é o header + o gate humano**.
- **Conferência de consumidores antes de mexer** (o que o 9.118 ensinou): a vitrine é a **única**
  consumidora da rota — os outros 2 hits do grep são strings de log do próprio arquivo.
- **Regressão**: vitrine 200 com 0 chunks faltando · init 200 · shape de quem já tem o curso
  inalterado (`isFree` entrou **só** no payload da loja).
- **Portão**: `tsc` 0 erros · `npm run build` exit 0 · a rota nova compilada (`ƒ /api/courses/[id]/claim`).
- **Produção pós-deploy**: vitrine e página de curso **200** na página FINAL (título do workspace,
  não o 307), controle negativo **404**; `POST .../claim` sem sessão → **401** (existe, e barra).
- **Staging limpo**: matrícula de prova removida, **0 `FREE_CLAIM`**.

**SHA do merge:** `847a63a`  ·  **Rollback:** `git revert -m 1 847a63a`

**Mudou em produção para quem:** **hoje, para ninguém — e isso é medido, não suposto**: há **0
cursos `isFree=true`** em produção, então nenhum aluno vê etiqueta nova nem botão de resgate. A
mudança só acorda quando o dono marcar um curso como "Gratuito". O que mudou **já** é invisível ao
usuário: a vitrine parou de ser cacheada por 30s no navegador (fica mais fresca, uma requisição a
mais por visita).

**Ficou aberto:** nenhum item novo. Seguem: **fiar os 5 escritores de `Enrollment` para gravar
`origin`** (a fatia seguinte, hoje todos gravam `UNKNOWN`) · **linha 2 do plano — cadastro
público** · linha 4 encolhida (visitante deslogado + cadeado do pago) · linhas 5 a 8.
⭐ **VIGIA REGISTRADA**: `FREE_CLAIM` em produção **sem** um curso `isFree=true` por trás =
caminho de escrita carimbando a origem errada. Hoje: **0 e 0**.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ (6/6, 4/4, 2/2) ·
papelada ✅ · runbook: **sem migração pendente, conferido por `prisma migrate status` antes do
push** ✅ · palco derrubado antes de qualquer build ✅

---

## 2026-08-28 — CAMADA 4, ETAPA E4.4 (etapa 1 de 8) — Chave gratuito/pago e origem da matrícula

**Estado antes:** main em `c526879`

**O que foi feito:** a fundação do mini curso gratuito. Dois campos (`Course.isFree` e
`Enrollment.origin` + enum `EnrollmentOrigin`), o Toggle "Gratuito" na tela do produtor e o aviso
do risco R4. **Sem efeito para o aluno** — nenhum escritor grava a origem ainda e nenhum gate
consulta `isFree`.

**Arquivos tocados:** 9 arquivos, **+148/−0**. Nada no caminho do aluno.

**Como foi provado:**
- **Gate humano 5/5 (28/08)**, incluindo a regressão da visão do aluno.
- **Por diff**: `app/w/`, `app/(course)/`, `lib/auth.ts`, `lib/lesson-access.ts`,
  `lib/community-read-access.ts` e `api/w/` com **zero ocorrências**.
- **Por API em staging**: `isFree` persistiu nos dois sentidos (4 idas e voltas); o `_count` traz
  a contagem certa (5 no `curso-teste`, 0 no `curso-corrida-923`); o shape do aluno é o mesmo —
  as listas `enrolled` e `store` **não trazem `isFree`**.
- **Em produção, depois da migração**: `isFree=true` em **0** cursos · origem ≠ `UNKNOWN` em
  **0** matrículas.

**SHA do merge:** `35d440d`  ·  **Rollback:** `git revert -m 1 35d440d`. ⚠️ A migração é aditiva;
derrubar as colunas exigiria o revert do código **antes** do DROP, porque o PUT/GET já as citam.

**Mudou em produção para quem:** ninguém ainda **sente** a mudança. O produtor **vê** o toggle
novo na tela de edição do curso; o aluno não vê nada. **66 cursos** e **28.829 matrículas**
receberam os defaults.

**⭐ A ORDEM DO RUNBOOK FOI CUMPRIDA DESTA VEZ.** Depois do incidente de 27/08 (merge empurrado
antes da migração, o que quebrou a comunidade em produção pela janela entre os dois comandos),
esta etapa fez: merge **local** → portão verde → **`migrate deploy` em produção** → **só então
`git push`**. Quando a Vercel deployou, a coluna já existia. **Zero janela de quebra.**

**⭐ TRÊS DECISÕES QUE VALEM MAIS QUE O CÓDIGO:**
**(1)** Não reusei campo existente, e a decisão foi **medida**: `checkoutUrl`/`price` vazios
liberariam de graça **20 a 32 cursos pagos reais** (33% e 53% do acervo estão assim por outros
motivos).
**(2)** O default do legado é **`UNKNOWN`**, não `PURCHASE`: as 28.829 matrículas não são todas
compra, e **carimbar `PURCHASE` seria inventar um passado**.
**(3)** Leitura e escrita entraram **juntas** — sem `isFree` no GET, o `CourseForm` (que devolve o
payload inteiro no PUT) faria o **primeiro "Salvar" tornar PAGO um curso gratuito**.

**⚠️ O QUE VIGIAR:** **nenhum curso de produção deve virar `isFree=true` sem o produtor mandar.**
A consulta de vigia é uma linha: `SELECT count(*) FROM "Course" WHERE "isFree" = true` — hoje
**0**. Qualquer número diferente de zero sem uma ação do produtor por trás é sinal de que algum
caminho de escrita está mandando o campo sem querer (o risco que a decisão (3) fechou).

**Ficou aberto:** **9.135** 🔴 (rota pública que cria ADMIN — **veredito em aberto**, precisa de
medição) · **9.136** 🟠 (produtor à mão reseta senha) — grupo **E3.32**. E as **7 etapas
restantes** da E4.4.

**Regras conferidas:** §17 respondido ✅ · migração antes do push ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-28 — CAMADA 4, ETAPA E4.2 — Ativação em PRODUÇÃO dos anexos

**Estado antes:** main em `cfa1128` · produção **sem** a tabela, **com** o código deployado

**O que foi feito:** `npx prisma migrate deploy` em produção (aditivo: cria `PostAttachment` e
o enum `AttachmentStatus`, não altera nada existente) e criação do bucket privado
`community-attachments` (50MB). O recurso passou a existir de ponta a ponta para os produtores.

**Arquivos tocados:** nenhum de código. Só banco e Storage de produção, mais os docs.

**Como foi provado:**
- **Prova de alvo impressa** (`wyamxwmdgbvqrfcqfbyh`) antes de **cada** escrita.
- `migrate status` antes: **exatamente uma** migração pendente, a nossa — nenhuma outra.
- Verificação pelo `information_schema`/`pg_catalog`, **não pela saída do comando**: 9 colunas,
  enum `PENDING, CONFIRMED`, 4 índices, 2 FKs `ON DELETE CASCADE`.
- **Nada existente alterado**: **60 → 61** tabelas; `Post` 9 → 9 colunas, `Comment` 7 → 7.
- Bucket: criado privado, `52428800`, **verificado por releitura**; os 4 buckets antigos
  comparados **um a um** com o estado anterior → **todos intactos**.
- Rotas em produção: as 4 novas + o feed respondem **401** (rota existe, gate age), com
  **controle** de caminho inexistente devolvendo **404**.
- `PostAttachment` em produção: **0** — nenhum dado de teste foi criado lá.

**SHA do merge:** `f13a8a6` (código) · esta entrada documenta a ATIVAÇÃO, que não tem SHA de
código  ·  **Rollback:** a migração é aditiva; reverter seria `DROP TABLE "PostAttachment"` +
`DROP TYPE "AttachmentStatus"` — mas ⚠️ **o código em produção já consulta a tabela**, então
derrubá-la recria a quebra. Rollback real = `git revert -m 1 f13a8a6` **antes** do DROP.

**Mudou em produção para quem:** todos os workspaces com comunidade ativa — **12 de 39**, 20% dos
cursos. O aluno passa a ver o botão de anexo; o produtor, a barra de consumo.

**🔴 A MIGRAÇÃO CUROU UMA QUEBRA ATIVA QUE EU MESMO CRIEI.** O merge foi empurrado **antes** da
migração, e a Vercel faz deploy no push. Resultado: o código foi para produção com o GET do feed
consultando `attachments` numa tabela que não existia. Medido antes de aplicar: `SELECT` em
`PostAttachment` → `42P01 relation "PostAttachment" does not exist`, com as rotas novas já
respondendo 401 (deployadas) e a rota de controle dando 404. **Todo aluno autenticado que abrisse
a comunidade batia nisso.** ⚠️ **O runbook da casa manda o inverso — migração ANTES do push** —, e
a regra existe exatamente para isto. A ordem se inverteu porque merge e migração vieram em
**comandos separados**, e a janela entre os dois virou indisponibilidade real. **Lição: feature
que toca schema tem de ter o `migrate deploy` no MESMO comando do merge, e antes do push.**

**⚠️ NÃO VERIFICADO — `CRON_SECRET` na Vercel.** O `.env` local não o tem (é variável de
ambiente da Vercel, não local) e **não há CLI da Vercel instalado** aqui para listar os nomes.
Minha tentativa de evidência indireta **falhou e vale registrar**: argumentei que o cron de
billing rodando provaria o segredo, mas **0 de 119 subscriptions têm `currentPeriodEnd`** — o que
bate com o item já aberto de que aquele cron pode nunca ter produzido efeito. ⇒ **A rota é
fail-closed**: sem o segredo ela responde 401 e a limpeza simplesmente **não roda** (nada quebra,
o lixo só acumula). Chamadas externas a `/api/cron/*` levam **403 do Cloudflare** — provado com
controle no `/api/cron/pending`, que se comporta igual. **Confirmar no painel da Vercel.**

**O que vigiar nos primeiros dias:** (1) os **primeiros uploads reais** — se `authorize` e
`confirm` casam, e se algum `confirm` recusa por divergência; (2) o **cron das 04:00 UTC** — se
roda e o que ele relata (o `dryRun=1` mostra sem apagar); (3) o **consumo dos workspaces**, para
saber se 2GB é folgado ou apertado no uso real; (4) **linhas PENDING acumulando** — sinal de
upload que começa e não termina.

**Ficou aberto:** 9.131 · 9.132 · 9.133 · 9.134 (grupo E3.31) · e a confirmação do `CRON_SECRET`.

**Regras conferidas:** §17 respondido ✅ · prova de alvo em toda escrita ✅ · gate humano ✅ ·
papelada ✅

---

## 2026-08-28 — CAMADA 4, ETAPA E4.2 — Anexos na comunidade (5 etapas)

**Estado antes:** main em `145882d`

**O que foi feito:** a demanda de cliente #3. O aluno passa a anexar PDF e documentos
a um post da comunidade; o produtor vê quanto o workspace consumiu. Entregue em **5 etapas**,
cada uma com gate próprio: fundação (schema + migração + constantes + bucket privado) → upload
(`authorize` + `confirm`) → adoção pelo post + download protegido → limpeza de órfãos + consumo
→ a tela. O arquivo vai **direto do browser para o Storage** porque a função da Vercel corta o
corpo em ~4,5MB e o teto pedido é 50MB.

**Arquivos tocados:** 26 arquivos, **+1843/−136** — 12 novos (5 libs, 3 componentes, 4 rotas),
o resto alterações pontuais. Nada fora do escopo das 5 etapas (conferido arquivo a arquivo).

**Como foi provado:**
- **Gate humano 3/3 (27/08)** no re-gate, depois de **7/7** nas etapas anteriores.
- **Provas por API em staging**, cada etapa com as suas: a mentira do cliente (declarou 69 bytes
  de PDF, enviou 5004 começando com `MZ`) foi **recusada, o objeto apagado e a linha removida**,
  com **controle positivo** (o objeto do caminho feliz continuou lá) · anexo de outro usuário,
  anexo em dois posts e 6 anexos → recusados · download: 401 sem sessão, 404 sem acesso, 404 para
  anexo PENDING, e **moderação** com 3 personas sobre o mesmo anexo (404/302/302) mais o
  **controle positivo** de aprovar pela rota real e ver o 404 virar 302 · a rotina de limpeza
  com **intruso plantado** que sobreviveu.
- **Comparação automática POST × GET** do mesmo post, com e sem anexo: **zero diferenças**.

**SHA do merge:** `f13a8a6`  ·  **Rollback:** `git revert -m 1 f13a8a6`

**Mudou em produção para quem:** ⚠️ **NINGUÉM AINDA.** O código está em `main`, mas a tabela
`PostAttachment`, o enum `AttachmentStatus` e o bucket `community-attachments` existem **só no
STAGING**. **A migração de produção é comando separado** — até lá, o botão de anexo não tem
onde gravar.

**Ficou aberto:** **9.131** (shape do PUT sem `attachments`) · **9.132** (mensagem crua do Zod
no limite de 5) · **9.133** (upload sem barra de progresso, e o teto aqui é 50MB) · **9.134** (o
POST de post ainda com a cópia do gate de leitura) — grupo **E3.31**, todos 🟢 e registrados
**sem fix**.

**⭐ O QUE FOI ASSUMIDO DE OLHOS ABERTOS:** indo direto ao Storage, o servidor **nunca vê os
bytes**, e o SDK não deixa ler só o cabeçalho do arquivo. A allow-list filtra **declaração**. As
três mitigações estão escritas no código, não só aqui: bucket privado · confirmação pós-upload
comparando tamanho e tipo **reais** via `info()` · download só por rota nossa, signed URL de
900s e `Content-Disposition: attachment` para o navegador não renderizar.

**⚠️ EU ERREI DUAS VEZES NO MESMO SINTOMA, e a lição vale mais que o fix.** O anexo não aparecia
no post recém-publicado. Acrescentei `attachments` ao `include` do POST e **afirmei no commit**
que a resposta o devolvia — sem conferir o `NextResponse.json` **110 linhas abaixo**, que monta o
objeto **à mão** e não incluía o campo. No diagnóstico seguinte conferi o **cliente** (inocente) e
concluí "servidor", mas não olhei o construtor **dentro** do servidor. Só na terceira rodada
apareceu. **Lição: `include` alimenta a variável; quem decide o que SAI é o construtor da
resposta — conferir os dois.** E a varredura que fiz no fim mostrou que aquele era o **único**
construtor manual do módulo: se eu a tivesse feito antes, teria fechado em minutos.

**⚠️ Corolário:** campo **AUSENTE ≠ campo VAZIO**. A resposta não vinha com `[]`, vinha **sem a
chave** — e no cliente os dois viram o mesmo valor só *depois* de o dado já ter sido perdido.

**🔴 REGRA DE PALCO NOVA, e essa quase custou caro:** com o palco de pé, **nunca** rodar
`npm run build`. Ele usa o `.env` de **produção**, troca o `.next` **sob o servidor** (foi o
`ChunkLoadError` que travou o gate) **e carimba a URL de produção no bundle do cliente** — medido:
**2 chunks apontando para produção, 0 para staging**. Como o seletor sobe o arquivo **direto**
para `NEXT_PUBLIC_SUPABASE_URL`, **se o gate tivesse conseguido anexar naquele estado, o arquivo
teria ido para o Supabase de PRODUÇÃO.** O `ChunkLoadError` impediu por acidente. **Ordem
correta**: derrubar → portão → commit → **build de staging por último** → servidor depois. E
conferir o REF nos chunks toda vez.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-27 — CAMADA 3, ETAPA E3.29 — A tela cheia que cortava o vídeo (9.129)

**Estado antes:** main em `21574e6`

**O que foi feito:** o botão de tela cheia nosso promove o **container**, mas quem dimensiona o
vídeo é a caixa `aspect-video w-full` um nível abaixo — ela **deriva a altura da LARGURA** e ignora
a altura da tela. Em monitor mais largo que 16:9 a altura calculada estourava e o `overflow-hidden`
cortava, levando junto a **barra de controles custom**. O fix acrescenta 2 classes estáveis e uma
regra que **só existe dentro do `:fullscreen`**: o container centraliza e a caixa ganha teto
`max-width: calc(100vh * 16/9)`. Fora da tela cheia **a regra não existe**.

**Arquivos tocados:** `components/video-player.tsx` (+2 classes, nada removido) ·
`app/globals.css` (bloco novo) · `PLANO-MESTRE.md` · `ROADMAP-EXECUCAO.md`

**Como foi provado:**
- ⭐ **PROVA POR DISCRIMINAÇÃO, não reobservação**: a **mesma** aula, o **mesmo** botão, em dois
  monitores de lados **opostos** de 16:9, com sintomas **opostos** —
  **LG ultrawide 3440×1440 (2,39)**: `3440×9/16 = 1935px` numa tela de `1440px` ⇒ cortava **495px
  (~26%)** e os controles sumiam junto; **MacBook 3456×2234 (1,55)**: `1944px` em `2234px` ⇒ **não
  cortava**. A inversão prevista **é** a prova da mecânica.
- **Gate humano 5/5 (27/08)**: ultrawide inteiro e centralizado **com os controles de volta** ✅ ·
  MacBook centralizado ✅ · **modo normal idêntico nos dois monitores** ✅ · chrome nativo
  inalterado ✅.
- **Artefato**: `max-width:177.778vh` e os 2 blocos (`:fullscreen` + `-webkit-`) no CSS **servido**,
  com marcador positivo (`.mc-tour-popover`, 17) **no mesmo arquivo** — zero não-tautológico.

**SHA do merge:** `b9bf7c6`  ·  **Rollback:** `git revert -m 1 b9bf7c6`

**Mudou em produção para quem:** as **1.958 aulas** que usam o botão nosso (845 YouTube com o flag
· 998 Panda · 115 Vimeo) — **só em tela cheia**. Modo normal: **zero efeito**, a regra não existe
fora do `:fullscreen` e nenhuma classe original foi removida. As 261 aulas de chrome nativo não
passam por este botão.

**Ficou aberto:** nada novo. **Risco residual declarado**: a prova visual cobriu **YouTube** —
Vimeo **não foi semeado por decisão de conduta** (a demo oficial da Vimeo dá **404**, verificado por
sonda oEmbed, e o único ID real do repo é **conteúdo de produtor**, que não vira dado de teste).
Mitigante: a regra atua na caixa **compartilhada pelos 3 provedores**, e nenhum ramo de provedor a
toca.

**⚠️ AUTOCRÍTICA — eu quase embarquei uma regra que não sabia provar.** A 1ª versão do CSS era
`height:100%; width:auto; max-width:100%`, e ela depende de o navegador **recalcular a outra
dimensão** quando o teto morde — comportamento de spec que eu **não conseguia afirmar com certeza**.
Troquei **antes de compilar** por uma regra que **reusa o mecanismo já provado em 100% das aulas**:
o `aspect-video` segue calculando a altura, e a regra só **limita a largura**. **Lição: quando o
desenho depende de um comportamento que eu não consigo provar, o caminho é reusar o mecanismo que
já está provado — não testar o incerto em produção.**

**⭐ LIÇÃO DE MÉTODO — PROVA POR DISCRIMINAÇÃO.** Quando existirem **dois ambientes em que a
hipótese prevê comportamentos OPOSTOS**, o gate usa **os dois**. Rodar só onde o defeito aparece é
reobservar o sintoma; ver a **inversão prevista** é provar a causa. O dado que virou a chave
(`system_profiler SPDisplaysDataType`) era trivial e estava disponível desde o início — o laudo
tinha registrado a lacuna honestamente ("falta a proporção do monitor") e foi ela que fechou o caso.

**ⓘ NOTA DE FERRAMENTA:** os CSS compilados ficam em **`.next/static/chunks/*.css`**, não em
`.next/static/css/`. Grep no caminho errado devolve "NENHUM" e **parece fix ausente** — mesma
armadilha de diretório do 9.84. `find .next -name "*.css"` antes de concluir.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-27 — CAMADA 3, ETAPA E3.26 — A legenda que ligava sozinha (9.126)

**Estado antes:** main em `84de33c`

**O que foi feito:** nas aulas com `hideYoutubeChrome=true` a legenda do YouTube aparecia sozinha —
e ali **não há botão de CC**, então o aluno não tinha como desligar. A causa **não era nossa**: o
estado de legenda do YouTube é **compartilhado entre embeds** na sessão do navegador. O fix desliga
de forma **imperativa** — `unloadModule("captions")` e `unloadModule("cc")` no `onReady` **e a cada
transição para PLAYING** — só no caminho do chrome nosso, protegido por `typeof` + `try/catch` por
módulo, porque `unloadModule` é **API não documentada** e não pode derrubar a aula.

**Arquivos tocados:** `components/video-player.tsx` — **só ele** (+72/−2) · `PLANO-MESTRE.md` ·
`ROADMAP-EXECUCAO.md` · `DEV-BRABO.md`

**Como foi provado:**
- **Palco pareado** (o mesmo do 9.124): 2 aulas, **mesmo vídeo**, diferindo **só no flag**.
- **Roteiro que não passa por vacuidade**: a legenda foi **PLANTADA** na aula de chrome nativo
  antes do teste — sem plantar, ela não apareceria de qualquer jeito e o teste passaria sem
  exercitar a condição.
- **Gate humano 4/4 (26/08)**: plantada no nativo ✅ · **sumiu** no nosso ✅ · **segue sumida ao
  sair da tela cheia sem pausar** ✅ · **e pausando/despausando** ✅. Engrenagem do nativo intacta.
- **Artefato**: `unloadModule` presente e `SONDA-9126` = **0** no chunk **servido**, com marcador
  positivo de controle no mesmo arquivo (zero não-tautológico).

**SHA do merge:** `f03b392`  ·  **Rollback:** `git revert -m 1 f03b392`

**Mudou em produção para quem:** as **845 aulas** YouTube com `hideYoutubeChrome=true` — a legenda
não aparece mais sozinha. As **261** de chrome nativo, **998** Panda e **115** Vimeo: comportamento
inalterado (o portão é a primeira linha do helper).

**Ficou aberto:** **9.129** 🟠 / **E3.29** — tela cheia do chrome próprio **dá zoom e corta o
vídeo** (`toggleFullscreen` põe o **container** em fullscreen, não o player; **1.958 aulas**).
Pré-existente, **não é regressão**; registrado **sem fix** nesta rodada.

**⚠️ MEU DESENHO REPROVOU NO GATE — e o gate estava certo.** A primeira versão desligava a legenda
**uma vez só**, com flag. Passou em tudo, **menos** ao sair da tela cheia: o YouTube **reinstala** a
legenda, e a trava já gasta não deixava ninguém para desligar de novo. **Lição permanente: trava de
"uma vez só" pressupõe que o estado só é instalado uma vez — quando quem instala é um terceiro que
pode reinstalar, a trava deixa de ser economia e vira o defeito.** Correção: desligar a cada
PLAYING; repetir é seguro porque a proteção absorve qualquer desfecho.

**⭐ QUALIDADE DE VÍDEO: encerrada como IMPOSSÍVEL, com medida — não reabrir.** Era o outro pedido
de cliente da frente de vídeo. Uma sonda temporária no **nosso** player mediu: os 3 métodos
existem, mas `getAvailableQualityLevels()` devolve `[]` e `getPlaybackQuality()` fica `"unknown"`
**antes e depois** de `setPlaybackQuality("hd1080")` — bate com a documentação oficial (funções
viraram no-op, `suggestedQuality` ignorado). **Não dá para forçar qualidade por API em plataforma
nenhuma**; o único caminho é a **engrenagem nativa** (flag desligado, 9.124). A instrumentação foi
**removida antes do merge**.

**⚠️ MÉTODO — uma prova minha era VAZIA e eu mesmo a peguei.** Eu vinha "provando" o alvo do palco
com `curl` em `/w/staging-teste` (200/307) × `/w/orion-academy` (404). Essa rota **redireciona para
`/login` antes de consultar o banco**: os dois davam **307**, e a sonda nunca olhou dado nenhum.
Receita correta, agora lei em `DEV-BRABO §(d)`: **`curl -L` até a página final** — staging tem de
renderizar **`Login · Staging Teste`** (nome vindo do banco) e um slug só de produção tem de dar
**404**.

**⚠️ Duas correções de afirmação minha:** (i) o `YouTubeCustomControls` **não** tem tela cheia
própria (`grep ullscreen`: zero) — o botão do overlay é o **único** caminho, o que **ampliou o
alcance do 9.129**; (ii) um comentário meu dizia que o caminho nativo "não passa" pelo helper —
**passa** e volta no portão; corrigido no commit do fix.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-27 — CAMADA 3, ETAPA E3.24 — O overlay que tapava a engrenagem (9.124)

**Estado antes:** main em `a914c33`

**O que foi feito:** o overlay de velocidade + tela cheia (`video-player.tsx:299`) **não tinha gate
nenhum** — renderizava em 100% dos vídeos, nos 3 provedores. Neste embed o YouTube agrupa **volume,
CC e ENGRENAGEM no topo direito**, exatamente onde o overlay se posiciona: os dois conjuntos
disputavam o hover e **o menu do "1x" cobria a engrenagem** — o único caminho do aluno para
**qualidade e legenda**. Agora ele não renderiza quando `youtube && !hideYoutubeChrome`, e o
`fs` volta a `1` nesse caso.

**Arquivos tocados:** `components/video-player.tsx` — **só ele** (+22/−2)

**Como foi provado:**
- **Palco pareado**: 2 aulas com **o mesmo vídeo do print**, diferindo **apenas no flag** — o
  controle experimental que isola a variável.
- **Gate humano 6/6 (26/08)**: botões sumiram · engrenagem livre com **Qualidade 1440p /
  Velocidade / Legendas** · **fullscreen nativo de volta** · sem flicker · regressão do chrome
  nosso idêntica · fullscreen nosso ok.

**SHA do merge:** `caf66fe`  ·  **Rollback:** `git revert -m 1 caf66fe`

**Mudou em produção para quem:** as **261 aulas** YouTube com `hideYoutubeChrome=false` — o aluno
recupera acesso a **qualidade e legenda**. **845** (flag ligado), **998** Panda e **115** Vimeo:
byte-a-byte iguais.

**Ficou aberto:** **9.125** 🟠 (velocidade inoperante no Panda) · **9.126** 🟠 (Bug B, legenda
sozinha) · **9.127** 🟢 (`buildEmbedUrl` morto) · **9.128** 🟠 (provedor não suportado não avisa) —
grupos **E3.25** a **E3.28**.

**⚠️ EU DEDUZI ERRADO, E SÓ O OLHO HUMANO CORRIGIU.** Meu laudo afirmava que a engrenagem do
YouTube fica na **barra inferior** e que portanto **não havia colisão geométrica** — cheguei a
registrar "cobre o cabeçalho, não a engrenagem". A medição no palco mostrou o oposto: **neste embed
o agrupamento é no topo direito**. Se eu tivesse desenhado o fix pela dedução, ele teria mirado o
lugar errado. **Lição: geometria de player de terceiro não se deduz do nosso CSS** — o chrome dele
vive dentro do iframe e só se conhece observando.

**⚠️ E o laudo inicial estava incompleto:** eu li o `video-player.tsx` **até a metade** e afirmei
que a única camada nossa era o `YouTubeCustomControls` (gateado). O overlay `:299` — **sem gate** —
só apareceu na segunda passada, e era ele o dono dos botões do print.

**⭐ Os dois pontos do fix são indivisíveis:** era `fs: 0` **sempre**. Esconder o overlay sem
devolver `fs: 1` deixaria as 261 aulas **sem nenhum caminho para tela cheia** — trocaria um defeito
por outro. E a condição é **estreita de propósito** (`youtube && !hideYoutubeChrome`, não "esconder
quando há chrome nativo"): em **Panda este overlay é o único controle de velocidade** que existe —
ainda que, como o 9.125 registra, ele **não funcione** lá.

**Nota de palco:** o módulo **"Palco 9.player"** (curso-teste) fica no staging com **2 aulas
pareadas** — mesmo vídeo, só o flag difere. É palco reutilizável de player: qualquer mexida no
`video-player` se compara nele em segundos.

**Regras conferidas:** §17 ✅ · medição humana antes do desenho ✅ · escopo de 1 arquivo ✅ ·
preservação verificada no diff (6 pontos intocados) ✅ · gate humano 6/6 ✅ · papelada ✅

---

## 2026-08-26 — CAMADA 3, ETAPA E3.20 — A rota órfã removida (9.117)

**Estado antes:** main em `9e3444d`

**O que foi feito:** `/producer/courses/[id]/menu` renderizava e funcionava, mas **nenhum link do
projeto apontava para ela** — só se chegava digitando a URL. **Decisão do dono: REMOVER.** Saiu o
arquivo (343 linhas) e o diretório; ficaram os 2 comentários que a citavam, reescritos.

**Arquivos tocados:** `producer/courses/[id]/menu/page.tsx` (**removido**) ·
`components/course-menu-manager.tsx` · `hooks/use-course-menu.ts` (comentários) — **+14/−357**

**Como foi provado (ANTES de remover):**
- ⭐ **Paridade funcional total**, recurso a recurso: arrastar · criar · icon · label · url ·
  enabled · excluir existem **idênticos** na tela viva. O **único** exclusivo era **moldura**
  (Voltar, título, `/slug`, Pré-visualizar) — e **o layout do editor já entrega os quatro**
  (`layout.tsx:95/101/113/127`). Era daí que vinha o **layout duplicado** que o gate do 9.123 viu.
- **Zero órfãos deixados**: todos os imports têm outros consumidores; **hook e as 5 rotas de API do
  menu seguem vivos** servindo a tela viva.
- **Ninguém apontava** (grep amplo) · **nada externo expunha** (sem sitemap/robots) · **nenhum item
  aberto dependia** do arquivo.
- **Gate humano 2/2 (25/08)**: tela viva íntegra (renomear · ícone · enabled · arrastar · criar ·
  excluir, persistindo após F5) · **URL órfã → 404 limpo**. Manifesto do build: a rota de página
  **ausente**; as 3 rotas de **API** do menu presentes, por desenho.

**SHA do merge:** `a248c79`  ·  **Rollback:** `git revert -m 1 a248c79`

**Mudou em produção para quem:** **ninguém que use a navegação** — a tela não tinha entrada. Só
quem tivesse a URL salva perde o atalho, e chega ao mesmo editor por Personalizar Curso → seção 5.

**Ficou aberto:** nada novo.

**⚠️ LIMITE DECLARADO, não escondido:** se **alguém acessava a URL na mão** é **não verificável** —
não há log de navegação e o `AuditLog` cobre só **escrita** (19 rotas, nenhuma do menu, sem coluna
de rota visitada). **Risco aceito**, reversível por revert.

**⭐ O GANHO É DE MANUTENÇÃO, e ele é o motivo real:** fix do menu deixa de ser feito em **duas
cópias mantidas em simetria** — a frase que apareceu nos commits do E3.12 **e** do 9.123. Barateia
o 9.106 (lote L6, uma tela a menos) e todo fix futuro. E o comentário do hook passou a registrar
**por que ele fica com um consumidor só**: a lógica precisa de **um lugar** (tratamento de erro do
E3.12 + commit-no-blur do 9.123).

**⚠️ Tropeço de ferramenta registrado (virou lição permanente):** após remover a rota, `tsc
--noEmit` acusou `TS2307` apontando para `.next/types/validator.ts` — **artefato do build
anterior**, que ainda listava a rota apagada. O `npm run build` regenerou e o typecheck passou.
**Depois de remover/renomear rota, o typecheck só é confiável APÓS rebuild.**

**Regras conferidas:** §17 ✅ · paridade provada antes de remover ✅ · limite de verificação
declarado ✅ · escopo (1 remoção + 2 comentários) ✅ · gate humano 2/2 ✅ · papelada ✅

---

## 2026-08-26 — CAMADA 3, ETAPA E3.23 — A corrida de PATCH por tecla (9.123)

**Estado antes:** main em `704eebc`

**O que foi feito:** os campos de **texto** do editor de menu (`label` e `url`) chamavam `onUpdate`
**a cada tecla** — N PATCHes em paralelo, e o banco ficava com o que **comitasse por último**, não
com o digitado por último. Agora o texto vive em **estado local** e vai ao servidor **uma vez**, no
**blur ou Enter**, seguindo o **molde da casa**. Fecha o E3.23 — o item que o gate do 9.118 pariu.

**Arquivos tocados:** `components/course-menu-manager.tsx` · `producer/courses/[id]/menu/page.tsx`
— **as 2 cópias, byte-idênticas no bloco** (+106/−8)

**Como foi provado:**
- **Produção medida ANTES de desenhar** (SELECT-only): **177 MenuItem · 0 truncados · 0 prefixos**;
  58 cursos com os 3 defaults intocados, **3 itens custom no total**.
- **Gate humano 5/5 (25/08)**: digitação rápida + blur mantém o texto inteiro · Enter salva ·
  Escape reverte · regressões (icon, url de item custom, enabled, arrasto, criar, excluir) · **a
  cópia órfã, pela URL, também curada**.

**SHA do merge:** `31827c3`  ·  **Rollback:** `git revert -m 1 31827c3`

**Mudou em produção para quem:** **ninguém sente**, e é esse o ponto — o menu quase não é editado
(3 itens custom em 58 cursos). O que muda é que a próxima edição **não pode mais corromper o
próprio nome**. ⚠️ Trade-off consciente: digitar e dar F5 **sem sair do campo** perde a edição não
confirmada — **igual ao rename de módulo e de material**: consistência com a casa, não regressão.

**Ficou aberto:** nada novo. Os 2 achados do gate foram **anexados ao 9.117** (rota órfã): a órfã
renderiza **layout duplicado** (reforça *remover* em vez de *linkar*) e os campos de URL dos itens
padrão são `disabled` **por desenho** (correto, registrado para não virar item por engano).

**⚠️ RECALIBRAGEM DE SEVERIDADE, feita no fechamento: 🔴 → 🟠.** A **natureza** era grave —
corrupção de dado **persistido**, que exigiu restauração por script, com a tela mentindo o tempo
todo. A **incidência** é **nula**. Registrei a distinção no item porque ela é a lição: *cai por
incidência, não por natureza* — e o número medido em produção é o que autoriza baixar a cor.

**⭐ O MOLDE VEIO DE CASA.** `modules-manager.tsx:437-483` e `lesson-materials.tsx:258-264` já
faziam exatamente isto desde sempre (estado local · blur/Enter · Escape · só grava se mudou). O fix
foi **replicar**, não inventar. ⚠️ **Uma adição declarada**: `useEffect` sincronizando o local
quando o item muda por fora — o molde não precisa porque lá o input **desmonta** ao sair da edição;
aqui ele vive sempre, e sem isso um PATCH recusado deixaria o campo mentindo depois do rollback.

**⛔ Opção (B) rejeitada com razão escrita** (fila no hook): não reduz o ruído de N PATCHes,
adiciona maquinário, e protegeria "consumidores futuros" que são exatamente **2** — ambos curados
por (A). E **abort não serviria**: cancela a espera do cliente, não o processamento no servidor.

**Regras conferidas:** §17 ✅ · incidência medida em produção antes do desenho ✅ · molde da casa
reusado (as 7 perguntas) ✅ · as 2 cópias em simetria ✅ · gate humano 5/5 ✅ · papelada ✅

---

## 2026-08-20 — CAMADA 3, ETAPA E3.21 — O cache que fazia o editor mentir (9.118)

**Estado antes:** main em `72c2586`

**O que foi feito:** o `GET` do menu do curso respondia `private, max-age=300` — 5 minutos de
licença ao **cache do navegador** numa rota cujo **único consumidor é a tela de edição**. O
produtor salvava, dava F5, e o browser respondia da própria máquina: estado antigo, "não salvou".
Virou **`no-store`** (1 linha + comentário). O menu do **aluno** vem de `by-slug/init` (cache
próprio, 30s+SWR) e **não foi tocado** — o cache de 5 min **não protegia ninguém**.

**Arquivos tocados:** `api/courses/[id]/menu/route.ts` — **só ele** (+12/−1)

**Como foi provado:**
- **Doença por olho humano (19/08)**: salvar → F5 → nome velho. **O banco provou que o save sempre
  funcionou** — a mentira era 100% do navegador.
- Headers na resposta **viva**, antes (`max-age=300`) e depois (`no-store`); vizinhas intactas
  (`by-slug/init` ao vivo; `courses` pelo fonte — o ramo cacheado dela não é alcançável pelas
  sondas, declarado).
- **Cura v2 por ARRASTO (20/08)** — mutação trocada **de propósito** para desviar da corrida
  por-tecla achada no meio do gate: **teste de gate não convive com defeito conhecido**.

**SHA do merge:** `c427b6a`  ·  **Rollback:** `git revert -m 1 c427b6a`

**Mudou em produção para quem:** o **produtor** que edita o menu — o F5 passa a contar a verdade.
Aluno: nada (rota que ele não consome). Custo: +1 hit de DB por abertura de editor, duas telas de
baixa frequência.

**Ficou aberto:** **9.123** 🔴 (E3.23) — o achado **9.118-B**, abaixo. ⭐ Candidato a próximo.

**⭐ O GATE DA CURA REPROVOU E ACHOU UM BUG MAIOR QUE O ITEM.** No teste humano, "Home E312"
digitado após triple-click **gravou "H"** no banco — com a tela mostrando o texto completo. A
perícia (read-only, o "H" preservado como evidência até o laudo) provou: **o input dispara 1 PATCH
por tecla** (`onChange` → `handleUpdate`, sem debounce/fila/abort), os PATCHes voam em paralelo, e
o banco fica com o que **comitar por último** — o do "H" comitou por último. **Pré-existente desde
`77a8e78` (24/abr)**; o commit do no-store muda um header de resposta de GET e **não tem como
causar escrita** — ele **REVELOU**. ⚠️ E a ironia que virou lição: **o cache escondia o save bom E
o save ruim** — produção está exposta à corrida desde abril, invisível pela UI.

**⚠️ Fatos anexos registrados**: `MenuItem` não tem `updatedAt` (perícia sem timestamp; servidor
sem árbitro de write velho) · o header nasceu em `f736f01` (abr/26) para uma experiência que hoje
não passa por esta rota · a "invalidação pós-mutação" ficou registrada como **ilusória** (HTTP
cache de navegador não é invalidável pelo servidor).

**Regras conferidas:** §17 ✅ · achado do gate periciado ANTES de qualquer decisão ✅ · dado da
perícia restaurado pelo gabarito ✅ · escopo de 1 arquivo ✅ · gate humano (doença + cura v2) ✅ ·
papelada ✅

---

## 2026-08-20 — CAMADA 3, ETAPA E3.13 (fecha) — Comentário sanitizado na escrita (9.24)

**Estado antes:** main em `9d75331`

**O que foi feito:** o post sanitiza antes de persistir desde sempre; o comentário gravava
`content.trim()` **cru**. Agora a **mesma allowlist dos posts** roda no `create` — 1 linha +
import, no lugar exato que o **marcador do 9.54** apontava. **Fecha o E3.13 inteiro** (9.23 +
9.24).

**Arquivos tocados:** `api/posts/[id]/comments/route.ts` — **só ele** (+7/−3)

**Como foi provado:**
- **Antes×depois com o MESMO payload, verbatim do banco**: velho →
  `<img src="x" onerror="alert(1)">` **gravado**; novo → `<img src="x" />` — evento removido,
  `<p>`/`<b>`/img preservados.
- **Regressões**: só-imagem do 9.54 (201, img gravada) · texto **byte-idêntico** · vazio → 400
  "Conteúdo obrigatório". A régua do 9.54 intacta.
- **Olho humano ✅ (19/08)**: moderação → aprovação → render limpo no feed.

**SHA do merge:** `6325123`  ·  **Rollback:** `git revert -m 1 6325123`

**Mudou em produção para quem:** ninguém percebe — e é esse o ponto. O banco deixa de guardar o
que o cliente mandou cru; o render de saída **fica** nas 3 superfícies (defesa em profundidade), e
é o que cobre os **35 legados** (todos inofensivos — varredura 18/08). **SEM backfill, por
decisão.** `LessonComment` é outro model, **fora** do 9.24 (React-escapado fim-a-fim).

**Ficou aberto:** nada novo. E3.13 ✅ completo.

**Nota de palco:** o **"comentário do gate 9.24"** (`47ffe89a`) fica no staging como dado fake
aprovado — prova viva do render limpo.

**Regras conferidas:** §17 ✅ · escopo de 1 arquivo ✅ · antes×depois no MESMO payload ✅ ·
interplay do 9.54 provado ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-20 — CAMADA 3, ETAPA E3.13 (parte 1) — A corrida do grupo default (9.23)

**Estado antes:** main em `8c0683e`

**O que foi feito:** `ensureDefaultGroup` era check-then-create sem proteção: num curso sem grupo,
o clique único do aluno (a página dispara `GET /groups` + `GET /posts` **em paralelo**) fazia a
perdedora estourar **P2002** e devolver **500**. Agora o `create` tem catch de `P2002` com re-busca
**pela unique que conflitou** — o banco decide quem venceu e **a perdedora adota o grupo do
vencedor**. No mesmo fôlego (`9dafa6c`): os **2 catches** de `producer/community/groups` param de
vazar `error.message` em 5xx — era por ali que o P2002 do Prisma chegava **cru** à tela do produtor.

**Arquivos tocados:** `lib/community-helpers.ts` · `api/producer/community/groups/route.ts` — só os 2 do escopo

**Como foi provado:**
- **A doença, antes do fix**: sonda na forma da produção (2 requisições HTTP simultâneas) →
  reproduzida **na 1ª tentativa**: `GET /groups` 500 + `P2002 (courseId, slug)` no log.
  ⚠️ A sonda 1 (5 chamadas num processo/um client) deu **5/5 fulfilled 3 vezes** — o pool
  **serializava** o que queria correr; ficou como lição de fidelidade de sonda.
- ⭐ **A trava que salvou o desenho**: o upsert do Prisma 5.22 nesta forma é **EMULADO** — log de
  query mostrou `BEGIN → SELECT → COMMIT`, **sem `INSERT ON CONFLICT`** — a mesma corrida com outra
  roupa. O fix virou o **PLANO B** exigido pelo comando, e não o upsert do desenho original.
- **A cura, com a mesma sonda da doença**: **5/5 rodadas `200+200` com exatamente 1 grupo** +
  regressão fast-path. ⭐ E o log mostra a corrida **disparando ~4×** (`prisma:error Unique
  constraint`, a exceção capturada) e sendo **absorvida** — vitória por desenho, não por sorte.
  **Zero 500, zero P2002 não-tratado.** **Olho humano ✅ (19/08).**

**SHA do merge:** `b29c64b`  ·  **Rollback:** `git revert -m 1 b29c64b`

**Mudou em produção para quem:** o **aluno** que abre a comunidade de um curso recém-criado —
**20 cursos** de produção ainda vão criar seu grupo default, e cada primeira visita era uma roleta
de 500. O **produtor** deixa de ver mensagem interna do Prisma em erro de grupos. ⚠️ **Vigiar os
logs da comunidade nos primeiros dias** — são os 20 exercícios reais do caminho novo.

**Ficou aberto:** **9.24** (comentário grava HTML cru) — a outra metade do E3.13.

**⚠️ Desvio declarado**: o 2º catch vazador (POST `:139`) do MESMO arquivo fechado junto — padrão
idêntico, 401/403 preservado byte a byte. **Bônus**: grupo manual slug `geral` não-default deixa de
ser 500 permanente.

**Nota de palco:** o **`curso-corrida-923`** (`fe995fcb-…`, dado obviamente fake) **permanece no
staging** como palco de corrida reutilizável — apagar os grupos dele recria o cenário em segundos.

**Regras conferidas:** §17 ✅ · corrida reproduzida ANTES do fix ✅ · trava empírica antes do
desenho ✅ · escopo de 2 arquivos respeitado ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-19 — CAMADA 3, ETAPA E3.12 (parte 1) — Falso sucesso + a régua completa (9.107 Tier 1 · 9.79)

**Estado antes:** main em `c8cd4e7`

**O que foi feito:** morreu o **falso sucesso** — a tela afirmando o que não aconteceu. O
`removeModerator` dizia "Moderador removido" **antes** do fetch; o `handleDragEnd` do menu fazia
`await fetch` **sem guardar a resposta**, em **cópia literal** em 2 arquivos (→ `useCourseMenu`,
−198 linhas). E o **9.79**: quem perdeu `ACCESS_MEMber_AREA` recebia "Não matriculado neste curso"
— verdade literal, pista zero; agora `mensagemDeEntradaNegada` distingue. ⭐ No meio do gate, o
teste humano **reprovou o fix** e expôs que ele cobria só `!res.ok`: quando o fetch **REJEITA**
(rede) não existe `res` — e a régua do 9.86 tem esse ponto cego **na assinatura**. Nasceu
`fetchJson`, cobrindo os dois modos, adotado nos 9 handlers da branch.

**Arquivos tocados:** `use-course-menu.ts` (novo) · `use-toast.tsx` (`fetchJson`) ·
`lib/collaborator.ts` (`mensagemDeEntradaNegada`) · `posts/route.ts` · `groups/route.ts` ·
`menu/page.tsx` · `course-menu-manager.tsx` · `lives/[id]/page.tsx` · `collaborators/page.tsx` ·
`notifications-bell.tsx`

**Como foi provado:**
- Matriz de máquina: 9.79 em 3 rotas × 2 personas + controles; `fetchJson` testado com o **texto
  extraído do arquivo pela AST do tsc** em 5 casos (rede, 500, 403, 200, 204).
- **Gate humano C·A·B, de olho**: **C** feliz 4/4 + persistência pós-restart · **A** falha de rede
  **REAL** — servidor **morto sob build de produção** com a página aberta → revert + toast de
  conexão · **B** 403 **REAL** — **revogação viva** de `MANAGE_LESSONS` no banco com a tela aberta
  → revert + "Sem permissão". Staging **restaurado ao byte** (gabarito guardado antes da escrita).
- ⚠️ Desvios registrados: `lives/moderators` aceita por prova via API (nenhuma persona alcança 403
  clicável ali — 9.116); `colab-zero` nunca foi veículo válido (bloqueio por desenho → 9.120).

**SHA do merge:** `6420f7d`  ·  **Rollback:** `git revert -m 1 6420f7d`

**Mudou em produção para quem:** produtores — reordenar menu, remover moderador, revogar/remover
colaborador e marcar notificações **param de mentir** quando a rede cai ou o servidor recusa: a
tela **volta** e **diz o que fazer**. Colaborador que perdeu acesso à área de membros passa a ler a
causa real. Caminho feliz: byte-a-byte o de antes.

**Ficou aberto:** o **9.106** (adoção da régua nos lotes L1-L6, agora com `fetchJson`) · o padrão
do **Tier 3** (~91 sítios de lista vazia) · os ~89 handlers pré-existentes só-`!res.ok` ·
**9.119-9.122** (E3.22, os 4 achados de UX do gate).

**⭐ O TESTE HUMANO REPROVOU O FIX, E FOI O MELHOR MOMENTO DA ETAPA.** A matriz de máquina exercitava
o 4xx/500 e passava; o dedo humano bloqueou a URL e viu a ordem ficar torta em silêncio. Provar só
um modo de falha foi exatamente o que deixou o buraco passar — o roteiro novo exige **os dois**.

**⭐ AS TRÊS LIÇÕES DO GATE** (registradas no 9.107): **(L1)** falha de rede em SPA carregada
**nunca em dev server** — o HMR recarrega a página quando o servidor morre e destrói o palco; usar
`next build` + `next start`. **(L2)** drag sintético não é confiável entre sessões do agente —
célula de arrasto exige mouse humano. **(L3)** **gate de TELA ≠ PÁGINA ≠ API** — mapear as três
camadas antes de desenhar teste de permissão.

**Regras conferidas:** §17 ✅ · os dois modos de falha provados ✅ · staging restaurado ao byte ✅ ·
gate humano C·A·B ✅ · papelada ✅

---

## 2026-08-18 — CAMADA 3, ETAPA E3.15 — Preço e checkout restritos ao dono (9.112)

**Estado antes:** main em `ce7d7ad`

**O que foi feito:** `checkoutUrl`, `price`, `priceCurrency` e `externalProductId` saíam no payload
de `GET /api/courses/[id]` para **qualquer uma das 5 permissões** do gate — inclusive
`REPLY_COMMENTS`. Agora são de **ADMIN e DONO**, **sem permissão nova**. ⭐ E o corte é de
**leitura E escrita**, no mesmo commit — pelo motivo abaixo.

**Arquivos tocados:** `api/courses/[id]/route.ts` — **só ele** (+84/−22)

**Como foi provado:**
- **GET 7/7**: dono e ADMIN recebem os 4; `colab-lessons`, `colab-students`, `colab-reply` e
  `colab-comunidade` **não**; `colab-zero` **403** (gate intacto). ⭐ E a asserção que fecha:
  **o que falta ao colaborador são EXATAMENTE os 4** — nada a mais, nada a menos —, com
  `supportEmail`/`supportWhatsapp` preservados.
- 🔴 **PUT com o payload DERIVADO DO GET**, montado como `edit/page.tsx` → `CourseForm` monta de
  verdade, não à mão. A sonda imprimiu o perigo: *"o form do colaborador enviaria:
  `checkoutUrl=null price=null`"* — e os 4 campos ficaram **intactos** (por `SELECT` antes/depois).
- Envio **explícito** por API (`price:1`, checkout malicioso, `USD`) → **ignorado**, tudo intacto.
- **O dono grava preço novo E limpa com `null`** — a capacidade de apagar continua sendo dele.
- **Regressão**: o colaborador segue salvando descrição, categoria, termos e flags.
- **Humano 5/5**, com ⭐ **CINCO gravações consecutivas do colaborador** — cinco oportunidades de
  apagar, **zero perdas**.

**SHA do merge:** `f34e5c1`  ·  **Rollback:** `git revert -m 1 f34e5c1`

**Mudou em produção para quem:** **os 3 colaboradores** que leem essa rota (`marcilenexl`,
`jesusblack016`, `ernestorodriguez.suport066`) — param de receber preço, checkout e a chave de
gateway, e **param de poder sobrescrevê-los**. ⚠️ Na aba Informações do editor os campos aparecem
**vazios** (decisão do dono: vazio é aceitável; desabilitar com aviso seria client a mais para caso
raro). **Dono e ADMIN: nada muda.**

**Ficou aberto:** **9.115** 🟢 (E3.18) — `supportEmail`/`supportWhatsapp` no mesmo payload.

**🔴 O ACHADO QUE MUDOU O DESENHO, e ele é §22 (possível perda de dado): cortar SÓ o GET
APAGARIA os campos.** O `CourseForm` envia o payload **inteiro**, o PUT grava o que chega
(`...(checkoutUrl !== undefined && { checkoutUrl })`, `price === "" → null`), e `canEditCourse`
libera colaborador com `MANAGE_LESSONS`. Na **primeira** vez que ele salvasse a aba Informações,
preço e checkout virariam `null` — falha **silenciosa**, em campo de **receita**, meses depois
sem ligação com a causa. O fix, feito pela metade, seria **pior que o problema**.

**⭐ E O ESPELHO, que o item não pedia e a investigação achou:** esse colaborador **já podia
ALTERAR** preço e checkout. A decisão "é do dono" só é coerente cobrindo os **dois lados** —
**esconder um valor que se continua deixando sobrescrever seria pior que não esconder**. É a
família *conferir a rota irmã que desliga*, aqui **entre GET e PUT do mesmo arquivo**.

**⛔ `supportEmail`/`supportWhatsapp` ficaram de fora — e não por serem inofensivos.** O
`CourseForm` **os exige** para salvar qualquer coisa (`course-form.tsx:171-178`): cortá-los travaria
a aba Informações do colaborador, que não salvaria **nem o título**. São contato de **produto**, e o
aluno **não os recebe por esta rota** — o `CourseSupportWidget` recebe só `courseId`, título e
cores, e o contato é resolvido no servidor por `lib/workspace-block.ts`. Virou **9.115**, com o
aviso de que **restringi-los exige mudar o formulário junto**.

**⚠️ PUT IGNORA em vez de recusar, e isso está escrito no código.** Um 403 recusaria o formulário
**inteiro** — o colaborador não salvaria nem o título, e a tela ficaria inutilizável para quem tem
todo o direito de usá-la. Ignorar preserva a tela e fecha a escrita.

**⚠️ ASSIMETRIA PRÉ-EXISTENTE REGISTRADA E NÃO UNIFICADA:** o gate de **leitura** aceita dono do
**workspace**; o de **escrita**, não. Unificar mudaria **quem pode editar** — fora do escopo. Ficou
comentada no código para o próximo leitor não "consertar" por engano.

**⚠️ PALCO POPULADO PELO CAMINHO REAL — era a QUARTA vacuidade desta frente.** Os 6 campos do
`curso-teste` eram **todos `null`**: cortado e não-cortado sairiam idênticos.
`checkoutUrl`/`price`/`priceCurrency`/`supportEmail`/`supportWhatsapp` pelo **PUT** (a aba
Informações), e ⚠️ **`externalProductId` pelo `PATCH` das telas de integração — o PUT do curso
NUNCA escreveu esse campo**, não está na desestruturação do corpo. **Estado de palco deliberado, não
apagar**: `curso-teste` fica com **preço 197,5**, checkout `https://checkout.staging.test/curso-teste`
e `externalProductId = PROD-STAGING-9112`. É o que torna este corte **observável** — sem eles,
qualquer prova futura volta a passar por vacuidade.

**Regras conferidas:** §17 respondido ✅ · rota irmã (o PUT) conferida no mesmo commit ✅ ·
predicado reusado, sem terceiro jeito de perguntar "é dono?" ✅ · staging-first ✅ · gate humano ✅ ·
papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.7 (fecha) — Cards no mobile (9.84)

**Estado antes:** main em `d2305fb`

**O que foi feito:** abaixo de `md`, a tabela de colaboradores dá lugar a **cards
empilhados** com a mesma informação e as mesmas ações. Fecha o **E3.7 inteiro**.

**Arquivos tocados:** `producer/settings/collaborators/page.tsx` — **só ele** (+174/−43)

**Como foi provado:**
- ⭐ **Desktop idêntico, por ARTEFATO e não por impressão**: as **5 strings de classe** dos
  botões são **idênticas** às de `main`, **na mesma ordem**; o diff **dentro** da tabela é **só**
  o wrapper ganhando `hidden md:block` — nenhum `<tr>`, `<td>`, `<th>`, `min-w-[640px]` ou
  `overflow-x-auto` mudou.
- **Bundle servido** (dev reiniciado, `.next` limpo): `hidden md:block` e `md:hidden space-y-3
  pb-20` no chunk client, e o **CSS gerado** — `.basis-[calc(50%-0.25rem)]{flex-basis:calc(50% -
  .25rem)}` e `.grow{flex-grow:1}`.
- **Humano 7/7**, com ⭐ **Reativar executado de verdade no mobile**: status → Pendente, toast
  "Convite reativado", modal com o link.

**SHA do merge:** `2c02b72`  ·  **Rollback:** `git revert -m 1 2c02b72`

**Mudou em produção para quem:** **produtores no celular** — o app é PWA e a tela de
colaboradores era a última do painel a só rolar lateralmente. **No desktop, ninguém sente nada**:
provado por artefato, não por olhar.

**Ficou aberto:** **9.114** 🟢 (E3.17) — divergência de breakpoint entre os moldes de tabela
responsiva.

**⭐ O MOLDE FOI ESCOLHIDO POR FATO, NÃO POR ANALOGIA.** O palpite do dono ("o de `students`,
por ser lista de pessoas") estava certo, mas a razão forte era outra: **o card do `applyfy` é de
LOG — só leitura, sem rodapé de ações**. Uma tabela cujo ponto são **até 4 botões por linha** não
tem o que copiar dele. Não era "qual é mais parecido", era "**qual dos dois tem a peça que eu
preciso**".

**⭐ A REGRA CONDICIONAL VIROU COMPONENTE, e essa foi a decisão de engenharia da etapa.** "Qual
botão aparece em qual status" agora vive **uma vez**, em `<AcoesColaborador>`, chamado pelas duas
superfícies com props idênticas exceto `layout`. Duplicar seria a família **9.42/9.54/9.57** — mas
com um agravante que as anteriores não tinham: **a divergência nasceria invisível**. Ninguém abre
a mesma tela em duas larguras para conferir se os botões batem. O defeito só apareceria no tamanho
de tela que quem editou não estava olhando. **Nenhuma condição de status sobrou na tabela.**

**⚠️ CARD SEM AVATAR, DE PROPÓSITO — e reportado em vez de omitido.** O molde de `students` tem
avatar; a **linha** do desktop de colaboradores não mostra nenhum. O card carrega o que a linha
tem. Copiar o avatar do molde faria as duas superfícies **discordarem sobre o que existe**.

**⚠️ DUAS CORREÇÕES DE SONDA MINHAS, registradas porque as duas produziram um 🔴 falso:**
1. Concluí "**servidor velho**" ao não achar os marcadores em `.next/static` e `.next/server`.
   Esses diretórios são **sobras do `npm run build`**; o dev do Turbopack serve de **`.next/dev/`**.
   Não era servidor velho — era **eu grepando o diretório errado**.
2. `grep -c "basis-[calc(50%-0.25rem)]"` devolveu **0** porque os colchetes viraram **classe de
   caracteres** do regex. A string sempre esteve no chunk. **Ausência só é ausência quando a sonda
   sabe achar presença** — o `grep -o "basis-[^\"' ]*"` mostrou na hora.

**⚠️ ESTADO DE PALCO ALTERADO PELO TESTE (registrado a pedido do dono):**
`colab-exaceito-e37@staging.test` saiu de `REVOKED` e está **`PENDING`** — foi o **Reativar
funcionando** no gate humano, não erro. Se algum grupo futuro precisar dele em `REVOKED`, é **um
clique em "Revogar"**. O palco fica: `PENDING=2 · REVOKED=2 · ACCEPTED=13`, com `colab-revogado` e
`qa-revogar-e30` (os preservados do E3.2) intactos.

**Regras conferidas:** §17 respondido ✅ · molde reusado, terceiro não inventado ✅ · desktop
provado por artefato ✅ · bundle servido conferido ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.7 (parcial) — Reativar convite revogado (9.83)

**Estado antes:** main em `4876d64`

**O que foi feito:** um convite `REVOKED` não tinha caminho de volta na tela — só "Editar" e
"Remover" — e **editar era enganoso**: o modal monta o payload **sem `status`**, então o PATCH
gravava as permissões, a tela dizia **"Colaborador atualizado"** e o acesso continuava
inexistente. Agora existe **"Reativar"**. ⭐ E **nenhuma linha nova de backend**: o `resend`
**já era** a reativação inteira, barrado por uma guarda de 4 linhas.

**Arquivos tocados:** `api/producer/collaborators/[id]/resend/route.ts` ·
`producer/settings/collaborators/page.tsx` — **só esses dois**

**Como foi provado:**
- **Matriz 22/22**: revogado-que-aceitou e revogado-que-nunca-aceitou reativam (200, antes
  **400**) · `acceptedAt` → `null` · `invitedAt` novo · magic link emitido · `userId` preservado.
- ⭐ **O ramo que não podia mudar não mudou**: `PENDING` → Reenviar com **diff da linha inteira**
  — **só `invitedAt` alterou**, exatamente como antes.
- **Reconvite por POST leva ao MESMO destino** que o botão: mesma linha, `{PENDING, acceptedAt
  null}`. Dois caminhos, um resultado.
- **Guarda de `ACCEPTED`** (`e5c2caa`): 400 com a frase, e o colaborador **continua ACCEPTED** —
  provado por **SELECT** (`status`, `acceptedAt`, `invitedAt`, `userId` intactos), não pelo
  status code.
- **CRUD intacto**: convidar · editar · revogar · remover — tudo em **descartáveis próprios**.
- **Gate humano 5/5**, incluindo o aviso âmbar e a confirmação de reativação.

**SHA do merge:** `cd4c71c`  ·  **Rollback:** `git revert -m 1 cd4c71c`

**Mudou em produção para quem:** **produtores** que revogaram alguém — ganham o caminho de volta
e param de ser enganados pela edição. **Ninguém perde nada**: os quatro fluxos existentes seguem
idênticos, e o `PENDING` foi provado byte-a-byte. ⚠️ **Restritivo de propósito**: quem chamava o
`resend` por API num colaborador **ativo** agora recebe **400** — antes o rebaixava a `PENDING` e
tirava o acesso.

**Ficou aberto:** **9.113** 🟠 (E3.16) — slot flutuante sem dono. E o **9.84**, que **encolheu**
(abaixo). O E3.7 fecha **parcial**.

**⭐ O FIX FOI DESCOBRIR QUE O FIX JÁ EXISTIA.** O `resend` fazia `{invitedAt: now, status:
PENDING}` **e** emitia magic link — isto é, reativar. A rota só recusava. As 7 perguntas
respondidas **no código**, não no palpite: pergunta 2 ("algo já faz isso?") valia um `−4/+1` em
vez de um fluxo novo. O que sobrou de trabalho real foi **o que a remoção da guarda abriu**, não
o que ela fechou.

**⭐ A GUARDA QUE PRECISOU NASCER JUNTO — e por que ela não é escopo extra.** Ao tirar a guarda de
`REVOKED`, a rota ficou **sem guarda nenhuma**, e o `update` é incondicional: um colaborador
`ACCEPTED` chamado por API voltava a `PENDING` e **perdia o acesso na hora**. Era **pré-existente**
— a guarda antiga só olhava `REVOKED` —, coberto por acidente porque a tela nunca ofereceu o botão
em linha ativa. Mergear assim seria publicar uma rota que **desliga acesso** sem nenhuma
verificação de estado. É a família **9.64/9.109: conferir a rota irmã que DESLIGA**. Recusa com
**400, não 403** — quem chama **tem** permissão; o que não existe é a operação.

**⚠️ O PALCO ESTAVA VAZIO NAS DUAS CÉLULAS QUE IMPORTAVAM, e isso foi descoberto ANTES de medir.**
Havia **0 convites PENDING** — o controle da não-regressão do `resend` — e os 2 `REVOKED`
preservados **nunca tinham sido aceitos**, então `acceptedAt` **já era `null`** e a asserção da
limpeza sairia ✅ **sem o código ter feito nada**. Terceira aparição da vacuidade nesta frente
(9.85 → 9.81 → aqui), e a primeira em que ela foi **prevista** em vez de descoberta no resultado.
Semeados `colab-pendente-e37` e `colab-exaceito-e37` **pelo caminho real** (convidar → aceitar →
revogar), registrados como **palco deliberado**. ⚠️ E os 2 `REVOKED` do E3.2 **não foram tocados**:
todo teste destrutivo rodou em descartáveis próprios, conferidos ao final.

**⚠️ CORREÇÃO DE REGISTRO — o E4.1 afirmava algo FALSO.** O item dizia que esconder o botão de
suporte "resolve junto a sobreposição sobre **'Enviar convite'**". **São dois widgets
diferentes**: `CourseSupportWidget` (`bottom-4 right-4 z-40`) só existe em
`(course)/course/[slug]/layout.tsx:179` — **área do aluno** —, e quem cobre o painel do produtor é
o `SupportChatWidget` (`bottom-6 right-6 z-50`) do `producer-shell.tsx:34`. O toggle do E4.1
**não resolve nada** no painel. Corrigido no ROADMAP.

**⚠️ O 9.84 ENCOLHEU — metade dele foi MEDIDA E REFUTADA pelo dono (406px).** O "scroll
horizontal da página" **não existe**: `body.scrollWidth === documentElement.scrollWidth ===
clientWidth === 406`, e os **132** elementos com `right > clientWidth` têm **todos** ancestral com
`overflow-x` próprio — rolagem **interna legítima**. A leitura de código não achara causa e **eu
não afirmei que existia**; a medição fechou. Resta do item **só a variante de cards no mobile**,
com molde já existente em dois lugares (`students` em `md`, `applyfy` em `sm`) — escolher um.

**Regras conferidas:** §17 respondido ✅ · as 7 perguntas respondidas no código ✅ · rota irmã que
desliga conferida ✅ · elenco de staging intocado ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.4 — Recorte de payload (9.81)

**Estado antes:** main em `3c3a962`

**O que foi feito:** `GET /api/courses/[id]` usava **`include` puro** e devolvia **toda coluna** de
`Course`, `Module`, `Lesson` e `Section` — `videoUrl` de todas as aulas incluído — para qualquer uma
das **5** permissões que abrem o editor, **nenhuma** relacionada a conteúdo. Virou **`select`
explícito**, e só o bloco de **conteúdo de aula** (`videoUrl` · `description` · `duration` ·
`hideYoutubeChrome`) ficou condicionado a `MANAGE_LESSONS`. ⚠️ **Quem entra não mudou**: a união das
duas listas de permissão é exatamente o `anyOf` de 5 de antes.

**Arquivos tocados:** `api/courses/[id]/route.ts` — **só ele** (+133/−10)

**Como foi provado:**
- **Diff de chaves `include`×`select` no mesmo dado**: `Course 54→54` · `Module 10→10` · `Lesson
  9→9` **com** permissão e **9→5** **sem**, cortando exatamente os 4.
- ⚠️ **O teste passava por VACUIDADE e foi pego**: `Section 0→0` — o `curso-teste` não tem seção
  nenhuma, então aquele ramo passava **sem testar nada**. Refeito contra o **`information_schema`**,
  com a lista extraída **do próprio arquivo da rota**: `Course 52/52` · `Section 5/5` · `Module 9/9`
  · `Lesson 9/9`. Zero coluna esquecida — **inclusive na tabela sem linha nenhuma**.
- **Matriz HTTP 8/8** com a expectativa **derivada do banco** (permissões + `courseIds` + workspace
  lidos **antes** de medir): `colab-lessons` **200 com** vídeo · `colab-students`, `colab-reply` e
  `colab-comunidade` **200 sem** · `colab-zero` e `sem-vinculo` **403** (gate intacto) · dono e ADMIN
  **200 com**.
- **Os 8 consumidores conferidos campo a campo** no payload sem permissão: layout 4/4 · menu 2/2 ·
  settings 14/14 · customize 5/5 · CourseForm 19/19 · ModuleData 8/8. **Nenhum campo faltando.**
- **7 rotas do editor carregam** com `producer-staging` **e** com `colab-students`, sem marcador de
  erro no HTML.
- **Gate humano 4/4**, com uma correção colada abaixo.

**SHA do merge:** `fcb1cbc`  ·  **Rollback:** `git revert -m 1 fcb1cbc`

**Mudou em produção para quem:** os **3 colaboradores** que liam a rota sem `MANAGE_LESSONS`
(`marcilenexl`/orion-academy com `REPLY_COMMENTS`; `jesusblack016` e
`ernestorodriguez.suport066`/kingdomacademy com `MANAGE_STUDENTS`) **param de receber** as URLs de
vídeo — e **nenhuma tela deles muda**, porque nenhuma exibia. Quem tem `MANAGE_LESSONS`, dono e
ADMIN: **nada muda**.

**Ficou aberto:** **9.112** 🟠 (E3.15) — bloco **comercial e de contato** no mesmo payload
(`checkoutUrl` · `price` · `priceCurrency` · `externalProductId` · `supportEmail` ·
`supportWhatsapp`). ⛔ **Não anda sem decisão de dono**: cortá-lo sob `MANAGE_LESSONS` faria a
permissão significar **duas coisas** (família do `DASHBOARD_PERMISSIONS`).

**⚠️ O ROTEIRO DE VALIDAÇÃO APONTOU A TELA ERRADA — e o humano provou a não-regressão por
COMPARAÇÃO.** Eu escrevi "Alunos → editar acesso de um aluno" esperando ver a lista de
módulos/aulas. Ela **não aparece ali para ninguém** — nem para o dono sem restrição. O fato: a lista
vive **duas camadas mais fundo**, no ícone de lápis (`aria-label="Editar tempo de acesso"`,
`students/page.tsx:290`) que abre o modal, e **dentro dele numa segunda aba**, `Liberação de
conteúdo` (`edit-access-modal.tsx:288`). O humano não aceitou a ausência como corte de permissão:
**comparou com `producer-staging`, viu a mesma tela, e concluiu certo**. É a família do *roteiro que
passa por vacuidade* — dessa vez o roteiro não passou por vacuidade, ele **mediu no lugar errado**,
e só não virou achado falso porque houve **grupo de controle**. ⚠️ **Consequência registrada**: a
lista de módulos/aulas **não foi vista renderizada** neste ciclo; a não-regressão daquele consumidor
está provada **por campo presente no payload + comparação com o dono**, não por olho na tela.

**⚠️ BURACOS DECLARADOS (baixo risco, não fechados):** `lives/[id]` **não rodou** — não há `Live` no
palco; ela lê só `modules[].{id,title}`, provados presentes. E `sections[]` volta **vazio** — o
conjunto de campos de `Section` está provado contra o schema, **não por HTTP**. Fechar os dois pedia
**escrita no staging**, que o comando não autorizou.

**⭐ O DESENHO COINCIDIU COM A INTENÇÃO DE PRODUTO, e isso é o que o tornou barato:** dos 8
consumidores, o único que precisa do conteúdo é `edit/page.tsx` — e ele **já expulsa**
(`router.replace` → `/comments`) quem não tem `MANAGE_LESSONS`. Não foi preciso inventar régua nova:
a régua já existia no client, sem o servidor a respeitar.

**⭐ EFEITO COLATERAL DESEJADO:** com `include`, **toda coluna nova ia junto sem ninguém decidir**.
Com `select`, uma coluna que nasça no schema **não vaza sozinha**.

**⚠️ NÚMEROS DO ITEM VENCIDOS, remedidos antes de agir:** o item dizia **1.833 aulas, 100% com
`videoUrl`**. São **1.831, 1.718 (93,8%)**. Item velho é hipótese, não fato.

**Regras conferidas:** §17 respondido ✅ · consumidores mapeados ANTES do desenho ✅ (o primeiro
grep, filtrado, dizia 3 — eram 8) · staging-first ✅ · gate humano ✅ · refutação de IDOR **não
reaberta** ✅ · papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.11 — 2FA para quem tem painel (9.109)

**Estado antes:** main em `b570739`

**O que foi feito:** o colaborador passou a poder **ativar** 2FA (o gate era por role, e ele é
`role=STUDENT` desde o C5), e **desativar** passou a exigir o **segundo fator**. ⭐ Os dois no
mesmo fôlego, por requisito — não por conveniência.

**Arquivos tocados:** `lib/staff-access.ts` (novo) · `lib/upload-access.ts` ·
`api/auth/mfa/enroll/route.ts` · `api/auth/mfa/unenroll/route.ts`

**Como foi provado:**
- **TOTP gerado por RFC 6238 com `crypto` nativo** — sem dependência nova. Ciclo completo:
  `enroll` → `verify` (código real) → login **exige** o desafio → `unenroll` **sem** AAL2 **403** →
  `challenge` → `unenroll` **com** AAL2 **200**.
- **Matriz 16/16**: `colab-comunidade` e `colab-zero` ativam (antes 401) · `sem-vinculo` e
  `aluno-staging` **403** · ADMIN e dono inalterados.
- **Regressão do 9.88 provada 5/5 idêntica** — o helper foi extraído, não reescrito.
- **Gate humano 6/6**, incluindo o teste que fecha o buraco: reativar, sair, entrar e tentar
  desativar **sem** completar o desafio → **403** com a frase certa.

**SHA do merge:** `b58df38`  ·  **Rollback:** `git revert -m 1 b58df38`

**Mudou em produção para quem:** **colaboradores** — passam a poder proteger a conta (a tela já
aparecia no menu deles e negava). **Quem já usa 2FA** — desativar passa a exigir o segundo fator;
é restritivo **de propósito**, com mensagem que diz o que fazer, não 500. ADMIN e PRODUCER: nada
muda no que já funcionava.

**Ficou aberto:** **9.111** 🔴 — não existe caminho de recuperação de 2FA.

**⭐ O ITEM ERA DOIS, e quem mostrou foi a varredura do diretório** (não a linha citada): `enroll`
gateava por role e **`unenroll` não gateava nada**. Uma sessão em AAL1 desligava o 2FA. É a forma
do **9.64** (POST rejeita, PATCH aceita) — só que aqui **a rota folgada é a que DESLIGA a
proteção**. Abrir o `enroll` sozinho aumentaria o número de contas com 2FA removível por sessão de
primeiro fator: mais cadeados, mesma chave do lado de fora.

**⭐ UM RISCO DESCARTADO ANTES DE ABRIR:** o desafio **aparece** para o colaborador — as três
portas de login fazem `listFactors()`. Se não aparecesse, habilitar seria **pior que não
habilitar**: a pessoa se acharia protegida sem estar. Verifiquei antes de recomendar.

**⚠️ E A DÍVIDA QUE ESTE FIX DEIXOU, escrita para não sumir:** ele **fechou a válvula de escape**
que existia (desligar 2FA com sessão simples). A válvula era um buraco — mas era, também, o único
caminho de quem perdesse o autenticador. **O 9.111 nasce deste fix**, e sobe para urgente **no dia
em que alguém habilitar 2FA em produção**.

**Regras conferidas:** §17 respondido ✅ · varredura do diretório inteiro ✅ · helper extraído sem
terceira cópia ✅ · erro que diz o que fazer, nunca 500 ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.10 — A torneira do webhook (9.98)

**Estado antes:** main em `cbf89d2`

**O que foi feito:** as 5 telas de integração montavam a URL do webhook a partir de
`window.location.origin` — **o produtor copiava o host em que estava navegando**. Quem abrisse o
painel por `applyfy-mvp.vercel.app` gravava **essa** URL no gateway, permanentemente. Invertida a
precedência para `NEXT_PUBLIC_APP_URL || origin`.

**Arquivos tocados:** as 5 telas de `producer/settings/integrations/` — **5 linhas de código e 35
de comentário**. Sem o porquê escrito, a próxima pessoa "conserta" de volta.

**Como foi provado:**
- ⭐ **Pelo BUNDLE COMPILADO**, nos dois sentidos: na `main` a expressão é
  `i || "https://applyfy-mvp.vercel.app"`; na branch é `U = "https://applyfy-mvp.vercel.app"` —
  **o compilador eliminou o `origin`**. Ordem antiga: **0 ocorrências**.
- **Cirurgia provada**: `window.location.origin` tem 10 ocorrências antes e depois, **idênticas**;
  `git diff` **vazio** nos 4 arquivos dos usos legítimos (workspaces ×3, alunos, player).
- **Gate humano**: as 5 telas com a URL canônica · `/w/staging-teste` abre · "Reenviar" → 200 ·
  ⭐ **aula com vídeo do YouTube TOCA**, que era o uso sensível de `origin`.

**SHA do merge:** `d58aecb`  ·  **Rollback:** `git revert -m 1 d58aecb`

**Mudou em produção para quem:** **produtor que abrir a tela de integração daqui pra frente** —
passa a ver o domínio canônico. **Nenhum produtor já configurado é afetado**, e nenhuma venda
muda de caminho. Ninguém a avisar.

**Ficou aberto:** **9.110** 🟢 (dev por `127.0.0.1` não hidrata o React).

**⭐ A PROVA PLANEJADA FALHOU E A SUBSTITUTA ERA MELHOR.** O marcador seria abrir as telas por
`127.0.0.1` e ver que o texto não muda. Não funcionou: por `127.0.0.1` o React **não hidrata**
(nenhum `__reactFiber`; o submit vira GET nativo e não autentica) — comportamento que **também
existe na `main`**, então não é do fix. A substituta — ler a **expressão compilada** — é
**determinística**: não depende de host, cookie nem hidratação, e mostra que **não existe caminho
no código executado** onde o host da navegação entre na URL. Virou memória.

**⚠️ ARTEFATO DE SONDA, registrado:** a primeira comparação dos usos legítimos acusou 🔴. Era a
**minha sonda**, que incluía o **número da linha** — e o comentário de 7 linhas deslocou as
demais. Refeita por arquivo + conteúdo: idênticas. **Sonda que compara ruído junto com sinal
inventa regressão.**

**⭐ O QUE ESTE FIX NÃO FAZ — e é metade do valor do registro:** ele **fecha a torneira** (produtor
novo copia o endereço certo), mas **não altera ninguém já configurado**. O gateway chama o
endereço gravado no painel dele. **Migrar os existentes é etapa separada**, um a um, com aviso — e
continua dependendo de **descobrir quem são**, o que o nosso banco não sabe (só log da
Vercel/Cloudflare).

**Regras conferidas:** §17 respondido ✅ · reconferência antes de tocar ✅ · cirurgia provada nos 5
usos legítimos ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-17 — 📌 9.7 CARROSSEL: "abandonar" virou "refazer" — correção de decisão

> Leitura pura + documentação. Zero código.

**Estado antes:** main em `ddb1bae` · o 9.7 registrado como "rebase ou abandonar"

**O que foi feito:** **correção de uma decisão que eu tinha registrado errado.** No reagrupamento
escrevi que a branch do carrossel era "rebase ou abandonar" — o dono corrigiu: **a feature é
desejada e vai ser feita**. Recuperei o desenho da branch, medi o que envelheceu, e registrei o
9.7 como **item VIVO** com o desenho colado dentro.

**Arquivos tocados:** `docs/PLANO-MESTRE.md` · `docs/ROADMAP-EXECUCAO.md`

**Como foi provado:** desenho lido dos componentes da branch; envelhecimento medido com
`git rev-list --count` **por arquivo tocado**; schema conferido no `information_schema` de
produção.

**Mudou em produção para quem:** ninguém. Zero código.

**⭐ O ACHADO QUE REORGANIZOU O ITEM:** `Course.bannerExtra` **já está no schema da main e em
produção** (migração `20260612190201` aplicada) — enquanto **nenhum dos 2 commits da branch está
na main**. É uma **coluna órfã**: schema + banco + migração, **zero uso no código**, **0 de 54
cursos** com dado. A decisão de dado sobreviveu; só a fiação nunca entrou.

**⚠️ E EU TIVE QUE CORRIGIR O MEU PRÓPRIO ARGUMENTO.** Escrevi que rebasear seria "reescrever a
feature no meio de conflitos injulgáveis". **A medição refuta isso**: dos arquivos que a branch
toca, `course-preview.tsx` teve **0** commits desde o merge-base e `course-form.tsx` teve **1
(+1/−1)**. O "448 commits atrás" assusta, mas **quase nenhum toca estes arquivos**. As 3
dependências de drag-and-drop **já estão instaladas** e o componente importado **existe**. Um
rebase teria **poucos conflitos**.

O motivo real para não rebasear é **outro, e mais forte**: a branch é **WIP que ninguém nunca
validou** (`pending visual validation`), e rebasear entregaria código não-validado **com aparência
de pronto**; além disso ela carrega um **arquivo de migração já aplicado por outro caminho**, e
histórico de migração é onde este projeto já destruiu um banco.

**⇒ Caminho recomendado: `cherry-pick` seletivo** — os 2 componentes são **arquivos novos** (~475
linhas, zero conflito); a fiação nos 4 arquivos existentes é **refeita à mão**. Preserva a UI e
refaz só o que envelheceu. A validação visual, que nunca aconteceu, vira o gate.

**⛔ A branch NÃO é apagada** até a feature existir — registrado **dentro do 9.6** (a faxina de
branches), para ninguém apagá-la varrendo. ⚠️ E a lição vale para as outras 4: **branch abandonada
pode ser a única cópia de um desenho** — examinar antes de apagar.

**Ficou aberto:** 9.7 na **Camada 4** (é item, não frente: desenho pronto, schema aplicado, cabe
numa sessão).

---

## 2026-08-17 — 📌 TRIAGEM DOS NUNCA-TRIADOS — não é etapa fechada

> Leitura pura + documentação. Zero código. **Cada veredito foi conferido no código de hoje**,
> não no texto do item.

**Estado antes:** main em `67ca82e` · 60 itens abertos, 21 triados

**O que foi feito:** varredura dos itens que **nunca passaram por triagem** — blocos *Débito*
(9.1–9.9), *QA & Observabilidade* (9.10–9.16) e *Comunidade* (9.20–9.46). ⚠️ **O número real era
36, não ~24.**

**Arquivos tocados:** `docs/PLANO-MESTRE.md` · `docs/ROADMAP-EXECUCAO.md`

**Como foi provado:** cada item verificado no código (`grep`/leitura), não por leitura do próprio
item — que foi como três fantasmas sobreviveram até ontem.

**Mudou em produção para quem:** ninguém. Zero código.

**Resultado:** **1 fantasma** (9.5 — o guard já existia nas duas rotas) · **1 encolheu** (9.2 — o
seed foi feito no E3.0; resta o `storage-policies.sql`, ⚠️ **que não está no repo**) · **1 cresceu**
(9.6 — eram 4 branches stale, hoje são 5) · **1 ilegível** (9.14) · **5 vivos confirmados**
(9.18 · 9.23 · 9.24 · 9.34 · 9.44b).

**⭐ A TAXA DE FANTASMA CAIU — e isso é informação, não sorte.** Ontem foram 3 em 26 (11%); hoje
1 em 36 (3%). Motivo provável: os itens de ontem estavam **na Camada 3, a área que estamos
mexendo** — fantasma nasce quando o trabalho recente cruza o item e ninguém fecha o papel. Os
blocos antigos quase não foram tocados, então quase não geraram fantasma. **Fantasma é função de
proximidade ao trabalho, não de idade do item.**

**⚠️ DOIS ACHADOS DE NATUREZA DIFERENTE, que mudam a leitura da fila:**
1. **Nove itens não eram itens — eram FRENTES** (9.1 · 9.58 · 9.35b · 9.28+9.30 · 9.53 · 9.12 ·
   9.13 · 9.15 · 9.22). Cada um vale uma sessão inteira ou mais. Contá-los como "itens de faxina"
   fazia a fila parecer ter 36 coisas pequenas; **tem ~20 pequenas e ~9 frentes.** Uma fila que
   mistura as duas escalas não se planeja.
2. **O 9.14 ficou ILEGÍVEL por causa do nosso próprio rename**: "Arte real do logo Applyfy" hoje
   se lê como o logo do produto, mas é o logo do **GATEWAY**. ⚠️ Item que não se consegue ler é
   item que nunca será feito — ou pior, que alguém executa errado. **Renomear a marca do produto
   mudou o sentido de itens antigos**, e este pode não ser o único.

**Subiram para a Camada 3:** **E3.13** (9.23 corrida no `ensureDefaultGroup` → 500 em 4 rotas ·
9.24 HTML cru no banco) e **E3.14** (9.44b — **11 pontos escrevem `Enrollment` e nenhum registra
quem foi**; o `AuditLog` cobre 17 ações, nenhuma de acesso de aluno).

**Ficou aberto:** 10 grupos · **10–12 sessões**, já **depois** de tirar as 9 frentes da conta.

**🔴 DUAS DECISÕES DO DONO, pendentes:** **9.7** (branch 128+ commits atrás — rebase ou abandonar?
o custo sobe todo dia) e **9.16** (backfill + `UPDATE` de preço **no banco de produção** — exige
dry-run, contagem declarada antes e autorização explícita).

---

## 2026-08-17 — 📌 REAGRUPAMENTO 2 DA CAMADA 3 — não é etapa fechada

> Trabalho de **planejamento** e **caça a fantasmas**. Nenhum item foi consertado — e mesmo assim
> **três fecharam**.

**Estado antes:** main em `19243bf` · Camada 3 com 5 de 10 grupos fechados

**O que foi feito:** refeita a triagem, porque os 5 grupos fechados **geraram 6 itens novos**
(9.104–9.109) que a ordem anterior não conhecia. Antes de agrupar, uma **caça a fantasmas** nos
itens que tocam arquivos já mexidos.

**Arquivos tocados:** `docs/ROADMAP-EXECUCAO.md` · `docs/PLANO-MESTRE.md`

**Como foi provado:** cada fantasma foi confirmado **no código e no `git log -S`**, não por
leitura do item.

**Mudou em produção para quem:** ninguém. Zero código.

**🔴 TRÊS FANTASMAS — fechados sem escrever uma linha:**
- **9.29** era **o mesmo bug do A2/9.87**, com outro número. ⚠️ Dois números para um bug é como
  um deles fica aberto para sempre: o 9.29 era de ago/26 e o A2 nasceu da auditoria E2.1, sem
  ninguém cruzar as listas.
- **9.38** fechado por `ad8e016`. ⚠️ E o mais constrangedor: **o texto do 9.48 já dizia** *"o
  loadPosts ganhou cancelamento no 9.38"*. A prova estava escrita no item vizinho.
- **9.26** (`masterPassword` em texto puro) — a rota já usa `select` explícito, com comentário
  dizendo que o campo fica de fora.

**E três que mudaram de tamanho:** **9.3** encolheu (título corrigido no rename; resta a stack) ·
**9.71** foi de 7 para 6 `isStaffViewer` (o `like:39` saiu de carona no 9.72) · **9.41** tem
número stale — diz "2 cursos", produção tem 6, mas 4 têm **zero** grupo e o `ensureDefaultGroup`
resolve, então o caso real é **1**.

**⭐ O FENÔMENO, nomeado:** a fila **cresce enquanto encolhe**. Cinco grupos fechados produziram
seis itens novos — taxa de ~1 item por grupo. Isso **não é falha do processo, é o processo
funcionando**: num sistema nunca varrido, cada correção ilumina o vizinho. O que seria falha é
executar com o mapa velho. **O reagrupamento periódico é o custo de varrer um sistema pela
primeira vez** — e desta vez ele se pagou sozinho, fechando 3 itens.

**⚠️ E O QUE ESTE REAGRUPAMENTO NÃO COBRE:** o PLANO-MESTRE tem **~50 itens abertos**, mas a
triagem da Camada 3 sempre olhou **~26**. Os outros ~24 (blocos *Comunidade*, *QA &
Observabilidade*, *Débito*) **nunca passaram por triagem** e podem conter fantasmas iguais aos
três de hoje.

**Ficou aberto:** 8 grupos, ordem nova. **Estimativa: 8–10 sessões**, contando a taxa observada
de 1 item novo por grupo.

**⭐ A decisão de ordem que contraria a intuição:** o **9.98** (as 5 telas emitindo a URL do host
navegado) subiu para **primeiro**, à frente do 9.109 (2FA). Motivo: é **o único item da fila que
PIORA sozinho** — cada produtor que configura hoje grava a URL errada, e a dívida de migração
cresce. Risco estático perde para risco que acumula.

---

## 2026-08-17 — CAMADA 3, ETAPA E3.3 — Predicado por role, cego ao vínculo (9.72 · 9.69 · 9.88 · 9.108)

**Estado antes:** main em `55bfe38`

**O que foi feito:** quatro gates que decidiam por **`user.role` global** passaram a decidir pelo
**vínculo** com o curso/workspace. O quarto (**9.108**) não estava na lista — apareceu na
varredura da classe.

**Arquivos tocados:** `posts/[id]/like/route.ts` · `lessons/[id]/reaction/route.ts` ·
`courses/[id]/terms-status/route.ts` · `upload/route.ts` · `upload/signed-url/route.ts` ·
`lib/upload-access.ts` (novo) — **3 commits granulares**, build verde em cada.

**Como foi provado:**
- **Uma matriz serviu aos três**, 14/14: `colab-comunidade` curte post e reage a aula (**200**,
  antes 403) · `colab-lessons` sobe thumbnail nas duas portas (**200**, antes 403) · `colab-zero`
  **403** em tudo · `aluno-staging` e dono como controles · ⭐ `sem-vinculo` **403 nas duas
  portas do bucket** — a prova de que o **A2 não reabriu**.
- **9.69**: `dono-b` (PRODUCER do workspace B, aluno aqui) **passou a exigir** o aceite de termos;
  `aluno-staging` continua exigindo; dono do curso não exige.
- **Gate humano 5/5**, com efeito real: curtidas pela rota da comunidade, arquivo **persistido no
  Storage**, e o modal "Termos de uso" aparecendo para `dono-b` **pela porta do aluno**.

**SHA do merge:** `e3d5e62`  ·  **Rollback:** `git revert -m 1 e3d5e62`

**Mudou em produção para quem:** **colaboradores** — quem tem permissão de comunidade passa a
curtir post e reagir a aula; quem tem `MANAGE_LESSONS` passa a subir thumbnail. **Produtor de
outro workspace matriculado num curso alheio** passa a **ver o aceite de termos** (antes pulava).
Aluno e dono: **nada muda**. Ninguém a avisar — são portas que abriram para quem já tinha
direito, e uma que fechou para quem não tinha.

**Ficou aberto:** **9.109** 🔴 — `mfa/enroll` nega 2FA a colaborador.

**⚠️ PALCO SEMEADO NESTA ETAPA — a próxima faxina NÃO pode apagar:**
- **termos cadastrados no `curso-teste`** (via PUT, caminho real);
- **`dono-b` matriculado no `curso-teste`** — é **o retrato do 9.69**: PRODUCER do workspace B
  que, aqui, é só um aluno. Sem essas duas coisas o 9.69 é **intestável**, e a investigação
  chegou a registrar isso antes de executar.

**⭐ TRÊS ACHADOS QUE O TRABALHO PRODUZIU:**
1. **O 4º item (9.108)** — `lessons/[id]/reaction`, o "curtir" da aula, com a cegueira idêntica
   **nos dois handlers**. Apareceu por varrer o **arquivo inteiro**, não as linhas do item —
   exatamente como o `:353`.
2. **Uma variável com DUAS autorizações**, revelada pelo type check: `isStaff` decidia "pode
   reagir" **e** "vê a contagem de dislikes". Corrigir a primeira teria **aberto a segunda de
   carona**. Separada em `veDislikes`, que preserva quem via antes.
3. **Paridade declarada em comentário é promessa, não garantia**: as duas portas do bucket diziam
   *"Gate = PARIDADE com /api/upload"* e a mantinham por **cópia**. Virou `lib/upload-access.ts`.

⚠️ E uma observação sobre documentação: o `isStaff` **já avisava**, em `auth.ts:197-200`, citando
**nominalmente** o produtor de outro workspace e mandando usar `isCourseStaffOwner`. O comentário
estava certo há meses. **Documentação não substitui gate.**

**Regras conferidas:** §17 respondido ✅ · varredura do arquivo inteiro ✅ · irmão fechado no
mesmo fôlego ✅ · short-circuit ADMIN/dono ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-17 — CAMADA 3, ETAPA E3.5 — Telas de acesso e dias (9.60 · 9.57c)

**Estado antes:** main em `c359735` · 3 cópias do mesmo `onChange`, `expiresAt` sem validação

**O que foi feito:** o campo "Personalizado" de dias de acesso foi **redesenhado** (`type="text"`
com normalização própria, helper único nos 3 modais) e o servidor ganhou a validação que não
tinha (`expiresAt` com formato, futuro e teto). ⚠️ Foram **3 rodadas** até a causa completa —
duas correções minhas foram descartadas ou consertadas pelo caminho.

**Arquivos tocados:** `src/lib/days-input.ts` (novo) · `src/lib/validations.ts` ·
`enroll-student-modal.tsx` · `send-access-modal.tsx` · `edit-access-modal.tsx`

**Como foi provado:**
- **Simulação 16/16** com o helper **transpilado do fonte** (não uma cópia): `"30.5"` e `"30,5"`
  → **31 nos dois modelos de locale** · backspace esvazia e resolve para `null` · `"0"`→1 ·
  `"999999"`→36500 · `"abc"`→null · `"30,5,7"`→31 · blur de `"30,"`→`"30"`.
- **Sondas de servidor**: 9999 → **400** · passado → **400** · lixo → **400** · `null` → **200**
  gravando NULL · 90 dias → **200**. Nenhuma matrícula real alterada (as inválidas dão 400).
- **Gate humano 6/6 nos TRÊS modais**, com salvamento real: `30.5`→31 · `30,5`→31 · backspace
  esvazia (`value=""` conferido no DOM) e o botão trava com o motivo · campo limpo + `45`→45 ·
  Vitalício sem data e 90 dias com "Expira em 90d" · prévia não aparece com campo vazio.

**SHA do merge:** `e26e312`  ·  **Rollback:** `git revert -m 1 e26e312`

**Mudou em produção para quem:** **produtor**, nos 3 modais de acesso. O campo perde as setas
nativas (é `type="text"` agora) e ganha: aceitar `,` **e** `.`, esvaziar com backspace, e travar
o envio quando vazio. Aluno não sente nada — o que muda é o prazo passar a ser o que o produtor
digitou. Ninguém a avisar.

**Ficou aberto:** nada desta etapa.

**⚠️ TRÊS ERROS MEUS, REGISTRADOS PORQUE SÃO O APRENDIZADO DA ETAPA:**
1. **Modelo de locale errado.** Meu relatório de investigação afirmou que a **vírgula** era o
   caso quebrado e o ponto funcionava. É o **inverso** em pt-BR. Simulei em en-US **sem declarar
   a locale** e apresentei como medição. O agente de navegador mediu certo.
2. **Regressão introduzida e corrigida na mesma etapa.** A 1ª correção ("vazio preserva o
   anterior") tornou **impossível esvaziar o campo** — `value` controlado por número redesenha o
   valor antigo. Consertei o reset-para-1 e criei um campo que não limpa.
3. **A "solução óbvia" era 9× pior.** Bloquear a digitação do separador leva `"30.5"` a **305**
   em vez de 31, porque os dígitos vizinhos colam. Descartada **com número na mão**, e o porquê
   ficou no código.

⚠️ **A evidência de 12/08 do 9.60 (`30.5 → 15`) só faz sentido em locale en-US e NÃO foi
reproduzida em pt-BR** — fica marcada no item como **dado a reabrir, não a confiar**.

**Regras conferidas:** §17 respondido ✅ · helper único, sem 4ª cópia ✅ · servidor com a mesma
régua do client (`MAX_ACCESS_DAYS` compartilhado) ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-16 — CAMADA 3, ETAPA E3.2 — "A interface que mente" (9.86 · 9.85 · 9.94)

**Estado antes:** main em `98af3ae` · 26 implementações locais de `showToast`

**O que foi feito:** criada a **régua** de aviso (`useToast` + `mensagemDeErro`), adotada em 1
tela, e consertados os dois pontos onde a tela mentia sobre a causa: o botão de convite que não
dizia por que estava travado, e a home do aluno que traduzia "não consegui carregar" como "você
não comprou nada". **O grupo encolheu de 5 para 3 itens** — ver abaixo.

**Arquivos tocados:** `src/hooks/use-toast.tsx` (novo) ·
`src/app/producer/settings/collaborators/page.tsx` · `src/app/(dashboard)/page.tsx`

**Como foi provado:**
- **A régua com 4xx reais**: `400 {"error":"Selecione ao menos uma permissão"}` e
  `409 {"error":"Já existe um convite ativo para este e-mail"}` — e o humano confirmou por
  **interceptação de fetch** que a UI exibe **exatamente** a string do servidor.
- **9.94, os dois estados**: aluno logado → **200 + 1 curso** (o empty-state nem aparece) · sem
  sessão → **401** → *"Não foi possível carregar seus cursos"*. Antes os dois caíam no mesmo
  texto.
- **Regressão dos toasts não migrados**: 3 telas conferidas mantendo `showToast` local; na tela
  migrada, **6 chamadas preservadas e 0 implementação local restante**.
- **Gate humano**: as três réguas com texto exato, frase e `disabled` medidos **juntos** em cada
  transição · `PATCH → 200 + status REVOKED + toast` alinhados (nada de toast verde sobre chamada
  morta) · aluno vê os cursos com `hasAccess` true / `isStaffViewer` false, e a ausência de "não
  está matriculado" testada por **regex no `innerText`**.

**SHA do merge:** `c088eb3`  ·  **Rollback:** `git revert -m 1 c088eb3`

**Mudou em produção para quem:** **produtor** — o botão de convite agora diz o que falta, e o
erro de convite traz a frase do servidor em vez de "Erro ao salvar". **Aluno** — só se a home
falhar ao carregar: em vez de "você não está matriculado", lê "não foi possível carregar" com
"Tentar de novo". Caminho feliz **idêntico**. Ninguém a avisar.

**Ficou aberto:** **9.106** (adoção nas 25 telas restantes) · **9.107** (82 candidatos a erro
engolido — ⚠️ **triar antes de virar fila**).

**⭐ O GATE HUMANO ACHOU UM DEFEITO NA MINHA RÉGUA — o achado mais valioso da etapa:**
o roteiro que escrevi para o 9.85 **passava por VACUIDADE**. O modal abre com
`ACCESS_MEMBER_AREA` **já pré-marcada**, então "ao menos uma permissão" já está satisfeita na
abertura — o estado 2 nunca era exercitado, e o roteiro passava sem testar nada.
**Roteiro corrigido: "digite o e-mail E DESMARQUE a permissão que vem marcada".**
⚠️ Uma régua que passa sem exercitar o caminho é **pior que régua nenhuma**: dá falsa confiança.

**⚠️ O GRUPO ENCOLHEU — dois itens saíram, e por motivos diferentes:**
- **9.90 → FANTASMA.** Já estava consertado desde `d5414b7` (**07/08**), **uma semana antes de o
  item nascer**. Veio de relato de QA não conferido contra o repo. E eu piorei: no E3.0 escrevi
  *"o servidor responde 403 e a tela engole"* a partir de **sonda de API sem abrir o client** —
  metade medida, metade afirmada.
- **9.79 → fora do grupo.** A mentira é do **SERVIDOR**, não da tela: *"Não matriculado neste
  curso"* é frase **verdadeira e irrelevante** quando a causa é `ACCESS_MEMBER_AREA` revogada.
  Fix no servidor, teste outro, 3 rotas. Não compartilha nada com a família.

**⚠️ Resíduo deliberado no palco:** `qa-revogar-e30@staging.test` (status `REVOKED`) **fica** —
é o cenário que o **9.83** vai precisar. O elenco não foi tocado (12 ACCEPTED intactos).

**Regras conferidas:** §17 respondido ✅ · reuso do molde (`use-confirm`, `animate-fade-in-up`)
✅ · adoção contida com prova por tela ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-16 — CAMADA 3, ETAPA E3.1 — CVEs: 4 dos 5 HIGH fechados (9.101)

**Estado antes:** main em `b1936ba` · `npm audit` com 5 HIGH e 2 moderate

**O que foi feito:** bump de 4 dependências em **3 commits granulares** — `nanoid` 3.3.12→3.3.18
e `brace-expansion` 5.0.6→5.0.9 (transitivas) · `postcss` 8.5.14→8.5.26 · **`next` 16.2.6→16.2.12**,
que fecha os **9 advisories** do framework, entre eles o **bypass de middleware/proxy no App
Router** — a camada onde vivem o `proxy.ts` e o origin lock. O `sharp` **não fechou** e virou
item próprio.

**Arquivos tocados:** `package.json` · `package-lock.json` — **zero arquivo de código**.

**Como foi provado:**
- **Build verde após CADA bump**, não só no fim — commit granular só vale se cada degrau for
  válido sozinho.
- **Matriz de Regressão Padrão 21/21** com `.next` **apagado** antes de subir o palco (bump de
  framework exige recompilar do zero, senão se mede o build velho).
- **Superfícies específicas de cada pacote**: `next` → webhook responde 200 · gate sem sessão
  401 · middleware intercepta 307 · rota protegida redireciona. `sharp` → upload grava, serve, e
  o **otimizador `/_next/image` responde 200**. `postcss` → `.course-customized` presente e
  `--member-*` compiladas no CSS **servido** (169 KB), não no fonte.
- **Gate humano** no palco `e2ad8f9`: painel completo com console limpo · editor de aulas ·
  caminho do `sharp` ponta a ponta (objeto real no Storage, `200/image/png/4209 bytes`, persiste
  após reload) · área de membro **pelo gate de matrícula** (`hasAccess` true, `isStaffViewer`
  false, sem banner de staff), com **15 posts por canal na API e 15 no DOM** após esgotar o
  "Carregar mais".

**SHA do merge:** `29368ab`  ·  **Rollback:** `git revert -m 1 29368ab` (+ `npm ci` para
restaurar o lock)

**Mudou em produção para quem:** ninguém deveria sentir nada — é bump de dependência sem
mudança de código. O que muda é o **risco**: o bypass de middleware/proxy deixa de existir.

**Ficou aberto:** **9.105** 🔴 — o `sharp`.

**🔴 O `sharp` e por que ele NÃO fechou:** `next@16.2.12` exige `sharp@^0.34.5`; o advisory pede
`>=0.35.0`. **Não há conserto dentro do range que o Next declara.** A exposição foi **medida, não
assumida**: `next.config` otimiza imagens de `*.supabase.co` — onde vivem os uploads de usuário —
e 34 arquivos usam `next/image`, então imagem de aluno passa pelo libvips. Atenuante: desde o
9.87 o upload valida por **magic bytes**, então só entra imagem real — atenua, não fecha.
**Decisão do dono: esperar**, com check periódico. Forçar `overrides` trocaria risco **medido**
por risco **desconhecido** no pipeline de imagem de 22 mil alunos.

**⚠️ TRÊS RESSALVAS HONESTAS, registradas porque somem fácil:**
1. **A recompressão pelo `sharp` NÃO foi provada.** No teste ponta a ponta os bytes saíram
   **idênticos à origem** — o arquivo não foi re-encodado. Provou-se que o caminho não quebrou,
   **não** que o sharp processou.
2. **O player não fechou.** Monta, escolhe `youtube-nocookie`, passa `origin` correto, faz
   handshake com a IFrame API e lê metadados — mas parou em buffering no Chrome automatizado,
   com **zero requisições a `googlevideo`**. É camada de mídia do ambiente, não o código. Fica
   como o único item da matriz que **nenhuma automação fecha** — precisa de olho humano.
3. **RP6 acusou 🔴 e era artefato meu**: escolhi `integrations/status` achando ser owner-only —
   é `requireStaff()` e devolve `{"connected":false}`, sem segredo. Refeito em `applyfy-tokens` e
   `hubla-secrets` → **403**. O `git diff main -- src/` vazio já provava que não podia ser
   regressão.

**Regras conferidas:** §17 respondido ✅ · commits granulares com build por degrau ✅ · `.next`
limpo antes de medir ✅ · gate humano ✅ · papelada ✅

---

## 2026-08-16 — CAMADA 3, ETAPA E3.0 — Fidelidade do elenco de staging (9.91 + 9.93)

**Estado antes:** main em `66a80e4` · staging com 19 users, 5 posts, 1 grupo por curso

**O que foi feito:** o elenco passou a **espelhar produção** e ganhou a persona que faltava.
Além do caso conhecido, foi feita uma **varredura sistemática**: para cada coluna anulável de
`User`, `Enrollment`, `Collaborator`, `Workspace` e `Course`, mediu-se quantos registros REAIS
de produção têm nulo — e onde produção tem **0 de N**, o staging não pode ter. Também foi
montado o **palco** que os grupos seguintes exigem.

**Arquivos tocados:** `scripts/seed-staging.mjs` (único; +~90 linhas) — dados de teste, zero
código de produção.

**Como foi provado:**
- **Varredura de fidelidade:** `User.workspaceId` foi a **única** divergência em ~89 colunas
  anuláveis analisadas (produção **0/22.449** nulos · staging 1/5). Corrigida. ⭐ O item 5 do
  comando perguntava se havia outros: **não havia** — resposta negativa, mas medida.
- **Semântica confirmada antes de escrever:** em produção, `workspaceId` == workspace do curso
  matriculado em **24.022 de 24.436** pares (98,3%); os 414 restantes são aluno com curso em
  outro ws, normal em multi-workspace. A regra é *"o workspace onde o aluno entrou"*.
- **`sem-vinculo@staging.test` criado pela ROTA PÚBLICA** (`register-producer`, 201) e conferido:
  `ws=0 cursos=0 matrículas=0 colaborações=0`, login OK.
- **Idempotência:** seed rodado **2×**; a segunda convergiu inteira ("já existia" em todas as
  linhas), com contagens idênticas e zero duplicata.
- **Palco:** 2 grupos × **14 posts APPROVED** cada (o "Carregar mais" existe) + **1 PENDING por
  grupo** + 3 comentários PENDING + 1 convite REVOKED.

**SHA do merge:** `b1936ba` (commit direto na main — só dados de teste e seed)  ·  **Rollback:** o seed é idempotente e versionado

**Mudou em produção para quem:** ninguém. Só staging.

**⚠️ TRÊS ACHADOS QUE O COMANDO NÃO PREVIA:**
1. 🔴 **3 órfãos em `auth.users`** (`aluno-b-qa-storage`, `aluno-b2`, `sem-vinculo`) — restos dos
   meus próprios testes. **Apagar a linha do Prisma não apaga o usuário do Supabase Auth.** O
   órfão muda o ramo do `register-producer` ("email já cadastrado") e envenena o teste seguinte.
   Removidos; **o seed agora confere `auth.users × Prisma` no fim** e denuncia órfão.
2. ⚠️ **A moderação está LIGADA no `curso-teste`**, então os 26 posts semeados nasceram
   `PENDING` — o aluno via **4**. Semear sem aprovar teria entregue um palco onde o 9.48 é
   **intestável**. O seed passou a aprovar pelo caminho real da moderação, **deixando 1 PENDING
   por grupo de propósito** (que é o palco do 9.90).
3. ⭐ **O 9.90 é bug de CLIENTE, não de servidor** — provado ao montar o palco: o servidor
   responde **403 com `{"error":"Post aguardando aprovação"}`**, mensagem correta e específica.
   Quem engole é a tela. Isso **estreita o item** e muda onde procurar.

**O ELENCO (handoff de QA — papel + permissões + escopo + o que DEVE e NÃO DEVE alcançar):**

| persona | papel | permissões | escopo | matrícula | DEVE alcançar | NÃO deve |
|---|---|---|---|---|---|---|
| `producer-staging` | DONO `staging-teste` | — | — | — | tudo do ws A | ws B |
| `dono-b` | DONO `workspace-b-staging` **+ colab no A** | A:`MANAGE_COMMUNITY,VIEW_ANALYTICS` | todos | — | tudo do B · moderação e analytics do A | conteúdo/alunos do A |
| `admin-staging` | ADMIN plataforma | — | — | — | tudo | — |
| `aluno-staging` | STUDENT | — | — | `curso-teste` ACTIVE | curso A, comunidade A, materiais A | qualquer coisa do B |
| `aluno-b` | STUDENT | — | — | `curso-b` ACTIVE | curso B | **publicar no A (403)** |
| `faxina-teste-1/2/4` | STUDENT | — | — | `curso-teste` ACTIVE | igual ao `aluno-staging` | ws B |
| `colab-comunidade` | colaborador | `MANAGE_COMMUNITY,ACCESS_MEMBER_AREA` | 1 curso | — | moderar e entrar na comunidade | dinheiro, alunos, aulas |
| `colab-modonly` | colaborador | `MANAGE_COMMUNITY` **sem** `ACCESS_MEMBER_AREA` | 1 curso | — | fila de moderação | **entrar na área de membros** |
| `colab-reply` | colaborador | `REPLY_COMMENTS,ACCESS_MEMBER_AREA` | 1 curso | — | responder comentários | excluir post alheio |
| `colab-lessons` | colaborador | `MANAGE_LESSONS` | todos | — | editar aulas e materiais | dinheiro, comunidade |
| `colab-students` | colaborador | `MANAGE_STUDENTS` | todos | — | matricular/exportar alunos | dinheiro, aulas |
| `colab-dash` | colaborador | `VIEW_DASHBOARD,ACCESS_MEMBER_AREA` | 1 curso | — | KPIs de receita | relatórios, gestão |
| `colab-analytics` | colaborador | `VIEW_ANALYTICS,ACCESS_MEMBER_AREA` | 1 curso | — | engajamento/progresso | **dashboard financeiro** |
| `colab-automations` | colaborador | `MANAGE_AUTOMATIONS` | todos | — | automações | resto |
| `colab-escopo` | colaborador | `MANAGE_STUDENTS,MANAGE_LESSONS` | **1 curso só** | — | só o curso do escopo | **o outro curso do mesmo ws** |
| `colab-duplo` | colaborador nos **2** ws | A:`REPLY_COMMENTS` · B:`MANAGE_COMMUNITY` | todos/todos | — | o que cada ws dá | trocar poder de um ws no outro |
| `colab-zero` | colaborador | **nenhuma** | 1 curso | — | **nada além de existir** | tudo |
| `colab-revogado` | convite `REVOKED` | `REPLY_COMMENTS` | todos | — | **nada** | tudo |
| ⭐ `sem-vinculo` | PRODUCER sem nada | — | — | — | **NADA** — é o atacante padrão | tudo |

⚠️ **A coluna "NÃO deve" é o ponto da tabela.** Sem ela, um handoff descreve o vínculo e não o
poder — foi assim que `dono-b` virou "IDOR cross-tenant confirmado" que não existia.

**ESTADO DO PALCO:**
```
curso-teste      comunidade=ON  moderação: comunidade=ON  aulas=ON   ← as duas LIGADAS de propósito
curso-teste-2    comunidade=ON  moderação: off/off
curso-b          comunidade=ON  moderação: off/off
grupo curso-teste/geral            READ_WRITE  14 posts visíveis  (+1 PENDING)
grupo curso-teste/turma-avancada   READ_WRITE  14 posts visíveis  (+1 PENDING)
grupo curso-b/geral                READ_WRITE   1 post
comentários PENDING: 3 · convites REVOKED: 1 · auth.users=20 = Prisma=20
⚠️ cores do membro NULAS no curso-teste (o `.course-customized` não entra)
```

**Ficou aberto:** nada desta etapa. O 9.90 fica **mais preciso** (é client-side) para o E3.2.

⚠️ **Falso positivo registrado na validação por agente:** a contagem de posts do palco foi feita
por **padrão de texto** ("Post de palco N") e acusou faltando — porque há posts semeados fora
desse padrão. **Contar pela API, não pelo DOM nem por regex de conteúdo**: o número certo veio de
`/api/posts?courseSlug=…` (15 por canal), e o DOM confirmou 15 após esgotar o "Carregar mais".
Sonda que depende do texto do seed quebra assim que alguém posta fora do molde.

**Regras conferidas:** prova dupla de `SUPABASE_REF` em todo bloco ✅ · escrita só em staging ✅ ·
tudo pelo caminho real (nenhum `insert` direto para criar) ✅ · idempotência provada por 2ª
rodada ✅ · papelada ✅

---

## 2026-08-16 — 📌 REAGRUPAMENTO DA CAMADA 3 — não é etapa fechada

> Registro de trabalho de **planejamento**, não de código. Nenhum item foi consertado.

**Estado antes:** main em `4a404f2` · Camada 3 com 4 etapas (E3.1–E3.4) desenhadas quando a
fila tinha 8 itens — e ~26 itens abertos de fato.

**O que foi feito:** recap item a item **pelo PLANO-MESTRE** (não pela memória) e
reagrupamento por **afinidade real**: mesma causa, mesmo arquivo, ou mesma matriz de prova.
Resultado: **10 grupos** (E3.0–E3.9) no lugar dos 4 antigos, com ordem recomendada e o porquê
de cada posição. Tabela §8 do roadmap reescrita para refletir **grupos**, não itens soltos.

**Arquivos tocados:** `docs/ROADMAP-EXECUCAO.md` (seção Camada 3 + tabela §8) ·
`docs/PLANO-MESTRE.md` (4 itens novos + 2 remarcações)

**Como foi provado:** os 26 itens da lista foram conferidos um a um contra o PLANO-MESTRE —
**todos existem e estão abertos**, nenhum fantasma. Os três achados residuais da E2.1 foram
**medidos agora**, não copiados: `npm audit` → **5 HIGH** (`next`, `sharp`, `postcss`, `nanoid`,
`brace-expansion`, todos com fix sem *major*) · HSTS vivo → `max-age=2592000`, sem
`includeSubDomains` · rate-limit → **20 de 197** rotas.

**Mudou em produção para quem:** ninguém. Zero código.

**⚠️ O recap corrigiu quatro coisas que a lista assumia:**
1. **Os 3 achados da E2.1 não existiam como itens numerados** — viviam em prosa no roadmap.
   Viraram **9.101** (CVEs), **9.102** (HSTS), **9.103** (cobertura de rate-limit). E ⚠️ não são
   reabertura do 2.1/2.2, que estão `[x]` — são **residuais novos**.
2. **9.65 não é trabalho pendente** — o próprio item diz "APROVADO como está no ínterim" com
   validação humana de 12/08. Estava ocupando fila como se fosse conserto. Marcado `[x]`.
3. **9.82 depende do épico 9.74** — os efeitos que ele lista (`resolveStaffWorkspace`,
   `getStaffCourseIds`) são exatamente o que o épico reescreve. Movido.
4. **Os órfãos do storage não tinham número** — viraram **9.104**.

**⚠️ Grupos que a lista sugeria e a leitura REFUTOU:**
- **9.93 não é "dívida do storage"** — é fidelidade do **elenco**, e vai com o 9.91 (mesmo
  arquivo, `scripts/seed-staging.mjs`).
- **9.100 não é "polimento de UI"** — é ação manual de 10 segundos fora do código.
- **9.85 e 9.86 não são UI de colaboradores** — são da família "a interface mente sobre a
  causa", que é transversal.
- **9.64 não é família de permissões** — a causa é validação de schema, e o teste é outro.

**⭐ A decisão de ordem que contraria a intuição:** o **E3.1 (CVEs)** ficou em 2º, à frente de
todos os bugs de permissão. Motivo: o advisory do `next` é **bypass de middleware/proxy no App
Router**, e este app tem `proxy.ts` e o origin lock nessa camada. Um bypass de framework vale
mais que uma permissão larga demais concedida a gente que o produtor convidou.

E o **E3.0 (elenco)** ficou em 1º por ser o **instrumento**: um elenco enviesado já fabricou um
achado falso de segurança que custou um ciclo inteiro (9.93).

**Ficou aberto:** os 10 grupos, nenhum executado. **9.95** precisa de investigação própria
(medir custo de streaming) antes de virar faxina.

---

## 2026-08-16 — RENAME DO PROJETO — o produto passa a se chamar Members Club em tudo que se vê

**Estado antes:** main em `8906d25` · repo `applyfy-mvp` · remote local no nome antigo

**O que foi feito:** rename **de exibição**, precedido de uma investigação de risco que mudou o
escopo. Trocaram de nome: `package.json` (`"projeto"` → `"members-club"`), o README (título + 9
menções ao **produto**) e o SYSTEM-MAP, que ganhou uma seção **§0 O NOME** com a nota histórica.
O repositório foi renomeado no GitHub para **`members-club`** (1.398 commits, `main` intacta) e o
remote local atualizado. **Nada funcional foi tocado.**

**Arquivos tocados:** `package.json` · `README.md` · `docs/SYSTEM-MAP.md` (merge `69aeb23`) ·
`docs/PLANO-MESTRE.md` (docs `8906d25`) · `docs/01-knowledge-base.md` + a skill do repo (URL do
repo, nesta entrada)

**Como foi provado:**
- `git diff --name-only src/` → **zero arquivo**. Nenhuma rota, schema, env ou config no diff.
- Cada uma das 9 trocas no README verificada como **ocorrência única** antes de aplicar (troca
  ambígua abortaria o script).
- As linhas do diff que citam `APPLYFY_*`, `WorkspaceApplyfyToken` e `/api/webhooks/applyfy` são
  **todas `+` na prosa das notas novas** — coladas uma a uma na conferência.
- Os dois exemplos `SEU-APP.vercel.app` viraram `app.mymembersclub.com.br` com o **caminho da
  rota preservado byte a byte**.
- Remote novo provado por comportamento: `git fetch` + `git status -sb` em sincronia, e **este
  push** é a prova final. Redirect do nome antigo conferido: **301 →
  `github.com/viniciusxavierbmx2016/members-club`**.

**SHA do merge:** `69aeb23`  ·  **Rollback:** `git revert -m 1 69aeb23` (só texto)

**Mudou em produção para quem:** **ninguém.** Zero código, zero config, zero comportamento.

**⛔ AS DUAS DECISÕES DE NÃO-FAZER (o mais importante desta entrada):**
1. **O projeto na Vercel NÃO foi renomeado.** `applyfy-mvp.vercel.app` está **ATIVO** (Valid
   Configuration em Domains) e produtores mandam webhook de **venda** para ele — renomear
   quebraria a liberação de acesso: **o aluno paga e não recebe o curso.**
2. **O gateway Applyfy permanece INTACTO** em tudo (`APPLYFY_*`, rota, tabela, schema, telas).
   ⚠️ E o motivo não é "nome legado": é um **produto de pagamento do próprio Vinicius**,
   integrado ao Members Club. **Produtos distintos que se integram** — a coincidência de nome é
   histórica, a separação é real e permanente.

**⭐ ACHADO DE MÉTODO:** busca-e-substitui cega teria renomeado **uma PESSOA** — o handle
`applyfybr`, colaboradora do `shop-club` e persona-alvo do 9.74 — dentro da documentação do
épico, além de derrubar o gateway. Classificar **ocorrência por ocorrência** revelou que toda
menção a "applyfy" no repo é uma de **quatro** coisas, e **nenhuma é o nome do produto**: o
gateway · o hostname da origem · a URL do repositório · o handle de uma pessoa. Em `docs/` o
resultado foi **nada a renomear**.

**Confirmado na investigação (Etapa 1):** `NEXT_PUBLIC_APP_URL` de **Production e Preview** já
aponta para `app.mymembersclub.com.br` — os links de e-mail (acesso, reset, convite) estavam
corretos e não dependiam do hostname da Vercel.

**Ficou aberto:** **9.98** 🔴 (as 5 telas emitem a URL do webhook a partir de
`window.location.origin` — pré-requisito do B.2 e de qualquer rename futuro na Vercel) ·
**9.99** 🟢 (o carimbo do Cloudflare é menos confiável do que a B.1 registrava) · **9.100** 🟢
(campo "About" do GitHub).

**Regras conferidas:** §17 respondido ✅ · escopo travado provado linha a linha ✅ · build verde
✅ · papelada ✅ · nenhuma mudança funcional ✅

---

## 2026-08-14 — CAMADA 2, STORAGE PARTE 2 · PASSO 2 — Flip do bucket (o A1 fechou)

**Estado antes:** main em `2ba455d` · bucket `materials` `public=true`, sem teto

**O que foi feito:** o segundo e último passo do **A1**. Um merge de preparo (a rota do painel
deixa de devolver `fileUrl`) e, depois dele em produção, **uma chamada de config**:
`{ public: false, file_size_limit: 52428800 }`. **Material de curso não está mais em URL aberta.**

**Arquivos tocados:** `api/producer/lessons/[id]/materials/route.ts` ·
`components/lesson-materials.tsx` *(+ a config do bucket, que não é arquivo)*

**Como foi provado:**
- **O portão, antes de qualquer coisa** — `SELECT count(*) FILTER (WHERE "fileUrl" !~
  '/object/public/materials/')` → **0 de 148**. Se desse > 0, cada linha viraria "Material
  indisponível" no instante do flip. Também: 0 registro sem objeto · 148/158 idênticos à medição
  de 14/08 (nada entrou no meio).
- **Estado do bucket registrado ANTES** (é o alvo do rollback): `public=true`,
  `file_size_limit=null`.
- **Depois do PATCH, na ordem:** (a) URL pública **morreu** · (b) URL assinada serve com
  **bytes = `fileSize`** em 3 materiais (8,7 MB · 3 KB · 6 KB) · (c) rota do app **401** sem
  sessão contra **404** em rota inexistente.
- **Staging antes do merge de preparo:** painel devolve `id, name, fileName, fileSize, fileType,
  sortOrder` — sem `fileUrl`, sem `object/public` no corpo — e o aluno seguiu baixando (200 ·
  124.232 bytes).

**SHA do merge:** `71a7692`  ·  **Rollback:** `git revert -m 1 71a7692` (código) **+**
`PATCH { public: true, file_size_limit: null }` (config, uma chamada, efeito imediato)

**Mudou em produção para quem:** **13 produtores · 17 cursos · 86 aulas · 148 materiais.** O
aluno baixa igual, pelo mesmo botão. **Risco assumido pelo dono:** links públicos que alguém
tenha copiado à mão pararam de funcionar — a URL não ia por email, notificação nem export
(varredura = zero), e o material segue acessível pelo app. Ninguém a avisar.

**Ficou aberto:** **9.97** (`fileUrl` guarda URL em vez de path — dois parses por regex e um
gêmeo no DELETE) · e o **teste humano final**: baixar um material em produção como aluno.

⚠️ **A pegadinha que quase virou falso alarme:** na primeira passada da prova (a), **1 dos 3
objetos ainda devolveu 200**. Não era flip incompleto — era **cache de borda da Cloudflare**.
Furando o cache (query nova, `no-cache`, `HEAD`) veio 400, e a varredura completa deu
**148/148 mortas**. Tornar um bucket privado **não** mata a URL pública no mesmo instante para
quem a tem em cache: a exposição decai com o TTL da borda.

⚠️ **A FASE 2 ficou parada esperando uma prova que eu não conseguia fazer:** confirmar que o
merge de preparo estava publicado. Três marcadores falharam — hash de chunks (a mudança removeu
só uma *declaração de tipo*, e o bundle saiu byte-idêntico), `/login` (vinha do cache da Vercel)
e `age` do prerender (sinal, não prova); `gh` não está instalado e não há token. Quem confirmou
foi o humano, no painel. **Fica a lição: sem um marcador de deploy observável, "está em
produção?" não é pergunta que eu responda sozinho.**

**Regras conferidas:** §17 respondido ✅ · portão de inventário ✅ · rollback armado no próprio
script ✅ · prova dupla de REF ✅ · papelada ✅

---

## 2026-08-14 — CAMADA 2, STORAGE PARTE 2 · PASSO 1 — Download de material por URL assinada

**Estado antes:** main em `3587505`

**O que foi feito:** o achado **A1** (bucket `materials` público) em dois passos. Este é o
**Passo 1, só código**: rota nova que assina o material por **900s** e redireciona, e a API de
materiais deixa de devolver `fileUrl`. **O bucket segue PÚBLICO de propósito** — é o que faz o
rollback não ter janela de quebra. Entraram junto dois acertos: nome de arquivo sanitizado (o
aluno recebia `a%CC%80s` no lugar de `às`) e sinal visual no clique.

**Arquivos tocados:** `api/lessons/[id]/materials/[materialId]/download/route.ts` (novo) ·
`lib/lesson-access.ts` (novo) · `lib/materials-constants.ts` ·
`api/lessons/[id]/materials/route.ts` · `(course)/course/[slug]/lesson/[id]/page.tsx`
*(5 arquivos, não os 3 previstos: os 2 novos de `lib/` são a consequência mecânica de "reusar o
gate e o regex" — reuso exige lugar comum. Molde: `lib/ticket-access.ts`.)*

**Como foi provado:**
- **Matriz de matrícula 9/9**, com o `Enrollment` lido do banco **antes de cada sonda** e colado
  ao lado: `ACTIVE` → **302** · `CANCELLED` → **403** · `EXPIRED` → **403** · `ACTIVE` com
  `expiresAt` no passado → **403** · com `expiresAt` no futuro → **302**. Rota irmã de listagem
  **concorda nos 4 estados**. ⭐ Aluno que cancelou **não** continua baixando. Estado da persona
  restaurado idêntico ao original (`try/finally`).
- **Sondas**: material de outra aula → **404** · id inexistente → **404** · anônimo → **401** ·
  token adulterado → **400** · **TTL lido do `exp` do JWT = 900s**. Bytes baixados == `fileSize`
  do banco e idênticos aos da URL pública.
- **Controle do rollback**: a `fileUrl` pública **ainda responde 206** neste passo — é o que
  garante `git revert` sem janela.
- **Produção (leitura)**: 3 materiais reais, incluindo nome com acento e com espaço, assinam e
  entregam bytes idênticos.
- **Reprova dos acertos**: o arquivo chega ao disco como
  `Captura_de_Tela_2026-08-11_as_20.14.36.png`, **593.600 bytes**, sem nenhum `%` de encoding.
- **Gate humano 4/4** pela porta do aluno (`/w/staging-teste`): dois materiais baixaram, painel
  do produtor intacto, e link sem cookies → **401 JSON, nenhum arquivo**.

**SHA do merge:** `21e4969`  ·  **Rollback:** `git revert -m 1 21e4969`

**Mudou em produção para quem:** o aluno passa a baixar por uma rota do app em vez da URL do
objeto — o arquivo é o mesmo e o clique é o mesmo. **Muda o nome do arquivo salvo**: acento vira
letra simples e espaço vira `_` (`às` → `as`). Ninguém a avisar. O bucket **não** mudou.

**Ficou aberto:** **9.93** seed sem `User.workspaceId` · **9.94** `/api/courses` vazio silencioso
· **9.95** redirect entrega o aluno ao Supabase (e é o que resolveria o acento).
⚠️ **O Passo 2 (flip do bucket para privado + teto de 50 MB) segue 🔴 aberto** e só acontece
depois deste em **produção**, com download real validado lá.

**Duas correções de rota, registradas:**
1. A correção prescrita para o nome era **NFC**. A medição a **refutou** — NFC continua saindo
   `%C3%A0s`, porque a dupla codificação está no Storage e atinge qualquer caractere que precise
   de encoding. Entrou `sanitizeFileName`, e a mensagem do commit foi corrigida para não afirmar
   NFC (commit que diz uma coisa e código que faz outra é item-fantasma em miniatura).
2. O **"503 da signed URL" não existe** — três provas independentes no item 9.92. A causa do
   alarme foi a ausência de sinal no clique: a aba pisca e fecha (comportamento **correto** de um
   `attachment`), e o humano clicou 5×. O sinal visual entrou por isso.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅ ·
7 perguntas (2 helpers extraídos, zero abstração nova) ✅ · caminho destrutivo não tocado ✅

---

## 2026-08-14 — CAMADA 2, STORAGE PARTE 1 — Fechar a torneira (`community/upload`)

**Estado antes:** main em `febcfad`

**O que foi feito:** o achado **A2** da auditoria E2.1 — `POST /api/community/upload` tinha
`getCurrentUser()` como **único** gate, e escrevia num bucket público sem checar vínculo, sem
rate-limit e validando mime pelo header que o cliente escolhe. A rota passou a exigir **vínculo
real** com a plataforma, ganhou o rate-limit do helper da casa, teto de tamanho no servidor e
**allowlist de mime por assinatura de bytes** — com a extensão gravada derivada do conteúdo,
não do nome enviado.

**Arquivos tocados:** `src/app/api/community/upload/route.ts` (único; +127/−36)

**Como foi provado:**
- **Matriz 14/14** em staging (`wxynnsyartxcvglqwmdw`, impresso antes de cada bloco). Legítimos
  **200**: aluno matriculado (A e B), `colab-comunidade`, `colab-modonly`, `colab-reply`,
  ⭐ `colab-lessons` (o caminho do produtor), dono, `dono-b`, ADMIN. Negados **403**:
  `colab-zero`, `colab-students`, `colab-analytics` — e o **atacante do A2**, uma conta criada
  na hora por `/api/auth/register-producer` (rota pública, **201**, nascida com 0 workspace,
  0 curso, 0 matrícula). Anônimo **401**.
- **Fronteira de contexto** (o desenho escolhido): `aluno-b` sobe **200**, publica no curso A
  **403** *"Não matriculado neste curso"*, publica no próprio B **201**.
- **Sondas**: 6 MB → **413** · PDF, EXE (`MZ`) e SVG **declarados `image/png`** → **415** ×3 ·
  SVG honesto → **415** · rajada → **429** na #99, `Retry-After: 17`, `X-RateLimit-Limit: 100`.
- **Marcador positivo por tipo**: PNG/JPEG/GIF/WebP enviados como `application/octet-stream`
  e **sem extensão no nome** gravaram `.png/.jpg/.gif/.webp`.
- **Controle crítico**: post com `<img>` publica (201), sobrevive ao sanitize, volta no feed, e
  a URL pública serve **70 bytes, `image/png`, idênticos aos enviados**.
- **Gate humano 5/5** no palco `e92a68b`: (1) post com imagem renderiza · (2) comentário e
  resposta com imagem, 201 · (3) editar post trocando imagem, persiste após reload ·
  (4) ⭐ **produtor insere imagem na descrição de aula — o irmão fora da comunidade não quebrou**
  · (5) PDF barrado no client com a mensagem certa, em vermelho, sem sair requisição.

**SHA do merge:** `af28974`  ·  **Rollback:** `git revert -m 1 af28974`

**Mudou em produção para quem:** ninguém legítimo perde nada — todos os 5 call-sites do
`RichTextEditor` foram mapeados antes e cobertos. **Passa a levar 403**: conta autenticada sem
nenhum vínculo (o alvo do fix) · colaborador `ACCEPTED` **sem** `MANAGE_COMMUNITY`,
`REPLY_COMMENTS` ou `MANAGE_LESSONS` · **PRODUCER recém-registrado sem workspace** (aprovado
pelo dono: sem workspace não há curso, logo não há caminho legítimo). Ninguém a avisar.

**Ficou aberto:** **9.88** portas irmãs do bucket gateadas por `role` (cegas ao híbrido) ·
**9.89** rate-limit por contagem e não por peso (~500 MB/min por IP) · **9.90** comentário em
post `PENDING` falha em silêncio (achado humano) · **9.91** seed sem persona sem-vínculo.
⚠️ **A1 (bucket `materials` público e sem teto) segue 🔴 aberto — é a Storage Parte 2.**

**Efeito colateral no staging (registrado):** `aluno-b@staging.test` ganhou a senha do elenco
no ws B, usando `generateSalt`/`hashPassword` de `src/lib/workspace-auth.ts` (nunca cripto
replicada). O login dele falhava desde a varredura de QA e **envenenava sondas** — foi a origem
do falso positivo de IDOR. Contas `sem-vinculo` e `aluno-b2` criadas e apagadas (`count=0`);
posts de teste removidos.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ · papelada ✅ ·
7 perguntas (reuso do `rateLimit` e dos helpers de gate, zero abstração nova) ✅ ·
irmãos mapeados antes do fix ✅

---

## 2026-08-14 — 📌 VARREDURA DE QA (staging) + TRIAGEM — não é etapa fechada

> Registro da varredura exploratória (trilha paralela, §7 do roadmap) e da
> triagem dos 7 achados. Nenhum código tocado; os itens nasceram no PLANO-MESTRE.

**Estado antes:** main em 5eacfc8 · palco de staging no ar (19 users, 2 workspaces)

**O que foi feito:** varredura de QA no painel do produtor, com as personas do
E0.3. Sete achados reportados, todos triados com investigação própria antes de
virar item.

**O resultado da triagem:**

| # | achado do QA | veredito |
|---|---|---|
| 1 | "IDOR cross-tenant em `/api/courses/[id]`" | 🔴 **FALSO POSITIVO, refutado com prova** → nota no **9.81** |
| 2 | dono se autoconvida e vira colaborador de si mesmo | ✅ real → **9.82** 🟠 |
| 3 | workspace de colaboração não aparece no seletor | já conhecido → é o **9.75**, sem item novo |
| 4 | convite revogado não reativa; sem botão | ✅ real → **9.83** 🟢 |
| 5 | tabela não responsiva no mobile | ✅ real → **9.84** 🟢 |
| 6 | botão desabilitado sem motivo | ✅ real → **9.85** 🟢 |
| 7 | textos de erro sem padronização | ✅ real → **9.86** 🟢 |

**+ 1 achado que o QA não viu e a investigação encontrou:** a rota devolve
`videoUrl` de todas as aulas a quem tem qualquer permissão do `anyOf` — em
produção, **1.833 aulas, 100% com vídeo, 3 colaboradores nessa condição**. É o
conteúdo do **9.81**.

**Como foi provado (o falso positivo):** a persona `dono-b` **tem** vínculo
`ACCEPTED` no workspace A com `MANAGE_COMMUNITY` — foi criada assim no E0.3. O
200 é por desenho. A prova do contrário é `aluno-staging`: sessão válida, **zero
linha de `Collaborator`**, recebe **403**.

**✅ O que veio LIMPO na varredura** (vale tanto quanto o que veio sujo): painel
do **admin**, área do **aluno**, e **10+ trocas de conta** sem vazamento de
estado entre sessões.

**Arquivos tocados:** docs/PLANO-MESTRE.md · docs/DIARIO-EXECUCAO.md — zero código
**SHA do merge:** n/a (commit direto na main, só docs) · **Rollback:** `git revert`
**Mudou em produção para quem:** ninguém
**Ficou aberto:** 9.81 🟠 · 9.82 🟠 · 9.83/9.84/9.85/9.86 🟢 — todos → Camada 3
**Regras conferidas:** §17 n/a (zero código) ✅ · staging-only ✅ · papelada ✅

⚠️ **Lição de processo desta varredura:** o handoff descrevia `dono-b` como
"dono do B **e** colaborador no A", e o agente usou a persona como "sem vínculo
no A". Handoff de QA precisa listar, por persona, **papel + permissões exatas +
escopo + o que ela DEVE e NÃO DEVE alcançar** — senão o relatório vira caça a
buraco inexistente. Virou memória permanente.

## 2026-08-14 — CAMADA 1 FECHADA, ETAPAS E1.1 + E1.2 — Bug do convite

**Estado antes:** main em 3a447ab

**O que foi feito:** investigado (E1.1) e corrigido (E1.2) o bug que travava o
aceite de convite quando o link era aberto num navegador com **outra conta
logada** — só funcionava em janela anônima, e ninguém sabia disso. A causa era
**ordem de checagem**: `accept/route.ts` lia o `mode` em `:33` e só o consultava
em `:81`, então o ramo de sessão (`:38-49`) interceptava o signup antes. O fix
despacha por modo **antes** da sessão, com condição composta, e a página passou a
avisar quando a sessão é de outra pessoa.

**Arquivos tocados:** `src/app/api/invite/[id]/accept/route.ts` ·
`src/app/invite/[id]/page.tsx`

**Como foi provado:** matriz de **6 cenários** antes/depois em staging, mais um
**teste de segurança** dedicado e verificação no banco:

```
(c) sessão de TERCEIRO + signup      400 → 200 created ✅   (sem janela anônima)
    ↳ userId gravado no vínculo      CONVIDADO (nunca o terceiro)
    ↳ pós auto-login, a sessão é     do convidado (o cookie É substituído)
(a) 200 created · (b) 409 useLogin · (d) 200 · (e) 200 (NÃO virou 409) ·
(f) revogado 400 / já aceito 200 alreadyAccepted
🔴 SEGURANÇA: A faz BIND no convite de B → 400, linha PENDING sem userId
Todos idênticos antes e depois, exceto o (c).
```

Humano: cenário (c) real, **sem anônima** — aviso âmbar apareceu, "Criar conta e
aceitar convite" funcionou, e terminou logado como o convidado. Bônus: reabrir o
link consumido mostrou "Convite já aceito", confirmando o (f) por acidente.

**SHA do merge:** 6510db1 · **Rollback:** `git revert -m 1 6510db1`

**Mudou em produção para quem:** ninguém perde nada — o fix só **destrava** um
caminho que antes recusava. Convidados futuros deixam de precisar de janela
anônima. Nenhum aviso a produtores é necessário.

**Ficou aberto:** ⚠️ **lacuna conhecida, baixo risco** — o botão "Sair e aceitar
como…" **não foi exercitado por humano** (o link já estava consumido quando se
pensou nele). Os dois comportamentos que ele compõe (logout · permanecer na
página do convite) foram provados isoladamente. Decisão do dono: não gerar
convite novo só para isso.

**Regras conferidas:** §17 respondido ✅ · staging-first ✅ · gate humano ✅ ·
papelada ✅

⭐ **Descoberta registrada no 9.80:** **convite NÃO EXPIRA** neste sistema —
`Collaborator` tem `invitedAt` e `acceptedAt`, sem `expiresAt`, e nenhuma rota
calcula idade. Elimina "convite expirado" de diagnósticos futuros.

## 2026-08-14 — 📌 DECISÃO REGISTRADA (não é etapa fechada) — CAMADA 4, ETAPA E4.3 criada

> ⚠️ **Esta entrada não fecha etapa nenhuma.** O diário registra fato, e o fato aqui é
> **a decisão de produto**, não uma implementação. A E4.3 nasce ⬜ pendente. Os campos do
> formato §2 que só fazem sentido para etapa executada estão marcados **n/a**.

**Estado antes:** main em e406309
**O que foi feito:** registrada a etapa **E4.3 — colaborador assistir aos cursos sem ocupar
matrícula** na Camada 4 do roadmap, com a decisão do dono e o que precisa ser investigado
antes de qualquer código.

**A decisão (13/08):**
- **Problema observado:** o colaborador com `ACCESS_MEMBER_AREA` entra na vitrine, mas os
  cursos aparecem **"Bloqueado"** e o player recusa. **Isso é desenho, não bug** — aula
  exige matrícula, decisão registrada no 9.77. Caso real: a colaboradora do `shop-club`
  precisa conhecer o conteúdo para dar suporte.
- **(A) ADOTADO AGORA:** matricular o colaborador (Vitalício). Já funciona hoje, é o
  caminho existente, e é o que **5 dos 12** colaboradores já fazem.
- **(C) REJEITADO:** incluir aulas no `ACCESS_MEMBER_AREA`. Colapsaria duas decisões
  diferentes numa permissão só — exatamente o erro do 9.76, agora na direção do dinheiro.
- **(B) FUTURO, com laudo antes:** permissão própria (`WATCH_COURSES`).

**Arquivos tocados:** docs/ROADMAP-EXECUCAO.md · docs/DIARIO-EXECUCAO.md — zero código
**Como foi provado:** n/a — nada foi implementado; a decisão vem do dono
**SHA do merge:** n/a (commit direto na main, só docs) · **Rollback:** `git revert` do commit
**Mudou em produção para quem:** ninguém
**Ficou aberto:** **E4.3** (⬜, prioridade 🟢 — o caminho A já atende). ⚠️ **A pergunta que
trava o (B):** colaborador com acesso por permissão **conta como aluno?** Impacta 5 pontos —
total de alunos do dashboard · **limite do plano (faturamento)** · analytics de engajamento ·
CSV de alunos · automações que disparam por matrícula. Palpite do dono: **não** deve contar;
mas é decisão de negócio e exige laudo do impacto em cada ponto antes de implementar.
**Regras conferidas:** §17 n/a (zero código) ✅ · staging-first n/a ✅ · gate humano n/a ✅ ·
papelada ✅

## 2026-08-14 — CAMADA 0, ETAPA E0.3 — Elenco completo do staging

**Estado antes:** main em 2b98ff2 · staging com 11 users, 1 workspace, 1 curso, 1 grupo

**O que foi feito:** criado `scripts/seed-staging.mjs` (idempotente, versionado) e
executado: **2º workspace** completo (`workspace-b-staging`, dono próprio, curso,
comunidade, aluno matriculado, 1 post), **2º curso no workspace A**
(`curso-teste-2`, para a persona de escopo restrito ter o que restringir), e as
**8 personas que faltavam**. O palco passa de 11 para **19 users** e de 1 para
**2 workspaces** — é o que torna qualquer teste cross-tenant real e destrava a
Camada 5 (9.74).

**Arquivos tocados:** scripts/seed-staging.mjs (novo) · docs/DIARIO-EXECUCAO.md ·
docs/ROADMAP-EXECUCAO.md — **zero código de produção**

**Como foi provado:** prova dupla de `SUPABASE_REF` em toda operação (staging
confirmado, produção abortaria); seed rodado **3×** até convergir sem erro
(idempotência real, não presumida); verificação final por SELECT com papel,
permissões, escopo, workspace e matrícula de cada persona; `auth.users` **19 ×
19** Prisma, zero órfão.

**SHA do merge:** commit direto na main — só docs + script de seed
**Rollback:** o staging é recriável pelo próprio seed; `git revert` do commit

**Mudou em produção para quem:** ninguém — nenhuma escrita em produção, nenhuma
linha de código de produção.

**Ficou aberto:** E0.1 (⏸️ aguardando ação do produtor) · E0.2 (avisos §21).

**Regras conferidas:** §17 respondido ✅ · staging-only ✅ · gate humano n/a ✅ ·
papelada ✅

### 📋 ESTADO DO PALCO (registrado aqui porque estado só na conversa se perde)

**Workspace A — `staging-teste`** (dono `producer-staging@staging.test`)
- Cursos: `curso-teste` (comunidade ON, grupo `Geral`/READ_WRITE) · `curso-teste-2` (novo)
- ⚠️ **`curso-teste` com as DUAS moderações LIGADAS** (`communityModerationEnabled` e
  `lessonCommentsModerationEnabled`) — ligadas de propósito no 9.68: sem elas toda
  sonda de moderação passa vazia. Comentário novo nasce PENDING; **não é bug**.
- ⚠️ **Cores do membro NULAS** — o 9.73 usou cores berrantes para a prova e as
  restaurou. Quem for testar tema precisa setá-las de novo (1 chamada na tela
  Personalizar).

**Workspace B — `workspace-b-staging`** (dono `dono-b@staging.test`)
- Curso `curso-b` (comunidade ON, grupo `Geral`/READ_WRITE, 1 post do dono)
- `aluno-b@staging.test` matriculado ACTIVE

**Elenco (19 users, senha `Staging@2026!`):**

| persona | papel |
|---|---|
| `producer-staging` | DONO do A |
| `dono-b` | **DONO do B + colaborador no A** `[MANAGE_COMMUNITY, VIEW_ANALYTICS]` — o retrato do `applyfybr`, persona-alvo do 9.74 |
| `admin-staging` | **ADMIN de plataforma** |
| `colab-duplo` | **colaborador nos DOIS** — A `[REPLY_COMMENTS]` · B `[MANAGE_COMMUNITY]` |
| `colab-escopo` | `[MANAGE_STUDENTS, MANAGE_LESSONS]` com **escopo restrito a 1 curso** |
| `colab-students` · `colab-lessons` · `colab-automations` | uma permissão isolada cada |
| `colab-dash` · `colab-analytics` · `colab-comunidade` · `colab-reply` | uma permissão + `ACCESS_MEMBER_AREA` |
| `colab-modonly` | `[MANAGE_COMMUNITY]` **sem** `ACCESS_MEMBER_AREA` (a célula ⭐ do 9.78) |
| `colab-zero` | `[]` — nenhuma permissão |
| `aluno-staging` · `aluno-b` | matriculados em A e B |
| `faxina-teste-1/2/4` | alunos matriculados em A (legado de sessões anteriores) |

**⚠️ Semeado FORA do caminho real** (não há rota, e está marcado no script):
`Subscription` EXEMPT dos produtores novos (é checkout de verdade) · `role=ADMIN`
do `admin-staging` (nenhuma rota promove a ADMIN de plataforma). Todo o resto —
registro, workspace, curso, convite, aceite, matrícula, post, escopo por PATCH —
passou pelas rotas reais.

## 2026-08-14 — CAMADA 0, ETAPA E0.4 — Sistema de documentação de execução

**Estado antes:** main em 76c9b58
**O que foi feito:** criados docs/ROADMAP-EXECUCAO.md (mapa de execução: 8
camadas, 26 etapas, ritual por etapa, Matriz de Regressão Padrão) e
docs/DIARIO-EXECUCAO.md (registro cronológico obrigatório por etapa);
CLAUDE.md passou a apontar os dois como leitura de início de sessão, com o
procedimento de recuperação de contexto.
**Arquivos tocados:** docs/ROADMAP-EXECUCAO.md · docs/DIARIO-EXECUCAO.md ·
CLAUDE.md
**Como foi provado:** integridade do roadmap conferida (346 linhas, primeira e
última linha, delimitador não vazado); diário com 0 entradas reais fora do
bloco de formato (confirmado por awk rastreando as cercas de código);
+386/−0, nenhum vizinho tocado.
**SHA do merge:** a7e302a (commit direto na main — só documentação)
**Rollback:** git revert a7e302a
**Mudou em produção para quem:** ninguém — documentação apenas.
**Ficou aberto:** E0.1 (fechar incidente PP com evidência), E0.2 (avisos §21 a
3 produtores), E0.3 (elenco de staging incompleto: faltam personas
MANAGE_STUDENTS/MANAGE_LESSONS/MANAGE_AUTOMATIONS, escopo restrito, ADMIN,
dono-de-outro-ws, colaborador de 2 ws, e um 2º workspace).
**Regras conferidas:** §17 respondido ✅ (só docs, risco nulo) · staging-first
n/a ✅ · gate humano ✅ · papelada ✅

> ⏱️ Datas deste diário em **UTC**. O commit `a7e302a` aparece como 2026-08-13T22:03-03:00
> no `git log` (fuso local) — é o mesmo instante. Convenção registrada aqui para a linha do
> tempo não parecer furada quando cruzada com o repo.
