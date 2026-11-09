const $=id=>document.getElementById(id),j=u=>fetch(u).then(r=>r.json());
const COLS={villages:[["n","Desa","text"],["kec","Kecamatan","text"],["ik","Ibu kota kec.","check"],["kec_rate","→ Kec (Rp)","num"],["kab_rate","→ Kab (Rp)","num"]],
 routes:[["a","Desa A","text"],["b","Desa B","text"],["r","Rate PP (Rp)","num"]],special:[["n","Keterangan","text"],["rate","Rate PP (Rp)","num"]]};
const TABS={villages:"Desa",routes:"Rute desa↔desa",special:"Rute khusus"};
let F={},files=[],cf,cur,tab="villages",ALIAS={};
const norm=s=>{s=(s||"").toLowerCase().trim().replace(/\s+/g," ").replace(/^(ds\.?|desa)\s+/,"");return ALIAS[s]||s};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const toObj=()=>({id:$("id").value.trim(),nomor:$("nomor").value.trim(),tanggal:$("tanggal").value,villages:cur.villages,routes:cur.routes.map(r=>[r.a,r.b,r.r]),special:cur.special});
function load(f){cf=f;cur=JSON.parse(JSON.stringify(F[f]));cur.routes=cur.routes.map(([a,b,r])=>({a,b,r}));
 ["id","nomor","tanggal"].forEach(k=>$(k).value=cur[k]||"");draw()}
function fill(sel){$("f").innerHTML=files.map(f=>`<option>${f}</option>`).join("");if(sel)$("f").value=sel}
function draw(){const rows=cur[tab],q=$("q").value.toLowerCase(),C=COLS[tab];
 $("tabs").innerHTML=Object.entries(TABS).map(([k,v])=>`<button class="${k==tab?"on":""}" data-t="${k}">${v}</button>`).join("");
 let h="<table><tr>"+C.map(c=>`<th>${c[1]}</th>`).join("")+"<th></th></tr>";
 rows.forEach((r,i)=>{if(q&&!C.some(c=>c[2]=="text"&&String(r[c[0]]).toLowerCase().includes(q)))return;
  h+="<tr>"+C.map(([k,,t])=>`<td><input data-i="${i}" data-k="${k}" type="${t=="check"?"checkbox":t=="num"?"number":"text"}" ${t=="check"?(r[k]?"checked":""):`value="${esc(r[k]??"")}"`}></td>`).join("")+`<td><button class="btn" data-del="${i}" aria-label="Hapus">✕</button></td></tr>`});
 $("tbl").innerHTML=h+"</table>"}
$("tabs").onclick=e=>{if(e.target.dataset.t){tab=e.target.dataset.t;draw()}};
$("q").oninput=draw;
$("tbl").onchange=$("tbl").oninput=e=>{const d=e.target.dataset;if(d.k==null)return;const t=e.target.type;
 cur[tab][d.i][d.k]=t=="checkbox"?e.target.checked:t=="number"?+e.target.value:e.target.value};
$("tbl").onclick=e=>{const i=e.target.dataset.del;if(i!=null&&confirm("Hapus baris ini?")){cur[tab].splice(i,1);draw()}};
$("add").onclick=()=>{$("q").value="";cur[tab].unshift(tab=="villages"?{n:"",kec:"",ik:false,kec_rate:0,kab_rate:0}:tab=="routes"?{a:"",b:"",r:0}:{n:"",rate:0});draw()};
$("f").onchange=()=>{F[cf]=toObj();load($("f").value)};
$("dup").onclick=()=>{const id=prompt("ID file SK baru (contoh: sk-200-2026)");if(!id)return;F[cf]=toObj();
 const o=toObj();o.id=id;o.nomor="";o.tanggal=new Date().toISOString().slice(0,10);const f=id+".json";if(!files.includes(f))files.push(f);F[f]=o;fill(f);load(f)};
$("chk").onclick=()=>{const m=[],seen={};
 cur.routes.forEach((r,i)=>{const k=[norm(r.a),norm(r.b)].sort().join("|");
  if(!r.a||!r.b||!(r.r>0))m.push(`Rute #${i+1} tidak lengkap atau rate ≤ 0`);if(norm(r.a)==norm(r.b))m.push(`Rute #${i+1}: asal = tujuan`);
  if(seen[k])m.push(`Rute ganda: ${r.a} ↔ ${r.b}`);seen[k]=1});
 const ik={};cur.villages.forEach(v=>{if(v.ik)ik[v.kec]=(ik[v.kec]||0)+1;if(!(v.kec_rate>0)||!(v.kab_rate>0))m.push(`Desa ${v.n||"(kosong)"}: rate kosong/0`)});
 [...new Set(cur.villages.map(v=>v.kec))].forEach(k=>{if(ik[k]!=1)m.push(`Kecamatan ${k}: harus tepat 1 ibu kota (sekarang ${ik[k]||0})`)});
 const vn=new Set(cur.villages.map(v=>norm(v.n))),un=new Set();cur.routes.forEach(r=>[r.a,r.b].forEach(x=>{if(x&&!vn.has(norm(x)))un.add(x)}));
 $("msg").style.display="";$("msg").innerHTML=(m.length?"<b>Perlu diperbaiki:</b><br>"+m.join("<br>"):"<b>✓ Tidak ada masalah ditemukan.</b>")+(un.size?`<p class="mu">Nama di rute yang tidak ada di daftar desa (cek ejaan, atau abaikan jika memang desa tanpa rate kecamatan): ${[...un].join(", ")}</p>`:"")};
function save(name,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));a.download=name;a.click()}
$("dl1").onclick=()=>{const o=toObj();if(!o.id||!o.nomor||!o.tanggal)return alert("Isi ID file, Nomor SK, dan Tanggal dulu.");save(o.id+".json",o)};
$("dl2").onclick=()=>{F[cf]=toObj();const n=toObj().id+".json";if(n!=cf&&cf){const i=files.indexOf(cf);if(!F[cf].nomor&&i>-1&&cf!=n)files[i]=n}save("index.json",{files})};
async function start(){const x=await j("data/index.json");files=x.files;ALIAS=await j("data/alias.json");for(const f of files)F[f]=await j("data/"+f);fill();load(files[0])}

const H=s=>{let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)};
const PIN_HASH="2agv2fiizu0";let started=0;
function unlock(){$("lock").style.display="none";$("app").style.display="";try{sessionStorage.adm=PIN_HASH}catch(e){}if(!started){started=1;start()}}
function tryPin(){if(H("ratra:"+$("pin").value.trim())==PIN_HASH)return unlock();
 $("lerr").textContent="PIN salah";$("pin").classList.add("bad");$("pin").value="";setTimeout(()=>$("pin").classList.remove("bad"),400)}
$("go").onclick=tryPin;$("pin").onkeydown=e=>{if(e.key=="Enter")tryPin()};
try{if(sessionStorage.adm==PIN_HASH)unlock();else $("pin").focus()}catch(e){$("pin").focus()}
