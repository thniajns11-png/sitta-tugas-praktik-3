// SITTA — do-tracking.js
// Komponen Pelacakan Delivery Order (<do-tracking>)
// Sesuai Spesifikasi STSI4209 Tugas Praktik 3 (Soal Halaman 6–7)

(function (window) {
  'use strict';

  /**
   * Helper: Format waktu lokal komputer ke format "YYYY-MM-DD HH:mm:ss"
   * Menghindari penggunaan toISOString() secara langsung karena menghasilkan waktu UTC.
   *
   * @param {Date} [date] - Objek Date (default: waktu lokal komputer saat ini)
   * @returns {String} String tanggal & jam lokal
   */
  function formatLocalDateTime(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1);
    var day = String(d.getDate());
    var hours = String(d.getHours());
    var minutes = String(d.getMinutes());
    var seconds = String(d.getSeconds());

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
  }

  // Ekspor helper agar dapat diuji secara terisolasi
  window.formatLocalDateTime = formatLocalDateTime;

  // ── Registrasi Komponen Vue 2 ──────────────────────────
  Vue.component('do-tracking', {
    template: '#tpl-tracking',
    props: {
      tracking: {
        type: [Object, Array],
        default: function () {
          return {};
        }
      },
      paketList: {
        type: Array,
        default: function () {
          return [];
        }
      },
      stokList: {
        type: Array,
        default: function () {
          return [];
        }
      }
    },
    data: function () {
      return {
        keyword: '',
        activeQuery: '',
        hasSearched: false,
        selectedDONumber: null,
        newProgressText: '',
        progressError: ''
      };
    },
    computed: {
      // 1. Normalisasi data tracking props menjadi flat array of DO objects
      allTrackingList: function () {
        var data = this.tracking || {};
        var list = [];
        if (Array.isArray(data)) {
          data.forEach(function (entry) {
            if (entry && typeof entry === 'object') {
              if (entry.nomorDO) {
                list.push(entry);
              } else {
                Object.keys(entry).forEach(function (k) {
                  var item = entry[k];
                  if (item && typeof item === 'object') {
                    list.push(Object.assign({ nomorDO: k }, item));
                  }
                });
              }
            }
          });
        } else if (typeof data === 'object') {
          Object.keys(data).forEach(function (k) {
            var item = data[k];
            if (item && typeof item === 'object') {
              list.push(Object.assign({ nomorDO: k }, item));
            }
          });
        }
        return list;
      },

      // 2. Daftar hasil pencarian berdasarkan nomor DO atau NIM (case-insensitive & substring match)
      searchResults: function () {
        if (!this.hasSearched || !this.activeQuery) {
          return [];
        }
        var q = this.activeQuery.toLowerCase();
        return this.allTrackingList.filter(function (item) {
          var doMatch = item.nomorDO && item.nomorDO.toLowerCase().indexOf(q) !== -1;
          var nimMatch = item.nim && String(item.nim).toLowerCase().indexOf(q) !== -1;
          return doMatch || nimMatch;
        });
      },

      // 3. Objek DO yang sedang aktif/dipilih
      selectedDO: function () {
        if (!this.selectedDONumber) return null;
        var list = this.allTrackingList;
        for (var i = 0; i < list.length; i++) {
          if (list[i].nomorDO === this.selectedDONumber) {
            return list[i];
          }
        }
        return null;
      },

      // 4. Detail paket yang cocok dengan kode paket pada DO terpilih
      selectedPaketDetail: function () {
        if (!this.selectedDO || !this.selectedDO.paket) return null;
        var kode = this.selectedDO.paket;
        var list = this.paketList || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i].kode === kode) {
            return list[i];
          }
        }
        return null;
      },

      // 5. Nama paket untuk tampilan (dengan penanganan aman jika tidak ditemukan)
      selectedPaketNama: function () {
        if (!this.selectedDO) return '—';
        if (this.selectedPaketDetail && this.selectedPaketDetail.nama) {
          return this.selectedPaketDetail.nama;
        }
        return this.selectedDO.paket || '—';
      },

      // 6. Rincian modul buku dalam paket terpilih (dicocokkan ke stokList)
      selectedModulList: function () {
        if (!this.selectedPaketDetail || !Array.isArray(this.selectedPaketDetail.isi)) {
          return [];
        }
        var stok = this.stokList || [];
        return this.selectedPaketDetail.isi.map(function (kodeMK) {
          var found = null;
          for (var i = 0; i < stok.length; i++) {
            if (stok[i].kode === kodeMK) {
              found = stok[i];
              break;
            }
          }
          return {
            kode: kodeMK,
            judul: (found && found.judul) ? found.judul : 'Detail judul tidak tersedia'
          };
        });
      }
    },
    watch: {
      newProgressText: function (val) {
        if (val && this.progressError) {
          this.progressError = '';
        }
      }
    },
    methods: {
      // ── Jalankan Pencarian ─────────────────────────────────
      search: function (forcedQuery) {
        if (typeof forcedQuery === 'string') {
          this.keyword = forcedQuery;
        }
        var q = (this.keyword || '').trim();
        this.activeQuery = q;
        this.hasSearched = !!q;

        if (!q) {
          this.selectedDONumber = null;
          return [];
        }

        var results = this.searchResults;
        if (results.length >= 1) {
          // Jika DO yang sedang dipilih tidak ada di dalam hasil baru, pilih hasil pertama
          var isFoundInResults = false;
          for (var i = 0; i < results.length; i++) {
            if (results[i].nomorDO === this.selectedDONumber) {
              isFoundInResults = true;
              break;
            }
          }
          if (!isFoundInResults) {
            this.selectedDONumber = results[0].nomorDO;
          }
        } else {
          this.selectedDONumber = null;
        }

        return results;
      },

      // ── Reset Pencarian ───────────────────────────────────
      resetSearch: function () {
        this.keyword = '';
        this.activeQuery = '';
        this.hasSearched = false;
        this.selectedDONumber = null;
        this.newProgressText = '';
        this.progressError = '';
      },

      // ── Pilih DO Tertentu ─────────────────────────────────
      selectDO: function (nomorDO) {
        this.selectedDONumber = nomorDO;
        this.newProgressText = '';
        this.progressError = '';
      },

      // ── Validasi & Tambah Catatan Progress Perjalanan ──────
      submitProgress: function () {
        if (!this.selectedDO) {
          this.progressError = 'Pilih Delivery Order terlebih dahulu.';
          return;
        }

        var text = (this.newProgressText || '').trim();
        if (!text) {
          this.progressError = 'Keterangan perjalanan tidak boleh kosong.';
          return;
        }

        this.progressError = '';

        var localTimestamp = formatLocalDateTime();
        var progressObj = {
          waktu: localTimestamp,
          keterangan: text
        };

        // Kirim event ke parent (root Vue) tanpa memutasi prop tracking
        this.$emit('add-progress', {
          nomorDO: this.selectedDO.nomorDO,
          progress: progressObj
        });

        // Kirim notifikasi toast
        this.$emit('toast', {
          message: 'Catatan perjalanan berhasil ditambahkan untuk ' + this.selectedDO.nomorDO,
          type: 'success'
        });

        // Bersihkan input form progress
        this.newProgressText = '';
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);

