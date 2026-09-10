/**
 * 9.271 — trava de intervalo na escrita de `User.lastAccessAt`.
 *
 * O campo era reescrito a CADA requisição do aluno: **17,5 vezes por aluno por
 * dia**, 643.036 vezes em 133,7 dias — **63,3% de todo o tempo de banco** da
 * plataforma, num `UPDATE` cujo trabalho real é de **0,04 ms** (99,1% HOT,
 * tabela de 11 MB, banco inteiro em cache). O custo nunca foi o trabalho: é a
 * exposição ao engasgo da instância, que atinge até `SELECT` indexado (máximo
 * medido: 20,5 s) e a própria query interna do PgBouncer (6,7 s).
 *
 * A precisão que alguém de fato CONSOME é bem mais grossa:
 *   - automações `STUDENT_INACTIVE` / `STUDENT_NEVER_ACCESSED` → **DIA**
 *     (`automation-cron.ts:19,32`; 3 das 11 automações ativas de produção)
 *   - ficha do aluno no painel do produtor e do admin → **MINUTO**
 *   - lista de alunos do admin → **DIA**
 * Uma hora de defasagem é invisível para a automação e cabe nas fichas.
 *
 * ⛔ **O PRIMEIRO ACESSO SEMPRE ESCREVE.** `lastAccessAt === null` é o
 * discriminador de "nunca acessou" — 19.468 usuários e a automação
 * `STUDENT_NEVER_ACCESSED` dependem dele. Nulo nunca é adiado.
 *
 * ⛔ **Não cobre `lastIpAddress`** (`api/auth/me/route.ts:31`), que é gravado
 * no MESMO `UPDATE` de lá e responde por outros 7,6% do tempo. É fatia própria,
 * por decisão do dono: travá-lo custa sinal de fraude/compartilhamento.
 *
 * ⭐ Molde: a trava de 1 hora do `AccessLog` em `api/auth/me/route.ts:35-45`,
 * que já existia no repo. A diferença é que lá o intervalo custa uma query
 * (`findFirst`) e aqui **não custa nenhuma** — o valor já chega em memória,
 * porque `getCurrentUser` busca o `User` sem `select` (as 22 colunas).
 */
export const LAST_ACCESS_MIN_INTERVAL_MS = 60 * 60 * 1000;

/**
 * `true` quando o carimbo deve ser regravado: nunca gravado (primeiro acesso)
 * ou mais velho que o intervalo mínimo.
 */
export function shouldWriteLastAccess(
  lastAccessAt: Date | null | undefined
): boolean {
  if (!lastAccessAt) return true;
  return Date.now() - lastAccessAt.getTime() >= LAST_ACCESS_MIN_INTERVAL_MS;
}
