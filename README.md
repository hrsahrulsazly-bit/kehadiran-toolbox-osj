# Kehadiran Toolbox OSJ

Sistem kehadiran mudah alih (mobile-friendly) untuk merekod kehadiran pekerja
Perjumpaan Toolbox Operasi Subang Jaya.

## Ciri-ciri

- **Ambil Kehadiran** — tandakan HADIR / TIDAK HADIR setiap pekerja ikut tarikh, dengan ruangan catatan yang ditaip secara manual.
- **Pekerja** — cari/filter pekerja ikut kumpulan (Staff / Pemandu), tambah pekerja baru, padam pekerja.
- **Rekod Bulanan** — jadual kehadiran sebulan bagi setiap pekerja, lengkap dengan jumlah hadir/tidak hadir dan peratus kehadiran.
- **Laporan** — jana laporan harian atau bulanan, muat turun sebagai **PDF** atau **Excel**.

## Guna terus (tanpa install)

Buka `index.html` terus di pelayar telefon/komputer, atau layari versi yang di-deploy di Vercel.

Data disimpan dalam `localStorage` pelayar peranti tersebut sahaja (tiada server/database). Setiap peranti/pelayar akan ada storan kehadiran berasingan.

## Jalankan secara tempatan (pilihan)

```bash
npx http-server . -p 8080
```

Kemudian buka `http://localhost:8080`.

## Struktur projek

- `index.html` — kerangka aplikasi & navigasi
- `css/style.css` — reka bentuk mudah alih
- `js/store.js` — lapisan data (localStorage)
- `js/view-*.js` — setiap skrin (Kehadiran, Pekerja, Bulanan, Laporan)
- `data/seed-data.js` — senarai pekerja awal (diimport dari fail Excel asal)
- `vendor/` — pustaka pihak ketiga (SheetJS, jsPDF, jsPDF-AutoTable) untuk eksport
