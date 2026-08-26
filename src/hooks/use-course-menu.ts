import { useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import { useConfirm } from "@/hooks/use-confirm";
import { fetchJson, useToast } from "@/hooks/use-toast";

/* A camada de dados do editor de menu do curso: estados e handlers.

   ⓘ HOJE TEM UM CONSUMIDOR SÓ — o `CourseMenuManager`, embutido na aba
   Personalizar. Nasceu com dois: até o E3.12 a lógica vivia em CÓPIA LITERAL
   também numa página própria (`/producer/courses/[id]/menu`), que o 9.117
   removeu por ser rota órfã — sem nenhum ponto de entrada na navegação.

   ⭐ POR QUE O HOOK FICA, mesmo com um consumidor: foi a duplicata que tornou
   o defeito caro — o `handleDragEnd` fazia `await fetch(...)` sem sequer
   GUARDAR a resposta, e estava assim NAS DUAS cópias (consertar uma e esquecer
   a outra é a família 9.42/9.54/9.57). Com a lógica aqui, o tratamento de erro
   e o commit-no-blur têm UM lugar, e a tela desenha — separação que continua
   valendo com uma tela só. */

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  order: number;
  isDefault: boolean;
  enabled: boolean;
}

export function useCourseMenu(courseId: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("link");
  const [newUrl, setNewUrl] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();
  const { showToast, Toast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- JS hoists function declarations; rule's TDZ check is overly strict
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function load() {
    setLoading(true);
    const r = await fetchJson(`/api/courses/${courseId}/menu`);
    if (r.ok) {
      setItems((r.data as { items: MenuItem[] }).items);
    }
    // ⚠️ Falha de CARGA continua silenciosa aqui, de propósito: é o padrão do
    // Tier 3 do 9.107 (~91 sítios, "lista vazia sem explicação"), que espera
    // uma régua própria. Inventar um tratamento só neste arquivo criaria a
    // 92ª forma diferente de dizer a mesma coisa.
    setLoading(false);
  }

  /* ⭐ O molde de otimista-com-rollback vem do `handleDeleteMessage` de
     `producer/lives/[id]/page.tsx` — guardar o estado anterior, aplicar na
     hora, e VOLTAR se o servidor recusar. Não foi inventado aqui. */
  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const anterior = items;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    const r = await fetchJson(
      `/api/courses/${courseId}/menu/reorder`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: reordered.map((i) => i.id) }),
      },
      "Não foi possível salvar a nova ordem"
    );
    if (!r.ok) {
      setItems(anterior);
      showToast(r.mensagem, "error");
    }
  }

  async function handleUpdate(id: string, patch: Partial<MenuItem>) {
    const anterior = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const r = await fetchJson(
      `/api/courses/${courseId}/menu/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      },
      "Não foi possível salvar a alteração"
    );
    if (!r.ok) {
      setItems(anterior);
      showToast(r.mensagem, "error");
    }
  }

  async function handleDelete(id: string) {
    if (
      !(await confirm({
        title: "Excluir item",
        message: "Excluir este item?",
        variant: "danger",
        confirmText: "Excluir",
      }))
    ) {
      return;
    }
    const r = await fetchJson(
      `/api/courses/${courseId}/menu/${id}`,
      { method: "DELETE" },
      "Não foi possível excluir o item"
    );
    if (!r.ok) {
      showToast(r.mensagem, "error");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleCreate() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const r = await fetchJson(
      `/api/courses/${courseId}/menu`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel.trim(),
          icon: newIcon,
          url: newUrl.trim(),
        }),
      },
      "Não foi possível criar o item"
    );
    if (!r.ok) {
      showToast(r.mensagem, "error");
      return;
    }
    setItems((prev) => [...prev, (r.data as { item: MenuItem }).item]);
    setNewLabel("");
    setNewIcon("link");
    setNewUrl("");
    setCreating(false);
  }

  return {
    items,
    loading,
    creating,
    setCreating,
    newLabel,
    setNewLabel,
    newIcon,
    setNewIcon,
    newUrl,
    setNewUrl,
    load,
    handleDragEnd,
    handleUpdate,
    handleDelete,
    handleCreate,
    ConfirmDialog,
    Toast,
  };
}
