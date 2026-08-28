import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { collaboratorCanActOnCourse } from "@/lib/collaborator";
import {
  adotarAnexos,
  validarAnexosParaAdocao,
} from "@/lib/community-attachment-adoption";
import { sanitizeHtml, hasPostContent } from "@/lib/sanitize-html";
import { PostType } from "@prisma/client";
import { updatePostSchema, validateBody } from "@/lib/validations";

const VALID_TYPES: PostType[] = ["QUESTION", "RESULT", "FEEDBACK", "FREE"];

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    let canEdit = user.role === "ADMIN" || post.userId === user.id;
    if (!canEdit && user.role === "PRODUCER") {
      const course = await prisma.course.findUnique({
        where: { id: post.courseId },
        select: { ownerId: true, workspace: { select: { ownerId: true } } },
      });
      canEdit = course?.ownerId === user.id || course?.workspace.ownerId === user.id;
    }
    // C6: drop role gate — helper handles "no Collaborator row → false".
    if (!canEdit) {
      canEdit = await collaboratorCanActOnCourse(user.id, post.courseId, ["MANAGE_COMMUNITY"]);
    }
    if (!canEdit) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const raw = await request.json().catch(() => ({}));
    const v = validateBody(updatePostSchema, raw);
    if (!v.success) return v.error;
    const { content, type } = v.data;
    const attachmentIds = v.data.attachmentIds ?? [];

    const data: Record<string, unknown> = {};
    if (content !== undefined) {
      if (typeof content !== "string") {
        return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
      }
      const sanitized = sanitizeHtml(content);
      if (!hasPostContent(content)) {
        return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });
      }
      if (sanitized.length > 20000) {
        return NextResponse.json({ error: "Conteúdo muito longo" }, { status: 400 });
      }
      data.content = sanitized;
    }
    if (type !== undefined && VALID_TYPES.includes(type)) {
      data.type = type;
    }

    /* ANEXOS na edição (etapa 3/4) — ACRESCENTA, nunca remove: tirar anexo de
       post é decisão de produto ainda não pedida, e implementá-la de carona
       seria inventar comportamento. O teto de 5 conta os que o post JÁ tem, e o
       teto de 2GB usa o workspace REAL do post.

       ⚠️ `userId: user.id` na validação, e não `post.userId`: quem edita pode
       ser um moderador com MANAGE_COMMUNITY (ver o `canEdit` acima). Ele só
       consegue prender anexos que ELE mesmo subiu — nunca os de terceiros. */
    if (attachmentIds.length > 0) {
      const curso = await prisma.course.findUnique({
        where: { id: post.courseId },
        select: { workspaceId: true },
      });
      if (!curso) {
        return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
      }
      const jaNoPost = await prisma.postAttachment.count({
        where: { postId: post.id },
      });
      const check = await validarAnexosParaAdocao({
        userId: user.id,
        attachmentIds,
        workspaceId: curso.workspaceId,
        jaNoPost,
      });
      if (!check.ok) {
        return NextResponse.json({ error: check.erro }, { status: check.status });
      }
    }

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        const u = await tx.post.update({
          where: { id: params.id },
          data,
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, role: true } },
            group: { select: { id: true, name: true, slug: true, permission: true } },
            _count: { select: { likes: true, comments: true } },
          },
        });
        await adotarAnexos(tx, {
          postId: u.id,
          userId: user.id,
          attachmentIds,
        });
        return u;
      });
    } catch (e) {
      if (e instanceof Error && e.message === "ANEXO_INDISPONIVEL") {
        return NextResponse.json({ error: "Anexo não encontrado." }, { status: 400 });
      }
      throw e;
    }

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("PUT /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Erro ao editar post" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    let canDelete = user.role === "ADMIN" || post.userId === user.id;
    if (!canDelete && user.role === "PRODUCER") {
      const course = await prisma.course.findUnique({
        where: { id: post.courseId },
        select: { ownerId: true, workspace: { select: { ownerId: true } } },
      });
      canDelete =
        course?.ownerId === user.id ||
        course?.workspace.ownerId === user.id;
    }
    // C6: drop role gate — helper handles "no Collaborator row → false".
    if (!canDelete) {
      canDelete = await collaboratorCanActOnCourse(user.id, post.courseId, [
        "MANAGE_COMMUNITY",
      ]);
    }
    if (!canDelete) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir post" },
      { status: 500 }
    );
  }
}
