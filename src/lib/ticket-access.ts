import type { User, SupportTicket } from "@prisma/client";
import { adminHasPerm } from "@/lib/admin-permissions-server";

// True if `user` may read/post on `ticket`. Producer-owner OR ADMIN OR
// ADMIN_COLLABORATOR with SUPPORT permission.
export async function canAccessTicket(
  user: Pick<User, "id" | "role">,
  ticket: Pick<SupportTicket, "producerId">
): Promise<boolean> {
  if (user.id === ticket.producerId) return true;
  if (user.role === "ADMIN") return true;
  if (user.role === "ADMIN_COLLABORATOR") {
    return await adminHasPerm(user, "SUPPORT");
  }
  return false;
}

// True if `user` may change a ticket's status/assignment. Admin team only;
// the producer cannot self-resolve or self-assign.
export async function canManageTicket(
  user: Pick<User, "id" | "role">
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "ADMIN_COLLABORATOR") {
    return await adminHasPerm(user, "SUPPORT");
  }
  return false;
}

// True if `user` may upload an attachment for PLATFORM support — a decisão que
// o upload precisa tomar ANTES de o ticket existir (o produtor anexa enquanto
// escreve o primeiro ticket, então não há `producerId` para comparar).
//
// ⭐ São as MESMAS três cláusulas que já governam as rotas irmãs, sem nenhuma
// régua nova: PRODUCER porque `POST /api/support/tickets:80` só deixa produtor
// ABRIR ticket; ADMIN e ADMIN_COLLABORATOR+SUPPORT porque é exatamente quem o
// `canAccessTicket` acima deixa LER e RESPONDER.
//
// ⚠️ NÃO usa `hasRealPlatformLink` (o molde da comunidade) de propósito, e o
// motivo é medido: lá o ramo PRODUCER exige `workspaces > 0 || courses > 0`, e
// em produção 105 dos 137 produtores (77%) não têm nenhum dos dois — conta
// nova, que é justamente quem mais precisa abrir chamado. E na outra direção
// aquele molde aceita qualquer matrícula ACTIVE: 27.430 alunos que não têm
// tela nenhuma para enviar anexo de plataforma.
export async function canUploadSupportAttachment(
  user: Pick<User, "id" | "role">
): Promise<boolean> {
  if (user.role === "PRODUCER") return true;
  if (user.role === "ADMIN") return true;
  if (user.role === "ADMIN_COLLABORATOR") {
    return await adminHasPerm(user, "SUPPORT");
  }
  return false;
}
