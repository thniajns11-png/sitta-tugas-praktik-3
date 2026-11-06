// SITTA — tracking-app.js
// Vue 3 app untuk halaman Tracking Delivery Order

const { createApp } = Vue;

createApp({
  data() {
    return {
      // --- Master Data ---
      pengirimanList: [...pengirimanList],
      paketList:      [...paketList],
      stokList:       [...stokList],

      // --- Tracking Storage: seed dengan data contoh ---
      trackingMap: { ...trackingData },

      // --- Tab aktif: 'buat' | 'cari' ---
      activeTab: 'buat',

      // --- Form Buat DO ---
      form: {
        nim:          '',
        nama:         '',
        ekspedisi:    '',
        paketKode:    '',
        tanggalKirim: '',
        totalHarga:   0,
      },
      formErrors: {},

      // --- Tracking search ---
      searchNomorDO: '',
      searchResult:  null,
      searchNotFound: false,

      // --- Toast ---
      toasts: [],

      // --- Watcher state ---
      lastPaketKode: '',
    };
  },

  computed: {
    // ── Nomor DO otomatis ─────────────────────────────────
    // Format: DO{YYYY}-{3 digit urut}, contoh: DO2025-001
    nextNomorDO() {
      const year   = new Date().getFullYear();
      const prefix = `DO${year}-`;
      const existing = Object.keys(this.trackingMap)
        .filter(k => k.startsWith(prefix))
        .map(k => parseInt(k.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
      const seq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return `${prefix}${String(seq).padStart(3, '0')}`;
    },

    // ── Paket terpilih ────────────────────────────────────
    selectedPaket() {
      if (!this.form.paketKode) return null;
      return this.paketList.find(p => p.kode === this.form.paketKode) || null;
    },

    // ── Detail isi paket (nama bahan ajar) ────────────────
    paketIsiDetail() {
      if (!this.selectedPaket) return [];
      return this.selectedPaket.isi.map(kodeMK => {
        const item = this.stokList.find(s => s.kode === kodeMK);
        return item
          ? { kode: kodeMK, judul: item.judul, harga: item.harga }
          : { kode: kodeMK, judul: '(data tidak tersedia)', harga: 0 };
      });
    },

    // ── Daftar DO untuk ditampilkan di riwayat ───────────
    allDoList() {
      return Object.entries(this.trackingMap)
        .map(([nomorDO, data]) => ({ nomorDO, ...data }))
        .sort((a, b) => b.nomorDO.localeCompare(a.nomorDO));
    },

    // ── Label ekspedisi terpilih ──────────────────────────
    selectedEkspedisiNama() {
      if (!this.form.ekspedisi) return '—';
      const found = this.pengirimanList.find(p => p.kode === this.form.ekspedisi);
      return found ? found.nama : '—';
    },
  },

  watch: {
    // WATCHER 1: Sinkronkan totalHarga saat paket berubah
    // Ini adalah watcher bermakna: mencegah pengguna mengetik harga sendiri
    'form.paketKode'(newKode) {
      if (newKode !== this.lastPaketKode) {
        this.lastPaketKode = newKode;
        const paket = this.paketList.find(p => p.kode === newKode);
        this.form.totalHarga = paket ? paket.harga : 0;
        // Hapus error paket jika sudah dipilih
        if (newKode && this.formErrors.paketKode) {
          const errs = { ...this.formErrors };
          delete errs.paketKode;
          this.formErrors = errs;
        }
      }
    },
  },

  methods: {
    // ── Format ───────────────────────────────────────────
    formatRupiah(val) {
      if (!val && val !== 0) return '—';
      return 'Rp ' + Number(val).toLocaleString('id-ID');
    },

    formatTanggal(str) {
      if (!str) return '—';
      // Input date (YYYY-MM-DD) perlu diparsing sebagai local time
      const parts = str.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d)) {
          return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
      return str;
    },

    // ── Tab ───────────────────────────────────────────────
    setTab(tab) {
      this.activeTab = tab;
    },

    // ── Set tanggal hari ini ──────────────────────────────
    setTodayDate() {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      this.form.tanggalKirim = `${y}-${m}-${d}`;
    },

    // ── Reset form bersih ─────────────────────────────────
    clearForm() {
      this.form.nim          = '';
      this.form.nama         = '';
      this.form.ekspedisi    = '';
      this.form.paketKode    = '';
      this.form.tanggalKirim = '';
      this.form.totalHarga   = 0;
      this.formErrors        = {};
      this.lastPaketKode     = '';
      this.setTodayDate();
    },

    // ── Validasi Form ─────────────────────────────────────
    validateForm() {
      const e = {};
      const nim = (this.form.nim || '').trim();
      if (!nim)                         e.nim          = 'NIM wajib diisi.';
      else if (!/^\d{6,12}$/.test(nim)) e.nim          = 'NIM harus 6–12 digit angka.';
      if (!(this.form.nama || '').trim())  e.nama        = 'Nama wajib diisi.';
      if (!this.form.ekspedisi)            e.ekspedisi   = 'Pilih layanan ekspedisi.';
      if (!this.form.paketKode)            e.paketKode   = 'Pilih paket bahan ajar.';
      if (!this.form.tanggalKirim)         e.tanggalKirim = 'Tanggal kirim wajib diisi.';
      return e;
    },

    // ── Submit DO Baru ────────────────────────────────────
    submitDO() {
      this.formErrors = this.validateForm();
      if (Object.keys(this.formErrors).length > 0) return;

      const nomorDO = this.nextNomorDO;
      // Simpan label ekspedisi yang sudah dikonversi, bukan kode mentah
      const ekspedisiLabel = this.pengirimanList.find(p => p.kode === this.form.ekspedisi)?.nama
                             || this.form.ekspedisi;

      // Waktu kirim dalam format "YYYY-MM-DD HH:MM:SS"
      const now = new Date();
      const waktuKirim = `${this.form.tanggalKirim} `
        + `${String(now.getHours()).padStart(2,'0')}:`
        + `${String(now.getMinutes()).padStart(2,'0')}:`
        + `${String(now.getSeconds()).padStart(2,'0')}`;

      // Tambahkan ke trackingMap (objek baru agar Vue mendeteksi perubahan)
      this.trackingMap = {
        ...this.trackingMap,
        [nomorDO]: {
          nim:          this.form.nim.trim(),
          nama:         this.form.nama.trim(),
          status:       'Menunggu Pickup',
          ekspedisi:    ekspedisiLabel,
          tanggalKirim: this.form.tanggalKirim,
          paket:        this.form.paketKode,
          total:        this.form.totalHarga,
          perjalanan: [
            { waktu: waktuKirim, keterangan: 'DO dibuat dan menunggu pickup oleh kurir.' }
          ]
        }
      };

      this.showToast(`DO ${nomorDO} berhasil dibuat.`, 'success');

      // Simpan nomor DO yang baru dibuat sebelum form direset
      const createdDO = nomorDO;

      // Reset form
      this.clearForm();

      // Pindah ke tab cari dan langsung tampilkan hasil
      this.searchNomorDO = createdDO;
      this.doSearch();
      this.activeTab = 'cari';
    },

    // ── Tracking Search ───────────────────────────────────
    doSearch() {
      const key = (this.searchNomorDO || '').trim().toUpperCase();
      if (!key) {
        this.searchResult   = null;
        this.searchNotFound = false;
        return;
      }
      const data = this.trackingMap[key];
      if (data) {
        const paket = this.paketList.find(p => p.kode === data.paket);
        this.searchResult = {
          nomorDO: key,
          ...data,
          paketNama: paket ? paket.nama : data.paket,
          paketIsi:  paket
            ? paket.isi.map(kodeMK => {
                const item = this.stokList.find(s => s.kode === kodeMK);
                return item ? item.judul : kodeMK;
              })
            : [],
        };
        this.searchNotFound = false;
      } else {
        this.searchResult   = null;
        this.searchNotFound = true;
      }
    },

    clearSearch() {
      this.searchNomorDO  = '';
      this.searchResult   = null;
      this.searchNotFound = false;
    },

    // ── Status badge ──────────────────────────────────────
    statusClass(status) {
      if (!status) return '';
      const s = status.toLowerCase();
      if (s.includes('selesai') || s.includes('terkirim')) return 'badge-ok';
      if (s.includes('dalam perjalanan') || s.includes('diteruskan')) return 'badge-warn';
      if (s.includes('pickup') || s.includes('menunggu')) return 'badge-muted';
      return '';
    },

    // ── Toast ─────────────────────────────────────────────
    showToast(message, type = 'success') {
      const id = Date.now();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 3500);
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },
  },

  mounted() {
    // Set tanggal hari ini sebagai default
    this.setTodayDate();
  },
}).mount('#app');
