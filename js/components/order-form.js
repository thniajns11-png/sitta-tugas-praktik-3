// SITTA — order-form.js
// Komponen Formulir Pemesanan Bahan Ajar (<order-form>)
// Sesuai Spesifikasi STSI4209 Tugas Praktik 3 (Soal Halaman 5–6)

(function (window) {
  'use strict';

  // Pemetaan label ekspedisi resmi sesuai spesifikasi STSI4209 Tugas Praktik 3
  var EKSPEDISI_LABEL_MAP = {
    'REG': 'JNE Regular (3-5 hari)',
    'EXP': 'JNE Express (1-2 hari)'
  };

  /**
   * Helper: Format tanggal lokal ke format ISO "YYYY-MM-DD"
   */
  function formatDateISO(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return year + '-' + month + '-' + day;
  }

  /**
   * Helper: Menghasilkan Nomor DO Baru Otomatis (3 Digit Sequence)
   * Format: DO{tahun berjalan}-{sequence 3 digit}
   * Contoh: DO2026-001, DO2026-002, DO2026-003
   *
   * @param {Object|Array} trackingData - Data tracking yang sudah ada
   * @param {Number} [targetYear] - Tahun berjalan (default: tahun saat ini)
   * @returns {String} Nomor DO berikutnya
   */
  function generateNextNomorDO(trackingData, targetYear) {
    var year = targetYear || new Date().getFullYear();
    var prefix = 'DO' + year + '-';
    var maxSeq = 0;

    if (trackingData) {
      // Ekstrak semua nomor DO baik dari Object Map maupun Array
      var keys = [];
      if (Array.isArray(trackingData)) {
        trackingData.forEach(function (item) {
          if (typeof item === 'string') {
            // Direct string DO entry
            keys.push(item);
          } else if (item && typeof item === 'object') {
            if (item.nomorDO) {
              keys.push(item.nomorDO);
            } else {
              Object.keys(item).forEach(function (k) {
                keys.push(k);
              });
            }
          }
        });
      } else if (trackingData && typeof trackingData === 'object') {
        keys = Object.keys(trackingData);
      }

      keys.forEach(function (key) {
        if (key && typeof key === 'string' && key.indexOf(prefix) === 0) {
          var seqPart = key.substring(prefix.length);
          // Validasi ketat: seluruh suffix harus memenuhi pola /^\d+$/
          // Mencegah suffix malformed seperti "002ABC" atau "ABC" ikut terhitung
          if (/^\d+$/.test(seqPart)) {
            var seqNum = parseInt(seqPart, 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
              maxSeq = seqNum;
            }
          }
        }
      });
    }

    var nextSeq = maxSeq + 1;
    var seqFormatted = String(nextSeq);
    while (seqFormatted.length < 3) {
      seqFormatted = '0' + seqFormatted;
    }
    return prefix + seqFormatted;
  }

  // Ekspor helper agar dapat diuji secara terisolasi
  window.generateNextNomorDO = generateNextNomorDO;
  window.EKSPEDISI_LABEL_MAP = EKSPEDISI_LABEL_MAP;

  // ── Registrasi Komponen Vue 2 ──────────────────────────
  Vue.component('order-form', {
    template: '#tpl-order',
    props: {
      paket: {
        type: Array,
        default: function () {
          return [];
        }
      },
      ekspedisi: {
        type: Array,
        default: function () {
          return [];
        }
      },
      tracking: {
        type: [Object, Array],
        default: function () {
          return {};
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
        form: {
          nim: '',
          nama: '',
          ekspedisi: '',
          paketKode: '',
          tanggalKirim: '',
          totalHarga: 0
        },
        errors: {}
      };
    },
    computed: {
      // 1. Nomor DO Otomatis
      generatedNomorDO: function () {
        return generateNextNomorDO(this.tracking);
      },

      // 2. Opsi Ekspedisi dengan Pemetaan Label Resmi (REG -> JNE Regular, EXP -> JNE Express)
      ekspedisiList: function () {
        var rawList = this.ekspedisi || [];
        return rawList.map(function (item) {
          var label = (item && item.kode && EKSPEDISI_LABEL_MAP[item.kode])
            ? EKSPEDISI_LABEL_MAP[item.kode]
            : (item ? item.nama : '');
          return {
            kode: item ? item.kode : '',
            nama: label
          };
        });
      },

      // 3. Opsi Paket Bahan Ajar
      paketList: function () {
        return this.paket || [];
      },

      // 4. Objek Paket yang Dipilih
      selectedPaket: function () {
        if (!this.form.paketKode) return null;
        var code = this.form.paketKode;
        var list = this.paketList;
        for (var i = 0; i < list.length; i++) {
          if (list[i].kode === code) {
            return list[i];
          }
        }
        return null;
      },

      // 5. Rincian Buku Modul dalam Paket Terpilih
      paketIsiDetail: function () {
        if (!this.selectedPaket || !Array.isArray(this.selectedPaket.isi)) {
          return [];
        }
        var stok = this.stokList || [];
        return this.selectedPaket.isi.map(function (kodeMK) {
          var matched = null;
          for (var i = 0; i < stok.length; i++) {
            if (stok[i].kode === kodeMK) {
              matched = stok[i];
              break;
            }
          }
          return {
            kode: kodeMK,
            judul: matched ? matched.judul : '(Judul bahan ajar tidak ditemukan)'
          };
        });
      },

      // 6. Nama Ekspedisi Terpilih untuk Tampilan Ringkasan dan Payload DO
      selectedEkspedisiNama: function () {
        if (!this.form.ekspedisi) return '—';
        var code = this.form.ekspedisi;
        if (EKSPEDISI_LABEL_MAP[code]) {
          return EKSPEDISI_LABEL_MAP[code];
        }
        var list = this.ekspedisiList;
        for (var i = 0; i < list.length; i++) {
          if (list[i].kode === code) {
            return list[i].nama;
          }
        }
        return this.form.ekspedisi;
      }
    },
    watch: {
      // WATCHER: Memantau perubahan pemilihan paket bahan ajar
      // Mengkalkulasi total harga secara otomatis dan membersihkan error paket
      'form.paketKode': function (newKode) {
        if (newKode) {
          var list = this.paketList;
          var found = null;
          for (var i = 0; i < list.length; i++) {
            if (list[i].kode === newKode) {
              found = list[i];
              break;
            }
          }
          this.form.totalHarga = found ? Number(found.harga) || 0 : 0;

          if (this.errors.paketKode) {
            this.$delete(this.errors, 'paketKode');
          }
        } else {
          this.form.totalHarga = 0;
        }
      }
    },
    methods: {
      // ── Set Tanggal Hari Ini ──────────────────────────────
      setToday: function () {
        this.form.tanggalKirim = formatDateISO();
        if (this.errors.tanggalKirim) {
          this.$delete(this.errors, 'tanggalKirim');
        }
      },

      // ── Reset Formulir Pemesanan ──────────────────────────
      resetForm: function () {
        this.form.nim = '';
        this.form.nama = '';
        this.form.ekspedisi = '';
        this.form.paketKode = '';
        this.form.totalHarga = 0;
        this.errors = {};
        this.setToday();
      },

      // ── Validasi Input Formulir ───────────────────────────
      validate: function () {
        var errs = {};
        var nim = (this.form.nim || '').trim();
        var nama = (this.form.nama || '').trim();

        // Validasi NIM: Wajib diisi & validasi format angka 6–12 digit
        if (!nim) {
          errs.nim = 'NIM mahasiswa wajib diisi.';
        } else if (!/^\d{6,12}$/.test(nim)) {
          errs.nim = 'NIM harus terdiri dari 6–12 digit angka.';
        }

        // Validasi Nama Mahasiswa: Wajib diisi
        if (!nama) {
          errs.nama = 'Nama lengkap mahasiswa wajib diisi.';
        }

        // Validasi Ekspedisi: Wajib dipilih
        if (!this.form.ekspedisi) {
          errs.ekspedisi = 'Pilih layanan ekspedisi pengiriman.';
        }

        // Validasi Tanggal Kirim: Wajib diisi
        if (!this.form.tanggalKirim) {
          errs.tanggalKirim = 'Tanggal pengiriman wajib diisi.';
        }

        // Validasi Paket Bahan Ajar: Wajib dipilih
        if (!this.form.paketKode) {
          errs.paketKode = 'Pilih paket bahan ajar yang dipesan.';
        }

        this.errors = errs;
        return Object.keys(errs).length === 0;
      },

      // ── Submit Pemesanan Delivery Order Baru ──────────────
      submitOrder: function () {
        if (!this.validate()) {
          return;
        }

        var newNomorDO = this.generatedNomorDO;

        // Bentuk objek Delivery Order baru sesuai spesifikasi
        var newDO = {
          nomorDO: newNomorDO,
          nim: this.form.nim.trim(),
          nama: this.form.nama.trim(),
          status: 'Dalam Perjalanan',
          ekspedisi: this.selectedEkspedisiNama,
          tanggalKirim: this.form.tanggalKirim,
          paket: this.form.paketKode,
          total: Number(this.form.totalHarga) || 0,
          perjalanan: [] // Riwayat perjalanan awal kosong (tidak mengarang data)
        };

        // Kirim event created dan toast ke root Vue
        this.$emit('created', newDO);
        this.$emit('toast', {
          message: 'Delivery Order ' + newNomorDO + ' berhasil dibuat!',
          type: 'success'
        });

        // Bersihkan formulir untuk pesanan berikutnya
        this.resetForm();
      }
    },
    mounted: function () {
      // Inisialisasi tanggal pengiriman default dengan tanggal hari ini
      if (!this.form.tanggalKirim) {
        this.setToday();
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);

