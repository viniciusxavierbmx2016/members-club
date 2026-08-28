import { prisma } from "@/lib/prisma";
import { createAdminClient, COMMUNITY_ATTACHMENTS_BUCKET } from "@/lib/supabase-admin";

/* LIMPEZA DE ÓRFÃOS dos anexos da comunidade — etapa 4/4.

   É a rotina que o sistema NUNCA teve. O item 9.104 mediu 10 objetos órfãos no
   bucket `materials`, contados duas vezes com dois dias de intervalo, e
   registrou: "não cresce rápido, mas não tem quem limpe". Aqui tem.

   Dois órfãos diferentes, com causas diferentes:
     (a) LINHA PENDING VELHA — alguém pediu a autorização e nunca confirmou
         (desistiu, fechou a aba, a rede caiu). A linha fica, e o objeto pode
         ou não existir.
     (b) OBJETO SEM LINHA — o `remove` best-effort do delete de post falhou, ou
         a linha morreu por Cascade antes de o objeto sair.

   ⚠️ JANELA DE 24h para o caso (a), e ela não é arbitrária: o upload é DIRETO
   ao Storage e pode levar minutos num arquivo de 50MB em rede ruim — uma
   janela curta apagaria a linha DEBAIXO de um upload em andamento, e o
   `confirm` seguinte falharia sem que o aluno tivesse feito nada errado. 24h é
   folgado o bastante para nunca cruzar com um upload vivo e curto o bastante
   para o lixo não acumular.

   ⚠️ E o caso (b) usa a MESMA janela, por um motivo diferente: um objeto
   recém-subido cuja linha ainda está PENDING é indistinguível, do lado do
   Storage, de um órfão de verdade. Só o tempo separa os dois. */

/* ───────────────────────── AS TRAVAS ─────────────────────────
   Escritas em código, não em comentário, porque isto APAGA ARQUIVO DE CLIENTE.

   1. O bucket é constante importada — a função não recebe bucket por
      parâmetro, então não existe chamada que a faça varrer outro lugar.
   2. Todo path candidato passa por `pathDoModulo()` antes de entrar na lista
      de remoção. Objeto que não casa com o formato exato deste módulo é
      IGNORADO, mesmo estando dentro do bucket. Se um dia alguém gravar outra
      coisa aqui, a rotina não encosta.                                      */
const PREFIXO = "community/";

/** `community/{uuid}/{timestamp}_{nome}.{ext}` — o formato que
    `attachments/authorize` monta, e SÓ ele. */
const PATH_DO_MODULO =
  /^community\/[0-9a-f-]{36}\/\d{13}_[A-Za-z0-9._-]+$/;

function pathDoModulo(path: string): boolean {
  return path.startsWith(PREFIXO) && PATH_DO_MODULO.test(path);
}

const VINTE_E_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

export type RelatorioLimpeza = {
  dryRun: boolean;
  agora: string;
  linhasPendentesVelhas: { id: string; storagePath: string; idadeHoras: number }[];
  objetosSemLinha: string[];
  ignoradosForaDoPadrao: string[];
  removidos: { linhas: number; objetos: number };
};

/** @param dryRun quando true, só RELATA — não apaga nada. É como se prova a
 *  rotina antes de deixá-la solta em cima de arquivo de gente de verdade. */
export async function limparAnexosOrfaos(
  dryRun: boolean,
  agoraMs: number
): Promise<RelatorioLimpeza> {
  const corte = new Date(agoraMs - VINTE_E_QUATRO_HORAS_MS);
  const supabase = createAdminClient();

  // (a) linhas PENDING mais velhas que a janela. Usa o `@@index([status,
  //     createdAt])` criado na etapa 1 exatamente para esta consulta.
  const pendentes = await prisma.postAttachment.findMany({
    where: { status: "PENDING", createdAt: { lt: corte } },
    select: { id: true, storagePath: true, createdAt: true },
  });

  // (b) objetos sem linha. O inventário é do bucket do módulo e de mais nenhum.
  const pastas =
    (await supabase.storage.from(COMMUNITY_ATTACHMENTS_BUCKET).list(PREFIXO.slice(0, -1), { limit: 1000 }))
      .data ?? [];
  const objetos: string[] = [];
  for (const pasta of pastas) {
    const dentro =
      (await supabase.storage
        .from(COMMUNITY_ATTACHMENTS_BUCKET)
        .list(`${PREFIXO}${pasta.name}`, { limit: 1000 })).data ?? [];
    for (const o of dentro) {
      if (o.id) objetos.push(`${PREFIXO}${pasta.name}/${o.name}`);
    }
  }

  const comLinha = new Set(
    (await prisma.postAttachment.findMany({ select: { storagePath: true } })).map(
      (a) => a.storagePath
    )
  );

  const ignoradosForaDoPadrao: string[] = [];
  const objetosSemLinha: string[] = [];
  for (const path of objetos) {
    if (!pathDoModulo(path)) {
      // TRAVA 2 em ação: está no bucket, mas não é nosso formato. Não se toca.
      ignoradosForaDoPadrao.push(path);
      continue;
    }
    if (!comLinha.has(path)) objetosSemLinha.push(path);
  }

  // Os objetos das linhas PENDING velhas também saem — mas só os que passam na
  // trava, pelo mesmo motivo.
  const objetosDePendentes = pendentes
    .map((p) => p.storagePath)
    .filter(pathDoModulo);

  const relatorio: RelatorioLimpeza = {
    dryRun,
    agora: new Date(agoraMs).toISOString(),
    linhasPendentesVelhas: pendentes.map((p) => ({
      id: p.id,
      storagePath: p.storagePath,
      idadeHoras: Math.floor((agoraMs - p.createdAt.getTime()) / 3_600_000),
    })),
    objetosSemLinha,
    ignoradosForaDoPadrao,
    removidos: { linhas: 0, objetos: 0 },
  };

  if (dryRun) return relatorio;

  const paraRemover = [...new Set([...objetosSemLinha, ...objetosDePendentes])];
  if (paraRemover.length > 0) {
    const { error } = await supabase.storage
      .from(COMMUNITY_ATTACHMENTS_BUCKET)
      .remove(paraRemover);
    if (error) {
      console.error("[cleanup anexos] remove falhou:", error.message);
    } else {
      relatorio.removidos.objetos = paraRemover.length;
    }
  }
  if (pendentes.length > 0) {
    const r = await prisma.postAttachment.deleteMany({
      where: { id: { in: pendentes.map((p) => p.id) } },
    });
    relatorio.removidos.linhas = r.count;
  }

  return relatorio;
}
