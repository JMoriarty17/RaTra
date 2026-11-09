/* Pembaca teks SK rate transport (tempel dari PDF). Dipakai admin.js dan bisa dijalankan di Node. */
function parseSK(text,known,alias,kecOf){
 kecOf=kecOf||{};
 alias=alias||{};const W=[];
 const norm=s=>{s=(s||"").toLowerCase().trim().replace(/\s+/g," ").replace(/^(ds\.?|desa)\s+/,"");return alias[s]||s};
 const clean=s=>s.replace(/\([^)]*\)/g," ").replace(/\s+/g," ").trim().replace(/^(ds\.?|desa)\s+/i,"");
 const t=String(text).replace(/\s+/g," ");const JK=/\b(?:KECAMATAN|DESA|RATE|KE|IBU|KOTA|KABUPATEN|TUJUAN|ASAL)\b|\(PP\)|\(\d\)/g;
 const amt=s=>+s.replace(/[.,]00$/,"").replace(/\D/g,"");
 const AMT=/Rp\s*([\d.,]+)/g;
  const PG=/ ?-\d{1,3}-?(?=[A-Z ]|$)/g,KT=/Keterangan: ?\* ?= ?ibukota kecamatan/gi;
 const sp=s=>{const o=[];let last=0,m;AMT.lastIndex=0;while(m=AMT.exec(s)){o.push({c:s.slice(last,m.index).trim(),a:amt(m[1])});last=AMT.lastIndex}return o};
 const nm=(t.match(/NOMOR (\d+) TAHUN (\d{4})/i)||[]);const nomor=nm[1]?`${nm[1]} Tahun ${nm[2]}`:"";
 const BL={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
 const dm=t.match(/Pada tanggal ?: ?(\d{1,2}) (\w+) (\d{4})/i);let tanggal="";
 if(dm&&BL[dm[2].toLowerCase()])tanggal=`${dm[3]}-${String(BL[dm[2].toLowerCase()]).padStart(2,"0")}-${dm[1].padStart(2,"0")}`;
 const f1=t.match(/\(1\) ?\(2\) ?\(3\) ?\(4\)/),m1=f1?f1.index+f1[0].length:-1,m2=t.search(/DESA ASAL/),m3=t.search(/RATE TRANSPORT DARI BUNTOK KOTA/i);
 if(m1<0||m2<0)return{sk:null,warn:["Tabel desa/rute tidak ditemukan. Pastikan seluruh teks lampiran SK ikut ditempel."]};
 // --- desa
 const KC={"G.B.AWAI":"Gunung Bintang Awai","GBAWAI":"Gunung Bintang Awai"};
 let vt=t.slice(m1,m2).replace(PG," ").replace(KT," ").replace(JK," ");
 const villages=[];let kec="";const KS=new Set(Object.values(kecOf));
 const P=sp(vt);P.forEach((p,i)=>{if(i%2)return;let c=p.c,b=P[i+1];if(!b)return;
  const h=c.match(/^((?:[A-Z][A-Z.]*\s+)*[A-Z][A-Z.]*)\s+(?=[A-Z][a-z])/);
  if(h){const k=h[1].trim(),cn=KC[k]||k.toLowerCase().replace(/(^|\s)\S/g,x=>x.toUpperCase());c=c.slice(h[0].length);
   if(KS.has(cn)||!KS.size||![...KS].some(x=>x.toLowerCase().split(" ").includes(cn.toLowerCase())))kec=cn}
  const ik=/\*/.test(c);c=clean(c.replace(/\*/g,""));const kk=kecOf[norm(c)]||kec;
  if(!c||!kk){W.push("Baris desa tidak terbaca: "+p.c);return}
  villages.push({n:c,kec:kk,ik,kec_rate:p.a,kab_rate:b.a})});
 const kn=new Set(known.map(norm));villages.forEach(v=>kn.add(norm(v.n)));
 const disp={};villages.forEach(v=>disp[norm(v.n)]=v.n);
 // --- rute desa-desa
 const rt=t.slice(m2,m3<0?t.length:m3).replace(PG," ").replace(JK," ");
 const routes=[],seen={};
 sp(rt).forEach(p=>{const tk=clean(p.c).split(" ").filter(Boolean);let best=null,half=null;
  for(let i=1;i<tk.length;i++){const L=tk.slice(0,i).join(" "),R=tk.slice(i).join(" "),kl=kn.has(norm(L)),kr=kn.has(norm(R));
   if(kl&&kr){best=[L,R,0];break}if((kl||kr)&&!half)half=[L,R,1]}
  if(!best&&half)best=half;
  if(!best&&tk.length%2==0&&tk.length>1)best=[tk.slice(0,tk.length/2).join(" "),tk.slice(tk.length/2).join(" "),1];
  if(!best){W.push("Rute tidak terbaca: "+p.c+" "+p.a);return}
  const [A,B]=best.slice(0,2).map(x=>clean(x));const dA=disp[norm(A)]||A,dB=disp[norm(B)]||B;
  if(best[2])W.push(`Nama baru/tebakan: ${dA} ↔ ${dB} (cek ejaan)`);
  const key=[norm(A),norm(B)].sort().join("|");
  if(seen[key]!=null){if(seen[key]!=p.a)W.push(`Rute ganda beda rate: ${dA} ↔ ${dB}`);return}
  seen[key]=p.a;routes.push([dA,dB,p.a])});
 // --- rute khusus
 const special=[];
 if(m3>=0)sp(t.slice(m3)).forEach(p=>{let c=p.c.replace(/^.*?\(1\) ?\(2\) ?/,"").trim();
  const n=/seberang/i.test(c)?"Buntok Kota ↔ Buntok Seberang (PP)":/pelabuhan/i.test(c)?"Pelabuhan → tempat kegiatan di Buntok Kota (PP)":c;
  if(n)special.push({n,rate:p.a})});
 const num=(nm[1]||"").padStart(3,"0");
 return{sk:{id:nm[1]?`sk-${num}-${nm[2]}`:"",nomor,tanggal,villages,routes,special},warn:W};
}
if(typeof module!="undefined")module.exports=parseSK;
