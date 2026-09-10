import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, requirePermission } from "@/lib/auth";
import { resolveStaffWorkspace } from "@/lib/workspace";
import { hasWorkspaceAccess } from "@/lib/workspace-access";
import { studentTagSchema, validateBody } from "@/lib/validations";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const staff = await requireStaff();
    if (staff.role === "COLLABORATOR") {
      await requirePermission(staff, "MANAGE_STUDENTS");
    }
    const { workspace } = await resolveStaffWorkspace(staff);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 400 });
    }
    // E4.4 §12.3 — pergunta sobre TERCEIRO ("esta pessoa é gente minha?"), e a
    // marca é exatamente essa resposta. ⚠️ Aqui NÃO vai `requireMemberPermission`:
    // perguntar permissão de colaborador sobre o aluno-alvo seria perguntar a
    // coisa errada sobre a pessoa errada (ver o JSDoc do helper).
    if (
      !(await hasWorkspaceAccess(params.id, workspace.id, {
        allowMembership: true,
      }))
    ) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }
    // 9.183 — ESCOPO DE WORKSPACE no GET. O POST (`:79`) e o DELETE (`:129`)
    // já recusam tag de outro workspace com `tag.workspaceId !== workspace.id`;
    // só a leitura não filtrava, e devolvia ao produtor os NOMES das tags de
    // segmentação que outros produtores aplicaram sobre a mesma pessoa
    // ("lead frio", "inadimplente"). O molde é o predicado do POST/DELETE deste
    // mesmo arquivo, escrito aqui como filtro.
    // ⚠️ O discriminador é o VÍNCULO com o workspace resolvido, NUNCA o role
    // global — é o erro que o 9.74 descreve. `workspace` vem do
    // `resolveStaffWorkspace` acima, que já é a autoridade desta rota.
    // ⭐ Short-circuit de ADMIN de plataforma: é o ÚNICO caso em que o role
    // decide, por decisão explícita da casa (PLANO-9.74 §2.2 e princípio 11).
    // Sem ele o ADMIN passaria a ver menos do que vê hoje — mudança de
    // comportamento de persona de staff, que esta fatia não pode causar.
    const isPlatformAdmin = staff.role === "ADMIN";
    const userTags = await prisma.userTag.findMany({
      where: {
        userId: params.id,
        ...(isPlatformAdmin ? {} : { tag: { workspaceId: workspace.id } }),
      },
      include: { tag: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      tags: userTags.map((ut) => ut.tag),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    const status =
      msg === "Não autorizado" ? 401 : msg === "Sem permissão" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const staff = await requireStaff();
    if (staff.role === "COLLABORATOR") {
      await requirePermission(staff, "MANAGE_STUDENTS");
    }
    const { workspace } = await resolveStaffWorkspace(staff);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 400 });
    }
    // E4.4 §12.3 — pergunta sobre TERCEIRO ("esta pessoa é gente minha?"), e a
    // marca é exatamente essa resposta. ⚠️ Aqui NÃO vai `requireMemberPermission`:
    // perguntar permissão de colaborador sobre o aluno-alvo seria perguntar a
    // coisa errada sobre a pessoa errada (ver o JSDoc do helper).
    if (
      !(await hasWorkspaceAccess(params.id, workspace.id, {
        allowMembership: true,
      }))
    ) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const raw = await request.json().catch(() => ({}));
    const v = validateBody(studentTagSchema, raw);
    if (!v.success) return v.error;
    const tagId = v.data.tagId;

    if (!tagId) {
      return NextResponse.json({ error: "tagId obrigatório" }, { status: 400 });
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    await prisma.userTag.upsert({
      where: { userId_tagId: { userId: params.id, tagId } },
      create: { userId: params.id, tagId },
      update: {},
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    const status =
      msg === "Não autorizado" ? 401 : msg === "Sem permissão" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const staff = await requireStaff();
    if (staff.role === "COLLABORATOR") {
      await requirePermission(staff, "MANAGE_STUDENTS");
    }
    const { workspace } = await resolveStaffWorkspace(staff);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 400 });
    }
    // E4.4 §12.3 — pergunta sobre TERCEIRO ("esta pessoa é gente minha?"), e a
    // marca é exatamente essa resposta. ⚠️ Aqui NÃO vai `requireMemberPermission`:
    // perguntar permissão de colaborador sobre o aluno-alvo seria perguntar a
    // coisa errada sobre a pessoa errada (ver o JSDoc do helper).
    if (
      !(await hasWorkspaceAccess(params.id, workspace.id, {
        allowMembership: true,
      }))
    ) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId obrigatório" }, { status: 400 });
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    await prisma.userTag.deleteMany({
      where: { userId: params.id, tagId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    const status =
      msg === "Não autorizado" ? 401 : msg === "Sem permissão" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
