# Rate Transport BPS Barito Selatan

Web statis (HTML/CSS/JS, tanpa build) — mobile-first, bisa dipasang di HP (PWA) dan jalan offline.

## Jalankan lokal
VS Code → ekstensi **Live Server** → klik kanan `index.html` → *Open with Live Server*.
(Atau `npx serve .`). Jangan dibuka lewat `file://` karena data dimuat dengan `fetch`.

## Deploy (GitHub Pages)
1. Buat repo di GitHub, push seluruh folder ini.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Situs aktif di `https://<user>.github.io/<repo>/`.
(Cloudflare Pages / Netlify juga bisa: tanpa build command, publish directory `/`.)

## Mengubah rate / menambah SK baru
1. Buka `/admin.html`. Pilih SK, edit tabel Desa / Rute / Rute khusus.
   Untuk SK baru: **Duplikat jadi SK baru** → isi nomor & tanggal → edit.
2. **Cek validasi**, lalu **Unduh SK (.json)**.
3. Taruh file di folder `data/` (timpa jika mengedit SK lama). Untuk SK baru, unduh juga `index.json` dan timpa.
4. `git add . && git commit -m "Update rate SK ..." && git push` → situs ter-update otomatis.

SK dengan tanggal terbaru otomatis jadi default. SK lain tetap muncul sebagai pembanding.
Halaman admin tidak mengubah data online; perubahan baru berlaku setelah kamu commit, jadi aman walau halaman bisa dibuka publik.
Edit manual di VS Code juga bisa langsung ke file JSON di `data/`.

## Format data (`data/sk-*.json`)
```
{ "id","nomor","tanggal":"YYYY-MM-DD",
  "villages":[{"n","kec","ik":true/false,"kec_rate","kab_rate"}],   // rupiah, PP; ik = ibu kota kecamatan
  "routes":[["Desa A","Desa B",rate]],                              // dua arah
  "special":[{"n","rate"}] }
```
`data/alias.json`: pemetaan ejaan alternatif (huruf kecil) → ejaan baku.

## Catatan
- Setelah deploy ulang, pengguna yang sudah memasang PWA melihat data baru pada pembukaan kedua (cache stale-while-revalidate). Untuk memaksa, naikkan `C="rate-v1"` di `sw.js`.
