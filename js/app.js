const $ = id => document.getElementById(id), rp = x => "Rp " + x.toLocaleString("id-ID");
const MODES = [["dd", "Desa ↔ Desa"], ["kc", "Ke Kecamatan"], ["kb", "Ke Kabupaten"], ["sp", "Rute khusus"]];
let SKS = [], ALIAS = {}, mode = "dd", last = null;
const norm = s => { s = (s || "").toLowerCase().trim().replace(/\s+/g, " ").replace(/^(ds\.?|desa)\s+/, ""); return ALIAS[s] || s };
const tgl = t => new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const cur = () => SKS[+$("sk").value];
function prep(sk) {
  const V = {}, adj = {}, nm = {}, ik = {};
  sk.villages.forEach(v => { const k = norm(v.n); V[k] = v; nm[k] = v.n; if (v.ik) ik[v.kec] = v.n });
  sk.routes.forEach(([a, b, r]) => { const A = norm(a), B = norm(b); nm[A] = nm[A] || a; nm[B] = nm[B] || b; (adj[A] = adj[A] || {})[B] = r; (adj[B] = adj[B] || {})[A] = r });
  Object.assign(sk, { V, adj, nm, ik })
}
function path(sk, s, t) {
  const d = { [s]: 0 }, prev = {}, done = {};
  while (1) {
    let u = null; for (const k in d) if (!done[k] && (u == null || d[k] < d[u])) u = k;
    if (u == null) return null; if (u == t) break; done[u] = 1;
    for (const w in sk.adj[u] || {}) { const c = d[u] + sk.adj[u][w]; if (d[w] == null || c < d[w]) { d[w] = c; prev[w] = u } }
  }
  const p = [t]; while (p[0] != s) p.unshift(prev[p[0]]); return { cost: d[t], p: p.map(k => sk.nm[k]) }
}
function val(sk, A, B) {
  const a = norm(A); if (mode == "dd") return sk.adj[a]?.[norm(B)];
  const v = sk.V[a]; return v ? (mode == "kc" ? v.kec_rate : v.kab_rate) : undefined
}
function box(c, t, g, ex) {
  const sk = cur(), r = g(sk); let cmp = ""; if (r != null) last = r;
  SKS.filter(s => s !== sk).forEach(s => {
    const o = g(s); if (o == null && r == null) return;
    cmp += `<tr><td>SK ${s.nomor}</td><td>${o == null ? "–" : rp(o)}${o != null && r != null && o != r ? ` <span class="d ${r > o ? "up" : "dn"}">${r > o ? "▲" : "▼"} ${rp(Math.abs(r - o))}</span>` : ""}</td></tr>`
  });
  return `<div class="res ${c}"><div class="mu">${t}</div><div class="big">${r == null ? "–" : rp(r)}</div>${ex ? `<div class="mu">${ex}</div>` : ""}
 ${cmp ? `<div class="mu" style="margin-top:8px">Perbandingan SK lain (▲▼ = SK terpilih lebih tinggi/rendah)</div><table>${cmp}</table>` : ""}
 ${r != null ? `<button class="btn cp" data-t="${encodeURIComponent(`${t}: ${rp(r)} (SK ${sk.nomor})`)}">Salin hasil</button>` : ""}</div>`
}
function render() {
  const sk = cur(); let h = ""; last = null; const A = $("a").value, B = $("b").value, a = norm(A), b = norm(B);
  if (mode == "sp") sk.special.forEach(s => h += box("ok", s.n, x => x.special.find(q => q.n == s.n)?.rate));
  else if (mode != "dd") {
    if (A) {
      const v = sk.V[a];
      if (!v) h = box("wr", "Desa tidak ditemukan", () => null, "Desa ini tidak punya rate langsung ke kecamatan/kabupaten, atau ejaannya berbeda.");
      else { const kc = mode == "kc"; const kab = "Buntok Kota"; h = box("ok", kc ? `${v.n} → ${sk.ik[v.kec] || "ibu kota kecamatan"} (PP)` : `${v.n} → ${kab} (PP)`, x => val(x, A), kc ? `Kecamatan ${v.kec} · ibu kota kecamatan: ${sk.ik[v.kec] || "–"}${v.ik ? " (desa ini)" : ""}` : `Tujuan: ${kab}, ibu kota Kabupaten Barito Selatan${norm(kab) == a ? " (desa ini)" : ""}`) }
    }
  }
  else if (A && B) {
    if (a == b) h = box("wr", "Desa asal dan tujuan sama", () => null);
    else if (val(sk, A, B) != null) h = box("ok", `${sk.nm[a] || A} ↔ ${sk.nm[b] || B} (PP)`, x => val(x, A, B), "Rute tercantum di SK " + sk.nomor);
    else {
      const p = path(sk, a, b); let ex = "Tidak ada rute langsung di SK ini.";
      if (p) ex += `<p><b>Estimasi rute bersambung</b> (bukan rate resmi):<br>${p.p.join(" → ")} = <b>${rp(p.cost)}</b></p>`;
      let t = "";[a, b].forEach(k => { const v = sk.V[k]; if (v) t += `<tr><td>${v.n} → kecamatan</td><td>${rp(v.kec_rate)}</td></tr><tr><td>${v.n} → kabupaten</td><td>${rp(v.kab_rate)}</td></tr>` });
      h = box("wr", "Tidak ada rate langsung", () => null, ex + (t ? `<br>Acuan:<table>${t}</table>` : "")); last = p ? p.cost : null
    }
  }
  $("out").innerHTML = h; total()
}
function total() {
  const n = +$("n").value || 0, t = +$("t").value || 0;
  $("tot").innerHTML = last == null ? "Pilih rute dulu untuk menghitung." : `${rp(last)} × ${n} orang × ${t} perjalanan = <b>${rp(last * n * t)}</b>`
}
function draw() {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.m == mode));
  $("b2").style.display = $("swap").style.display = mode == "dd" ? "" : "none"; $("inp").style.display = mode == "sp" ? "none" : "";
  $("l1").textContent = mode == "dd" ? "Desa asal" : "Nama desa"; render()
}
const TH = ["auto", "light", "dark"]; let ti = 0; try { ti = Math.max(0, TH.indexOf(localStorage.theme)) } catch (e) { }
function setT() { const r = document.documentElement; TH[ti] == "auto" ? r.removeAttribute("data-theme") : r.dataset.theme = TH[ti]; $("theme").textContent = ["◐", "☀", "☾"][ti] }
$("theme").onclick = () => { ti = (ti + 1) % 3; try { localStorage.theme = TH[ti] } catch (e) { } setT() }; setT();
$("tabs").innerHTML = MODES.map(m => `<button data-m="${m[0]}">${m[1]}</button>`).join("");
$("tabs").onclick = e => { if (e.target.dataset.m) { mode = e.target.dataset.m; draw() } };
["a", "b"].forEach(i => { $(i).oninput = render; $(i).onfocus = e => e.target.select() });
["n", "t"].forEach(i => $(i).oninput = total);
$("swap").onclick = () => { [$("a").value, $("b").value] = [$("b").value, $("a").value]; render() };
$("sk").onchange = () => { $("sub").textContent = `Barito Selatan · SK ${cur().nomor} (${tgl(cur().tanggal)}) · semua rate PP`; render() };
$("out").onclick = e => { const t = e.target.dataset.t; if (t) navigator.clipboard?.writeText(decodeURIComponent(t)).then(() => e.target.textContent = "Tersalin ✓") };
(async () => {
  const j = u => fetch(u).then(r => r.json());
  try {
    const idx = await j("data/index.json"); ALIAS = await j("data/alias.json");
    SKS = await Promise.all(idx.files.map(f => j("data/" + f))); SKS.forEach(prep); SKS.sort((x, y) => y.tanggal.localeCompare(x.tanggal));
    $("sk").innerHTML = SKS.map((s, i) => `<option value="${i}">SK ${s.nomor} (${tgl(s.tanggal)})${i ? "" : " – terbaru"}</option>`).join("");
    const M = new Map(); SKS.forEach(s => { for (const k in s.nm) M.set(s.nm[k], M.get(s.nm[k]) || s.V[k]?.kec || "") });
    $("dl").innerHTML = [...M].sort().map(([n, k]) => `<option value="${n}" label="${k}">`).join("");
    $("sk").onchange(); draw()
  } catch (e) { $("sub").textContent = "Gagal memuat data. Jalankan lewat server (bukan file://)." }
})();
if ("serviceWorker" in navigator && location.protocol != "file:") navigator.serviceWorker.register("sw.js");
