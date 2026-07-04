# 🖊️ TulisTangan App (v1.0.0)

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.10-blue?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev)
[![TailwindCSS Version](https://img.shields.io/badge/TailwindCSS-v4-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**TulisTangan App** adalah aplikasi web berbasis AI / Algoritma Geometris yang canggih untuk mengubah dokumen teks digital (PDF, DOCX, Rich Text) menjadi lembar tulisan tangan yang sangat realistis dan natural. Aplikasi ini dirancang khusus untuk mempertahankan tata letak (layout) asli dokumen Anda maupun mengalirkan teks secara natural pada buku tulis bergaris/kotak dengan kualitas resolusi cetak premium.

---

## ✨ Fitur Unggulan

### 1. 📐 Preservasi Layout 1:1 (PDF & DOCX)
- **Line-Grouping & Collision-Free Snapping**: Algoritma yang secara dinamis mendeteksi koordinat vertikal teks asli dari PDF dan mensejajarkannya (snapping) ke baris buku tulis terdekat tanpa tabrakan baris.
- **Pembersihan Teks Ganda (Deduplikasi)**: Dilengkapi dengan algoritma *Geometric Backward Scanning* dan *Bidirectional Substring Overlap Detection* untuk menyaring duplikat layer visual/OCR yang berbayang.
- **Dynamic 1:1 Scaling**: Pengguna dapat mengubah ukuran teks layout asli PDF secara proporsional langsung menggunakan slider kustomisasi.

### 2. 📝 Reflow Mode (Teks Editor)
- **Rich Text Editor**: Editor dokumen lengkap (Google Docs Mode) dengan dukungan format tebal, miring, list, tabel, gambar, dan tombol pemisah halaman (page break).
- **Nested List (Tree Diagram) Support**: Mendukung tingkat daftar bersarang (bullet/number) secara hierarkis dengan indentasi otomatis dan variasi bullet (`•`, `–`, `▪`) untuk diagram pohon (B-Tree/BST).
- **Auto-Wrapping Tables**: Sel tabel terpotong secara rapi (`ctx.clip()`) dan memiliki baris dinamis menyesuaikan isi kolom agar teks tidak menabrak kolom tetangga.

### 3. 🖼️ Output Resolusi Tinggi (Kualitas Cetak Premium)
- **Multi-skala DPI (1x, 2x, 3x)**: Pilihan resolusi ekspor hingga **3x (288 DPI)** untuk hasil cetak fisik yang sangat tajam tanpa piksel pecah saat diperbesar.
- **Auto-Scale Stroke & Lines**: Tebal goresan tinta, garis buku tulis bergaris, kotak-kotak, dan margin merah disesuaikan secara proporsional dengan skala resolusi pilihan Anda.
- **A4 mm PDF Exporter**: PDF yang diunduh secara otomatis memiliki dimensi fisik A4 (210mm x 297mm) meskipun berisi gambar dengan kepadatan piksel tinggi.

### 4. ✍️ Karakteristik Tulisan Tangan Realistis
- **Seeded Jitter & Slant**: Variasi goyangan garis horizontal, kemiringan karakter (natural slant), ukuran huruf acak, dan kejernihan tinta yang disimulasikan menggunakan derau matematis Simplex Noise.
- **Pencil/Pen Ink Shader**: Bayangan coretan tinta pulpen atau pensil yang meyakinkan dengan opacity yang dinamis.
- **Desk Lamp Shadow & Vignette**: Overlay pencahayaan lampu meja realistis pada kertas digital.

---

## 🛠️ Tech Stack & Pustaka Utama

*   **Framework Utama**: [Next.js 16.2 (Turbopack)](https://nextjs.org/)
*   **User Interface**: [React 19](https://react.dev/) & [TailwindCSS v4](https://tailwindcss.com/)
*   **Parser PDF**: [pdfjs-dist](https://github.com/mozilla/pdf.js) (OCR layer & coordinates extraction)
*   **Parser Word**: [Mammoth.js](https://github.com/mwilliamson/mammoth.js) (DOCX to HTML parsing)
*   **Eksporter PDF**: [jsPDF](https://github.com/parallax/jsPDF) (A4 canvas compiling)
*   **Database Offline**: [Dexie.js](https://dexie.org/) (Local IndexedDB storage)
*   **Math Noise**: [Simplex Noise](https://github.com/jwagner/simplex-noise.js) (Handwriting imperfections simulation)

---

## 📂 Struktur Repositori

```bash
tulistangan-app/
├── app/
│   ├── convert/          # Halaman konversi utama (upload, edit, preview, export)
│   ├── globals.css       # Tema visual, animasi, dan gaya editor teks
│   └── layout.tsx        # Shell tata letak global aplikasi
├── components/
│   └── RichTextEditor.tsx # Editor rich-text dengan toolbars kustom
├── lib/
│   ├── handwritingEngine.ts # Inti rendering tulisan tangan (layouting, canvas drawing, noise)
│   ├── pdfParser.ts         # Parser PDF spasial, deduplikasi overlap, dan pembuat HTML
│   ├── docxParser.ts        # Mammoth mapping untuk file Word
│   ├── paperRenderer.ts     # Penggambaran pola kertas (bergaris, kotak, polos) dan efek lampu
│   └── exportUtils.ts       # Manajemen ekspor gambar (PNG/JPEG) dan penyusun halaman PDF
├── public/
│   └── pdf.worker.min.mjs   # Berkas worker PDF.js untuk parser asinkronus
├── package.json
└── tsconfig.json
```

---

## 🚀 Memulai di Server Lokal

### 1. Prasyarat
Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 ke atas) di perangkat Anda.

### 2. Kloning Repositori
```bash
git clone https://github.com/Atnan49/-Handwriting-dengan-Teks-Editor.git
cd tulistangan-app
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda untuk running aplikasi secara lokal.

### 5. Kompilasi Produksi (Build)
```bash
npm run build
npm run start
```

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah **MIT License**. Lihat berkas [LICENSE](LICENSE) jika tersedia untuk detail selengkapnya.

---

*Dibuat dengan 💖 untuk memudahkan kebutuhan tulisan tangan digital.*
