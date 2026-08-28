import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  COMMUNITY_ATTACHMENT_MAX_PER_POST,
  COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES,
} from "@/lib/community-attachments-constants";

/* ADOÇÃO de anexos por um post da comunidade — etapa 3/4.

   ⭐ É AQUI QUE O TETO DE 2 GB VIRA TRAVA DE VERDADE.
   Em `community/attachments/authorize` o workspace vem do `courseId` que o
   CLIENTE declara, porque no momento do upload o post ainda não existe — lá é
   barreira de BOA-FÉ, e está dito no comentário daquela rota. Aqui o post está
   nascendo (ou sendo editado), então o workspace vem da cadeia real
   anexo → post → curso → workspace e não há nada a declarar. Quem tentou furar
   a cota declarando um curso folgado esbarra NESTE ponto.

   Vive em `lib/` e não dentro do route porque as DUAS portas precisam da mesma
   regra — criar post (`api/posts`) e editar post (`api/posts/[id]`). Molde de
   `lib/upload-access.ts`: paridade mantida por CÓPIA é a receita do
   9.42/9.54/9.57.

   ⚠️ TUDO OU NADA, de propósito: se um id da lista falha, o post inteiro é
   recusado. Adotar parcialmente entregaria ao autor um post com menos anexos do
   que ele anexou, sem avisar — falso sucesso, a família do 9.107. */

export type ResultadoValidacao =
  | { ok: true; bytes: number }
  | { ok: false; erro: string; status: number };

/** Confere a lista ANTES de o post existir. Não escreve nada. */
export async function validarAnexosParaAdocao(params: {
  userId: string;
  attachmentIds: string[];
  workspaceId: string;
  jaNoPost?: number;
}): Promise<ResultadoValidacao> {
  const { userId, attachmentIds, workspaceId, jaNoPost = 0 } = params;
  if (attachmentIds.length === 0) return { ok: true, bytes: 0 };

  const unicos = [...new Set(attachmentIds)];
  if (unicos.length !== attachmentIds.length) {
    return { ok: false, erro: "Anexo repetido na lista.", status: 400 };
  }
  if (jaNoPost + unicos.length > COMMUNITY_ATTACHMENT_MAX_PER_POST) {
    return {
      ok: false,
      erro: `Um post aceita no máximo ${COMMUNITY_ATTACHMENT_MAX_PER_POST} anexos.`,
      status: 400,
    };
  }

  /* Os três predicados de uma vez — e o `postId: null` é o que impede reusar o
     mesmo anexo em dois posts. Se algum id não casar com TODOS eles, a contagem
     não fecha e a lista inteira cai. A resposta não diz QUAL falhou nem por
     quê: id de outro usuário, id inexistente e id já adotado saem pela mesma
     porta, como no `confirm` da etapa 2. */
  const anexos = await prisma.postAttachment.findMany({
    where: { id: { in: unicos }, userId, status: "CONFIRMED", postId: null },
    select: { id: true, fileSize: true },
  });
  if (anexos.length !== unicos.length) {
    return { ok: false, erro: "Anexo não encontrado.", status: 400 };
  }

  // O TETO REAL. Só CONFIRMED entra na conta; os que estão sendo adotados agora
  // ainda têm postId nulo, então não aparecem na soma do workspace — por isso
  // eles são somados à parte.
  const bytes = anexos.reduce((s, a) => s + a.fileSize, 0);
  const usado = await prisma.postAttachment.aggregate({
    where: { status: "CONFIRMED", post: { course: { workspaceId } } },
    _sum: { fileSize: true },
  });
  if ((usado._sum.fileSize ?? 0) + bytes > COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES) {
    // Sem números internos na resposta (§9).
    return {
      ok: false,
      erro: "O espaço de arquivos desta área acabou. Fale com o produtor.",
      status: 400,
    };
  }

  return { ok: true, bytes };
}

/** Prende os anexos ao post. Roda DENTRO da transação que cria/edita o post.
    Lança se algum id não puder mais ser adotado — e aí a transação inteira
    volta atrás, post incluído. */
export async function adotarAnexos(
  tx: Prisma.TransactionClient | PrismaClient,
  params: { postId: string; userId: string; attachmentIds: string[] }
): Promise<void> {
  const { postId, userId, attachmentIds } = params;
  if (attachmentIds.length === 0) return;

  /* O `postId: null` no WHERE é a guarda de CORRIDA, não decoração: entre a
     validação e este update, outra requisição pode ter adotado o mesmo anexo.
     O banco decide — quem chegar depois atualiza 0 linhas, a contagem não fecha
     e a transação cai inteira. É o mesmo princípio do 9.23: contra corrida,
     quem arbitra é o banco, não um check-then-write. */
  const r = await tx.postAttachment.updateMany({
    where: { id: { in: attachmentIds }, userId, status: "CONFIRMED", postId: null },
    data: { postId },
  });
  if (r.count !== attachmentIds.length) {
    throw new Error("ANEXO_INDISPONIVEL");
  }
}
