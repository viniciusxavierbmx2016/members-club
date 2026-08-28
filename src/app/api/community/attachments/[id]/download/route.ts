import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checarLeituraDaComunidade } from "@/lib/community-read-access";
import { sanitizeFileName } from "@/lib/materials-constants";
import { createAdminClient, COMMUNITY_ATTACHMENTS_BUCKET } from "@/lib/supabase-admin";

/* GET /api/community/attachments/[id]/download   — etapa 3/4.

   O aluno recebe ESTA rota, nunca uma URL de arquivo. Um link copiado da tela
   leva o próximo visitante ao MESMO gate — é o molde do download de material
   (`lessons/[id]/materials/[materialId]/download/route.ts`), e a razão de o
   bucket ser privado desde a etapa 1.

   ⭐ E é aqui que a mitigação do buraco assumido se completa. O servidor nunca
   viu os bytes (upload direto), então o arquivo pode não ser o que diz ser. As
   três defesas que sobram são todas desta rota:
     · bucket PRIVADO — nada é alcançável sem passar por este gate;
     · link TEMPORÁRIO — a assinatura vale 900s e é cunhada no clique;
     · download FORÇADO — `Content-Disposition: attachment` via `?download=`,
       para o navegador NÃO renderizar o conteúdo. Um HTML ou SVG disfarçado de
       PDF vai para o disco, não para a tela. */

// 900s: a assinatura é cunhada NO CLIQUE e consumida no redirect seguinte —
// precisa durar o download (50MB a ~500kbps passa de 13min) e nada além. Mesmo
// valor e mesmo raciocínio do download de material.
const SIGNED_URL_TTL_SECONDS = 900;

/* Uma única frase para TODAS as recusas depois do 401. Anexo inexistente, de
   post apagado, não confirmado, de curso a que a pessoa não tem acesso, ou
   escondido por moderação — todos saem por aqui. Distinguir qualquer um deles
   confirmaria que aquele id existe; é o mesmo padrão do `confirm` (etapa 2) e
   do download de material, que responde 404 e não 403 pela mesma razão. */
// ⚠️ FUNÇÃO, não constante: um NextResponse de módulo seria a MESMA instância
// em todas as requisições, e corpo de Response se consome uma vez só.
const naoEncontrado = () =>
  NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 });

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Só anexo CONFIRMED e JÁ ADOTADO por um post é alcançável. PENDING é
    // rascunho e órfão (postId nulo) nunca virou conteúdo de ninguém — é o
    // "orphan paths are not signable" do molde de anexo de ticket.
    const anexo = await prisma.postAttachment.findFirst({
      where: { id: params.id, status: "CONFIRMED", postId: { not: null } },
      select: {
        storagePath: true,
        fileName: true,
        post: { select: { id: true, courseId: true, status: true, userId: true } },
      },
    });
    if (!anexo?.post) return naoEncontrado();

    const course = await prisma.course.findUnique({
      where: { id: anexo.post.courseId },
      select: {
        id: true,
        ownerId: true,
        communityEnabled: true,
        workspace: { select: { ownerId: true } },
      },
    });
    if (!course) return naoEncontrado();

    /* O MESMO gate do feed — `lib/community-read-access.ts`, importado também
       pelo GET de `api/posts`. ⚠️ A recusa dele vira 404 aqui, e não o 403 com
       a mensagem rica que o feed mostra: entrar na comunidade é uma ação que a
       pessoa está tentando fazer conscientemente, e explicar o porquê ajuda;
       pedir um arquivo específico é outra coisa, e responder qualquer coisa
       diferente de "não existe" confirmaria que aquele anexo existe. */
    const acesso = await checarLeituraDaComunidade(user, course);
    if (!acesso.ok) return naoEncontrado();

    /* MODERAÇÃO — espelho exato do filtro do feed (`api/posts/route.ts`, o
       `postWhere.OR` do GET): quem não é staff enxerga post APPROVED, ou
       PENDING de sua própria autoria. Nada de critério novo: se o post não
       aparece no feed para esta pessoa, o anexo dele também não pode ser
       alcançável — senão o anexo vira a porta dos fundos da moderação. */
    const staff = acesso.isStaffOwner || acesso.collabAllowed;
    if (!staff) {
      const visivel =
        anexo.post.status === "APPROVED" ||
        (anexo.post.status === "PENDING" && anexo.post.userId === user.id);
      if (!visivel) return naoEncontrado();
    }

    /* `download` com o nome ORIGINAL sanitizado. O sanitize não é capricho: o
       Storage encoda o valor de `?download=` uma segunda vez sem decodificar a
       primeira, então acento chega ao disco do aluno como lixo (medido no
       9.95). O preço é "às" virar "as"; o ganho é o Content-Disposition
       attachment, que impede o navegador de RENDERIZAR o arquivo. */
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(COMMUNITY_ATTACHMENTS_BUCKET)
      .createSignedUrl(anexo.storagePath, SIGNED_URL_TTL_SECONDS, {
        download: sanitizeFileName(anexo.fileName),
      });

    if (error || !data?.signedUrl) {
      console.error("[community attachment download] assinatura falhou:", error?.message);
      return NextResponse.json({ error: "Falha ao gerar link" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (error) {
    console.error("[COMMUNITY_ATTACHMENT_DOWNLOAD]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
