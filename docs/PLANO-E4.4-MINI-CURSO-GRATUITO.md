# PLANO E4.4 — MINI CURSO GRATUITO / FUNIL

> Documento de PLANO. Escrito na **etapa 0 (investigação read-only, 28/08/26)**, antes de
> qualquer linha de código. As decisões do dono estão registradas **como recebidas**; onde a
> leitura do código as **desmentiu ou mudou o custo**, há um bloco `⚠️ DIVERGÊNCIA` — o plano
> **não foi corrigido por conta própria**, conforme a ordem.
>
> Nada aqui foi implementado. A etapa 1 só começa sob nova ordem.

---

## 1. As 12 decisões do dono (como recebidas)

| # | Decisão |
|---|---|
| D1 | Curso ganha chave **gratuito/pago** |
| D2 | Curso gratuito cria **MATRÍCULA automática** — nada de caminho de acesso paralelo |
| D3 | Tela de confirmação **"Resgatar acesso"** |
| D4 | Virou pago: **quem entrou mantém**; o produtor remove manualmente |
| D5 | Cadastro público **recusa e-mail já existente** |
| D6 | **Sem** verificação de e-mail |
| D7 | **WhatsApp obrigatório** no cadastro |
| D8 | Vitrine mostra **tudo**; pagos com **cadeado** que leva à página do curso |
| D9 | Aluno gratuito usa a **comunidade normalmente** |
| D10 | O acesso nasce como matrícula comum — **os gates existentes valem sem alteração** |
| D11 | A página do curso com **botão de comprar** é o destino do cadeado |
| D12 | O funil é **por workspace** (a vitrine do produtor), não global |

---

## 2. O que a investigação achou — e o que ela DESMENTIU

### 2.1 Já existe e se reusa (não precisa nascer)

| O quê | Onde |
|---|---|
| **Página do curso com botão de comprar** | `components/course-preview.tsx:112-114` e `:419-421`; `app/(course)/course/[slug]/page.tsx:573-575`. O link vem do **campo `course.checkoutUrl`** — não de plano, não de integração |
| **Vitrine com DOIS grupos**: matriculados × loja | `app/api/w/[slug]/init/route.ts:121` (`enrolledCourses`, `storeCourses`) |
| **Flag de exibição na loja** | `Course.showInStore Boolean @default(true)` (`prisma/schema.prisma:229`) |
| **Cadeado** | `components/course-card.tsx:15,43,71,93,131,204,227` — a prop `locked` já existe e já muda o card; usada em `app/w/[slug]/page.tsx:578` |
| **Criação de conta + credencial + matrícula** | `lib/webhook-helpers.ts` (`ensureUserByEmail`) — reaproveitável |
| **Gates por matrícula ACTIVE** | 19 pontos, todos via `Enrollment.status === "ACTIVE"` |

### 2.2 ⚠️ DIVERGÊNCIAS — onde a leitura contraria o plano

> **DIV-1 — O risco R1 não está onde o plano supõe.**
> No **webhook de compra**, e-mail já existente é **reaproveitado** e a senha **nunca é
> rotacionada**: `lib/webhook-helpers.ts:51` busca por e-mail normalizado, `:64-66` só preenche
> lacunas, e `:141-142` diz com todas as letras *"Existing credentials are never rotated — they
> stay under the student's control"*. O e-mail é normalizado **igual na escrita e na busca**
> (`email.trim().toLowerCase()`, `:44`).
> **Onde o risco EXISTE**: no produtor adicionando aluno à mão —
> `app/api/courses/[id]/students/route.ts:283-300` **rotaciona a senha** quando o aluno já tem
> credencial, gateado por `!wasActive && !isStaff` (`:276`). Ou seja: quem comprou o curso A e
> depois é matriculado no curso B do mesmo workspace **tem a senha trocada**.
> ⇒ **A etapa 6 muda de alvo**: o caminho da matrícula gratuita não pode passar por esse ramo.

> **DIV-2 — `Enrollment` não tem marca de ORIGEM.**
> Campos: `status`, `expiresAt`, `termsAcceptedAt`, `createdAt`, `updatedAt`, `accessEmailPending`
> (`prisma/schema.prisma`, model `Enrollment`). **Não há como distinguir matrícula paga de manual
> de gratuita.** D4 ("virou pago, quem entrou mantém, produtor remove manual") e o relatório do
> produtor **dependem** dessa distinção.
> ⇒ **Precisa nascer** um campo de origem — decisão de schema, não detalhe.

> **DIV-3 — O risco R7 (estourar limite de plano) NÃO EXISTE.**
> Os únicos limites no schema são `maxWorkspaces` e `maxCoursesPerWorkspace`
> (`prisma/schema.prisma:805-806`). **Nenhum limite conta alunos ou matrículas.**
> ⇒ Uma enxurrada de matrículas gratuitas **não estoura nada**. O risco R6 (distorcer NÚMERO)
> continua de pé — a contagem aparece em `app/api/producer/analytics/route.ts:325,396` e na
> exportação `app/api/producer/students/export/route.ts`.

> **DIV-4 — Já existe rota de cadastro público, mas ela cria ADMIN.**
> `app/api/auth/register/route.ts:52-59` faz `prisma.user.create({ ..., role: "ADMIN" })`.
> Não serve para o funil e **não deve ser reusada como está**. `grep` de
> `signup|sign-up|cadastro`: nenhuma outra rota pública.
> ⇒ O cadastro do funil **nasce novo**, e a proximidade com esta rota é uma armadilha a evitar.

> **DIV-5 — O revoke dos gateways é por (usuário, curso), sem olhar origem.**
> `lib/gateways/process-webhook.ts:340-343`:
> `enrollment.updateMany({ where: { userId, courseId }, data: { status: "CANCELLED" } })`.
> Se o mesmo curso um dia for pago **e** tiver matrículas gratuitas, um `order_refunded`
> daquele usuário cancela a matrícula **qualquer que seja a origem** — porque origem não existe
> (DIV-2). **Risco R5 confirmado**, e ele depende de DIV-2 para ser fechado.

### 2.3 Precisa nascer
- Chave gratuito/pago no `Course` (D1) — **não há nenhuma noção de "gratuito" no sistema**
  (`grep free|gratuit|isFree`: só `PostType.FREE` da comunidade, `schema:509`).
- Marca de **origem** em `Enrollment` (DIV-2).
- Rota + tela de **cadastro público** do funil (DIV-4), com WhatsApp obrigatório (D7).
- Tela **"Resgatar acesso"** (D3) e a rota que cria a matrícula gratuita (D2).
- Cadeado ligado a **preço/gratuidade** na vitrine (D8) — o `locked` existe, mas hoje é
  `!course.canManage` (`app/w/[slug]/page.tsx:578`), critério **diferente**.

---

## 3. As 8 etapas, com o gate de cada uma

| # | Etapa | Gate para fechar |
|---|---|---|
| **1** ✅ | **FEITA (merge `35d440d`, 28/08, já em produção).** Fundação de schema: `Course.isFree` + `Enrollment.origin`/`EnrollmentOrigin`. Migração aditiva, zero runtime | Migração aplicada em staging com prova por `information_schema`; prova dupla em produção (não existe lá); `Post`/`Enrollment` sem colunas alteradas |
| **2** ⚠️ | **Cadastro público** (rota + tela): recusa e-mail existente (D5), WhatsApp obrigatório (D7), sem verificação (D6). **NÃO reusar `/api/auth/register`** (DIV-4). ⚠️ **HERDOU 3 REQUISITOS OBRIGATÓRIOS da linha 4** — ver §8; sem eles o funil não fecha | Além das provas de API: os **3 pré-requisitos do §8** atendidos, e **9.139 lido antes de desenhar** |
| **3** ✅ | **FEITA (merge `847a63a`, 30/08, já em produção).** **"Resgatar acesso"** (D3) + `POST /api/courses/[id]/claim` (D2), carimbando `FREE_CLAIM` | Matrícula nasce ACTIVE com origem correta; **não passa pelo ramo que rotaciona senha** (DIV-1) e **não envia e-mail** (a pessoa já está logada); idempotente (200 `alreadyEnrolled`); **cancelada NÃO reativa — 409**. Gate humano 6/6 |
| **4** ✅🚫 | **FECHADA SEM CÓDIGO (30/08, investigação read-only).** **Vitrine + cadeado** (D8) — a etiqueta já saíra com a linha 3, e a investigação das 8 combinações **não achou o que corrigir**: a vitrine é fechada em 3 camadas independentes e a cascata do checkout já cobre **todos** os casos, inclusive os **20 de 66** cursos de produção sem `checkoutUrl`. **Os 3 bloqueios que sobraram não são desta linha — são PRÉ-REQUISITOS DA LINHA 2** (cadastro público) e estão escritos abaixo | Nada a provar: **não houve mudança de código**. O laudo está em `DIARIO-EXECUCAO` (30/08) e os achados viraram os itens **9.139–9.143** |
| **5** | **Gates**: confirmar que os 19 pontos de `ACTIVE` aceitam a matrícula gratuita sem alteração (D10) e que a comunidade funciona (D9) | Persona gratuita: entra na área de membros, assiste, comenta, anexa, baixa material, tira certificado — ou o relatório diz explicitamente o que NÃO deve |
| **6** | **Proteger a senha de quem já é aluno** (DIV-1): garantir que nenhum caminho do funil rotacione credencial existente | Prova: aluno com credencial resgata curso gratuito → **senha inalterada** (verificar hash antes/depois) |
| **7** | **Personalização** da tela de cadastro/resgate, no molde dos campos `login*` do `Workspace` (13 campos, `schema`) e dos `member*` do `Course` (8 campos) | Produtor personaliza e a tela reflete; campos são **texto puro**, não HTML (é o que os `login*` já são) |
| **8** | **Relatórios**: separar aluno gratuito de pagante onde a contagem importa (R6) — analytics e exportação CSV | O produtor consegue ver os dois números separados; o CSV traz a origem |

⚠️ **A ORDEM EXECUTADA TROCOU 2 E 3, e isto fica escrito para não virar item-fantasma.**
Os comandos chamaram de **"etapa 2"** o que nesta tabela é a **linha 3** (o resgate). O **cadastro
público — linha 2 — segue ABERTO e não foi tocado**. Consequência prática e presente: **o resgate
exige estar logado**; o visitante deslogado ainda não tem por onde entrar, e é por isso que a
linha 4 depende da 2 para fechar. Quem procurar uma "etapa 2 = cadastro" fechada não vai achar,
porque ela não aconteceu.

---

## 4. Os 8 riscos

| # | Risco | Estado após a investigação |
|---|---|---|
| **R1** | Cadastro/resgate reseta a senha de quem já é aluno | ⚠️ **Deslocado**: não é o webhook (`webhook-helpers.ts:141-142` protege); é `courses/[id]/students/route.ts:283-300`. **Etapa 6** |
| **R2** | E-mail duplicado criando conta paralela | ✅ Baixo: normalização idêntica na escrita e busca (`webhook-helpers.ts:44,51`) |
| **R3** | Matrícula gratuita não passar nos gates | ✅ Baixo: os 19 pontos olham só `status === "ACTIVE"`; uma matrícula ativa passa |
| **R4** | Curso gratuito virar pago e o aluno perder acesso | ⚠️ Depende de **DIV-2** (sem origem, não há como preservar seletivamente) |
| **R5** | Matrícula gratuita revogada por engano | 🔴 **Confirmado**: `process-webhook.ts:340-343` cancela por (usuário, curso) sem olhar origem |
| **R6** | Enxurrada de gratuitos distorcer o número de alunos | ⚠️ Real: `producer/analytics/route.ts:325,396` e o CSV não separam |
| **R7** | Estourar limite de plano | ✅ **Não existe**: só `maxWorkspaces` e `maxCoursesPerWorkspace` (`schema:805-806`) |
| **R8** | Cadastro público virar superfície de abuso (spam/bot) | ⚠️ A avaliar na etapa 2: `rateLimit` é 100 req/60s por IP+rota (`lib/rate-limit.ts:12-13`), sem captcha nem verificação (D6) |

---

## 5. Modelo mental do acesso HOJE (da compra à aula)

```
compra no gateway
   ↓  webhook → lib/gateways/process-webhook.ts
ensureUserByEmail (lib/webhook-helpers.ts)
   ├─ e-mail normalizado (:44) → busca (:51)
   ├─ existe? reusa e só preenche lacunas (:64-66)
   └─ não existe? cria auth + User (:74-126)
   ↓
WorkspaceCredential — cria SE não houver; NUNCA rotaciona (:141-156)
   ↓
enrollment.upsert (:198) → status ACTIVE
   ↓
login em /w/[slug]/login  →  vitrine (init: enrolledCourses × storeCourses)
   ↓
área do curso → gates por Enrollment ACTIVE (19 pontos)
```

**O que a demanda toca**: o começo (uma entrada nova, sem gateway) e a vitrine (o cadeado).
**O miolo — credencial, matrícula, gates — é reuso.**

---

## 6. Etapa 1 — o que ficou decidido na prática (28/08, merge `35d440d`)

**(i) A condição de PARE não disparou, e a evidência é o oposto de "quase serve".**
O comando mandava parar se algum campo existente já servisse. Medi em produção: `showInStore`
significa *"aparece na loja"*, não *"é de graça"*; e usar `checkoutUrl`/`price` vazios como sinal
**liberaria de graça 20 a 32 cursos pagos reais** — **20 de 60 (33%)** sem `checkoutUrl` e
**32 (53%)** sem preço, por outros motivos. Campo novo, `@default(false)`.

**(ii) O default do legado é `UNKNOWN`, não `PURCHASE`.** As **28.829** matrículas de produção
**não são todas compra** — importação, produtor à mão e automação misturados, e nenhum dado os
separa depois do fato. `UNKNOWN` significa *"origem não registrada"*, verdade tanto para o legado
quanto para a janela até a fatia de runtime ligar os cinco escritores. Mesmo princípio do
`updatedAt` do próprio model: **um campo que mente é pior que um campo ausente**. Linha nova com
`UNKNOWN` depois daquela fatia = escritor esquecido, separável por `createdAt`.

**(iii) ⚠️ Leitura e escrita tiveram que entrar JUNTAS.** O comentário do próprio GET do curso
avisa que *"o `CourseForm` devolve o payload INTEIRO no PUT"*. Sem `isFree` na **leitura**, o
estado do form nasceria `false` e o **primeiro "Salvar" de um curso gratuito o tornaria PAGO** — a
armadilha do 9.112 na direção contrária. GET, PUT e POST de criação entraram no mesmo commit.

**(iv) O aviso do R4 é honesto sobre o que não sabemos.** Ao ligar "Gratuito" num curso com
alunos, o bloco mostra a contagem e diz, na tela: *"não é possível saber aqui quantos desses
alunos compraram — as matrículas anteriores não registram a origem"*.

**Provado em produção depois da migração:** `isFree=true` em **0** cursos · origem ≠ `UNKNOWN` em
**0** matrículas · **61 → 61** tabelas, `Course` 52→53 e `Enrollment` 9→10 colunas.

---

## 7. O resgate — o que ficou decidido na prática (30/08, merge `847a63a`)

*(É a **linha 3** da tabela §3, executada sob o nome "etapa 2" — ver o aviso da ordem trocada.)*

**(i) O resgate NÃO REATIVA matrícula cancelada — responde 409, e essa é a regra nova da casa.**
Os 5 caminhos que já escreviam `Enrollment` **reativam**, e podem: todos partem do **produtor** ou
de uma **compra**. Este é o **primeiro iniciado pelo ALUNO**. Deixá-lo reativar significaria que
qualquer pessoa cujo acesso foi **revogado** o restaura sozinha com um clique, desfazendo por baixo
uma decisão do dono do curso. Já `ACTIVE` devolve **200 `alreadyEnrolled`** — idempotente de
propósito, porque botão se clica duas vezes.

**(ii) Não envia e-mail de acesso, e isso é desenho.** Os moldes enviam porque **criam usuário e
entregam SENHA**; aqui a pessoa **já está logada** e entra direto no curso. E-mail com senha num
fluxo em que ninguém pediu senha é vazamento de contexto — o mesmo defeito que o **9.136** registra
na porta do produtor. O que o resgate **mantém** do molde: notificação e automações
`STUDENT_ENROLLED`, em fire-and-forget (o crítico é a matrícula).

**(iii) O `select` explícito desmentiu o laudo, e custou uma fatia inteira.** A investigação da
etapa supôs que a vitrine já recebia `isFree` *"porque usa include"*. **Falso** — aquele init monta
um `select` campo a campo. Campo ausente **não dá erro, dá tela errada**: o curso gratuito apareceu
para o gate humano com a tag **"Bloqueado"**. Ficou a regra: **conferir no arquivo, nunca supor
pelo padrão do vizinho.**

**(iv) A vitrine não atualizava por CACHE DE NAVEGADOR, medido — não deduzido.** Três hipóteses,
duas refutadas no palco (o servidor responde certo no instante seguinte ao resgate; a página refaz
a busca ao voltar). Sobrou o header `private, max-age=30, stale-while-revalidate=60` — que **o
servidor não consegue invalidar**. Cura: **`no-store`**, o mesmo remédio do **9.118**. E a
conferência que aquele item ensinou foi feita **antes**: a vitrine é a **única** consumidora da
rota, então não havia trade-off.

**A VIGIA, medida em produção no dia do merge:** **0** cursos `isFree=true` · **0** matrículas
`FREE_CLAIM` · **28.918** `UNKNOWN`. Enquanto nenhum curso for marcado como gratuito, **o número
correto dos dois é zero** — qualquer `FREE_CLAIM` sem curso gratuito por trás é escritor carimbando
origem errada.

---

## 8. Os 3 pré-requisitos do CADASTRO PÚBLICO (herdados da linha 4, 30/08)

A linha 4 fechou **sem código**: a investigação das 8 combinações de acesso não achou o que
corrigir. **O que ela achou foram três bloqueios — e nenhum deles é da vitrine. Todos são da linha
2.** Ficam aqui como **requisitos obrigatórios do desenho**, não como sugestões.

### (a) ⭐ O VÍNCULO — o requisito que decide se o funil existe

`hasWorkspaceAccess` (`lib/workspace-access.ts:30-56`) só devolve `true` para quem tem
**matrícula (ACTIVE ou EXPIRED) em algum curso do workspace**, **`Collaborator` ACCEPTED**, ou é o
**dono**. Duas portas o consultam e respondem **404** a quem não passa:
`api/courses/by-slug/[slug]/init:101-106` (a página do curso) e `api/courses/[id]/claim:68` (o
resgate).

⇒ **O recém-cadastrado não tem nenhum dos três.** Ele não consegue nem ABRIR a página do curso
gratuito, quanto mais resgatá-lo. É o ovo e a galinha: para resgatar é preciso já ter vínculo, e o
único jeito de ter vínculo seria a matrícula que o resgate criaria.

⚠️ **E a trava está CORRETA — não é ela que muda.** A própria rota diz por quê
(`claim:65-66`): *"Sem isto, qualquer usuário logado resgataria o gratuito de qualquer
produtor."* Afrouxá-la transformaria cada curso gratuito da plataforma em conteúdo aberto a toda a
base — 22 mil pessoas. **REQUISITO: o vínculo tem de nascer NO CADASTRO** (é o cadastro que sabe a
qual workspace a pessoa está entrando), **não** ser arrancado do resgate.

### (b) A PORTA — para onde o deslogado é mandado

`/course/<slug>` não é rota pública; sem cookie, `proxy.ts:75-86` cai no último arm (`:84`) e manda
para **`/producer/login`** — a tela de login do **PRODUTOR**, para um aluno. O **slug do curso se
perde** (não há `returnTo`/`redirectTo` em nenhum fluxo de login — grep feito). ⓘ Detalhe lido: o
3º nível daquele ternário é **código morto**, `:83` e `:84` são o literal idêntico.

⚠️ **E há um obstáculo que o registro antigo não menciona**: em `/course/<slug>` **não existe slug
de workspace na URL**, e o proxy **não consulta banco** — ele não tem como descobrir para qual
`/w/{slug}/login` mandar. Qualquer desenho que queira "mandar para o login certo" precisa resolver
isso fora do proxy.

📌 **Já registrado** como candidato de UX em `PLANO-MESTRE.md:362` (*"student deslogado é mandado
pro `/producer/login` (esquisito)"*), com os 2 pontos de fix nomeados lá. **O que muda agora**: com
o funil, isso deixa de ser esquisitice interna e vira **a porta de entrada do produto** — é a
primeira tela de quem vem do Instagram.

### (c) A MENSAGEM — o 401 que aparece cru

`components/course-preview.tsx:124-145` trata a resposta do resgate com **um único ramo genérico**
(`if (!res.ok)`), que joga `d.error` numa linha vermelha dentro do modal. Um **401** apareceria
para a pessoa como a frase literal **"Não autenticado"** (`claim/route.ts:40`), com o modal aberto
e **sem nenhum caminho para o login**. Não existe no repo nenhuma mensagem tipo "faça login para
resgatar" (grep feito).

---

⚠️ **LEITURA OBRIGATÓRIA ANTES DE DESENHAR A LINHA 2: o item 9.139.** A investigação mediu, em
produção, **dois furos que desviam o proxy por inteiro** (o matcher isenta por sufixo `.json`; o
cookie é contado, não validado). Hoje eles **não vazam dado** — as camadas 2 e 3 seguram. Mas a
linha 2 vai **abrir caminho público novo**, e qualquer desenho que trate o proxy como parede cria
um furo real. **Gate de verdade mora na rota e na página.**

---

## 9. REQUISITOS PROVADOS PARA O CADASTRO (investigação da etapa 5, 30/08/26)

**⏸️ PAUSADA em 31/ago/26 — ver docs/PAUSA-E4.4-FATIA1.md**

> **De onde vem esta seção.** Investigação read-only da etapa 5, com **16 agentes** (8 leitores +
> 8 verificadores adversariais) e **4 rodadas de medição SELECT-only em produção** (alvo
> `wyamxwmdgbvqrfcqfbyh` impresso em todas). **Zero código, zero banco, zero schema.**
>
> **O que mudou de status:** o §8 desta mesma página listava 3 pré-requisitos herdados da linha 4,
> escritos por dedução. **Agora eles estão MEDIDOS** — e a medição achou mais 8. Os 25 itens que a
> investigação gerou (**9.144–9.168**) estão no `PLANO-MESTRE`, grupos **E3.35–E3.40** do ROADMAP,
> **todos sem fix e por decisão do dono: voltam DEPOIS que o funil fechar.**

### 9.1 O que o cadastro é OBRIGADO a fazer

| # | Requisito | A prova (não é opinião) |
|---|---|---|
| **R-1** | ⭐ **Criar o VÍNCULO, não só a conta.** | `hasWorkspaceAccess` (`lib/workspace-access.ts:25-57`, lido inteiro, **sem homônimo**) tem **exatamente 3 vias**: matrícula com `status ∈ {ACTIVE, EXPIRED}` · `Collaborator` ACCEPTED · `Workspace.ownerId`. **`CANCELLED` não passa.** Quem tem só conta+credencial **autentica e toma 403** em `api/w/[slug]/login/route.ts:251-259`. **MEDIDO: 679 pessoas em produção já vivem nesse limbo** (credencial + zero matrícula), e 1.336 credenciais existem num ws onde a pessoa não tem matrícula nenhuma. ⚠️ **A trava está CORRETA** (`claim:65-66`) — quem muda é o cadastro. |
| **R-2** | **Entrar no regex de rota pública do proxy.** | `src/proxy.ts:66` isenta **só** `/^\/w\/[^/]+\/(login\|forgot-password\|reset-password)\/?$/`. Uma rota nova **não está lá** → visitante sem cookie é redirecionado para `/w/{slug}/login` (`:75-86`) e o cadastro nunca abre. ⚠️ **O proxy não protege (9.139) mas ATRAPALHA** — a linha 66 terá de ser tocada. |
| **R-3** | **`rateLimit` próprio na 1ª linha do handler.** | `src/proxy.ts:59-61` devolve `NextResponse.next()` para **todo** `/api/` (*"auth is enforced per-handler"*) e **não existe `middleware.ts`**. Nenhum freio roda antes do Node. Cobertura atual: **23 de 203 rotas**. ⚠️ A chave é `rl:{ip}:{pathname}` (`lib/rate-limit.ts:94`) ⇒ o teto de 100/60s é **por slug**, e o helper **não é parametrizável** (assinatura `rateLimit(request)`). |
| **R-4** | **Reusar `ensureUserByEmail` e o par `generateSalt`+`hashPassword`.** | Funil **único**, 6 call-sites, **sem homônima** (`lib/webhook-helpers.ts:37-160`). Hash: `scryptSync(pw, salt, 64)` com salt de 32 bytes (`lib/workspace-auth.ts:14-22`), verificado por `timingSafeEqual`. **Nunca inventar hash paralelo** — é a lição do BUG C. |
| **R-5** | **Normalizar o e-mail na ESCRITA e na BUSCA, e usar o MESMO valor para Prisma e Supabase.** | `webhook-helpers.ts:44` faz `.trim().toLowerCase()` e usa o mesmo nos dois. ⚠️ **A porta do aluno NÃO faz isso** (item **9.151**): `w/[slug]/login:45` usa `toLowerCase()` sem `trim` e manda o **cru** ao Supabase em `:101`, `:152`, `:203`. ⚠️ **Nenhum schema Zod normaliza** (`grep` de `.trim()/.toLowerCase()/.transform()` em `lib/validations.ts` → zero). ⚠️ **E o banco não protege**: a constraint real é `User_email_key UNIQUE btree(email)` — **case-SENSITIVE**, sem `citext`. |
| **R-6** | **Carimbar `Enrollment.origin`.** | Hoje **só** o resgate carimba (`api/courses/[id]/claim/route.ts:97`); toda outra matrícula nasce `UNKNOWN` — inclusive as de compra. **MEDIDO: 28.929 matrículas, 100% `UNKNOWN`.** Sem carimbo, D4/R5/R6 continuam sem chão. |
| **R-7** | **Normalizar o telefone pela régua que os campos de suporte já usam.** | `replace(/\D/g,"")` em `api/workspaces/[id]/route.ts:212`, `api/courses/route.ts:342`, `api/courses/[id]/route.ts:495-496` — e **MEDIDO: 5/5 `supportWhatsapp` preenchidos são só-dígitos**, o contrato funciona. ⚠️ **`User.phone` não participa de régua nenhuma** (item **9.158**): 4 dialetos, 25 linhas de lixo, **70,6% vazio**, escrita **one-shot** (`webhook-helpers.ts:58-60` — telefone errado nunca é corrigido). **D7 exige obrigatório ⇒ o cadastro produziria um 5º formato.** |
| **R-8** | **Herdar o molde visual, não recriá-lo.** | `WorkspaceAuthShell` + as 4 classes exportadas `authInputCls`/`authLabelCls`/`authErrorCls`/`authSubmitCls` (`components/workspace-auth-shell.tsx:449-461`), com o `select` de 18 campos de `w/[slug]/login/page.tsx:16-38` e `notFound()` em `!workspace \|\| !workspace.isActive`. |

### 9.2 O que o cadastro NÃO deve fazer

| # | Proibição | Por quê |
|---|---|---|
| **N-1** | **Não reusar `/api/auth/register`.** | `role: "ADMIN"` **hardcoded** em `api/auth/register/route.ts:57`, handler só com `rateLimit` (item **9.135**, 🔴, veredito em aberto). |
| **N-2** | **Não usar "tem credencial" como sinal de nada.** | `api/w/[slug]/forgot-password/route.ts:122-143` **CRIA** a `WorkspaceCredential` para qualquer par (user, ws) **anonimamente**, sem checar vínculo. E o repo já proíbe por escrito: *"NUNCA ramificar por 'tem credencial'"* (`api/auth/producer-login/route.ts:15-23`). |
| **N-3** | **Não confiar no proxy como gate.** | Item **9.139**: matcher isenta por sufixo (`proxy.ts:126`) e o cookie é **contado, não validado** (`:30-43`). |
| **N-4** | **Não passar pelo ramo que rotaciona senha.** | `api/courses/[id]/students/route.ts:283-301` troca a senha de quem já tem credencial quando `!wasActive && !isStaff` (item **9.136**). ⚠️ **E não passar pelo ramo do import**, que entrega a **master password** (item **9.144** 🔴). |
| **N-5** | **Não enviar e-mail com senha.** | A pessoa acabou de escolher a dela. É a mesma regra que fechou a etapa 3 (o resgate não manda e-mail porque a pessoa já está logada). |
| **N-6** | **Não afrouxar `hasWorkspaceAccess`.** | `claim:65-66` diz por quê: *"Sem isto, qualquer usuário logado resgataria o gratuito de qualquer produtor."* Afrouxar abre 22 mil pessoas. |
| **N-7** | **Não confiar no `upsert` do Prisma contra corrida.** | O molde da casa é `create` + `catch P2002` + **re-busca pela unique que conflitou** (`lib/community-helpers.ts:24-53`, fix do 9.23), e `:14-18` registra que **o upsert foi descartado por prova empírica de emulação no Prisma 5.22**. ⚠️ Hoje há **zero** tratamento de P2002 no fluxo de compra (item **9.157**). |
| **N-8** | **Não deixar a falha silenciosa.** | 4 rotas da fundação não gravam `WebhookLog` no catch e o Stripe não grava nenhum (item **9.150**) — é o que torna a corrida indetectável. Um cadastro que falhe em silêncio repete o defeito **com uma pessoa olhando a tela**. |

### 9.3 ⚠️ As 11 perguntas que SÓ A MEDIÇÃO HUMANA responde — pré-requisito do desenho

Nenhuma é decidível por leitura de código. **Enquanto não forem respondidas, o desenho da etapa 5
está apoiado em suposição:**

1. **O `upsert` de `Enrollment` é nativo ou emulado?** (`webhook-helpers.ts:198-202`) — a forma medida no `b935be6` era *unique composta + `update` vazio*; aqui o update não é vazio. **Exige log de SQL** e ver se sai `INSERT ... ON CONFLICT`. A regra da casa proíbe confiar sem isso.
2. **Qual a ordenação real do `admin.auth.admin.listUsers`?** — decide **quais** 4.000 identidades a recuperação alcança (item **9.153**). ⓘ A conclusão "85% fora do alcance" já vale em qualquer direção; a ordenação decide *quem*.
3. **`UPSTASH_REDIS_REST_URL/TOKEN` estão setadas na Vercel de produção?** — sem elas o teto é **100 × nº de instâncias** (`lib/rate-limit.ts:18-24`). Os `.env` do repo têm **0 ocorrências**.
4. **A Vercel/Cloudflare sobrescreve `x-forwarded-for`?** — `getIp` confia no **primeiro** elemento sem allowlist (`lib/rate-limit.ts:27-28`), e o SYSTEM-MAP §5 registra tráfego real chegando **direto na origem**. Se não sobrescreve, a chave do rate-limit é escolhida por quem ataca.
5. **O projeto Supabase exige confirmação de e-mail?** — é config de dashboard. O código **nunca lê** `email_confirmed_at` (`grep` → zero) e todo caminho servidor passa `email_confirm: true`.
6. **`supabase.auth.signUp` devolve `data.user` para e-mail já registrado?** — se devolver, um cadastro que copie `register/route.ts:51-59` faz `prisma.user.create` com e-mail existente → **P2002 não tratado → 500**.
7. **Como o GoTrue trata duas chamadas `createUser` CONCORRENTES com o mesmo e-mail?** — decide se a janela de corrida do `prisma.user.create` chega a abrir. ⚠️ **Sonda com 2 requisições HTTP simultâneas** — o método que reproduziu o 9.23 de primeira. **Sonda de 1 processo SERIALIZA e dá falso-negativo.**
8. **O GoTrue trata caixa e espaço igual no `signInWithPassword`/`generateLink`?** — é o que decide se o **9.151** é defeito latente ou inerte. Teste: mesmo usuário, e-mail com maiúscula, nas duas rotas.
9. **Qual o status HTTP efetivo do `notFound()`** para slug inativo? — `curl -I` contra staging. ⓘ Produção tem **0 workspaces inativos**, então o caminho nunca foi exercitado.
10. **O 503 com PII do produtor sai mesmo?** (item **9.156**) — exige um workspace `SUSPENDED` no **staging**; produção tem **0**.
11. **O polling de `/lives` dispara de fato na tela pública?** (item **9.164**) — a prova é estrutural (hooks antes do early-return); confirmar exige abrir a tela e olhar a aba Network.

### 9.4 Os números de produção que o desenho herda (medidos em 30/08/26)

```
Users 27.340 · auth.users 27.342 (5 órfãs, 4 fora do teto de 4.000 do listUsers)
e-mails duplicados exatos 0 · por caixa 0 · com maiúscula 0   ← o código segura, o banco não
Um User serve N workspaces: credencial em 2 ws=441 · 3=187 · 4=3 · 10=1  (632 em 2+)
                            matrícula em 2+ workspaces = 175
Credencial SEM matrícula no mesmo ws: 1.336 (1.177 pessoas, 15 ws)
Credencial e ZERO matrícula em lugar nenhum: 679          ← o limbo do 403
PRODUCER com matrícula ativa: 46 de 124 (43 em ws alheio) · STUDENT-collab (C6): 10
Workspaces 39 · inativos 0 · com masterPassword 10 · customDomain 0
Subscriptions: 83 PENDING · 37 ACTIVE (37 isentas) · 0 SUSPENDED · 0 CANCELLED ⇒ 0 bloqueados
Telefone: 19.307 sem (70,6%) · 7.255 com não-dígito · lixo: 25 linhas
Cursos 66 · publicados 53 · na loja 64 · sem checkoutUrl 20
VIGIA E4.4: 0 cursos isFree · 0 matrículas FREE_CLAIM · 28.929 UNKNOWN     ✅ segue limpa
```

---

## 10. O QUE A SONDA DO TURNSTILE PROVOU (30/08/26) — anti-robô do cadastro

> **De onde vem.** Decisão do dono: a proteção anti-robô do cadastro público é
> **limite por IP + Cloudflare Turnstile**, com o captcha **FAIL-OPEN** e o widget em
> modo **MANAGED**. Como "quais diretivas da CSP o Turnstile exige" **não é decidível
> por leitura** — é a cicatriz do BUG E (`5e78edd`), em que o SDK do Vimeo fazia XHR
> da página-mãe e o defeito era de `connect-src`, não de `frame-src` — foi construída
> uma **sonda descartável** e medida no navegador.
>
> **A sonda foi REMOVIDA** (`5ea03e2`). O código dela fica arquivado na branch
> `sonda/turnstile-csp` (**`da9697e`** = a sonda · **`56bac2f`** = a chave corrigida).
> **Nada dela ficou no repositório.** O que sobrevive é esta seção.

### 10.1 ✅ CSP — `script-src` + `frame-src` BASTAM. `connect-src` NÃO é necessário

As duas linhas, verbatim, para voltarem **no mesmo commit que trouxer o widget**:
```
script-src  … https://challenges.cloudflare.com
frame-src   … https://challenges.cloudflare.com
```
⚠️ **`static.cloudflareinsights.com`, que já está no `script-src`, NÃO cobre isto** —
são domínios diferentes e não há wildcard.

**Como foi medido, e por que a medição é confiável:** a CSP **não tem `report-uri`**
(`next.config.mjs:44-60`), então uma violação é 100% silenciosa no servidor. A sonda
contornou isso escutando o evento **`securitypolicyviolation` do `document`** e
listando as violações **na tela**. Resultado do gate humano: **0 violações**, com o
ciclo inteiro funcionando. ⭐ E há um segundo argumento independente: na rodada em que
a chave estava errada, o widget **chegou a receber um 400 da Cloudflare** — uma
requisição que **sai e é respondida** prova que a CSP não a bloqueou.
⇒ **A cicatriz do Vimeo não se repetiu.**

### 10.2 ✅ O ciclo inteiro funciona ponta a ponta

```
render → token (773 chars) → POST siteverify → HTTP 200
  { success: true, hostname: "localhost", "error-codes": [], metadata: { interactive: false } }   210ms
```
⭐ **`interactive: false`** — o modo **managed** não pediu clique. **Zero atrito** para a
pessoa real, que é exatamente o que se queria saber antes de pôr isso na porta de
entrada do funil.

### 10.3 ✅ `localhost` funciona com a chave de PRODUÇÃO — não precisamos de chave de teste

Os hostnames do widget são **`app.mymembersclub.com.br` · `applyfy-mvp.vercel.app` ·
`localhost`**. A Cloudflare **permite** domínio local (a doc só *recomenda* não usar em
chave de produção — *"Cloudflare recommends that sitekeys used in production do not
allow local domains"*, que é recomendação, não proibição). ⇒ **staging e dev usam a
chave real**; as *dummy keys* documentadas (`1x00000000000000000000AA` etc.) **não são
necessárias**. ⓘ Domínio **nunca** foi o problema desta sonda.

⚠️ **ATUALIZAÇÃO 30/08/26 — o widget mudou.** O par em uso agora é o do **widget v2** (*"Members Club - Cadastro v2"*), criado porque a rotação da secret do v1 **não efetivava** (§10.7). ⚠️ **Os 3 hostnames e o modo managed foram CONFIGURADOS iguais — isso é PREMISSA DE PAINEL, não medição.** Tudo o que esta seção prova foi medido no **v1**; no v2 revalida no gate humano do widget, e a prova é o campo `hostname` da resposta do `siteverify`. Esta frente já teve **quatro** valores que chegaram "confirmados no painel" e estavam errados — herdar prova por semelhança de configuração é exatamente o que não se faz aqui. A sitekey v1 (`0x4AAAAAAEiYQMvuGFkxJM5v`) está **aposentada**; o widget v1 aguarda exclusão (**9.170**).

### 10.4 🔴 O DISCRIMINADOR SITEKEY × SECRET — o achado mais importante da sonda

As duas chaves **se parecem**: mesmo prefixo `0x4AAAAAA`, mesmo painel, campos
vizinhos. Só o **formato** difere — **sitekey 24 chars · secret 35** — e não dá para
confiar no olho. **Trocá-las publica a SECRET no bundle do navegador.**

⚠️⚠️ **E o pior: a troca "quase funciona".** A secret **valida no servidor** — o
`siteverify` aceita —, então o sintoma é parcial e o vazamento é silencioso.
**Um gate de configuração que pergunte só "a env existe?" NÃO pega esse caso.**

**O teste, e ele discrimina de verdade — rodar em TODO valor ANTES de colar:**
```bash
curl -s -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
  -d "secret=<CANDIDATO>" -d "response=x"
```
| Resposta | O candidato é | Onde pode ir |
|---|---|---|
| `{"error-codes":["invalid-input-secret"]}` | **SITEKEY** (ou string inválida) | ✅ `NEXT_PUBLIC_…`, HTML, bundle |
| `{"error-codes":["invalid-input-response"]}` | **SECRET** | 🔴 **nunca no cliente** — só `TURNSTILE_SECRET_KEY` |

**Prova de que o teste discrimina** (é o que o torna confiável, e não plausível):
sitekeys **reais e documentadas** (`1x00000000000000000000AA`, `2x00000000000000000000AB`)
são **recusadas** como secret com `invalid-input-secret`; uma secret real **passa**.

### 10.5 ⚠️ O histórico honesto — a sonda custou 4 rodadas, e o erro é de INTERFACE

Fica registrado porque **vai se repetir** com quem abrir aquele painel:

| Rodada | O que aconteceu | Custo |
|---|---|---|
| 1 | Sonda construída e CSP liberada no mínimo | — |
| 2 | Widget falhou: `error-callback` **400020**. A hipótese do comando leu isso como *"domínio não autorizado"*; a doc diz que **`400020` = "Invalid sitekey"** e que domínio é **`110200`**. A chave tinha **um "A" a mais** no prefixo (25 chars em vez de 24) | 1 rodada |
| 3 | Ao voltar ao painel, foi lida a **SECRET** em vez da site key (campos vizinhos, formato parecido). Detectado pelo discriminador **antes do commit**; a secret chegou a ser assada num bundle **local** e foi expurgada (`.next` apagado, env removida, nada commitado) | 1 rodada |
| 4 | Site key correta, **verificada pelo discriminador antes de entrar**. Gate verde | — |

⭐ **A lição de método:** *medir o dado que chega, mesmo quando vem confirmado.* Nas
rodadas 2 e 3 o valor veio como "confirmado no painel" e estava errado nas duas.
⭐ **A lição de produto:** a sonda só ficou diagnosticável quando passou a **mostrar na
tela qual chave estava em uso**. Ferramenta de diagnóstico que esconde o próprio
insumo não diagnostica.

### 10.6 📌 Requisitos que isto impõe ao cadastro

1. **`NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` nos DOIS ambientes**,
   com valores **diferentes** (a de staging não vale em produção).
2. **Zero literal no código.** A site key vem de env, sem fallback.
3. **O discriminador (§10.4) roda em cada valor antes de entrar** — é a única checagem
   que separa os dois erros que já aconteceram.
4. **As 2 linhas de CSP (§10.1) entram no MESMO commit do widget**, não antes: hoje
   elas foram **removidas** do `next.config.mjs` por menor privilégio (§3 do DEV-BRABO),
   já que nada as consome até o cadastro existir.
5. ⚠️ **A env que falta é MUDA**: sem a site key o widget não renderiza, e **a CSP não
   tem `report-uri`** — nada no servidor acusa. Combinado com a decisão de **fail-open**,
   isso significa que *"captcha ausente por erro de configuração"* e *"captcha ausente
   porque a Cloudflare caiu"* **são indistinguíveis** hoje. Ver o item **9.169**.

### 10.7 ✅ RESOLVIDA (30/08/26) — e a rotação simples NÃO bastou: foi preciso WIDGET NOVO

A secret do v1 **circulou fora do contrato de segredo** — e **duas vezes**: na sonda
(colada em conversa) e depois na verificação do próprio item, quando o valor de um slot
`NEXT_PUBLIC_…` foi **impresso** porque o **nome do slot** foi tomado como prova de que o
conteúdo era público. ⭐ **Regra que nasceu: o nome do slot é uma alegação sobre para onde
o valor VAI, não sobre o que ele É — o discriminador (§10.4) roda ANTES de qualquer
impressão, inclusive de valor tido como público.**

⭐ **E a rotação não fechava o item — medido, não suposto.** Em **três** tentativas o
painel do v1 devolveu **o mesmo valor byte a byte** (mesmo `sha256`), e o discriminador
mostrava a chave **pré-rotação ainda ACEITA** pelo `siteverify`: se a Cloudflare guarda
**um** *previous secret*, uma rotação real a teria expulsado na hora. ⇒ **a rotação não
estava efetivando, e a chave vazada era a que estava EM VIGOR.** As três rodadas foram
barradas pelo **gate de ineditismo** — nenhuma gravou nada.

**A saída pela raiz:** widget **v2** (*"Members Club - Cadastro v2"*), managed, mesmos 3
hostnames. Par novo no `.env.staging` por escrita atômica com rollback armado — sitekey
**24** chars, secret **35**, **as duas provadas pelo discriminador antes de entrar**;
varredura por padrão com **0** secrets fora do arquivo e `git grep` **0**; clipboard limpo.
Item **9.169 fechado**. Sobra o **9.170** (excluir o widget v1 do painel).

⚠️ **A alínea que NÃO fechou** e volta no desenho do cadastro: com **fail-open** e a CSP
**sem `report-uri`**, *"captcha ausente por configuração errada"* e *"captcha ausente
porque a Cloudflare caiu"* continuam **indistinguíveis**.

---

## 11. O VÍNCULO SEM MATRÍCULA — DECISÃO, OPÇÕES DESCARTADAS E PRÉ-REQUISITOS (31/08/26)

> **De onde vem.** Investigação read-only da **etapa 5**, feita sobre `main @ 9b93a2f`, com
> 6 leitores + 24 verificadores adversariais e **medição SELECT-only em produção**
> (`SUPABASE_REF wyamxwmdgbvqrfcqfbyh`, alvo impresso antes de cada conexão). **Zero código.**

### 11.1 ⭐ A DECISÃO DO DONO — o vínculo é uma MARCA PRÓPRIA

O cadastro criará **conta + pertencimento ao workspace**, com **matrícula OPCIONAL**. A pessoa
se cadastra num workspace específico, passa a ver **aquela** vitrine, e pode resgatar um
gratuito, comprar um pago, ou não fazer nada. Uma conta por e-mail (global), **um cadastro por
workspace**; cadastrado no produtor A **não** vê a vitrine do produtor B.

**O pertencimento será uma marca própria.** As outras três opções estão **descartadas por
medição**, não por gosto:

| Opção | Por que caiu | Prova |
|---|---|---|
| **Usar a `WorkspaceCredential`** | Daria pertencimento **retroativo a 1.177 pessoas** em **15 workspaces** (679 delas não são aluno de ninguém) — e **exclui staff por construção**: `webhook-helpers.ts:144` só cria credencial `if (!isStaff && workspaceId)`, então produtor que compra de outro produtor, colaborador e admin teriam pertencimento **zero** mesmo com matrícula ativa. E há **dois criadores sem vínculo** | item **9.176** |
| **Matrícula "vazia" (sem curso)** | **Impossível no schema**: `courseId` é `NOT NULL` sem default (`information_schema` em produção), com FK obrigatória e **`Enrollment_userId_courseId_key` UNIQUE**. Nenhuma das 7 migrações que tocam `Enrollment` afrouxa isso. Exigiria migração **e** um `Course`-sentinela real — e `Course.workspaceId` também é `NOT NULL` | medido 31/08 |
| **`Collaborator` com permissão nula** | ⛔ **Não resolve o problema**: `workspace-access.ts:49-54` com `permissions: []` **não retorna `true`**, e as duas portas passam `requireMemberPermission: true` ⇒ a pessoa tomaria **exatamente o mesmo 403 de hoje**. E o efeito colateral é enorme: `auth.ts:183-188` **sintetiza a role `COLLABORATOR`** (135 chamadas de `requireStaff` em 86 arquivos), o painel abre (`producer/layout.tsx:38-43`), e a linha **vira a chave do dual-auth** em 4 pontos (`login:145-149` · `password:40-49` · `forgot-password:65-71` · `webhook-helpers:131-148`), **trocando o regime de senha das 679 pessoas** | medido 31/08 |

ⓘ Em produção há **13** `Collaborator` `ACCEPTED` + **4** `PENDING`, e **0** com permissões
vazias — o estado seria inédito.

### 11.2 ⭐ A ASSIMETRIA QUE O DESENHO TERÁ DE RESPEITAR

`hasWorkspaceAccess` tem **13 call-sites em 10 arquivos** (contados por `grep` literal em
`main @ 9b93a2f`), e apenas **3** passam `requireMemberPermission: true`:
**`w/[slug]/login:249`** · **`w/[slug]/init:63`** · **`courses/by-slug/[slug]/init:99`**.

🔴 **A função responde a DUAS perguntas diferentes com o mesmo nome:**
- **9 perguntam *"posso entrar?"*** — primeiro argumento é `user.id`;
- **4 perguntam *"esta pessoa é gente daqui?"*** — sobre um **terceiro**:
  `producer/students/[id]/tags:19`, `:49`, `:93` (passam `params.id`, o aluno-alvo) e
  `producer/lives/[id]/moderators:60` (passa o `userId` do **candidato a moderador**, vindo do
  corpo da requisição).

O próprio JSDoc do helper registra isso (`workspace-access.ts:15-21`) e é a razão declarada de
`requireMemberPermission` ser **opt-in por call-site**.

⚠️ **Consequência para o desenho:** uma 4ª via colocada **dentro** do helper move as duas
perguntas **de uma vez**. Nas 4 do terceiro, o efeito não é ler a mais — é **conceder poder ao
recém-cadastrado**: ele passaria a ser elegível a **moderador de live**, e moderador tem
`DELETE` de mensagem (`lives/[id]/messages/[messageId]:53-63`). É o caso literal da lição
*"feature inofensiva pode CRIAR o vetor"*.

### 11.3 ⛔ A ORDEM OBRIGATÓRIA — os furos fecham ANTES do cadastro público

Os itens **9.172**, **9.173**, **9.174**, **9.175**, **9.176** e **9.177** (grupo **E3.42**)
nasceram desta investigação. Três deles são **pré-requisito**, e a razão é uma só:

> **Hoje esses furos exigem uma conta na plataforma. Depois do cadastro público exigiriam
> apenas um cadastro grátis.** A mudança não cria os furos — ela **derruba o preço de entrada**
> deles.

1. **9.172 🔴** — `courses/by-slug/[slug]` sem gate de tenant: conteúdo cross-tenant para
   qualquer autenticado, com `api/search` entregando o slug. **Fecha antes.**
2. **9.173 🔴** — `lessons/[id]/quiz` sem gate de tenant, POST devolvendo o gabarito e
   disparando automação do produtor. **Fecha antes.**
3. **9.174 🟠** — `by-slug/[slug]/init` gateia por WORKSPACE e paga em CURSO. **É o furo que
   esta etapa amplificaria** — todo cadastrado passaria a recebê-lo. **Fecha antes.**
4. **9.175 · 9.176 · 9.177** — entram no mesmo grupo; **9.176** é o que sustenta a decisão do
   §11.1 (por que credencial não pode ser pertencimento).

### 11.4 O que a vitrine expõe hoje — e por que o risco NÃO está nela

O `select` da loja (`api/w/[slug]/init/route.ts:179-208`) devolve **metadado de catálogo**:
`id · title · slug · description · thumbnail · thumbnailPosition · checkoutUrl · price ·
priceCurrency · isFree · reviewsEnabled · showAccessBadge ·` 6 campos `member*Color ·
memberWelcomeText · memberLayoutStyle · featured · category`, mais as notas de avaliação
(`ownerId` entra no select e é **removido** em `:235`). **Não há módulo, aula, material nem
`videoUrl`.** Para não-staff o filtro é `isPublished: true, showInStore: true` (`:174-176`).

⇒ **Deixar alguém ver a vitrine é barato.** O risco vive nas **outras** rotas que o mesmo
helper guarda — daí a §11.3.

ⓘ **O que ainda precisa de medição humana:** (a) se o `videoUrl` vazado converte em vídeo
assistível (depende do provedor); (b) se há WAF/bot-protection na frente de
`/api/w/*/forgot-password` fora do repo; (c) `/api/student/workspace/route.ts` não foi lido —
não se sabe o que devolve para conta+credencial sem matrícula.

---

## 12. A MARCA DE PERTENCIMENTO — DECISÕES DO DONO (31/08/26)

> **É a base do desenho da fatia seguinte.** Registrado **antes** de implementar, para que o
> raciocínio não se perca — o §11 levantou as opções por medição; aqui ficam as **escolhas** e,
> mais importante, **o porquê de cada uma**. Zero código nesta rodada.

### 12.1 ⭐ LIVE É ASSUNTO DE ALUNO — e é isto que corta o pior risco NA RAIZ

**A regra:** para assistir live é preciso ter **curso**; para ter curso é preciso **comprar** ou
**resgatar** o gratuito. ⇒ o recém-cadastrado **não alcança live, não escreve no chat**, e a
pergunta *"pode ser moderador?"* **não chega a existir**. Mesmo raciocínio para **moderação de
comentários** e **comunidade**: exigem matrícula.

⭐ **Por que isto é elegante, e não só restritivo:** a investigação achou um ciclo que se fechava
sozinho — a marca abriria o `POST` do chat (`lives/[id]/messages/route.ts:112`) → escrever põe o
nome na caixa *"Assistindo"* do console do produtor, montada com quem escreveu nos últimos 10
minutos (`producer/lives/[id]/page.tsx:343-353`) → **ao lado dela há um botão `+mod`** (`:602`) →
o `POST` de `producer/lives/[id]/moderators/route.ts:60` aceitaria porque o helper diria sim → e
`LiveModerator` **apaga qualquer mensagem** da live (`lives/[id]/messages/[messageId]/route.ts:53-65`).
⇒ **cadastro gratuito + uma mensagem = um clique do poder de deletar conteúdo de aluno pagante.**

**A decisão do dono desarma esse ciclo no primeiro elo, sem trava especial nenhuma.** Não é
mitigação: é a regra de negócio tornando o vetor **inexistente**. É o contrário da lição *"feature
inofensiva pode CRIAR o vetor"* — aqui o recorte de produto **impede que o vetor nasça**.
ⓘ **Consequência prática:** o chat de live seguir **sem rate-limit** (`messages/route.ts` não
importa `rateLimit`, e o proxy pula `/api/` em `proxy.ts:58-61`) deixa de ser problema **desta**
etapa, porque quem não tem curso não chega lá.

### 12.2 ⭐ CANCELAR MATRÍCULA **NÃO** APAGA A MARCA

**O raciocínio do dono:** o cancelamento tira o **CURSO**, não o **pertencimento**. A pessoa volta
a ser *"só cadastrada"*: **vê a vitrine, pode comprar de novo ou resgatar o gratuito**.

📏 **Afeta os 505 pares medidos** cuja **única** matrícula é `CANCELLED` — o achado que só apareceu
quando a medição passou a usar as **3 vias exatas** do helper (`ACTIVE|EXPIRED`) em vez de *"tem
alguma Enrollment"*. A conta fecha: **1.341 + 505 = 1.846** pares.

⚠️ **Isto NÃO contradiz a regra do resgate** (§7): lá, *"o resgate não reativa matrícula cancelada
(409)"* — continua valendo. São coisas diferentes: **a marca não devolve o curso revogado**; ela
só mantém a pessoa vendo a **loja**. Revogação de acesso segue intacta.

### 12.3 A MARCA VALE EM EXATAMENTE 4 LUGARES

| Vale | Não vale |
|---|---|
| **Porta 1** — login do workspace (`w/[slug]/login/route.ts:248`) | **Porta 3** — curso (`courses/by-slug/[slug]/init/route.ts:124`) |
| **Porta 2** — vitrine (`w/[slug]/init/route.ts:62`) | aula · material · certificado |
| **Resgate** de curso gratuito (`courses/[id]/claim/route.ts:68`) | live · chat · comunidade · comentários |
| **As 3 rotas de tags** (`producer/students/[id]/tags/route.ts:19, :49, :93`) — a pergunta *"esta pessoa é gente minha?"* | **em todo o resto quem manda é a MATRÍCULA** |

⚠️ **Por que a Porta 3 fica de fora, provado no código:** `courses/by-slug/[slug]/init` **não
filtra por `isPublished`** e devolve seções, módulos, **títulos e descrições de aula**, duração e
`daysToRelease` de **qualquer curso do workspace** (`:58-97`). Se a marca valesse ali, o cadastrado
gratuito leria a árvore inteira de todo curso pago — inclusive os **não publicados**.

⭐ **E é isto que prova que a 4ª via NÃO pode entrar "dentro do helper" sem distinção:** as três
portas chamam `hasWorkspaceAccess` com o **mesmo** `requireMemberPermission`. Somado à assimetria
do §11.2 (**9** call-sites perguntam *"posso entrar?"* e **4** perguntam sobre um **terceiro**), a
forma da leitura é decisão de desenho da fatia seguinte — e **não** um detalhe de implementação.

### 12.4 A FORMA: tabela nova, no molde de `WorkspaceCredential`

`@@unique([userId, workspaceId])` + `onDelete: Cascade` nas **duas** FKs + `@@index([workspaceId])`
— a silhueta que a casa opera há meses (`prisma/schema.prisma:155-172`).
**A origem vira ENUM próprio, não boolean**, espelhando `EnrollmentOrigin` e o `AttachmentStatus`
do `PostAttachment` (`:602-606`): estado com nome é o padrão desta casa.

⚠️ **A `@@unique` não é só integridade — é a defesa contra corrida**: o molde é `create` +
`catch P2002` + re-busca **pela unique que conflitou** (a lição de que `upsert` do Prisma pode ser
emulado). E o contra-molde está no próprio schema: `PointsLedger` e `Notification` têm o par
`(userId, workspaceId)` **sem** unique — é assim que a casa diz *"isto é LOG, muitas linhas"*.
A marca é o oposto: **uma linha por par**.

### 12.5 ⚠️ A TABELA NASCE **COM RLS** — correção explícita de precedente

`ENABLE ROW LEVEL SECURITY` **+ `REVOKE`** na **própria migração**.

🔴 **O precedente recente NÃO tem, e isso foi medido:** só **duas** migrações do repo inteiro
habilitam RLS (`20260603150000_enable_rls_remaining_tables` e
`20260805004547_enable_rls_origin_lock_and_gateway_secret`), e **`PostAttachment` não aparece em
nenhuma** — `grep "ROW LEVEL"` na migração dele devolve **0**. O modelo é exemplar em **modelagem**
e **omisso em postura de banco**.
⇒ **A marca não repete a omissão**, porque ela guarda **quem pertence a qual produtor** — dado de
tenancy puro, a mesma família do P0 da Data API já fechado. **Registrado aqui como correção de
precedente, para que o próximo que copiar o `PostAttachment` copie a modelagem e não o buraco.**

### 12.6 ⚠️ A ORDEM: `migrate deploy` em produção **ANTES** do `git push`

É a cicatriz do dia dos anexos (`PLANO-MESTRE:1124`): *"o merge foi empurrado ANTES da migração, e
a Vercel faz deploy no push: o código foi para produção com o GET do feed consultando `attachments`
numa tabela que não existia."* **Não há esperteza que compense** — a Vercel deploya no push.
O runbook completo está na skill; a ordem é **GATE**, não sugestão.

### 12.7 🔵 FUTURO, fora desta etapa — BLOQUEIO / lista negra do produtor

Ideia do dono, registrada para o roadmap: **hoje o produtor tira o CURSO, mas não tem como tirar a
PESSOA do workspace.** Com a marca existindo, **bloquear passa a ser possível** — e é o complemento
natural dela: se pertencer é uma linha, deixar de pertencer é apagá-la ou marcá-la.
⇒ Item **9.188**. **Não é desta etapa.**

### 12.8 O que a fatia seguinte terá de resolver, e já está registrado

| # | O que | Onde |
|---|---|---|
| **9.187** 🟢 | a marca abre as portas mas é **invisível para a navegação** — `/api/student/workspace` resolve por `Enrollment` ACTIVE e devolve **404** sem ela | PLANO-MESTRE |
| **9.186** 🟢 | `HAS_TAG` é **inerte** para quem não tem matrícula ATIVA — o produtor tagueia, filtra, monta automação e ela **nunca alcança**, em silêncio | PLANO-MESTRE |
| **9.183** 🟠 | `GET` de tags **sem escopo de workspace** — o produtor A lê as tags de B/C/D | PLANO-MESTRE, grupo **E3.45** |
| **9.184** 🟠 | recortes de live **cegos a papel** (`if user.role === "STUDENT"`) — furo de PAPEL, que a decisão 12.1 **não** conserta | PLANO-MESTRE, grupo **E3.45** |
| **9.185** 🟠 | `/api/courses` devolve o **catálogo cru** (sem `select`) | PLANO-MESTRE, grupo **E3.45** |
