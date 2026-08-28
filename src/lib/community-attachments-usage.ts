import { prisma } from "@/lib/prisma";
import { COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES } from "@/lib/community-attachments-constants";

/* QUANTOS BYTES um workspace já gastou com anexos da comunidade.

   ───── Por que virou função ─────
   Esta mesma consulta nasceu DUPLICADA na etapa 2/3: uma cópia em
   `community/attachments/authorize` (a barreira de boa-fé) e outra em
   `lib/community-attachment-adoption` (a trava real). Quando a tela do
   produtor precisou do MESMO número, a escolha era uma terceira cópia ou
   extrair. Duas contas diferentes para o mesmo número é a família
   9.42/9.54/9.57 — e aqui seria pior que o normal: o produtor veria um valor e
   o sistema barraria por outro, sem ninguém entender por quê.

   ───── A cadeia, e por que não há campo denormalizado ─────
   PostAttachment → Post.courseId → Course.workspaceId. Os três saltos são
   indexados (`@@index([postId])` do model novo, `@@index([courseId, ...])` do
   Post e `@@index([workspaceId])` do Course), o que foi conferido na etapa 1
   ANTES de decidir não copiar o workspace para dentro do anexo.

   ⚠️ Só CONFIRMED conta. PENDING é transitório — pode nunca virar post, e é
   justamente o que a rotina de limpeza recolhe. Cobrar do produtor um byte que
   vai ser apagado em 24h seria mentir para ele. */
export async function bytesUsadosNoWorkspace(workspaceId: string): Promise<number> {
  const usado = await prisma.postAttachment.aggregate({
    where: { status: "CONFIRMED", post: { course: { workspaceId } } },
    _sum: { fileSize: true },
  });
  return usado._sum.fileSize ?? 0;
}

/** O número que a tela do produtor mostra — usados, teto e o que sobra. */
export async function consumoDoWorkspace(workspaceId: string) {
  const usedBytes = await bytesUsadosNoWorkspace(workspaceId);
  const limitBytes = COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES;
  return {
    usedBytes,
    limitBytes,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
    // Arredondado a uma casa: a tela não precisa de precisão de byte, e
    // devolver o cru evita que cada consumidor invente a sua própria conta.
    usedPercent: Math.round((usedBytes / limitBytes) * 1000) / 10,
  };
}
