import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { hasRealPlatformLink } from "@/lib/community-upload-access";
import { sanitizeFileName } from "@/lib/materials-constants";
import {
  COMMUNITY_ATTACHMENT_ALLOWED_TYPES,
  COMMUNITY_ATTACHMENT_EXT_BY_MIME,
  COMMUNITY_ATTACHMENT_MAX_FILE_SIZE,
  COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES,
} from "@/lib/community-attachments-constants";
import { createAdminClient, COMMUNITY_ATTACHMENTS_BUCKET } from "@/lib/supabase-admin";

/* POST /api/community/attachments/authorize   — etapa 2/4, rota A de duas.

   AUTORIZA um upload que vai DIRETO do browser para o Supabase Storage. O
   arquivo NÃO passa por aqui: o corpo é JSON minúsculo, e por isso o teto de
   50 MB é possível (a função da Vercel corta o corpo em ~4,5 MB). Devolve
   `{ attachmentId, path, token }`; o browser sobe com o token e depois chama
   a rota B (`../confirm`), que é quem PERGUNTA AO STORAGE o que realmente
   chegou.

   ⚠️ Nada aqui prova o CONTEÚDO. Tudo que este arquivo valida é DECLARAÇÃO do
   cliente — o buraco assumido está escrito em `community-attachments-constants.ts`.
   O que este arquivo garante é mais modesto e ainda assim importante: só quem
   tem vínculo real sobe, o caminho é escolhido pelo servidor, e o workspace
   não estoura a cota por descuido. */

type Corpo = {
  courseId?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
};

export async function POST(request: Request) {
  // 1) Rate-limit ANTES de tudo — molde de `community/upload/route.ts:108`.
  const limited = await rateLimit(request);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2) Vínculo real com a plataforma. A MESMA função do upload de imagem da
  //    comunidade — importada, não copiada (ver `lib/community-upload-access.ts`).
  if (!(await hasRealPlatformLink(user))) {
    return NextResponse.json(
      { error: "Você não tem permissão para enviar arquivos." },
      { status: 403 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Servidor mal configurado" }, { status: 500 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Corpo;
    const { courseId, fileName, fileSize, mimeType } = body;

    // 3) O DECLARADO.
    if (typeof courseId !== "string" || !courseId) {
      return NextResponse.json({ error: "Curso obrigatório" }, { status: 400 });
    }
    if (typeof fileName !== "string" || !fileName.trim()) {
      return NextResponse.json({ error: "Nome do arquivo obrigatório" }, { status: 400 });
    }
    if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "Tamanho inválido" }, { status: 400 });
    }
    if (fileSize > COMMUNITY_ATTACHMENT_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx. 50MB)" },
        { status: 400 }
      );
    }
    if (typeof mimeType !== "string" || !COMMUNITY_ATTACHMENT_ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Formato não permitido." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { workspaceId: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }
    const workspaceId = course.workspaceId;

    /* 4) TETO DE 2 GB POR WORKSPACE.

       A soma anda pela cadeia provada na etapa 1 — PostAttachment →
       Post.courseId → Course.workspaceId — e por isso NÃO há campo
       denormalizado no model. Os três saltos são indexados:
       `PostAttachment.@@index([postId])`, `Post.@@index([courseId, ...])` e
       `Course.@@index([workspaceId])`.

       Conta só o que está CONFIRMED, e isso é deliberado: PENDING é transitório
       e pode nunca virar nada.

       ⚠️ LIMITE HONESTO DESTA CHECAGEM, dito aqui para não virar surpresa: no
       momento do upload o post ainda NÃO existe, então o workspace vem do
       `courseId` que o cliente DECLARA. Quem quiser furar a cota pode declarar
       um curso folgado e depois anexar o arquivo a um post de outro curso. A
       checagem que fecha isso de verdade é a da ADOÇÃO (etapa 3), quando o post
       existe e o workspace deixa de ser declaração. Esta aqui é a barreira de
       boa-fé, que é o que impede o estouro por descuido — a esmagadora maioria
       dos casos. */
    const usado = await prisma.postAttachment.aggregate({
      where: {
        status: "CONFIRMED",
        post: { course: { workspaceId } },
      },
      _sum: { fileSize: true },
    });
    const jaUsado = usado._sum.fileSize ?? 0;
    if (jaUsado + fileSize > COMMUNITY_ATTACHMENT_MAX_WORKSPACE_BYTES) {
      // Sem números internos na resposta (§9): o aluno não precisa saber quanto
      // o workspace consumiu, e o produtor vê isso na tela dele.
      return NextResponse.json(
        { error: "O espaço de arquivos desta área acabou. Fale com o produtor." },
        { status: 400 }
      );
    }

    /* 5) O PATH é montado 100% no SERVIDOR — nenhum byte do cliente decide onde
       grava nem qual sufixo fica. O nome enviado só sobrevive sanitizado e SEM
       a extensão dele: o sufixo vem do mimeType já validado. É a diferença
       exata para a rota de anexo de suporte (item 9.130), onde
       `file.name.split(".").pop()` deixa o cliente escolher. */
    const ext = COMMUNITY_ATTACHMENT_EXT_BY_MIME[mimeType];
    const base = sanitizeFileName(fileName).replace(/\.[^.]*$/, "").slice(0, 80) || "arquivo";
    const storagePath = `community/${user.id}/${Date.now()}_${base}.${ext}`;

    // 6) A linha nasce PENDING e SEM post. Ela é o registro de que este path
    //    foi autorizado a existir — a rota B não assina nada que não esteja aqui.
    const attachment = await prisma.postAttachment.create({
      data: {
        userId: user.id,
        storagePath,
        fileName: fileName.trim().slice(0, 255),
        fileSize,
        mimeType,
        status: "PENDING",
      },
      select: { id: true },
    });

    // 7) O token de upload.
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(COMMUNITY_ATTACHMENTS_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      // A linha só existe para casar com um objeto; sem token não haverá objeto.
      // Apagar aqui evita nascer o órfão que o 9.104 mediu no bucket materials.
      await prisma.postAttachment
        .delete({ where: { id: attachment.id } })
        .catch(() => {});
      console.error("[community attachment authorize] signed url:", error);
      return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
    }

    return NextResponse.json({
      attachmentId: attachment.id,
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    // Mensagem interna vai para o log, não para a resposta (§9).
    console.error("[community attachment authorize]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
