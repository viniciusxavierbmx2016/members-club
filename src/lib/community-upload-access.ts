import { prisma } from "@/lib/prisma";

/* Quem pode enviar arquivo pela COMUNIDADE — imagem no editor (`community/upload`)
   e, desde a etapa 2 dos anexos, também `community/attachments/authorize`.

   Esta função nasceu dentro de `api/community/upload/route.ts` e foi movida para
   cá sem UMA vírgula de mudança de lógica, quando a segunda porta apareceu. O
   molde é o do `lib/upload-access.ts`, que registra o motivo com todas as letras:
   "Paridade declarada em comentário e mantida por CÓPIA é a receita do
   9.42/9.54/9.57 — aqui é UMA função, e as duas a importam."

   ───── O critério, e por que ele NÃO é "matrícula no curso X" ─────
   Nenhuma das duas rotas sabe em que curso o arquivo vai ser usado no momento
   do upload: o objeto é gravado em `community/{userId}/…`, sem curso no
   caminho, e o editor é compartilhado por cinco superfícies (post, comentário,
   resposta, edição de post e — fora da comunidade — a descrição da aula no
   painel do produtor). Exigir "matrícula no curso X" seria um obstáculo e não
   uma fronteira: quem tem matrícula em QUALQUER curso declararia esse curso.

   A fronteira de CONTEXTO continua onde ela de fato existe: publicar
   (`posts/route.ts`) e comentar (`posts/[id]/comments/route.ts`) exigem
   matrícula ACTIVE ou permissão de comunidade NAQUELE curso. Um arquivo subido
   fora de contexto nasce órfão.

   O que se fecha aqui é o que estava aberto: conta recém-criada, sem nenhum
   vínculo, usando o Storage como hospedagem gratuita. */

// A união dos call-sites que realmente usam este editor, não um palpite:
// comunidade escreve com MANAGE_COMMUNITY/REPLY_COMMENTS, a descrição da aula
// com MANAGE_LESSONS.
const UPLOAD_PERMISSIONS = ["MANAGE_COMMUNITY", "REPLY_COMMENTS", "MANAGE_LESSONS"];

export async function hasRealPlatformLink(user: {
  id: string;
  role: string;
}): Promise<boolean> {
  // ADMIN e dono ANTES do vínculo (lição 9.63: há PRODUCER em produção que
  // também carrega linha de Collaborator — consultar o vínculo primeiro daria
  // a resposta do papel errado).
  if (user.role === "ADMIN") return true;
  if (user.role === "PRODUCER") {
    const [workspaces, courses] = await Promise.all([
      prisma.workspace.count({ where: { ownerId: user.id } }),
      prisma.course.count({ where: { ownerId: user.id } }),
    ]);
    if (workspaces > 0 || courses > 0) return true;
  }

  const enrollments = await prisma.enrollment.count({
    where: { userId: user.id, status: "ACTIVE" },
  });
  if (enrollments > 0) return true;

  // Colaborador ACCEPTED com alguma das permissões que realmente usam o editor.
  const collaborations = await prisma.collaborator.count({
    where: {
      userId: user.id,
      status: "ACCEPTED",
      permissions: { hasSome: UPLOAD_PERMISSIONS },
    },
  });
  return collaborations > 0;
}
