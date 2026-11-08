// SITTA — stock-table.js
// Komponen Kelola Stok Bahan Ajar (<ba-stock-table>)
// Memenuhi Indikator Penilaian: Vue Component, Directives, Computed, Methods, 2 Watchers, Event Mouse & Keyboard, dan Custom Formatting Filter

Vue.component('ba-stock-table', {
  template: '#tpl-stock',
  props: {
    items: {
      type: Array,
      default: function () {
        return [];
      }
    },
    upbjjList: {
      type: Array,
      default: function () {
        return [];
      }
    },
    kategoriList: {
      type: Array,
      default: function () {
        return [];
      }
    }
  },
  data: function () {
    return {
      // Salinan data internal
      stokData: [],

      // Filter State
      searchQuery: '',
      filterUpbjj: '',
      filterKategori: '',
      filterReorder: false,
      filterKosong: false,

      // Sorting State
      sortField: '',
      sortDir: 'asc',

      // Modal Tambah
      showAddModal: false,
      formAdd: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      },
      formAddErrors: {},

      // Modal Edit
      showEditModal: false,
      formEdit: {
        id: null,
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      },
      formEditErrors: {},
      editOriginalKode: '',

      // Watcher tracking state
      lastFilterUpbjj: '',
      lastCriticalCount: null
    };
  },
  watch: {
    // Sinkronisasi data saat props items berubah dari parent
    items: {
      immediate: true,
      deep: true,
      handler: function (newItems) {
        if (Array.isArray(newItems)) {
          this.stokData = JSON.parse(JSON.stringify(newItems));
        }

        // WATCHER 1: Memantau kondisi stok kritis (Menipis dan Kosong)
        var menipis = 0;
        var kosong = 0;
        (newItems || []).forEach(function (s) {
          if (s.qty === 0) {
            kosong++;
          } else if (s.qty < s.safety) {
            menipis++;
          }
        });
        var currentCritical = menipis + kosong;
        if (this.lastCriticalCount !== null && currentCritical !== this.lastCriticalCount) {
          if (currentCritical > 0) {
            this.$emit('toast', {
              message: 'Perhatian: Terdapat ' + menipis + ' bahan ajar menipis dan ' + kosong + ' kosong!',
              type: 'warn'
            });
          }
        }
        this.lastCriticalCount = currentCritical;
      }
    },

    // WATCHER 2: Reset filter kategori ketika filter UT-Daerah berubah
    filterUpbjj: function (newVal) {
      if (newVal !== this.lastFilterUpbjj) {
        this.filterKategori = '';
        this.lastFilterUpbjj = newVal;
      }
    }
  },
  computed: {
    upbjjOptions: function () {
      return this.upbjjList || [];
    },
    kategoriOptions: function () {
      return this.kategoriList || [];
    },

    // Dependent Dropdown Kategori: hanya menampilkan kategori yang ada pada UT-Daerah terpilih
    dependentKategoriList: function () {
      if (!this.filterUpbjj) {
        return [];
      }
      var selectedUpbjj = this.filterUpbjj;
      var availableCats = {};
      this.stokData.forEach(function (s) {
        if (s.upbjj === selectedUpbjj && s.kategori) {
          availableCats[s.kategori] = true;
        }
      });
      return Object.keys(availableCats);
    },

    // Pengolahan Filter & Sort menggunakan memoized Computed Property (efisien dan tidak recompute berlebih)
    filteredStok: function () {
      var list = this.stokData.slice();

      // 1. Pencarian teks (Kode, Judul, Lokasi Rak)
      if (this.searchQuery && this.searchQuery.trim()) {
        var q = this.searchQuery.trim().toLowerCase();
        list = list.filter(function (item) {
          return (
            (item.kode && item.kode.toLowerCase().indexOf(q) !== -1) ||
            (item.judul && item.judul.toLowerCase().indexOf(q) !== -1) ||
            (item.lokasiRak && item.lokasiRak.toLowerCase().indexOf(q) !== -1)
          );
        });
      }

      // 2. Filter UT-Daerah
      if (this.filterUpbjj) {
        var upbjj = this.filterUpbjj;
        list = list.filter(function (item) {
          return item.upbjj === upbjj;
        });
      }

      // 3. Filter Kategori (hanya aktif jika UT-Daerah terpilih)
      if (this.filterUpbjj && this.filterKategori) {
        var kat = this.filterKategori;
        list = list.filter(function (item) {
          return item.kategori === kat;
        });
      }

      // 4. Filter Kondisi Stok: Reorder (< safety) & Kosong (= 0)
      if (this.filterReorder && this.filterKosong) {
        list = list.filter(function (item) {
          return item.qty === 0 || (item.qty > 0 && item.qty < item.safety);
        });
      } else if (this.filterReorder) {
        list = list.filter(function (item) {
          return item.qty > 0 && item.qty < item.safety;
        });
      } else if (this.filterKosong) {
        list = list.filter(function (item) {
          return item.qty === 0;
        });
      }

      // 5. Fitur Sort (Judul, Stok, Harga, Kode)
      if (this.sortField) {
        var field = this.sortField;
        var dir = this.sortDir === 'asc' ? 1 : -1;
        list.sort(function (a, b) {
          var valA = a[field];
          var valB = b[field];
          if (typeof valA === 'string') {
            return dir * valA.localeCompare(valB, 'id');
          }
          return dir * (Number(valA) - Number(valB));
        });
      }

      return list;
    },

    // Status Filter Aktif
    isFilterActive: function () {
      return !!(
        this.searchQuery ||
        this.filterUpbjj ||
        this.filterKategori ||
        this.filterReorder ||
        this.filterKosong ||
        this.sortField
      );
    },

    // Statistik Ringkasan Stok
    totalCount: function () {
      return this.stokData.length;
    },
    amanCount: function () {
      return this.stokData.filter(function (s) {
        return s.qty >= s.safety;
      }).length;
    },
    menipisCount: function () {
      return this.stokData.filter(function (s) {
        return s.qty > 0 && s.qty < s.safety;
      }).length;
    },
    kosongCount: function () {
      return this.stokData.filter(function (s) {
        return s.qty === 0;
      }).length;
    }
  },
  methods: {
    // ── Sorting ──────────────────────────────────────────
    setSort: function (field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDir = 'asc';
      }
    },
    sortIcon: function (field) {
      if (this.sortField !== field) return '↕';
      return this.sortDir === 'asc' ? '↑' : '↓';
    },

    // ── Reset Filter ──────────────────────────────────────
    resetFilters: function () {
      this.searchQuery = '';
      this.filterUpbjj = '';
      this.filterKategori = '';
      this.filterReorder = false;
      this.filterKosong = false;
      this.sortField = '';
      this.sortDir = 'asc';
    },

    // ── Validasi Form ─────────────────────────────────────
    validateForm: function (form, excludeKode) {
      var errors = {};
      var kode = (form.kode || '').trim().toUpperCase();

      if (!kode) {
        errors.kode = 'Kode mata kuliah wajib diisi.';
      } else {
        // Cek duplikasi kode MK
        var isDuplicate = this.stokData.some(function (item) {
          var itemKode = (item.kode || '').trim().toUpperCase();
          if (excludeKode && itemKode === excludeKode.trim().toUpperCase()) {
            return false;
          }
          return itemKode === kode;
        });
        if (isDuplicate) {
          errors.kode = 'Kode mata kuliah sudah ada di sistem.';
        }
      }

      if (!(form.judul || '').trim()) {
        errors.judul = 'Nama mata kuliah/judul wajib diisi.';
      }
      if (!form.kategori) {
        errors.kategori = 'Pilih kategori mata kuliah.';
      }
      if (!form.upbjj) {
        errors.upbjj = 'Pilih UT-Daerah.';
      }
      if (!(form.lokasiRak || '').trim()) {
        errors.lokasiRak = 'Lokasi rak wajib diisi.';
      }
      if (form.harga === '' || form.harga === null || isNaN(Number(form.harga)) || Number(form.harga) < 0) {
        errors.harga = 'Harga harus berupa angka ≥ 0.';
      }
      if (form.qty === '' || form.qty === null || isNaN(Number(form.qty)) || Number(form.qty) < 0) {
        errors.qty = 'Jumlah stok harus berupa angka ≥ 0.';
      }
      if (form.safety === '' || form.safety === null || isNaN(Number(form.safety)) || Number(form.safety) < 0) {
        errors.safety = 'Safety stock harus berupa angka ≥ 0.';
      }

      return errors;
    },

    // ── Modal Tambah ──────────────────────────────────────
    openAddModal: function () {
      this.formAdd = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      };
      this.formAddErrors = {};
      this.showAddModal = true;
    },
    closeAddModal: function () {
      this.showAddModal = false;
    },
    // Submit Tambah — Didukung melalui klik tombol maupun trigger keyboard 'Enter'
    submitAdd: function () {
      this.formAddErrors = this.validateForm(this.formAdd, null);
      if (Object.keys(this.formAddErrors).length > 0) {
        return;
      }

      var sanitizedNote = window.apiService ? window.apiService.sanitizeHTML(this.formAdd.catatanHTML) : this.formAdd.catatanHTML;
      var newId = this.stokData.length > 0 ? Math.max.apply(null, this.stokData.map(function (s) { return s.id || 0; })) + 1 : 1;

      var newItem = {
        id: newId,
        kode: this.formAdd.kode.trim().toUpperCase(),
        judul: this.formAdd.judul.trim(),
        kategori: this.formAdd.kategori,
        upbjj: this.formAdd.upbjj,
        lokasiRak: this.formAdd.lokasiRak.trim(),
        harga: Number(this.formAdd.harga),
        qty: Number(this.formAdd.qty),
        safety: Number(this.formAdd.safety),
        catatanHTML: sanitizedNote
      };

      this.stokData.push(newItem);
      this.$emit('update-stock', this.stokData);
      this.$emit('toast', {
        message: 'Bahan ajar ' + newItem.kode + ' berhasil ditambahkan.',
        type: 'success'
      });
      this.showAddModal = false;
    },

    // ── Modal Edit ────────────────────────────────────────
    openEditModal: function (item) {
      this.editOriginalKode = item.kode;
      this.formEdit = {
        id: item.id,
        kode: item.kode,
        judul: item.judul,
        kategori: item.kategori,
        upbjj: item.upbjj,
        lokasiRak: item.lokasiRak,
        harga: item.harga,
        qty: item.qty,
        safety: item.safety,
        catatanHTML: item.catatanHTML
      };
      this.formEditErrors = {};
      this.showEditModal = true;
    },
    closeEditModal: function () {
      this.showEditModal = false;
    },
    // Submit Edit — Didukung melalui klik tombol maupun trigger keyboard 'Enter'
    submitEdit: function () {
      this.formEditErrors = this.validateForm(this.formEdit, this.editOriginalKode);
      if (Object.keys(this.formEditErrors).length > 0) {
        return;
      }

      var sanitizedNote = window.apiService ? window.apiService.sanitizeHTML(this.formEdit.catatanHTML) : this.formEdit.catatanHTML;
      var targetId = this.formEdit.id;
      var updatedItem = {
        id: targetId,
        kode: this.formEdit.kode.trim().toUpperCase(),
        judul: this.formEdit.judul.trim(),
        kategori: this.formEdit.kategori,
        upbjj: this.formEdit.upbjj,
        lokasiRak: this.formEdit.lokasiRak.trim(),
        harga: Number(this.formEdit.harga),
        qty: Number(this.formEdit.qty),
        safety: Number(this.formEdit.safety),
        catatanHTML: sanitizedNote
      };

      var idx = this.stokData.findIndex(function (s) {
        return s.id === targetId || s.kode === updatedItem.kode;
      });

      if (idx !== -1) {
        this.$set(this.stokData, idx, updatedItem);
        this.$emit('update-stock', this.stokData);
        this.$emit('toast', {
          message: 'Data ' + updatedItem.kode + ' berhasil diperbarui.',
          type: 'success'
        });
      }

      this.showEditModal = false;
    },

    // ── Hapus Data Bahan Ajar ─────────────────────────────
    confirmDeleteItem: function (item) {
      var self = this;
      if (this.$refs.deleteModal && typeof this.$refs.deleteModal.open === 'function') {
        this.$refs.deleteModal.open({
          title: 'Hapus Bahan Ajar',
          message: 'Apakah Anda yakin ingin menghapus data bahan ajar ' + item.kode + ' (' + item.judul + ')? Tindakan ini tidak dapat dibatalkan.',
          confirmText: 'Ya, Hapus',
          cancelText: 'Batal',
          confirmType: 'danger',
          onConfirm: function () {
            self.executeDeleteItem(item);
          }
        });
      } else {
        // Fallback jika modal ref belum terikat
        if (window.confirm('Hapus bahan ajar ' + item.kode + '?')) {
          self.executeDeleteItem(item);
        }
      }
    },
    executeDeleteItem: function (item) {
      this.stokData = this.stokData.filter(function (s) {
        return s.id !== item.id && s.kode !== item.kode;
      });
      this.$emit('update-stock', this.stokData);
      this.$emit('toast', {
        message: 'Bahan ajar ' + item.kode + ' berhasil dihapus.',
        type: 'success'
      });
    }
  }
});

