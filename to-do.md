Kita akan mengembangkan proyek SITTA (Sistem Informasi Tiras dan Transaksi Bahan Ajar Universitas Terbuka) untuk memenuhi STSI4209 Tugas Praktik 3.

Saya sudah menyalin proyek Tugas Praktik 2 ke workspace ini. Proyek lama harus tetap aman dan tidak boleh disentuh.

Baca dan analisis tiga sumber berikut:
1. Seluruh source code proyek yang sedang terbuka di workspace.
2. `reference/STSI4209 Soal Tugas 3.pdf` sebagai spesifikasi utama.
3. `reference/dataBahanAjar.json` sebagai sumber dummy data.

**ATURAN MUTLAK: INI HANYA TAHAP AUDIT. JANGAN MELAKUKAN PERUBAHAN APA PUN PADA FILE.**

Lakukan audit dengan cakupan:

1. Identifikasi struktur folder dan fungsi setiap file.
2. Identifikasi versi Vue.js yang digunakan, termasuk cara inisialisasi aplikasinya.
3. Evaluasi apakah arsitektur saat ini kompatibel dengan kebutuhan Vue Component dan Vue Template.
4. Periksa seluruh fitur stok bahan ajar yang sudah tersedia.
5. Periksa seluruh fitur tracking Delivery Order yang sudah tersedia.
6. Identifikasi kebutuhan halaman pemesanan bahan ajar.
7. Audit isi dan konsistensi data JSON, termasuk duplikasi nomor DO.
8. Analisis kebutuhan komponen:
   - stock-table
   - do-tracking
   - order-form
   - status-badge
   - app-modal
9. Analisis kebutuhan template eksternal dalam folder `templates`.
10. Bandingkan implementasi yang tersedia dengan seluruh indikator penilaian Tugas Praktik 3.
11. Identifikasi risiko teknis, khususnya ketidakcocokan API Vue, pemuatan JSON, pemuatan template, dan pengelolaan state.
12. Susun rekomendasi arsitektur akhir dan tahapan implementasi.

Format hasil audit:

A. Ringkasan kondisi proyek.
B. Struktur dan versi teknologi yang digunakan.
C. Matriks pemenuhan persyaratan tugas.
D. Daftar masalah dan risiko teknis.
E. Rekomendasi struktur folder dan arsitektur komponen.
F. Rencana implementasi bertahap.
G. Daftar pengujian yang harus dilakukan.
H. Konfirmasi bahwa tidak ada file yang dimodifikasi.

Untuk setiap temuan, cantumkan nama file dan lokasi kode yang menjadi bukti.

Jangan mengarang fitur yang belum ada. Bedakan dengan jelas antara fitur yang sudah tersedia, belum tersedia, dan belum dapat diverifikasi.

**Berhenti setelah memberikan laporan audit. Jangan membuat kode, jangan melakukan refactoring, dan jangan menjalankan perubahan otomatis. Tunggu instruksi saya berikutnya.**