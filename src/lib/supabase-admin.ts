import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged operations (storage uploads, admin tasks)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export const STORAGE_BUCKET = "thumbnails";
export const AVATAR_BUCKET = "avatars";
export const MATERIALS_BUCKET = "materials";
export const TICKET_ATTACHMENTS_BUCKET = "ticket-attachments";
/* Anexos de post da comunidade (etapa 1/4). PRIVADO e SEPARADO de propósito:
   `thumbnails` é público e compartilhado por 6 rotas, e `materials` é do
   produtor, com allow-list e teto diferentes. Mesmo valor de
   COMMUNITY_ATTACHMENTS_BUCKET_NAME em community-attachments-constants.ts, que
   é a cópia importável pelo client. */
export const COMMUNITY_ATTACHMENTS_BUCKET = "community-attachments";
