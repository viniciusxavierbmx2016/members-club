import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { hasRealPlatformLink } from "@/lib/community-upload-access";
import { createAdminClient, COMMUNITY_ATTACHMENTS_BUCKET } from "@/lib/supabase-admin";

/* POST /api/community/attachments/confirm   — etapa 2/4, rota B de duas.

   ⭐ ESTA É A TRAVA QUE NENHUM DOS 3 MOLDES EXISTENTES TEM.

   No molde de materiais o POST que grava o metadado apenas CONFIA que o
   arquivo chegou: sondei os sete verbos que confirmariam (`list`, `info`,
   `exists`, `download`, `head`…) em `producer/lessons/[id]/materials/route.ts`
   e todos deram zero — a única chamada de Storage é `getPublicUrl`, que monta
   string e não vai à rede. O preço disso está medido no item 9.104: **10
   objetos órfãos** no bucket `materials`, contados duas vezes com dois dias de
   intervalo.

   Aqui a linha só vira CONFIRMED depois de o servidor PERGUNTAR AO STORAGE o
   que de fato chegou, e comparar com o que foi declarado na autorização. Se o
   objeto não existe, ou se veio diferente do declarado, o objeto é apagado e a
   linha some — nada de PENDING acumulando.

   ⚠️ O que isto NÃO é: inspeção de conteúdo. O `content_type` que o Storage
   devolve é o que o cliente mandou no upload, não uma dedução por bytes. Isto
   fecha a divergência entre o DECLARADO e o ENVIADO — não a mentira coerente
   (declarar PDF e enviar um executável rotulado como PDF). Esse buraco está
   assumido e mitigado por bucket privado + link temporário + download forçado. */

const NAO_ENCONTRADO = { error: "Anexo não encontrado" };

export async function POST(request: Request) {
  const limited = await rateLimit(request);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await hasRealPlatformLink(user))) {
    return NextResponse.json(
      { error: "Você não tem permissão para enviar arquivos." },
      { status: 403 }
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Servidor mal configurado" }, { status: 500 });
  }

  const supabase = createAdminClient();

  try {
    const body = (await request.json().catch(() => ({}))) as { attachmentId?: unknown };
    const { attachmentId } = body;
    if (typeof attachmentId !== "string" || !attachmentId) {
      return NextResponse.json({ error: "attachmentId obrigatório" }, { status: 400 });
    }

    /* 1) O anexo tem de ser DESTE usuário e ainda estar PENDING.

       404 e não 403, de propósito, e é o mesmo padrão do download de material
       (`lessons/[id]/materials/[materialId]/download/route.ts:41-53`):
       responder 403 confirmaria que aquele id EXISTE e é de outra pessoa. Os
       três casos — id inexistente, id de outro usuário, id já confirmado —
       saem pela mesma porta e são indistinguíveis de fora. */
    const anexo = await prisma.postAttachment.findFirst({
      where: { id: attachmentId, userId: user.id, status: "PENDING" },
      select: { id: true, storagePath: true, fileSize: true, mimeType: true },
    });
    if (!anexo) {
      return NextResponse.json(NAO_ENCONTRADO, { status: 404 });
    }

    // Limpeza usada em todo caminho de recusa: o objeto não pode ficar no
    // bucket sem linha, senão inventamos o órfão que viemos evitar.
    const descartar = async () => {
      await supabase.storage
        .from(COMMUNITY_ATTACHMENTS_BUCKET)
        .remove([anexo.storagePath])
        .catch(() => {});
      await prisma.postAttachment.delete({ where: { id: anexo.id } }).catch(() => {});
    };

    /* 2) PERGUNTAR AO STORAGE. `info()` existe no @supabase/storage-js 2.105.3
       e devolve `FileObjectV2` com `size` e `content_type` — conferido nos
       tipos da versão instalada antes de escrever esta rota. */
    const { data: info, error: infoErr } = await supabase.storage
      .from(COMMUNITY_ATTACHMENTS_BUCKET)
      .info(anexo.storagePath);

    if (infoErr || !info) {
      // Autorizado mas nunca enviado (o usuário desistiu, a rede caiu). A linha
      // PENDING não serve para nada — sai agora, sem esperar rotina de limpeza.
      await prisma.postAttachment.delete({ where: { id: anexo.id } }).catch(() => {});
      return NextResponse.json(
        { error: "O arquivo não chegou. Tente enviar de novo." },
        { status: 400 }
      );
    }

    const tamanhoReal = info.size;
    const tipoReal = info.contentType;

    /* Se o Storage não devolver tamanho, não há o que comparar — e passar
       adiante seria fingir que verificamos. Recusa honesta (§4.8): o objeto sai
       e o erro é claro. Isto NÃO deve acontecer nesta versão do SDK; existe
       porque `size` é opcional no tipo e um dia pode voltar vazio. */
    if (typeof tamanhoReal !== "number") {
      await descartar();
      console.error(
        "[community attachment confirm] Storage não devolveu size — verificação impossível:",
        anexo.id
      );
      return NextResponse.json(
        { error: "Não foi possível verificar o arquivo. Tente de novo." },
        { status: 400 }
      );
    }

    // 3) O REAL contra o DECLARADO.
    if (tamanhoReal !== anexo.fileSize) {
      await descartar();
      return NextResponse.json(
        { error: "O arquivo enviado não confere com o que foi anunciado." },
        { status: 400 }
      );
    }
    if (typeof tipoReal === "string" && tipoReal !== anexo.mimeType) {
      await descartar();
      return NextResponse.json(
        { error: "O arquivo enviado não confere com o que foi anunciado." },
        { status: 400 }
      );
    }

    // 4) Só agora.
    const confirmado = await prisma.postAttachment.update({
      where: { id: anexo.id },
      data: { status: "CONFIRMED" },
      select: { id: true, fileName: true, fileSize: true, mimeType: true, status: true },
    });

    return NextResponse.json({ attachment: confirmado });
  } catch (error) {
    console.error("[community attachment confirm]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
