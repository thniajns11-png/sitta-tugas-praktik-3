// SITTA — stok-app.js
// Vue 3 app untuk halaman Stok Bahan Ajar

const { createApp } = Vue;

// ── Sanitasi HTML Catatan (Pencegahan XSS Teruji) ──────────────────────────
// Menggunakan library DOMPurify jika tersedia di browser.
// Dilengkapi fallback kokoh berbasis DOMParser (browser) dan regex whitelist (Node/offline).
// Hanya mengizinkan tag semantik aman: em, strong, i, u, b, s, br, span tanpa atribut berbahaya.
function sanitizeHTML(input) {
  if (!input || typeof input !== 'string') return '';

  const ALLOWED_TAGS = ['em', 'strong', 'i', 'u', 'b', 's', 'br', 'span'];

  // 1. Prioritas Utama: DOMPurify (jika dimuat via CDN/library)
  if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ALLOWED_TAGS,
      ALLOWED_ATTR: [], // TIDAK mengizinkan atribut apa pun (mencegah onload, onerror, onclick, style, dsb.)
      ALLOW_DATA_ATTR: false
    });
  }

  // 2. Fallback Browser: DOMParser (jika DOMPurify gagal dimuat atau lingkungan offline)
  // Parsing berbasis DOM sejati jauh lebih aman daripada sekadar regex string
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/html');
      const upperAllowed = ALLOWED_TAGS.map(t => t.toUpperCase());

      function sanitizeNode(node) {
        const children = Array.from(node.childNodes);
        for (const child of children) {
          if (child.nodeType === 1) { // Node elemen
            const tag = child.tagName.toUpperCase();
            if (upperAllowed.includes(tag)) {
              // Hapus seluruh atribut dari elemen yang diizinkan
              while (child.attributes.length > 0) {
                child.removeAttribute(child.attributes[0].name);
              }
              sanitizeNode(child);
            } else if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'SVG'].includes(tag)) {
              // Hapus elemen berbahaya beserta isinya
              child.remove();
            } else {
              // Elemen tidak berbahaya tapi tidak diizinkan: ganti dengan teksnya saja
              sanitizeNode(child);
              const textNode = doc.createTextNode(child.textContent || '');
              child.replaceWith(textNode);
            }
          }
        }
      }

      sanitizeNode(doc.body);
      return doc.body.innerHTML;
    } catch (e) {
      // Jika terjadi kesalahan DOMParser, lanjut ke fallback regex
    }
  }

  // 3. Fallback Aman: Jika tidak ada sanitizer DOM yang dapat diandalkan (lingkungan non-DOM/Node.js)
  // Tampilkan sebagai teks biasa yang aman (escape seluruh karakter khusus HTML)
  // daripada mengandalkan regex yang rentan terhadap bypass XSS.
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

createApp({
  data() {
    return {
      // --- Master Data ---
      upbjjList: [...upbjjList],
      kategoriList: [...kategoriList],
      stok: stokList.map((item, idx) => ({
        ...item,
        id: idx + 1,
        catatanHTML: sanitizeHTML(item.catatanHTML)
      })),

      // --- Filter State ---
      searchQuery: '',
      filterUpbjj: '',
      filterKategori: '',
      filterReorder: false,
      filterKosong: false,
      sortField: '',
      sortDir: 'asc',

      // --- State Notifikasi Kritis ---
      lastReorderCount: null,
      lastKosongCount: null,

      // --- Modal: Tambah ---
      showAddModal: false,
      formAdd: {
        kode: '', judul: '', kategori: '', upbjj: '',
        lokasiRak: '', harga: '', qty: '', safety: '', catatanHTML: ''
      },
      formAddErrors: {},

      // --- Modal: Edit ---
      showEditModal: false,
      formEdit: {},
      formEditErrors: {},
      editIndex: null,
      editOriginalKode: '',   // kode asli item yang sedang diedit

      // --- Toast ---
      toasts: [],

      // --- Watcher state ---
      lastFilterUpbjj: '',
      // reorderAlertShown TIDAK dipertahankan antar-edit agar setiap
      // perubahan nyata pada stok bisa memunculkan notifikasi kembali
    };
  },

  methods: {
    // ── Utilities ─────────────────────────────────────────
    emptyForm() {
      return {
        kode: '', judul: '', kategori: '', upbjj: '',
        lokasiRak: '', harga: '', qty: '', safety: '', catatanHTML: ''
      };
    },

    formatRupiah(val) {
      if (!val && val !== 0) return '—';
      return 'Rp ' + Number(val).toLocaleString('id-ID');
    },

    statusBadge(item) {
      if (item.qty === 0)                         return { label: 'Kosong',  cls: 'badge-danger' };
      if (item.qty > 0 && item.qty < item.safety) return { label: 'Menipis', cls: 'badge-warn' };
      return                                             { label: 'Aman',    cls: 'badge-ok' };
    },

    // ── Sorting ───────────────────────────────────────────
    setSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDir = 'asc';
      }
    },

    sortIcon(field) {
      if (this.sortField !== field) return '↕';
      return this.sortDir === 'asc' ? '↑' : '↓';
    },

    // ── Reset Filter ──────────────────────────────────────
    resetFilters() {
      this.searchQuery    = '';
      this.filterUpbjj    = '';
      this.filterKategori = '';
      this.filterReorder  = false;
      this.filterKosong   = false;
      this.sortField      = '';
      this.sortDir        = 'asc';
    },

    // ── Modal: Tambah ─────────────────────────────────────
    openAddModal() {
      this.formAdd       = this.emptyForm();
      this.formAddErrors = {};
      this.showAddModal  = true;
    },

    closeAddModal() {
      this.showAddModal = false;
    },

    // ── Validasi Form ─────────────────────────────────────
    // currentKode: kode milik item yang sedang diedit (boleh sama dengan dirinya sendiri)
    validateForm(form, currentKode) {
      const errors = {};
      const normalizedKode = (form.kode || '').trim().toUpperCase();

      if (!normalizedKode) {
        errors.kode = 'Kode mata kuliah wajib diisi.';
      } else {
        // Cek duplikat: izinkan kode milik item yang sedang diedit
        const ownKode = (currentKode || '').trim().toUpperCase();
        const duplicate = this.stok.some(s => {
          const sk = s.kode.toUpperCase();
          if (ownKode && sk === ownKode) return false; // lewati item sendiri
          return sk === normalizedKode;
        });
        if (duplicate) {
          errors.kode = 'Kode mata kuliah sudah digunakan oleh item lain.';
        }
      }

      if (!(form.judul || '').trim())      errors.judul     = 'Judul wajib diisi.';
      if (!form.kategori)                   errors.kategori  = 'Pilih kategori.';
      if (!form.upbjj)                      errors.upbjj     = 'Pilih UT-Daerah.';
      if (!(form.lokasiRak || '').trim())   errors.lokasiRak = 'Lokasi rak wajib diisi.';

      if (form.harga === '' || form.harga === null || isNaN(Number(form.harga)) || Number(form.harga) < 0)
        errors.harga  = 'Harga harus berupa angka ≥ 0.';
      if (form.qty === '' || form.qty === null || isNaN(Number(form.qty)) || Number(form.qty) < 0)
        errors.qty    = 'Jumlah stok harus berupa angka ≥ 0.';
      if (form.safety === '' || form.safety === null || isNaN(Number(form.safety)) || Number(form.safety) < 0)
        errors.safety = 'Safety stock harus berupa angka ≥ 0.';

      return errors;
    },

    submitAdd() {
      this.formAddErrors = this.validateForm(this.formAdd, null);
      if (Object.keys(this.formAddErrors).length > 0) return;

      const newId = this.stok.length > 0 ? Math.max(...this.stok.map(s => s.id)) + 1 : 1;
      this.stok.push({
        id:          newId,
        kode:        this.formAdd.kode.trim().toUpperCase(),
        judul:       this.formAdd.judul.trim(),
        kategori:    this.formAdd.kategori,
        upbjj:       this.formAdd.upbjj,
        lokasiRak:   this.formAdd.lokasiRak.trim(),
        harga:       Number(this.formAdd.harga),
        qty:         Number(this.formAdd.qty),
        safety:      Number(this.formAdd.safety),
        catatanHTML: sanitizeHTML(this.formAdd.catatanHTML.trim())
      });

      this.showAddModal = false;
      this.showToast('Bahan ajar berhasil ditambahkan.', 'success');
    },

    // ── Modal: Edit ───────────────────────────────────────
    openEditModal(item) {
      this.editIndex       = this.stok.findIndex(s => s.id === item.id);
      this.editOriginalKode = item.kode;
      this.formEdit        = { ...item };
      this.formEditErrors  = {};
      this.showEditModal   = true;
    },

    closeEditModal() {
      this.showEditModal = false;
    },

    submitEdit() {
      // Validasi dengan kode asli agar item sendiri tidak dianggap duplikat
      this.formEditErrors = this.validateForm(this.formEdit, this.editOriginalKode);
      if (Object.keys(this.formEditErrors).length > 0) return;

      if (this.editIndex !== null && this.editIndex >= 0) {
        this.stok.splice(this.editIndex, 1, {
          ...this.formEdit,
          kode:        this.formEdit.kode.trim().toUpperCase(),
          judul:       this.formEdit.judul.trim(),
          lokasiRak:   this.formEdit.lokasiRak.trim(),
          harga:       Number(this.formEdit.harga),
          qty:         Number(this.formEdit.qty),
          safety:      Number(this.formEdit.safety),
          catatanHTML: sanitizeHTML((this.formEdit.catatanHTML || '').trim()),
        });
      }

      this.showEditModal = false;
      this.showToast('Data berhasil diperbarui.', 'success');
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

  computed: {
    // ── Dependent kategori options ─────────────────────────
    // Hanya tampilkan kategori yang ada di UT-Daerah terpilih
    filteredKategoriOptions() {
      if (!this.filterUpbjj) return [];
      const available = this.stok
        .filter(s => s.upbjj === this.filterUpbjj)
        .map(s => s.kategori);
      return this.kategoriList.filter(k => available.includes(k));
    },

    // ── Main Filtered + Sorted list ───────────────────────
    filteredStok() {
      let list = this.stok;

      // Search
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        list = list.filter(s =>
          s.kode.toLowerCase().includes(q) ||
          s.judul.toLowerCase().includes(q) ||
          s.lokasiRak.toLowerCase().includes(q)
        );
      }

      // Filter UT-Daerah
      if (this.filterUpbjj) {
        list = list.filter(s => s.upbjj === this.filterUpbjj);
      }

      // Filter Kategori (hanya aktif setelah UT-Daerah dipilih)
      if (this.filterUpbjj && this.filterKategori) {
        list = list.filter(s => s.kategori === this.filterKategori);
      }

      // Filter stok:
      // - "Perlu Reorder" = qty > 0 DAN qty < safety (status Menipis)
      // - "Stok Kosong"   = qty === 0
      // - Keduanya aktif  = tampilkan gabungan (Menipis ATAU Kosong)
      if (this.filterReorder && this.filterKosong) {
        list = list.filter(s => s.qty === 0 || (s.qty > 0 && s.qty < s.safety));
      } else if (this.filterReorder) {
        list = list.filter(s => s.qty > 0 && s.qty < s.safety);
      } else if (this.filterKosong) {
        list = list.filter(s => s.qty === 0);
      }

      // Sort
      if (this.sortField) {
        const dir = this.sortDir === 'asc' ? 1 : -1;
        list = [...list].sort((a, b) => {
          const av = a[this.sortField];
          const bv = b[this.sortField];
          if (typeof av === 'string') return dir * av.localeCompare(bv, 'id');
          return dir * (av - bv);
        });
      }

      return list;
    },

    // ── Stats (selalu dari data lengkap, bukan filtered) ──
    totalStok()    { return this.stok.length; },
    countAman()    { return this.stok.filter(s => s.qty >= s.safety).length; },
    countMenipis() { return this.stok.filter(s => s.qty > 0 && s.qty < s.safety).length; },
    countKosong()  { return this.stok.filter(s => s.qty === 0).length; },

    isFilterActive() {
      return !!(this.searchQuery || this.filterUpbjj || this.filterKategori
             || this.filterReorder || this.filterKosong || this.sortField);
    },
  },

  watch: {
    // WATCHER 1: Reset kategori filter ketika UT-Daerah berubah
    filterUpbjj(newVal) {
      if (newVal !== this.lastFilterUpbjj) {
        this.filterKategori  = '';
        this.lastFilterUpbjj = newVal;
      }
    },

    // WATCHER 2: Notifikasi jika kondisi stok kritis berubah
    // Mencegah spam toast berulang pada mutasi stok biasa (mis. edit judul/rak)
    // namun tetap memicu notifikasi jika ada item yang baru menjadi kritis/kosong.
    stok: {
      deep: true,
      handler(newList) {
        const reorderCount = newList.filter(s => s.qty > 0 && s.qty < s.safety).length;
        const kosongCount  = newList.filter(s => s.qty === 0).length;

        if (reorderCount !== this.lastReorderCount || kosongCount !== this.lastKosongCount) {
          this.lastReorderCount = reorderCount;
          this.lastKosongCount  = kosongCount;
          if (reorderCount > 0 || kosongCount > 0) {
            const msg = `Perhatian: ${reorderCount} item menipis, ${kosongCount} item kosong.`;
            this.showToast(msg, 'warn');
          }
        }
      }
    },
  },

  mounted() {
    // Trigger initial reorder check saat halaman dimuat
    this.$nextTick(() => {
      const reorderCount = this.stok.filter(s => s.qty > 0 && s.qty < s.safety).length;
      const kosongCount  = this.stok.filter(s => s.qty === 0).length;
      this.lastReorderCount = reorderCount;
      this.lastKosongCount  = kosongCount;
      if (reorderCount > 0 || kosongCount > 0) {
        const msg = `Perhatian: ${reorderCount} item menipis, ${kosongCount} item kosong.`;
        this.showToast(msg, 'warn');
      }
    });
  }

}).mount('#app');
