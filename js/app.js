// SITTA — app.js
// Root Single Page Application (SPA) Controller
// Sesuai Spesifikasi STSI4209 Tugas Praktik 3 (Stage 3.1)

(function (window) {
  'use strict';

  // ── 1. Helper Konversi & Global Filters ────────────────────

  /**
   * Filter: Format mata uang Rupiah
   * Contoh: 120000 -> "Rp 120.000"
   */
  function formatRupiah(value) {
    if (value === null || value === undefined || value === '') {
      return 'Rp 0';
    }
    var num = Number(value);
    if (isNaN(num)) {
      return 'Rp 0';
    }
    var parts = Math.round(num).toString().split('');
    var result = '';
    var count = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      result = parts[i] + result;
      count++;
      if (count % 3 === 0 && i !== 0) {
        result = '.' + result;
      }
    }
    return 'Rp ' + result;
  }

  /**
   * Filter: Format kuantitas buah
   * Contoh: 28 -> "28 buah"
   */
  function formatSatuanBuah(value) {
    if (value === null || value === undefined || value === '') {
      return '0 buah';
    }
    var num = Number(value);
    if (isNaN(num)) {
      return '0 buah';
    }
    return num + ' buah';
  }

  /**
   * Filter: Format tanggal bahasa Indonesia
   * Contoh: "2025-08-25" -> "25 Agustus 2025"
   * Bebas pergeseran zona waktu karena mem-parse langsung komponen kalender (tanpa Date.toISOString UTC)
   */
  var NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function formatTanggalIndonesia(value) {
    if (!value || typeof value !== 'string') {
      return '—';
    }
    var datePart = value.trim().split(' ')[0];
    var parts = datePart.split('-');
    if (parts.length !== 3) {
      return value;
    }
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return value;
    }
    return day + ' ' + NAMA_BULAN[month - 1] + ' ' + year;
  }

  /**
   * Daftarkan seluruh global filter ke Vue
   */
  function registerGlobalFilters(VueInstance) {
    var V = VueInstance || (typeof window !== 'undefined' ? window.Vue : null);
    if (!V || typeof V.filter !== 'function') {
      return;
    }
    V.filter('rupiah', formatRupiah);
    V.filter('satuanBuah', formatSatuanBuah);
    V.filter('formatTanggal', formatTanggalIndonesia);
  }

  // ── 2. Definisi Opsi Root Vue Application ──────────────────

  function createRootAppConfig() {
    return {
      el: '#app',
      data: function () {
        return {
          currentTab: 'stok', // 'stok' | 'tracking' | 'order'
          stokList: [],
          upbjjList: [],
          kategoriList: [],
          pengirimanList: [],
          paketList: [],
          tracking: {},
          isLoading: true,
          errorMessage: '',
          toasts: []
        };
      },
      computed: {
        // Indikator ringkas ketersediaan data
        isDataReady: function () {
          return !this.isLoading && !this.errorMessage;
        }
      },
      methods: {
        // ── Pemuatan Data Awal dari apiService ─────────────────
        loadInitialData: function () {
          var self = this;
          self.isLoading = true;
          self.errorMessage = '';

          var service = (typeof window !== 'undefined') ? window.apiService : null;
          if (!service || typeof service.fetchData !== 'function') {
            self.isLoading = false;
            self.errorMessage = 'Layanan data apiService tidak ditemukan.';
            return Promise.reject(new Error(self.errorMessage));
          }

          return service.fetchData()
            .then(function (data) {
              if (!data) {
                throw new Error('Data yang diterima dari apiService kosong.');
              }
              // Pemetaan state sesuai struktur aktual
              self.stokList = Array.isArray(data.stok) ? data.stok : [];
              self.upbjjList = Array.isArray(data.upbjjList) ? data.upbjjList : [];
              self.kategoriList = Array.isArray(data.kategoriList) ? data.kategoriList : [];
              self.pengirimanList = Array.isArray(data.pengirimanList) ? data.pengirimanList : [];
              self.paketList = Array.isArray(data.paket) ? data.paket : [];
              self.tracking = (data.tracking && typeof data.tracking === 'object') ? data.tracking : {};
              self.isLoading = false;
              return data;
            })
            .catch(function (err) {
              self.isLoading = false;
              self.errorMessage = 'Gagal memuat data bahan ajar: ' + (err.message || err);
              console.error('SITTA loadInitialData error:', err);
            });
        },

        // ── Navigasi Tab ──────────────────────────────────────
        switchTab: function (tabName) {
          if (['stok', 'tracking', 'order'].indexOf(tabName) !== -1) {
            this.currentTab = tabName;
          }
        },

        // ── Event Handlers ────────────────────────────────────

        /**
         * 1. handleStockUpdate
         * Menerima event 'update-stock' dari ba-stock-table
         */
        handleStockUpdate: function (newStock) {
          if (Array.isArray(newStock)) {
            // Perbarui array stokList secara reaktif tanpa memutasi prop asal
            this.stokList = newStock.slice();
          }
        },

        /**
         * 2. handleOrderCreated
         * Menerima event 'created' dari order-form saat DO baru berhasil disimpan
         */
        handleOrderCreated: function (newDO) {
          if (!newDO || typeof newDO !== 'object' || !newDO.nomorDO) {
            console.warn('handleOrderCreated: Payload Delivery Order tidak valid.');
            return;
          }
          var nomorDO = newDO.nomorDO;
          if (!this.tracking || typeof this.tracking !== 'object') {
            this.tracking = {};
          }
          // Cegah duplikasi
          if (Object.prototype.hasOwnProperty.call(this.tracking, nomorDO)) {
            console.warn('handleOrderCreated: Nomor DO ' + nomorDO + ' sudah terdaftar.');
            this.showToast({
              message: 'Nomor DO ' + nomorDO + ' sudah terdaftar di sistem.',
              type: 'error'
            });
            return;
          }
          // Tambahkan key baru secara reaktif ke objek tracking menggunakan this.$set
          this.$set(this.tracking, nomorDO, newDO);
        },

        /**
         * 3. handleAddProgress
         * Menerima event 'add-progress' dari do-tracking
         */
        handleAddProgress: function (payload) {
          if (!payload || !payload.nomorDO || !payload.progress) {
            console.warn('handleAddProgress: Payload add-progress tidak valid.');
            return;
          }
          var nomorDO = payload.nomorDO;
          var progress = payload.progress;

          if (!this.tracking || !this.tracking[nomorDO]) {
            console.warn('handleAddProgress: Nomor DO ' + nomorDO + ' tidak ditemukan di tracking.');
            return;
          }
          if (!progress.keterangan || !String(progress.keterangan).trim()) {
            console.warn('handleAddProgress: Keterangan perjalanan tidak boleh kosong.');
            return;
          }
          if (!progress.waktu) {
            console.warn('handleAddProgress: Waktu perjalanan tidak valid.');
            return;
          }

          var targetDO = this.tracking[nomorDO];
          if (!Array.isArray(targetDO.perjalanan)) {
            this.$set(targetDO, 'perjalanan', []);
          }
          // Tambahkan riwayat progress baru ke array perjalanan
          targetDO.perjalanan.push({
            waktu: progress.waktu,
            keterangan: String(progress.keterangan).trim()
          });
        },

        /**
         * 4. showToast & removeToast
         * Menerima event 'toast' dari komponen anak
         */
        showToast: function (payload) {
          if (!payload || !payload.message) return;
          var id = Date.now() + Math.random().toString(36).substring(2, 7);
          var toastItem = {
            id: id,
            message: payload.message,
            type: payload.type || 'info' // 'success' | 'error' | 'warn' | 'info'
          };
          this.toasts.push(toastItem);
          var self = this;
          setTimeout(function () {
            self.removeToast(id);
          }, 4000);
        },
        removeToast: function (id) {
          this.toasts = this.toasts.filter(function (t) {
            return t.id !== id;
          });
        }
      },
      mounted: function () {
        this.loadInitialData();
      }
    };
  }

  // ── 3. Asynchronous Bootstrap Loader ──────────────────────

  var TEMPLATES_CONFIG = [
    { id: 'tpl-badge', url: 'templates/status-badge.html' },
    { id: 'tpl-modal', url: 'templates/app-modal.html' },
    { id: 'tpl-stock', url: 'templates/stock-table.html' },
    { id: 'tpl-order', url: 'templates/order-form.html' },
    { id: 'tpl-tracking', url: 'templates/do-tracking.html' }
  ];

  var COMPONENTS_CONFIG = [
    { name: 'status-badge', src: 'js/components/status-badge.js' },
    { name: 'app-modal', src: 'js/components/app-modal.js' },
    { name: 'ba-stock-table', src: 'js/components/stock-table.js' },
    { name: 'order-form', src: 'js/components/order-form.js' },
    { name: 'do-tracking', src: 'js/components/do-tracking.js' }
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') return resolve();
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        return resolve();
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Gagal memuat file skrip: ' + src)); };
      document.body.appendChild(s);
    });
  }

  /**
   * Bootstrap Asinkron:
   * 1. Validasi dependensi Vue & apiService
   * 2. Ambil seluruh template eksternal via fetch() dan injeksikan ke DOM
   * 3. Muat seluruh skrip komponen secara berurutan
   * 4. Daftarkan global filter Vue
   * 5. Inisialisasi root Vue jika #app tersedia di DOM
   */
  async function bootstrapSITTA() {
    // 1. Validasi dependensi
    if (typeof window.Vue === 'undefined') {
      throw new Error('Vue 2 tidak ditemukan di window.Vue. Pastikan js/vue.js dimuat lebih dahulu.');
    }
    if (typeof window.apiService === 'undefined') {
      throw new Error('apiService tidak ditemukan di window.apiService. Pastikan js/services/api.js dimuat.');
    }

    var Vue = window.Vue;

    // 2. Ambil dan injeksikan template eksternal
    if (typeof document !== 'undefined' && typeof window.fetch === 'function') {
      for (var i = 0; i < TEMPLATES_CONFIG.length; i++) {
        var tpl = TEMPLATES_CONFIG[i];
        if (!document.getElementById(tpl.id)) {
          var res = await window.fetch(tpl.url);
          if (!res.ok) {
            throw new Error('Gagal mengambil template: ' + tpl.url + ' (HTTP Status: ' + res.status + ')');
          }
          var htmlContent = await res.text();
          var scriptEl = document.createElement('script');
          scriptEl.type = 'text/x-template';
          scriptEl.id = tpl.id;
          scriptEl.text = htmlContent;
          document.body.appendChild(scriptEl);
        }
        if (!document.getElementById(tpl.id)) {
          throw new Error('Template #' + tpl.id + ' gagal diverifikasi di DOM.');
        }
      }
    }

    // 3. Muat skrip komponen jika belum terdaftar
    for (var j = 0; j < COMPONENTS_CONFIG.length; j++) {
      var comp = COMPONENTS_CONFIG[j];
      if (!Vue.component(comp.name)) {
        await loadScript(comp.src);
      }
      if (!Vue.component(comp.name)) {
        throw new Error('Komponen Vue "' + comp.name + '" gagal didaftarkan.');
      }
    }

    // 4. Daftarkan filter global
    registerGlobalFilters(Vue);

    // 5. Inisialisasi root Vue bila elemen #app ada di DOM
    if (typeof document !== 'undefined' && document.getElementById('app')) {
      var appInstance = new Vue(createRootAppConfig());
      window.__SITTA_APP__ = appInstance;
      return appInstance;
    } else {
      console.info('SITTA: Elemen #app belum tersedia di DOM (menunggu refaktor index.html pada Stage 3.2).');
      return null;
    }
  }

  // Ekspor pembantu & fungsi bootstrap untuk integrasi dan pengujian
  window.formatRupiah = formatRupiah;
  window.formatSatuanBuah = formatSatuanBuah;
  window.formatTanggalIndonesia = formatTanggalIndonesia;
  window.registerGlobalFilters = registerGlobalFilters;
  window.createRootAppConfig = createRootAppConfig;
  window.bootstrapSITTA = bootstrapSITTA;

  // Auto-run bootstrap jika document sudah siap dan #app tersedia
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('app')) {
          bootstrapSITTA().catch(function (err) {
            console.error('SITTA Bootstrap Error:', err);
          });
        }
      });
    } else {
      if (document.getElementById('app')) {
        bootstrapSITTA().catch(function (err) {
          console.error('SITTA Bootstrap Error:', err);
        });
      }
    }
  }

})(typeof window !== 'undefined' ? window : this);

