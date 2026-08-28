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
| **1** | **Fundação de schema**: chave gratuito/pago no `Course` + marca de **origem** no `Enrollment`. Migração aditiva, zero runtime | Migração aplicada em staging com prova por `information_schema`; prova dupla em produção (não existe lá); `Post`/`Enrollment` sem colunas alteradas |
| **2** | **Cadastro público** (rota + tela): recusa e-mail existente (D5), WhatsApp obrigatório (D7), sem verificação (D6). **NÃO reusar `/api/auth/register`** (DIV-4) | Provas por API: e-mail novo cria; e-mail existente **recusa** com a frase da casa; sem WhatsApp recusa; rate-limit ativo |
| **3** | **"Resgatar acesso"** (D3) + a rota que cria a matrícula gratuita (D2), marcando a origem | Matrícula nasce ACTIVE com origem correta; **sem passar pelo ramo que rotaciona senha** (DIV-1); idempotente (resgatar duas vezes não duplica) |
| **4** | **Vitrine + cadeado** (D8): curso pago mostra cadeado que leva à página do curso; gratuito mostra "Resgatar" | Visitante deslogado, aluno sem matrícula e aluno matriculado veem o correto; o critério do `locked` passa a considerar gratuidade |
| **5** | **Gates**: confirmar que os 19 pontos de `ACTIVE` aceitam a matrícula gratuita sem alteração (D10) e que a comunidade funciona (D9) | Persona gratuita: entra na área de membros, assiste, comenta, anexa, baixa material, tira certificado — ou o relatório diz explicitamente o que NÃO deve |
| **6** | **Proteger a senha de quem já é aluno** (DIV-1): garantir que nenhum caminho do funil rotacione credencial existente | Prova: aluno com credencial resgata curso gratuito → **senha inalterada** (verificar hash antes/depois) |
| **7** | **Personalização** da tela de cadastro/resgate, no molde dos campos `login*` do `Workspace` (13 campos, `schema`) e dos `member*` do `Course` (8 campos) | Produtor personaliza e a tela reflete; campos são **texto puro**, não HTML (é o que os `login*` já são) |
| **8** | **Relatórios**: separar aluno gratuito de pagante onde a contagem importa (R6) — analytics e exportação CSV | O produtor consegue ver os dois números separados; o CSV traz a origem |

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
