// SITTA — api.js
// Layanan Pengambilan & Normalisasi Data Bahan Ajar (STSI4209 Tugas Praktik 3)

(function (window) {
  'use strict';

  // Data cadangan darurat (fallback) jika aplikasi dibuka langsung via protokol file://
  // yang menyebabkan browser memblokir XMLHttpRequest / fetch() karena kebijakan CORS.
  var FALLBACK_DATA = {
    upbjjList: [
      "Jakarta",
      "Surabaya",
      "Makassar",
      "Padang",
      "Denpasar"
    ],
    kategoriList: [
      "MK Wajib",
      "MK Pilihan",
      "Praktikum",
      "Problem-Based"
    ],
    pengirimanList: [
      {
        kode: "REG",
        nama: "Reguler (3-5 hari)"
      },
      {
        kode: "EXP",
        nama: "Ekspres (1-2 hari)"
      }
    ],
    paket: [
      {
        kode: "PAKET-UT-001",
        nama: "PAKET IPS Dasar",
        isi: [
          "EKMA4116",
          "EKMA4115"
        ],
        harga: 120000
      },
      {
        kode: "PAKET-UT-002",
        nama: "PAKET IPA Dasar",
        isi: [
          "BIOL4201",
          "FISIP4001"
        ],
        harga: 140000
      }
    ],
    stok: [
      {
        kode: "EKMA4116",
        judul: "Pengantar Manajemen",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A3",
        harga: 65000,
        qty: 28,
        safety: 20,
        catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
      },
      {
        kode: "EKMA4115",
        judul: "Pengantar Akuntansi",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A4",
        harga: 60000,
        qty: 7,
        safety: 15,
        catatanHTML: "<strong>Cover baru</strong>"
      },
      {
        kode: "BIOL4201",
        judul: "Biologi Umum (Praktikum)",
        kategori: "Praktikum",
        upbjj: "Surabaya",
        lokasiRak: "R3-B2",
        harga: 80000,
        qty: 12,
        safety: 10,
        catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
      },
      {
        kode: "FISIP4001",
        judul: "Dasar-Dasar Sosiologi",
        kategori: "MK Pilihan",
        upbjj: "Makassar",
        lokasiRak: "R2-C1",
        harga: 55000,
        qty: 2,
        safety: 8,
        catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
      }
    ],
    tracking: [
      {
        "DO2025-0001": {
          nim: "123456789",
          nama: "Rina Wulandari",
          status: "Dalam Perjalanan",
          ekspedisi: "JNE",
          tanggalKirim: "2025-08-25",
          paket: "PAKET-UT-001",
          total: 120000,
          perjalanan: [
            {
              waktu: "2025-08-25 10:12:20",
              keterangan: "Penerimaan di Loket: TANGSEL"
            }
          ]
        }
      },
      {
        "DO2025-0001": {
          nim: "123456789",
          nama: "Rina Wulandari",
          status: "Dalam Perjalanan",
          ekspedisi: "JNE",
          tanggalKirim: "2025-08-25",
          paket: "PAKET-UT-001",
          total: 120000,
          perjalanan: [
            {
              waktu: "2025-08-25 10:12:20",
              keterangan: "Penerimaan di Loket: TANGSEL"
            }
          ]
        }
      }
    ]
  };

  /**
   * Melakukan sanitasi teks HTML catatan untuk mencegah XSS.
   */
  function sanitizeHTML(input) {
    if (!input || typeof input !== 'string') return '';
    if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['em', 'strong', 'i', 'u', 'b', 's', 'br', 'span'],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false
      });
    }
    // Fallback sederhana jika DOMPurify tidak tersedia
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  }

  /**
   * Menormalisasi data mentah dari dataBahanAjar.json:
   * 1. Menambahkan identifier unik (id) pada data stok dan melakukan sanitasi catatanHTML.
   * 2. Menghilangkan duplikasi entri nomor DO pada array tracking.
   * 3. Mengubah struktur array of objects tracking menjadi Map/Dictionary yang mudah diakses.
   */
  function normalizeData(rawData) {
    var data = rawData || {};

    // 1. Stok
    var stokList = (data.stok || []).map(function (item, index) {
      return {
        id: item.id || (index + 1),
        kode: item.kode || '',
        judul: item.judul || '',
        kategori: item.kategori || '',
        upbjj: item.upbjj || '',
        lokasiRak: item.lokasiRak || '',
        harga: Number(item.harga) || 0,
        qty: Number(item.qty) || 0,
        safety: Number(item.safety) || 0,
        catatanHTML: sanitizeHTML(item.catatanHTML || '')
      };
    });

    // 2. Tracking: Normalisasi dan Deduplikasi Nomor DO
    // Format di JSON adalah array of { [nomorDO]: item }
    var trackingMap = {};
    if (Array.isArray(data.tracking)) {
      data.tracking.forEach(function (entry) {
        if (entry && typeof entry === 'object') {
          Object.keys(entry).forEach(function (doKey) {
            // Hindari menimpa jika sudah ada atau ambil data yang valid
            if (!trackingMap[doKey]) {
              var val = entry[doKey];
              trackingMap[doKey] = {
                nomorDO: doKey,
                nim: String(val.nim || ''),
                nama: val.nama || '',
                status: val.status || 'Menunggu Pengiriman',
                ekspedisi: val.ekspedisi || 'JNE',
                tanggalKirim: val.tanggalKirim || '',
                paket: val.paket || '',
                total: Number(val.total) || 0,
                perjalanan: Array.isArray(val.perjalanan) ? val.perjalanan.slice() : []
              };
            }
          });
        }
      });
    }

    return {
      upbjjList: (data.upbjjList || []).slice(),
      kategoriList: (data.kategoriList || []).slice(),
      pengirimanList: (data.pengirimanList || []).slice(),
      paket: (data.paket || []).slice(),
      stok: stokList,
      tracking: trackingMap
    };
  }

  var apiService = {
    /**
     * Mengambil data dari data/dataBahanAjar.json.
     * Mengembalikan Promise yang menghasilkan objek data ter-normalisasi.
     */
    fetchData: function () {
      var jsonPath = 'data/dataBahanAjar.json';

      // Cek apakah lingkungan browser mendukung fetch
      if (typeof window.fetch === 'function') {
        return window.fetch(jsonPath)
          .then(function (response) {
            if (!response.ok) {
              throw new Error('Gagal memuat data dari ' + jsonPath + ' (Status: ' + response.status + ')');
            }
            return response.json();
          })
          .then(function (json) {
            return normalizeData(json);
          })
          .catch(function (err) {
            console.warn('apiService: Fetch gagal (kemungkinan batasan CORS file://). Mengaktifkan fallback data.', err);
            return normalizeData(FALLBACK_DATA);
          });
      }

      // Fallback jika fetch tidak tersedia
      return Promise.resolve(normalizeData(FALLBACK_DATA));
    },

    /**
     * Sanitasi HTML Catatan
     */
    sanitizeHTML: sanitizeHTML
  };

  // Ekspor ke window global
  window.apiService = apiService;

})(window);

