import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient, STORAGE_BUCKET } from "@/lib/supabase-admin";
/* ANEXOS etapa 2/4 — o gate saiu daqui para `lib/community-upload-access.ts`
   quando a SEGUNDA porta (`community/attachments/authorize`) apareceu. A lógica
   é byte-a-byte a mesma; o motivo da extração está no cabeçalho do arquivo
   novo, e o molde é o `lib/upload-access.ts`: paridade mantida por cópia é a
   receita do 9.42/9.54/9.57. */
import { hasRealPlatformLink } from "@/lib/community-upload-access";

const MAX_SIZE = 5 * 1024 * 1024;

/* ───── Tipo deduzido do CONTEÚDO, não do que o cliente declara ─────
   O allowlist antigo olhava `file.type`, que vem do FormData e é escolhido por
   quem envia: um .exe renomeado e enviado como `image/png` passava (§13 —
   esconder no cliente não é gate). Aqui o tipo sai dos primeiros bytes, e é o
   tipo DEDUZIDO que vai para o Storage e para a extensão do caminho — o que
   também elimina o `file.name.split(".").pop()` de antes, que deixava o nome
   do arquivo escolher o sufixo gravado no bucket. */
const SIGNATURES: {
  mime: string;
  ext: string;
  matches: (b: Buffer) => boolean;
}[] = [
  {
    mime: "image/png",
    ext: "png",
    matches: (b) =>
      b.length >= 8 &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/jpeg",
    ext: "jpg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/gif",
    ext: "gif",
    matches: (b) =>
      b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1")),
  },
  {
    // RIFF....WEBP — o tamanho mora nos bytes 4-7, por isso a checagem pula eles.
    mime: "image/webp",
    ext: "webp",
    matches: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

function sniff(buffer: Buffer): { mime: string; ext: string } | null {
  return SIGNATURES.find((s) => s.matches(buffer)) ?? null;
}

export async function POST(request: Request) {
  const limited = await rateLimit(request);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Gate ANTES de ler o corpo: sem isto, um desconhecido ainda obrigaria o
  // servidor a bufferizar 5 MB antes de levar o 403.
  if (!(await hasRealPlatformLink(user))) {
    return NextResponse.json(
      { error: "Você não tem permissão para enviar imagens." },
      { status: 403 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Servidor mal configurado" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx. 5MB)" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniff(buffer);
    if (!kind) {
      return NextResponse.json(
        { error: "Formato não permitido. Use PNG, JPG, WebP ou GIF." },
        { status: 415 }
      );
    }

    const supabase = createAdminClient();

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === STORAGE_BUCKET)) {
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
      });
    }

    const fileName = `community/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${kind.ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: kind.mime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Community upload error:", uploadError);
      return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    // A mensagem do erro interno vai para o log, não para a resposta (§9).
    console.error("Community upload error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
