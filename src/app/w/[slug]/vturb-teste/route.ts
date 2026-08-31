// ─────────────────────────────────────────────────────────────────────────────
// SONDA-VTURB — REMOVER. Página descartável, criada para medir três coisas que
// NÃO são decidíveis por leitura (laudo da DEMANDA #2):
//   (1) quais diretivas de CSP o iframe do VTurb exige de verdade;
//   (2) se o player emite postMessage — em especial de FIM DE VÍDEO;
//   (3) se o vídeo toca em iframe puro, sem SDK.
//
// ⚠️ POR QUE UM ROUTE HANDLER E NÃO UM page.tsx: qualquer `page.tsx` sob
// `/w/[slug]/` herda `w/[slug]/layout.tsx`, que monta o `WorkspaceShell`
// (sino de notificações, PushOptIn, tour…). Se a sonda carregasse tudo isso,
// uma violação de CSP observada poderia ser de OUTRA origem — e a sonda existe
// exatamente para atribuir a violação ao VTurb. Route Handler não passa por
// layout nenhum: o documento abaixo é a página inteira.
//
// ⚠️ A CSP é aplicada por `next.config.mjs` com `source: "/(.*)"`, então ela
// vale para este handler também — é o que torna a medição válida.
// ─────────────────────────────────────────────────────────────────────────────
import { getCurrentUser } from "@/lib/auth";

const VTURB_EMBED =
  "https://scripts.converteai.net/d32806d9-4005-4c55-bfe2-cf32f76b899f/players/6a8dfcd5140103a038ee92be/v4/embed.html";

export async function GET() {
  // A sonda vive sob /w/[slug]/**, que o proxy já exige sessão para abrir.
  // Esta checagem é a segunda camada — a sonda não é superfície pública.
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Não autenticado — faça login no workspace primeiro.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SONDA VTURB — descartável</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
       background:#0b0e14;color:#e6e9ef;padding:16px}
  h1{font-size:16px;margin:0 0 4px}
  .sub{color:#8b93a7;font-size:12px;margin-bottom:16px}
  .grid{display:grid;gap:16px;grid-template-columns:minmax(320px,1fr) minmax(340px,1fr)}
  @media(max-width:900px){.grid{grid-template-columns:1fr}}
  .card{background:#141924;border:1px solid #232a3a;border-radius:10px;padding:12px}
  .card h2{font-size:13px;margin:0 0 8px;color:#a8b2c8;text-transform:uppercase;letter-spacing:.04em}
  #stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #232a3a;vertical-align:top}
  th{color:#8b93a7;font-weight:500}
  .empty{color:#5b6478;font-size:12px;padding:8px 0}
  .ok{color:#4ade80}.bad{color:#f87171}.warn{color:#fbbf24}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;word-break:break-all}
  .clock{font-family:ui-monospace,monospace;font-size:20px;color:#7dd3fc}
  .pill{display:inline-block;padding:1px 6px;border-radius:99px;background:#232a3a;font-size:11px}
  .banner{background:#2a1a00;border:1px solid #6b4a00;color:#fbbf24;padding:8px 10px;border-radius:8px;
          font-size:12px;margin-bottom:12px}
</style></head><body>
<div class="banner"><strong>SONDA DESCARTÁVEL — SONDA-VTURB.</strong> Nada aqui vira produto.
Mede: diretivas de CSP exigidas · postMessage (fim de vídeo?) · se o vídeo toca sem SDK.</div>
<h1>Sonda VTurb <span class="pill" id="clock">--:--:--</span></h1>
<div class="sub">CSP liberada nesta branch: <code>frame-src https://scripts.converteai.net</code> — e <strong>só isso</strong>.
Qualquer outra diretiva que o player precisar vai aparecer na tabela de violações.</div>

<div class="grid">
  <div>
    <div class="card">
      <h2>1 · O player (molde do Panda: iframe puro, sem SDK)</h2>
      <div id="stage"></div>
      <div style="margin-top:8px;font-size:12px">
        Estado do iframe: <strong id="ifstate" class="warn">montando…</strong><br>
        <code id="ifsrc"></code>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>3 · Violações de CSP <span class="pill" id="cspn">0</span></h2>
      <div class="sub" style="margin:0 0 8px">A CSP não tem <code>report-uri</code> ⇒ violação é muda no servidor.
      Esta tabela é a ÚNICA testemunha.</div>
      <table><thead><tr><th>hora</th><th>diretiva</th><th>URI bloqueada</th><th>modo</th></tr></thead>
      <tbody id="csp"></tbody></table>
      <div class="empty" id="cspempty">nenhuma violação até agora</div>
    </div>
  </div>

  <div>
    <div class="card">
      <h2>2 ⭐ · postMessage recebidos <span class="pill" id="msgn">0</span></h2>
      <div class="sub" style="margin:0 0 8px">Hoje o repo tem <strong>zero</strong> <code>addEventListener("message")</code>.
      Se aparecer mensagem de FIM DE VÍDEO aqui, existe canal para conclusão automática. Se não aparecer, não existe.</div>
      <table><thead><tr><th>hora</th><th>origin</th><th>payload (resumo)</th></tr></thead>
      <tbody id="msgs"></tbody></table>
      <div class="empty" id="msgempty">nenhuma mensagem recebida ainda</div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Roteiro para o gate humano</h2>
      <ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.8">
        <li>Abra esta página e espere o iframe carregar.</li>
        <li><strong>Dê play.</strong> Anote se o vídeo toca.</li>
        <li>Veja se a tabela de <strong>violações de CSP</strong> acusa algo (connect-src? img-src? media-src?).</li>
        <li>⭐ <strong>Deixe o vídeo terminar</strong> e olhe a lista de postMessage no mesmo segundo do relógio.</li>
        <li>Copie as duas tabelas inteiras no relatório.</li>
      </ol>
    </div>
  </div>
</div>

<script>
(function(){
  var pad=function(n){return String(n).padStart(2,"0")};
  setInterval(function(){var d=new Date();
    document.getElementById("clock").textContent=pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds());
  },1000);
  var now=function(){var d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())};

  // ── 3 · CSP: a única testemunha, porque não há report-uri ───────────────
  var cspN=0;
  document.addEventListener("securitypolicyviolation",function(e){
    cspN++;document.getElementById("cspn").textContent=cspN;
    document.getElementById("cspempty").style.display="none";
    var tr=document.createElement("tr");
    tr.innerHTML="<td>"+now()+"</td><td class='bad'>"+e.violatedDirective+
      "</td><td><code>"+String(e.blockedURI).slice(0,120)+"</code></td><td>"+e.disposition+"</td>";
    document.getElementById("csp").appendChild(tr);
  });

  // ── 2 · TODA mensagem, de qualquer origem ───────────────────────────────
  var msgN=0;
  window.addEventListener("message",function(e){
    msgN++;document.getElementById("msgn").textContent=msgN;
    document.getElementById("msgempty").style.display="none";
    var p;
    try{p=typeof e.data==="string"?e.data:JSON.stringify(e.data)}catch(_){p="[não serializável: "+typeof e.data+"]"}
    if(p&&p.length>220)p=p.slice(0,220)+"…";
    var tr=document.createElement("tr");
    tr.innerHTML="<td>"+now()+"</td><td><code>"+String(e.origin)+"</code></td><td><code>"+
      (p||"(vazio)").replace(/</g,"&lt;")+"</code></td>";
    document.getElementById("msgs").appendChild(tr);
  });

  // ── 1 · O iframe, pelo MOLDE DO PANDA (video-player.tsx:284-298) ────────
  var mount=document.getElementById("stage");
  var f=document.createElement("iframe");
  f.src=${JSON.stringify(VTURB_EMBED)};
  f.style.border="none";f.style.backgroundColor="#000";
  f.style.position="absolute";f.style.top="0";f.style.left="0";
  f.style.width="100%";f.style.height="100%";
  f.allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture";
  f.allowFullscreen=true;
  f.setAttribute("fetchpriority","high");
  f.onload=function(){var el=document.getElementById("ifstate");el.textContent="onload disparou";el.className="ok"};
  f.onerror=function(){var el=document.getElementById("ifstate");el.textContent="onerror disparou";el.className="bad"};
  mount.innerHTML="";
  mount.appendChild(f);
  document.getElementById("ifsrc").textContent=f.src;
})();
</script>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
