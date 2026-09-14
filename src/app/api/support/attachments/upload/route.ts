import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createAdminClient,
  TICKET_ATTACHMENTS_BUCKET,
} from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { canUploadSupportAttachment } from "@/lib/ticket-access";
import { sniff } from "@/lib/file-signatures";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

// Single-file upload to the private ticket-attachments bucket. Returns the
// path; the caller includes it in `attachments[]` of POST /tickets or
// /tickets/[id]/messages. Per-message limit (5 files) is enforced at message
// creation, not here.
//
// Auth: quem pode ESCREVER em suporte de plataforma — produtor, admin ou
// admin-colaborador com SUPPORT (`canUploadSupportAttachment`, as mesmas
// cláusulas de `canAccessTicket`, que já governa a LEITURA em
// `signed-url/route.ts:43`). O path inclui o userId para o admin saber quem
// enviou, e a posse é reconferida na hora de assinar.
//
// ⭐ O tipo vem dos BYTES (`lib/file-signatures.ts`), não do `file.type`: este
// era o furo do 9.130 — `file.type` e `file.name` são declaração do cliente, e
// um .exe renomeado como image/png passava. O tipo DEDUZIDO é o que decide o
// allowlist, vai para o Storage e forma a extensão gravada no bucket.
export async function POST(request: Request) {
  const limited = await rateLimit(request);
  if (limited) return limited;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Gate ANTES de ler o corpo: sem isto, quem não pode enviar ainda obrigaria
    // o servidor a bufferizar 10 MB antes de levar o 403. (Molde: a mesma
    // ordem de `community/upload/route.ts:70-77`.)
    if (!(await canUploadSupportAttachment(user))) {
      return NextResponse.json(
        { error: "Você não tem permissão para enviar anexos." },
        { status: 403 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo excede 10 MB" },
        { status: 400 }
      );
    }

    // O allowlist continua sendo o desta rota — o que muda é QUEM responde
    // "de que tipo é": os bytes, não o cliente.
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniff(buf);
    if (!kind || !ALLOWED.has(kind.mime)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido (imagens e PDF apenas)" },
        { status: 400 }
      );
    }

    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `tickets/${user.id}/${ts}-${rand}.${kind.ext}`;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(TICKET_ATTACHMENTS_BUCKET)
      .upload(path, buf, {
        contentType: kind.mime,
        upsert: false,
      });
    if (error) {
      console.error("[support upload] error:", error.message);
      return NextResponse.json(
        { error: "Falha no upload" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path,
      contentType: kind.mime,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[SUPPORT_ATTACHMENT_UPLOAD]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
