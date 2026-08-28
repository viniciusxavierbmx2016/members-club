import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { resolveStaffWorkspace } from "@/lib/workspace";
import { consumoDoWorkspace } from "@/lib/community-attachments-usage";

/* GET /api/producer/community/attachments-usage — etapa 4/4.

   O número que o produtor vê: quanto os anexos da comunidade já consumiram do
   teto de 2GB do workspace dele.

   ───── O guard, reusado e não inventado ─────
   `requireStaff()` + `resolveStaffWorkspace(staff)` é o molde EXATO de
   `api/producer/community/route.ts:8-26`, a rota irmã. Duas consequências que
   importam:
     · o workspace vem da SESSÃO, nunca de parâmetro — não existe
       `?workspaceId=`, então não há IDOR a fechar depois;
     · `requireStaff` já cobre o colaborador híbrido (C6), então colaborador
       com vínculo aceito enxerga o consumo do workspace em que colabora.
   ⚠️ NÃO usei `hasWorkspaceAccess`: aquele helper considera ALUNO MATRICULADO
   como quem tem acesso, e este número é do painel do produtor.

   O número em si sai de `lib/community-attachments-usage.ts` — a MESMA função
   que a autorização e a adoção usam para decidir o bloqueio. Se o produtor
   visse um total e o sistema barrasse por outro, ninguém entenderia o porquê;
   é a família 9.42/9.54/9.57 aplicada a um número em vez de a um gate. */
export async function GET() {
  try {
    const staff = await requireStaff();
    const { workspace, scoped } = await resolveStaffWorkspace(staff);
    const workspaceId = scoped && workspace ? workspace.id : null;

    if (!workspaceId) {
      // Mesmo desfecho da rota irmã para staff sem workspace resolvido: um
      // corpo vazio de sentido em vez de erro. ADMIN global não tem workspace
      // único, e não há um total "de todo mundo" que signifique alguma coisa.
      return NextResponse.json({ usage: null });
    }

    return NextResponse.json({ usage: await consumoDoWorkspace(workspaceId) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const status = msg === "Não autorizado" ? 401 : msg === "Sem permissão" ? 403 : 500;
    if (status === 500) console.error("[attachments-usage]", error);
    return NextResponse.json({ error: msg || "Erro" }, { status });
  }
}
