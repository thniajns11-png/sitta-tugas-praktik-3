// SITTA — status-badge.js
// Komponen Status Badge (<status-badge>)
// Indikator Penilaian: Vue Component, Data Binding, Conditional Rendering, dan Mouse Event (Hover Preview)

Vue.component('status-badge', {
  template: '#tpl-badge',
  props: {
    qty: {
      type: Number,
      default: 0
    },
    safety: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: ''
    },
    catatan: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      showTooltip: false
    };
  },
  computed: {
    badgeType: function () {
      if (this.status) {
        var s = this.status.toLowerCase();
        if (s.indexOf('selesai') !== -1 || s.indexOf('terkirim') !== -1 || s.indexOf('aman') !== -1) {
          return 'aman';
        }
        if (s.indexOf('perjalanan') !== -1 || s.indexOf('menipis') !== -1 || s.indexOf('diteruskan') !== -1) {
          return 'menipis';
        }
        if (s.indexOf('kosong') !== -1 || s.indexOf('batal') !== -1 || s.indexOf('gagal') !== -1) {
          return 'kosong';
        }
        return 'muted';
      }
      if (this.qty === 0) return 'kosong';
      if (this.qty < this.safety) return 'menipis';
      return 'aman';
    },
    badgeClass: function () {
      switch (this.badgeType) {
        case 'aman':
          return 'badge-ok';
        case 'menipis':
          return 'badge-warn';
        case 'kosong':
          return 'badge-danger';
        default:
          return 'badge-muted';
      }
    },
    badgeLabel: function () {
      if (this.status) return this.status;
      if (this.qty === 0) return 'Kosong';
      if (this.qty < this.safety) return 'Menipis';
      return 'Aman';
    }
  }
});
