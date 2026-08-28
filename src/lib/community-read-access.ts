import { prisma } from "@/lib/prisma";
import {
  collaboratorCanActOnCourse,
  mensagemDeEntradaNegada,
} from "@/lib/collaborator";

/* QUEM PODE LER a comunidade de um curso.

   ───── Por que este arquivo existe ─────
   A regra estava ESCRITA INLINE, duplicada, em `api/posts/route.ts`: uma cópia
   no GET (ler o feed) e outra no POST (publicar), com a mesma estrutura e a
   mesma ordem. Quando o download de anexo precisou do mesmo critério, a
   escolha era escrever uma TERCEIRA cópia ou extrair. Regra de autorização
   mantida por cópia é a doença que esta casa já pagou caro para desfazer
   (9.42 · 9.54 · 9.57), e o `lib/upload-access.ts` registra a mesma decisão
   com todas as letras: "aqui é UMA função, e as duas a importam".

   ⚠️ O POST AINDA TEM A CÓPIA DELE (`api/posts/route.ts`, o segundo
   `if (!course.communityEnabled)`). Isto NÃO é esquecimento: PUBLICAR não é
   LER, e unificar dois critérios que hoje só por acaso coincidem seria uma
   mudança grande no meio de outra. Fica como item próprio — quem for unificar
   precisa primeiro provar que os dois devem mesmo ser o mesmo critério.

   ───── O que NÃO mudou na extração ─────
   Nem a lógica nem a ORDEM das checagens: comunidade ligada → staff/dono →
   colaborador (com `requireMemberAccess`) → matrícula ACTIVE. A única
   diferença é a FORMA de recusar: em vez de devolver `NextResponse` daqui de
   dentro, devolve-se o motivo e o status, e quem chamou responde. Foi o que
   permitiu a segunda porta reusar sem herdar o formato de resposta da
   primeira. */

export type AcessoLeituraComunidade =
  | { ok: true; isStaffOwner: boolean; collabAllowed: boolean }
  | { ok: false; erro: string; status: number };

type CursoParaGate = {
  id: string;
  ownerId: string | null;
  communityEnabled: boolean;
  workspace: { ownerId: string };
};

export async function checarLeituraDaComunidade(
  user: { id: string; role: string },
  course: CursoParaGate
): Promise<AcessoLeituraComunidade> {
  if (!course.communityEnabled) {
    return { ok: false, erro: "Comunidade desativada neste curso", status: 403 };
  }

  const isStaffOwner =
    user.role === "ADMIN" ||
    (user.role === "PRODUCER" &&
      (course.ownerId === user.id ||
        course.workspace.ownerId === user.id));
  let collabAllowed = false;
  // C6: drop the role gate. collaboratorCanActOnCourse itself returns
  // false when there's no ACCEPTED Collaborator row, so STUDENT without
  // collab elevation is a no-op (and STUDENT-with-Collab now passes).
  if (!isStaffOwner) {
    // ENTRADA na comunidade (VER o feed): além da permissão de comunidade,
    // exige ACCESS_MEMBER_AREA (9.78). Moderação pelo PAINEL não passa aqui.
    collabAllowed = await collaboratorCanActOnCourse(
      user.id,
      course.id,
      ["MANAGE_COMMUNITY", "REPLY_COMMENTS"],
      { requireMemberAccess: true }
    );
  }
  if (!isStaffOwner && !collabAllowed) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: course.id },
      },
    });
    if (!enrollment || enrollment.status !== "ACTIVE") {
      // 9.79 — distingue "nunca teve vínculo" de "perdeu ACCESS_MEMBER_AREA".
      // A consulta extra roda SÓ aqui, no caminho de falha.
      return {
        ok: false,
        erro: await mensagemDeEntradaNegada(user.id, course.id),
        status: 403,
      };
    }
  }

  return { ok: true, isStaffOwner, collabAllowed };
}
