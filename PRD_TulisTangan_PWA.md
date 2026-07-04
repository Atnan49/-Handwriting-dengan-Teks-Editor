**Product Requirement Document**

TulisTangan.id — PWA Konversi PDF menjadi Simulasi Tulisan Tangan

*Disusun untuk: Atnan Septian Wijanarko  |  Versi 1.0  |  Juli 2026*

# 1\. Ringkasan Produk

TulisTangan.id adalah Progressive Web App (PWA) yang mengubah dokumen PDF (materi kuliah, soal, draft tugas, dsb) menjadi gambar/halaman yang tampak seperti hasil tulisan tangan manusia asli — lengkap dengan variasi bentuk huruf, kemiringan, tekanan pena, dan tekstur kertas — bukan sekadar mengganti font. Produk ini menyasar pelajar dan mahasiswa yang membutuhkan tugas berbentuk catatan tangan namun ingin proses penulisan lebih cepat dan rapi secara konten, sambil tetap terlihat autentik secara visual.

Nilai jual utama produk: hasil akhir berupa citra (image) yang meniru foto lembar tulisan tangan asli — bukan PDF teks biasa — dengan tingkat variasi "human-like" tinggi (jitter antar huruf, baseline bergelombang, ketebalan pena tidak konsisten) sehingga sulit dibedakan dari tulisan tangan sungguhan pada pandangan sekilas.

# 2\. Latar Belakang & Tujuan

* Banyak tugas sekolah/kuliah di Indonesia masih mensyaratkan format tulisan tangan (catatan, rangkuman, resume, tugas portofolio).

* Menulis tangan untuk dokumen panjang memakan waktu dan melelahkan, terutama saat tenggat mepet atau tugas menumpuk dari banyak mata kuliah/pelajaran.

* Solusi font-handwriting sederhana yang sudah ada (banyak beredar di internet) hasilnya terlalu seragam/kaku dan mudah dikenali sebagai hasil generate, bukan tulisan asli.

* Tujuan produk: menyediakan alat yang cepat, bisa diakses dari HP (PWA, installable, bisa offline), dan menghasilkan output yang secara visual meyakinkan sebagai tulisan tangan asli.

*Catatan etika: fitur ini berada di area abu-abu (dapat disalahgunakan untuk kecurangan akademik). Bagian Risiko & Pertimbangan membahas mitigasi — misalnya positioning produk sebagai alat bantu "membuat catatan pribadi lebih cepat" dan menambahkan disclaimer penggunaan yang bertanggung jawab.*

# 3\. Target Pengguna & Persona

## Persona utama: Pelajar/Mahasiswa

**Kebutuhan:** Menyalin/menulis ulang catatan, rangkuman buku, tugas resume, atau jawaban esai dalam bentuk tulisan tangan untuk dikumpulkan ke guru/dosen

**Perangkat:** Mayoritas mengakses dari smartphone (Android), sebagian dari laptop saat mengerjakan tugas besar

**Titik sakit (pain point):** Waktu terbatas, tugas menumpuk dari banyak mata pelajaran, tulisan tangan asli lambat dan bikin pegal, hasil generator font online yang ada terlihat terlalu "robotic"

**Ekspektasi hasil:** Terlihat senatural mungkin, bisa dicetak / dikumpulkan dalam bentuk file foto atau PDF halaman bertekstur kertas

# 4\. Use Case (Skenario Penggunaan)

Berikut skenario yang harus tercakup agar produk benar-benar lengkap dari sisi kebutuhan:

## 4.1 Konversi teks polos

* PDF berisi esai/artikel/rangkuman teks murni → dikonversi apa adanya menjadi halaman tulisan tangan, mempertahankan urutan paragraf.

## 4.2 PDF dengan struktur (heading, poin-poin, penomoran)

* Sistem mendeteksi heading/sub-heading dan list agar hasil tulisan tangan tetap punya hierarki visual (judul ditulis lebih besar/tebal, poin-poin diberi bullet/nomor manual bergaya tulisan tangan).

## 4.3 PDF hasil scan / berbasis gambar (tidak ada teks yang bisa diselect)

* Sistem menjalankan OCR terlebih dahulu untuk mengekstrak teks sebelum diproses ke tahap simulasi tulisan tangan; jika OCR gagal/kualitas rendah, user diberi opsi edit teks manual sebelum lanjut.

## 4.4 PDF dengan elemen non-teks (gambar, tabel, rumus matematika/kimia)

* Gambar & tabel: disisipkan apa adanya (di-crop dari PDF asli) ke posisi yang sesuai di halaman hasil, dikelilingi teks tulisan tangan.

* Rumus matematika/kimia (mis. dari LaTeX/simbol khusus): opsi untuk dirender sebagai "tulisan tangan rumus" sederhana (karakter dasar \+−×÷=√π dst mengikuti gaya huruf) atau tetap sebagai cetakan gambar kecil bila terlalu kompleks.

## 4.5 Dokumen multi-halaman panjang (\>10 halaman)

* Proses harus tetap responsif (progress indicator per halaman), dengan opsi apakah tiap halaman PDF sumber dipetakan 1:1 ke satu halaman tulisan tangan, atau reflow otomatis (karena tulisan tangan makan tempat lebih banyak dari cetakan).

## 4.6 Personalisasi gaya tulisan

* User memilih dari galeri gaya tulisan tangan bawaan (rapi, agak berantakan, miring ke kanan/kiri, huruf sambung, huruf cetak/balok).

* User meng-upload sampel tulisan tangannya sendiri (foto beberapa kata di kertas) untuk digenerate menjadi "font" personal — fitur advanced.

## 4.7 Kustomisasi kertas & alat tulis

* Pilihan kertas: bergaris (folio/buku tulis), kotak-kotak (matematika), HVS polos, kertas lubang binder.

* Pilihan alat tulis: pulpen biru/hitam, pensil (dengan efek smudge ringan), spidol/board marker.

## 4.8 Simulasi ketidaksempurnaan manusiawi

* Variasi tekanan pena antar goresan, sesekali huruf dicoret dan ditulis ulang di sebelahnya (efek typo yang dibetulkan), noda tinta kecil, garis bantu pensil yang belum terhapus sempurna — semua sebagai opsi toggle intensitas (rendah/sedang/tinggi).

## 4.9 Preview & revisi sebelum ekspor

* User dapat melihat pratinjau tiap halaman, mengedit ulang teks per baris jika hasil ekstraksi/OCR kurang tepat, mengatur ulang layout, sebelum final export.

## 4.10 Ekspor & penggunaan hasil

* Ekspor sebagai gambar per halaman (JPG/PNG), gabungan PDF multi-halaman, atau ZIP berisi semua gambar — sesuai kebutuhan (upload ke portal tugas online vs dicetak fisik).

## 4.11 Penggunaan offline / koneksi terbatas

* Sebagai PWA, proses inti (ekstraksi teks yang sudah berupa teks \+ rendering canvas) dapat berjalan sepenuhnya di perangkat tanpa koneksi internet setelah aplikasi pertama kali dimuat; OCR untuk PDF hasil scan dapat berjalan on-device (WASM) atau membutuhkan koneksi bila memakai layanan cloud.

## 4.12 Riwayat & manajemen proyek

* User (opsional login) dapat menyimpan riwayat dokumen yang pernah dikonversi untuk diunduh ulang atau diedit kembali tanpa upload ulang PDF.

# 5\. Fitur Produk

## 5.1 Fitur Inti (MVP — wajib ada)

| Fitur | Deskripsi |
| :---- | :---- |
| Upload PDF | Upload file PDF via drag-drop atau file picker, termasuk dari kamera/scan HP |
| Ekstraksi teks | Parsing teks & struktur dasar (paragraf, heading, list) dari PDF berbasis teks |
| Pilihan gaya tulisan | Minimal 4–6 preset gaya handwriting berbeda |
| Pilihan kertas | Minimal 3 jenis kertas (garis, kotak, polos) |
| Mesin simulasi human-like | Jitter posisi/rotasi/ukuran per karakter, baseline bergelombang, variasi ketebalan tinta |
| Preview real-time | Pratinjau hasil sebelum diekspor, per halaman |
| Edit teks pra-render | User bisa mengoreksi teks hasil ekstraksi sebelum di-render |
| Ekspor JPG/PNG | Unduh tiap halaman sebagai gambar |
| Ekspor PDF gabungan | Gabungkan seluruh halaman jadi satu file PDF |
| PWA dasar | Installable, manifest, ikon, splash screen, responsif mobile-first |

## 5.2 Fitur Lanjutan (V1)

| Fitur | Deskripsi |
| :---- | :---- |
| OCR untuk PDF scan/gambar | Ekstraksi teks dari PDF hasil scan menggunakan OCR on-device (mis. Tesseract.js WASM) |
| Penyisipan gambar/tabel dari PDF asli | Deteksi & crop elemen non-teks, ditempatkan otomatis di layout hasil |
| Reflow otomatis multi-halaman | Hitung ulang jumlah halaman tulisan tangan berdasarkan kepadatan tulisan & ukuran huruf |
| Kustomisasi lanjutan | Warna tinta, ukuran huruf, kerapatan baris, margin, kemiringan dasar tulisan |
| Intensitas ketidaksempurnaan | Slider rendah/sedang/tinggi untuk efek coretan, noda, dan variasi tekanan |
| Efek "hasil foto" | Overlay bayangan, sedikit rotasi halaman, noise, vignette, agar terlihat seperti difoto, bukan di-scan sempurna |
| Riwayat proyek (akun opsional) | Simpan & kelola histori konversi (local-first via IndexedDB, sinkron opsional bila login) |
| Mode offline penuh | Service worker \+ cache aset (font, tekstur kertas) agar seluruh alur inti berjalan tanpa internet |

## 5.3 Fitur Premium/Masa Depan (V2 — opsional, dasar dari roadmap monetisasi)

| Fitur | Deskripsi |
| :---- | :---- |
| Font tulisan tangan personal | User upload sampel tulisan sendiri → generate "font" custom yang meniru gaya huruf mereka |
| Render rumus matematika/kimia bergaya tangan | Dukungan notasi khusus (pecahan, akar, superscript/subscript) dalam gaya tulisan tangan |
| Kolaborasi/berbagi template kertas | User dapat mengunggah foto kertas nyata (misal buku tulis sekolahnya) sebagai template latar |
| Batch processing | Upload banyak PDF sekaligus, diproses dalam antrian |
| Watermark-free & kuota tanpa batas | Model freemium: gratis dengan watermark/batas halaman, berbayar untuk full akses |

# 6\. Arsitektur Teknis

Prinsip desain: proses inti dijalankan client-side (di browser) sebanyak mungkin — untuk kecepatan, privasi (dokumen tidak perlu diunggah ke server), dan efisiensi biaya hosting. Backend hanya diperlukan untuk fitur yang butuh persistensi lintas perangkat (akun, riwayat tersinkron) atau pemrosesan berat (font generation dari sampel tulisan).

## 6.1 Frontend / PWA

* Framework: Next.js 15 (App Router) \+ TypeScript \+ Tailwind CSS — sesuai stack yang sudah dikuasai.

* PWA: next-pwa atau Workbox manual untuk service worker, manifest.json, caching strategy (cache-first untuk aset statis/font/tekstur, network-first untuk data dinamis).

* Parsing PDF: pdf.js (Mozilla) untuk ekstraksi teks \+ posisi, berjalan di Web Worker agar tidak memblokir UI.

* OCR (opsional/V1): Tesseract.js (WASM) berjalan di Web Worker untuk PDF hasil scan.

* Rendering simulasi tulisan tangan: HTML5 Canvas API — setiap karakter digambar satu per satu dengan transformasi acak (lihat bagian 7).

* Export gambar: canvas.toBlob() untuk JPG/PNG; jsPDF atau pdf-lib untuk menggabungkan menjadi PDF.

* Penyimpanan lokal: IndexedDB (via idb-keyval/Dexie.js) untuk riwayat proyek & cache dokumen, tanpa perlu backend untuk MVP.

## 6.2 Backend (opsional, untuk fitur akun & font generation)

* API: Next.js Route Handlers atau Laravel terpisah (sesuai preferensi & rencana skala) untuk autentikasi, penyimpanan riwayat lintas perangkat, dan endpoint generate-font-dari-sampel.

* Database: MySQL/PostgreSQL untuk data user & metadata proyek (bukan menyimpan isi dokumen mentah demi privasi — cukup metadata \+ hasil akhir bila user memilih simpan).

* Storage: object storage (mis. Cloudflare R2/S3-compatible) untuk font hasil generate & template kertas custom.

* Font generation dari sampel tulisan: proses ini berat (image processing \+ vectorization huruf per huruf), cocok dijalankan sebagai job asynchronous di backend, bukan di browser.

## 6.3 Diagram Alur Data (ringkas)

PDF diunggah → di-parse di browser (pdf.js) → jika perlu OCR, dijalankan di Web Worker → teks & elemen non-teks diekstrak → user mengedit/menyetujui di layar preview → mesin rendering canvas menggambar tiap halaman dengan gaya & kertas terpilih → hasil dirender ke gambar → digabung jadi PDF bila diminta → diunduh langsung dari browser (tanpa perlu round-trip ke server untuk kasus umum).

# 7\. Mesin Simulasi Tulisan Tangan (Detail Algoritma)

Bagian ini adalah inti pembeda produk — target: hasil tidak terlihat seperti "font diketik", melainkan seperti digoreskan tangan.

## 7.1 Sumber bentuk huruf

* Preset: font handwriting berkualitas (mis. dari Google Fonts kategori Handwriting: Caveat, Kalam, Shadows Into Light, Homemade Apple, Patrick Hand, dsb) sebagai basis bentuk huruf.

* Custom (V2): huruf hasil vektorisasi dari sampel tulisan user sendiri, disimpan sebagai set glyph per karakter.

## 7.2 Variasi per karakter (jitter)

* Rotasi acak kecil per huruf, kira-kira \-4° sampai \+4°, dengan distribusi tidak seragam antar huruf berdekatan.

* Pergeseran vertikal (baseline jitter) beberapa piksel naik-turun per huruf, mengikuti fungsi noise (mis. Perlin/simplex noise) agar polanya organik, bukan acak murni yang terlihat "berisik".

* Variasi ukuran font antar huruf, kira-kira ±5–8%.

* Variasi spasi antar huruf dan antar kata, tidak seragam seperti kerning font digital.

## 7.3 Simulasi alat tulis

* Ketebalan garis (stroke width) bervariasi sepanjang goresan huruf, meniru tekanan pena yang naik-turun.

* Opacity tinta sedikit bervariasi antar goresan untuk efek pena yang mulai kehabisan tinta / tekanan tangan tidak konsisten.

* Mode pensil: tambahkan noise abu-abu halus di sekitar goresan untuk efek smudge grafit.

## 7.4 Ketidaksempurnaan manusiawi (opsional, sesuai slider intensitas)

* Sesekali (probabilitas kecil, dapat diatur) satu kata dicoret tipis dan ditulis ulang di sebelahnya — efek koreksi tulisan tangan asli.

* Baseline per baris sedikit melengkung/miring naik-turun, bukan lurus sempurna seperti garis buku.

* Noda tinta kecil acak di beberapa titik halaman (jumlah dan intensitas dapat diatur dari nol).

## 7.5 Efek tekstur kertas & "hasil foto"

* Overlay tekstur kertas (noise halus, serat kertas) di bawah layer tulisan.

* Gradient bayangan ringan dari salah satu sisi halaman untuk mensimulasikan pencahayaan foto, bukan hasil scan datar sempurna.

* Rotasi keseluruhan halaman 1–2° dan sedikit perspektif ringan (opsional) agar terlihat seperti difoto dari atas dengan tangan, bukan didokumenkan dengan scanner.

* Vignette halus di tepi gambar dan sedikit blur (\~0.3–0.5px) untuk menghindari kesan tulisan "terlalu tajam/vektor".

## 7.6 Performa

* Rendering per halaman dilakukan di Web Worker/OffscreenCanvas agar UI tetap responsif, dengan progress bar per halaman untuk dokumen panjang.

# 8\. Alur Pengguna (User Flow)

* 1\. Landing page → tombol "Mulai Konversi" / "Upload PDF".

* 2\. Halaman upload → drag-drop atau pilih file PDF (atau ambil foto langsung dari kamera HP untuk versi mobile).

* 3\. Sistem memproses: ekstraksi teks (+ OCR bila perlu) → tampilkan preview teks yang terdeteksi, user dapat mengedit.

* 4\. Halaman kustomisasi: pilih gaya tulisan, jenis kertas, alat tulis, warna tinta, intensitas ketidaksempurnaan — dengan preview langsung 1 halaman contoh.

* 5\. Klik "Generate" → proses rendering seluruh halaman dengan progress indicator.

* 6\. Halaman preview hasil per halaman → user bisa scroll/swipe cek tiap halaman, regenerate halaman tertentu bila kurang puas.

* 7\. Ekspor: pilih format (gambar per halaman / PDF gabungan / ZIP) → unduh.

* 8\. (Opsional) simpan ke riwayat untuk diakses/di-edit kembali nanti.

# 9\. Kebutuhan Non-Fungsional

| Aspek | Target |
| :---- | :---- |
| Performa | Rendering 1 halaman A4 penuh teks selesai \< 2 detik di perangkat mid-range; dokumen 20 halaman \< 30 detik total |
| Kompatibilitas | Berjalan baik di Chrome/Safari mobile & desktop; installable sebagai PWA di Android & desktop, add-to-homescreen di iOS |
| Privasi | Dokumen tidak diunggah ke server pada alur default (diproses di browser); bila fitur akun/riwayat cloud dipakai, jelaskan secara eksplisit ke user |
| Aksesibilitas | UI kontrol (bukan hasil tulisan tangan) tetap mengikuti standar kontras & ukuran tap-target yang layak untuk mobile |
| Offline | Setelah pemuatan pertama, alur inti (upload PDF teks → kustomisasi → render → ekspor) berfungsi tanpa koneksi internet |
| Skalabilitas biaya | Karena pemrosesan di client, biaya server tetap rendah meski trafik naik — kecuali untuk fitur OCR cloud/font generation yang dibuat opsional |

# 10\. Roadmap Pengembangan

## MVP (Fase 1\)

* Upload PDF berbasis teks, ekstraksi dasar, 4–6 gaya tulisan, 3 jenis kertas, mesin jitter dasar, preview, ekspor JPG & PDF, PWA installable.

## V1 (Fase 2\)

* OCR untuk PDF scan, penyisipan gambar/tabel dari PDF asli, kustomisasi lanjutan (warna tinta, ukuran, margin), efek hasil foto, riwayat lokal via IndexedDB, mode offline penuh.

## V2 (Fase 3 — opsional/monetisasi)

* Font tulisan tangan personal dari sampel user, dukungan rumus matematika/kimia, akun & sinkronisasi cloud, model freemium (kuota halaman gratis \+ watermark, berbayar untuk unlimited).

# 11\. Risiko & Pertimbangan

* Penyalahgunaan akademik: produk berpotensi dipakai untuk mengelabui guru/dosen bahwa tugas ditulis manual. Mitigasi: positioning sebagai "alat bantu membuat catatan pribadi lebih cepat", tambahkan halaman kebijakan penggunaan wajar, hindari klaim pemasaran yang eksplisit menargetkan "kecurangan tugas".

* Akurasi OCR: PDF scan kualitas rendah bisa menghasilkan teks salah baca; wajib ada tahap koreksi manual sebelum render final.

* Kompleksitas elemen non-teks: tabel/rumus rumit sulit di-otomatisasi sepenuhnya; MVP bisa membatasi pada penyisipan gambar apa adanya dahulu.

* Performa di perangkat rendah: rendering canvas intensif untuk dokumen panjang; perlu Web Worker & progress feedback agar tidak terasa hang, terutama di HP entry-level yang jadi mayoritas target pengguna.

* Font generation dari sampel tulisan (V2) adalah fitur berat secara teknis (image processing \+ vectorization) — sebaiknya divalidasi sebagai eksperimen terpisah sebelum dijanjikan ke roadmap utama.

# 12\. Rekomendasi Tech Stack Ringkas

| Layer | Pilihan |
| :---- | :---- |
| Framework | Next.js 15 (App Router) \+ TypeScript |
| Styling | Tailwind CSS |
| PDF parsing | pdf.js |
| OCR (V1) | Tesseract.js (WASM, on-device) |
| Rendering | HTML5 Canvas API (+ OffscreenCanvas/Web Worker) |
| Noise/jitter | simplex-noise (npm) untuk pola acak organik |
| Export gambar → PDF | jsPDF atau pdf-lib |
| Penyimpanan lokal | IndexedDB via Dexie.js / idb-keyval |
| PWA | next-pwa / Workbox (manifest \+ service worker) |
| Backend opsional (V2) | Next.js Route Handlers atau Laravel API \+ MySQL |
| Storage cloud opsional | Cloudflare R2 (S3-compatible) |
| Deployment | Vercel |

# 13\. Langkah Selanjutnya

* Validasi teknis kecil: buat prototipe mesin rendering canvas (bagian 7\) sebagai proof-of-concept terpisah sebelum membangun keseluruhan alur PDF → agar risiko terbesar (kualitas visual hasil) tervalidasi lebih dulu.

* Setelah PoC rendering meyakinkan, lanjut ke pembangunan MVP sesuai roadmap Fase 1\.

* Dokumen ini dapat dijadikan input langsung untuk breakdown ke SRS/SDD teknis (mis. via Antigravity) sebelum mulai coding.