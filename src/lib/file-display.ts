/* Como um arquivo APARECE na tela — tamanho legível e o selo por tipo.

   Estas duas funções nasceram locais na página de aula
   (`(course)/course/[slug]/lesson/[id]/page.tsx`), onde só os materiais de aula
   precisavam delas. Quando os anexos da comunidade passaram a listar arquivo
   também, a escolha era copiar ou extrair. Copiar significaria que um PDF
   apareceria vermelho num lugar e de outra cor no outro assim que alguém
   mexesse num só — a mesma doença de paridade-por-cópia do 9.42/9.54/9.57.

   Lógica movida SEM alteração: mesmas faixas de tamanho, mesmos tipos, mesmas
   classes de cor, mesma ordem dos testes (a ordem importa — `text/csv` cai no
   ramo de planilha ANTES de qualquer teste por prefixo). */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getMaterialIcon(type: string): { color: string; label: string; dotColor: string } {
  if (type === "application/pdf") return { color: "text-red-500 bg-red-50 dark:bg-red-500/10", label: "PDF", dotColor: "#ef4444" };
  if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv")
    return { color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", label: "XLS", dotColor: "#22c55e" };
  if (type.includes("word") || type === "application/msword")
    return { color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10", label: "DOC", dotColor: "#3b82f6" };
  if (type.includes("presentation") || type.includes("powerpoint"))
    return { color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10", label: "PPT", dotColor: "#f97316" };
  if (type.startsWith("image/")) return { color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10", label: "IMG", dotColor: "#a855f7" };
  if (type.startsWith("audio/")) return { color: "text-pink-500 bg-pink-50 dark:bg-pink-500/10", label: "MP3", dotColor: "#eab308" };
  if (type.startsWith("video/")) return { color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10", label: "MP4", dotColor: "#ec4899" };
  if (type.includes("zip") || type.includes("rar")) return { color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10", label: "ZIP", dotColor: "#6b7280" };
  return { color: "text-gray-500 bg-gray-50 dark:bg-gray-500/10", label: "FILE", dotColor: "#6b7280" };
}
