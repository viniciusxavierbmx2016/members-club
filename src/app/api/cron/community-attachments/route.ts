import { NextResponse } from "next/server";
import { limparAnexosOrfaos } from "@/lib/community-attachments-cleanup";
import { observeOrigin } from "@/lib/origin-lock";

/* GET /api/cron/community-attachments — limpeza de órfãos dos anexos.

   Molde EXATO dos 3 crons que já existem (`automations`, `pending`,
   `billing`): mesmo header `Bearer ${CRON_SECRET}`, mesma checagem
   fail-closed (`!cronSecret ||` — sem o segredo configurado NINGUÉM entra,
   nem por engano), mesmo `observeOrigin(..., "exempt-cron")`, mesmo formato de
   erro. Rota que APAGA ARQUIVO não podia ser a primeira a inventar um jeito
   próprio de se proteger.

   `?dryRun=1` só RELATA. É como a rotina se prova antes de encostar em
   arquivo de gente de verdade — e continua disponível depois, para conferir o
   que ela FARIA sem que ela faça. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await observeOrigin(request, "exempt-cron"); // 2.4 B.1 observe-mode

  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "1";
    const relatorio = await limparAnexosOrfaos(dryRun, Date.now());
    return NextResponse.json(relatorio);
  } catch (error) {
    console.error("Cron community-attachments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
