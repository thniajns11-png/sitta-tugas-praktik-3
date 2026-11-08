# SITTA — Sistem Informasi Tiras dan Transaksi Bahan Ajar Universitas Terbuka

SITTA adalah aplikasi web untuk pengelolaan inventaris bahan ajar dan transaksi Delivery Order (DO) Universitas Terbuka. Aplikasi dibangun menggunakan Vue.js 2 dengan pendekatan Vue Component dan Vue Template untuk menghadirkan antarmuka interaktif berbasis Single Page Application (SPA).

Proyek ini dikembangkan sebagai implementasi **STSI4209 Tugas Praktik 3**.

**Repository:** https://github.com/thniajns11-png/sitta-tugas-praktik-3

---

## Fitur Utama

### A. Stok Bahan Ajar

- Menampilkan inventaris bahan ajar dari sumber data JSON.
- Ringkasan jumlah item, stok aman, stok menipis, dan stok kosong.
- Filter berdasarkan UT-Daerah (UPBJJ) dan kategori mata kuliah.
- Filter kebutuhan reorder dan stok kosong.
- Sorting berdasarkan judul, jumlah stok, dan harga.
- Tambah, edit, dan hapus bahan ajar.
- Indikator status **Aman**, **Menipis**, dan **Kosong** berdasarkan batas safety stock.
- Preview catatan HTML pada status stok.

### B. Tracking Delivery Order

- Pencarian Delivery Order berdasarkan nomor DO atau NIM mahasiswa.
- Menampilkan detail mahasiswa dan informasi pengiriman.
- Menampilkan informasi paket bahan ajar yang dipesan.
- Timeline perjalanan pengiriman.
- Penambahan catatan progress perjalanan dengan timestamp lokal.
- Menangani kondisi DO tanpa riwayat perjalanan (empty state).

### C. Pemesanan Delivery Order

- Formulir pembuatan Delivery Order baru.
- Nomor DO terbentuk otomatis dengan format `DO{tahun}-{sequence tiga digit}`, contoh: `DO2026-001`.
- Validasi NIM (6–12 digit angka) dan seluruh input wajib.
- Pilihan layanan ekspedisi (REG / EXP).
- Pilihan paket bahan ajar beserta preview isi paket.
- Perhitungan total biaya dilakukan secara otomatis sesuai paket yang dipilih.
- DO baru langsung terintegrasi ke modul Tracking tanpa perlu memuat ulang halaman.

---

## Teknologi

| Teknologi | Versi / Keterangan |
|-----------|--------------------|
| HTML5 | Struktur halaman |
| CSS3 | Styling antarmuka |
| JavaScript (ES5/ES6) | Logika aplikasi |
| Vue.js 2 | 2.7.16 — Global Build (file lokal) |
| JSON | Sumber data dummy |
| Python HTTP Server | Server statis untuk pengembangan lokal (opsional) |

> **Catatan:** Proyek ini menggunakan **Vue 2 Global Build**, bukan Vue 3. File Vue dimuat dari `js/vue.js` yang merupakan distribusi lokal, bukan via CDN atau bundler.
>
> Proyek **tidak memerlukan bundler (Webpack, Vite) maupun proses build npm** untuk menjalankan versi saat ini.

---

## Struktur Folder

```text
sitta/
├── assets/
│   └── css/
│       └── style.css          # Stylesheet utama SPA
├── css/
│   └── style.css              # Stylesheet legacy (MPA lama)
├── data/
│   └── dataBahanAjar.json     # Sumber data dummy aplikasi
├── js/
│   ├── components/
│   │   ├── app-modal.js       # Komponen modal konfirmasi global
│   │   ├── do-tracking.js     # Komponen modul Tracking DO
│   │   ├── order-form.js      # Komponen formulir Pemesanan DO
│   │   ├── status-badge.js    # Komponen badge status stok
│   │   └── stock-table.js     # Komponen tabel Stok Bahan Ajar
│   ├── services/
│   │   └── api.js             # Service pengambilan & normalisasi data JSON
│   ├── app.js                 # Root controller & bootstrap SPA
│   ├── vue.js                 # Distribusi lokal Vue.js 2.7.16
│   ├── dataBahanAjar.js       # Script data legacy (MPA lama)
│   ├── stok-app.js            # Script legacy modul Stok (MPA lama)
│   └── tracking-app.js        # Script legacy modul Tracking (MPA lama)
├── reference/
│   ├── dataBahanAjar.json     # Data referensi tugas (read-only)
│   └── STSI4209 Soal Tugas 3.pdf
├── templates/
│   ├── app-modal.html         # Template HTML komponen modal
│   ├── do-tracking.html       # Template HTML komponen Tracking
│   ├── order-form.html        # Template HTML komponen Pemesanan
│   ├── status-badge.html      # Template HTML badge status
│   └── stock-table.html       # Template HTML tabel Stok
├── index.html                 # Entry point SPA utama
├── stok.html                  # Halaman legacy modul Stok (MPA lama)
├── tracking.html              # Halaman legacy modul Tracking (MPA lama)
└── README.md
```

**Keterangan folder:**

| Folder / File | Fungsi |
|---------------|--------|
| `index.html` | Entry point SPA; memuat Vue, API service, dan app.js. |
| `assets/css/style.css` | Stylesheet utama yang digunakan oleh SPA. |
| `js/app.js` | Root controller: bootstrap, registrasi komponen, mount Vue, dan event handler. |
| `js/components/` | Komponen Vue 2 yang terdaftar secara global. |
| `templates/` | Template HTML terpisah yang dimuat asinkron oleh `app.js`. |
| `js/services/api.js` | Mengambil dan menormalisasi data dari `dataBahanAjar.json`; menyediakan data cadangan (fallback). |
| `js/vue.js` | Distribusi lokal Vue.js 2.7.16. |
| `data/` | Menyediakan sumber data JSON aplikasi. |
| `reference/` | Dokumen soal dan data referensi tugas (tidak dimodifikasi). |
| `stok.html`, `tracking.html`, dan skrip terkait | File legacy dari implementasi Multi-Page Application (MPA) sebelumnya; dipertahankan untuk referensi. |

---

## Cara Menjalankan Aplikasi

### Persyaratan

- Browser modern (Google Chrome, Firefox, Edge).
- Python 3 atau HTTP server statis lainnya.
- Tidak diperlukan instalasi `npm` atau proses build apa pun.

> **Penting:** Aplikasi harus dijalankan melalui HTTP server lokal, **bukan** dengan membuka file HTML secara langsung (`file://`). Hal ini karena aplikasi memuat template HTML dan data JSON menggunakan `fetch()`, yang akan diblokir oleh browser pada protokol `file://`.

---

### Langkah 1 — Clone repository

```bash
git clone https://github.com/thniajns11-png/sitta-tugas-praktik-3.git
```

### Langkah 2 — Masuk ke folder proyek

```bash
cd sitta-tugas-praktik-3
```

### Langkah 3 — Jalankan HTTP server lokal

**Windows (PowerShell atau Command Prompt):**

```powershell
py -m http.server 5500
```

**Alternatif (jika `py` tidak dikenali):**

```bash
python -m http.server 5500
```

### Langkah 4 — Buka aplikasi di browser

```
http://localhost:5500/index.html
```

### Langkah 5 — Menghentikan server

Tekan `Ctrl + C` pada terminal yang menjalankan server.

---

## Arsitektur Aplikasi

### Alur Bootstrap SPA

```
index.html
  └── Memuat js/vue.js         → Vue 2.7.16 tersedia di window.Vue
  └── Memuat js/services/api.js → window.apiService tersedia
  └── Memuat js/app.js
        ├── 1. Validasi dependensi (Vue & apiService)
        ├── 2. Fetch lima template eksternal via HTTP dan injeksikan ke DOM
        ├── 3. Muat lima skrip komponen secara berurutan
        ├── 4. Daftarkan global Vue filters (rupiah, satuanBuah, formatTanggal)
        └── 5. Mount root Vue pada #app → loadInitialData() dipanggil
```

### Navigasi SPA

Aplikasi memiliki tiga tampilan utama yang berpindah tanpa reload halaman:

| Tab | Komponen |
|-----|----------|
| Stok Bahan Ajar | `<ba-stock-table>` |
| Tracking DO | `<do-tracking>` |
| Pemesanan DO | `<order-form>` |

### Komunikasi Antar-Komponen

Komponen anak mengirim data ke root Vue melalui event (child → parent):

| Event | Pengirim | Penerima | Fungsi |
|-------|----------|----------|--------|
| `update-stock` | `ba-stock-table` | Root Vue | Memperbarui daftar stok |
| `created` | `order-form` | Root Vue | Menambahkan DO baru ke tracking |
| `add-progress` | `do-tracking` | Root Vue | Menambahkan riwayat perjalanan DO |
| `toast` | Semua komponen | Root Vue | Menampilkan notifikasi toast |

Root Vue mengelola seluruh state aplikasi (`stokList`, `tracking`, `paketList`, dll.) dan meneruskan perubahan secara reaktif ke komponen anak melalui props.

---

## Sumber Data dan Batasan Penyimpanan

> **Penting untuk dipahami:**

- Data awal aplikasi berasal dari file `data/dataBahanAjar.json`.
- File JSON ini merupakan **data dummy**, bukan database yang sesungguhnya.
- Operasi tambah, edit, hapus stok serta pembuatan DO berjalan pada **state aplikasi di memori browser**.
- Perubahan tersebut **tidak tersimpan secara permanen**.
- Memuat ulang halaman (refresh) akan mengembalikan data ke kondisi awal dari file JSON.
- Aplikasi saat ini **belum menggunakan backend atau database permanen**.

---

## Pengujian Aplikasi

Pengujian dilakukan secara **manual melalui browser lokal** dan beberapa fungsi logis diuji menggunakan **Node.js harness terisolasi** (tidak tersimpan di dalam repository).

Fungsi yang telah diuji:

| Area | Fungsi yang Diuji |
|------|--------------------|
| Pemuatan SPA | Bootstrap, fetch template, registrasi komponen, mount Vue |
| Stok | Filter (UT-Daerah, kategori, reorder, kosong), sorting, reset |
| Stok | Tambah, edit, dan hapus bahan ajar |
| Tracking | Pencarian berdasarkan nomor DO dan NIM (case-insensitive) |
| Tracking | Penambahan catatan progress perjalanan DO |
| Pemesanan | Validasi input wajib dan format NIM |
| Pemesanan | Pembuatan DO baru dengan nomor otomatis |
| Integrasi | DO baru langsung tersedia di Tracking tanpa reload |
| Isolasi | Progress satu DO tidak memengaruhi DO lain |
| Notifikasi | Modal konfirmasi dan toast notification (success/error) |

> Pengujian responsivitas pada perangkat seluler belum dilakukan secara menyeluruh.
> Tidak terdapat automated test suite yang tersimpan di dalam repository.

---

## Catatan Pengembangan

- Aplikasi menggunakan **Vue 2 dengan registrasi komponen secara global** (`Vue.component(...)`).
- Vue.js dimuat dari file lokal (`js/vue.js`) tanpa CDN.
- Template HTML disimpan terpisah di folder `templates/` dan dimuat secara asinkron oleh `app.js`.
- Data masih berupa JSON dummy; belum ada mekanisme penyimpanan permanen.
- Pengembangan backend dan integrasi database permanen dapat menjadi pengembangan berikutnya, namun bukan bagian dari implementasi saat ini.

---

*SITTA — STSI4209 Tugas Praktik 3 · Universitas Terbuka*

