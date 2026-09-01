import { prisma } from "@/lib/prisma";
import { MEMBER_AREA_PERMISSION } from "@/lib/collaborator";

/**
 * Returns true if the given user has access to the given workspace.
 * A student has access when they have at least one Enrollment in a course
 * of the workspace, OR an accepted Collaborator record, OR they own the
 * workspace (PRODUCER). Does not handle the ADMIN global bypass — callers
 * should skip this check for ADMIN role.
 *
 * `requireMemberPermission` (opt-in, default false) exige `ACCESS_MEMBER_AREA`
 * do ramo COLABORADOR — e só dele. Serve às PORTAS da área de membros (login do
 * workspace, vitrine, curso), onde o produtor passou a poder revogar a entrada.
 *
 * ⚠️ Opt-in por call-site, e NÃO embutido no helper, porque `hasWorkspaceAccess`
 * também é chamado pelo PAINEL — e lá a pergunta é outra:
 *   · `producer/students/[id]/tags` pergunta pelo ALUNO (passa params.id, não o
 *     id de quem está logado): exigir permissão de colaborador ali seria
 *     perguntar a coisa errada sobre a pessoa errada;
 *   · `producer/lives/[id]/moderators` valida um CANDIDATO a moderador.
 * Ligar a exigência dentro do helper quebraria os dois em silêncio.
 *
 * Matrícula e posse NÃO são afetadas: aluno e dono entram como sempre.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `allowMembership` (opt-in, default false) — E4.4 etapa 5, fatia 1.
 * Faz a MARCA DE PERTENCIMENTO (`WorkspaceMembership`) contar como 4ª via.
 * Decisões canônicas no §12 do `docs/PLANO-E4.4-MINI-CURSO-GRATUITO.md`.
 *
 * ⚠️ OPT-IN, e esta é a decisão de desenho mais importante da fatia. Se a
 * marca contasse SEM distinção, os 13 call-sites deste helper a herdariam de
 * uma vez — e entre eles está a PORTA 3 (`courses/by-slug/[slug]/init:124`),
 * que devolve seções, módulos e títulos/descrições de aula de QUALQUER curso
 * do workspace, sem filtrar `isPublished`. O recém-cadastrado leria a árvore
 * inteira de todo curso pago. Por isso a marca vale em EXATAMENTE 4 lugares
 * (§12.3): login do workspace · vitrine · resgate de curso gratuito · as 3
 * rotas de tags ("esta pessoa é gente minha?"). Como as tags são 3 handlers,
 * esses 4 lugares são 6 dos 13 call-sites; nos outros 7 o parâmetro não é
 * passado, o default é false, e o comportamento é o de hoje, byte a byte.
 *
 * A forma copia o `requireMemberPermission` acima de propósito: é o precedente
 * desta casa para exatamente esta tensão — um helper com 13 chamadores que
 * respondem a perguntas diferentes.
 *
 * ⚠️ A marca NÃO substitui a credencial. No login ela resolve o gate de
 * VÍNCULO (`w/[slug]/login:248`); a autenticação continua exigindo a
 * `WorkspaceCredential` daquele workspace (`:181-199`). São duas paredes.
 */
export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string,
  opts?: { requireMemberPermission?: boolean; allowMembership?: boolean }
): Promise<boolean> {
  const [enrollment, collab, ws, membership] = await Promise.all([
    prisma.enrollment.findFirst({
      where: {
        userId,
        course: { workspaceId },
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      select: { id: true },
    }),
    prisma.collaborator.findFirst({
      where: { userId, workspaceId, status: "ACCEPTED" },
      select: { id: true, permissions: true },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    }),
    // Só consulta quando o call-site pediu. Nos outros 7 isto é
    // `Promise.resolve(null)` — nenhuma consulta a mais no caminho quente.
    opts?.allowMembership
      ? prisma.workspaceMembership.findUnique({
          where: { userId_workspaceId: { userId, workspaceId } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (enrollment) return true;
  if (collab) {
    if (!opts?.requireMemberPermission) return true;
    if (collab.permissions.includes(MEMBER_AREA_PERMISSION)) return true;
    // Sem a permissão o vínculo não abre a porta — mas o dono e a matrícula
    // seguem abrindo, então quem também é aluno entra pelo caminho de aluno.
  }
  if (ws?.ownerId === userId) return true;
  // A 4ª via, por último de propósito: quem já entra por matrícula, colaboração
  // ou posse não muda de caminho — a marca só decide quem NÃO tinha nenhuma
  // das três. ⚠️ `membership` é sempre null quando `allowMembership` não veio.
  if (membership) return true;
  return false;
}
