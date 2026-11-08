// SITTA — app-modal.js
// Komponen Modal Reusable (<app-modal>)
// Digunakan untuk popup dialog konfirmasi (mis. hapus stok) dan formulir modal

Vue.component('app-modal', {
  template: '#tpl-modal',
  props: {
    title: {
      type: String,
      default: 'Konfirmasi'
    },
    message: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: 'Konfirmasi'
    },
    cancelText: {
      type: String,
      default: 'Batal'
    },
    confirmType: {
      type: String,
      default: 'primary' // 'primary' | 'danger'
    },
    visible: {
      type: Boolean,
      default: false
    },
    showConfirm: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      isOpen: this.visible,
      modalTitle: this.title,
      modalMessage: this.message,
      confirmLabel: this.confirmText,
      cancelLabel: this.cancelText,
      confirmBtnType: this.confirmType,
      showConfirmBtn: this.showConfirm,
      onConfirmCallback: null,
      onCancelCallback: null
    };
  },
  watch: {
    visible: function (newVal) {
      this.isOpen = newVal;
    },
    title: function (newVal) {
      this.modalTitle = newVal;
    },
    message: function (newVal) {
      this.modalMessage = newVal;
    }
  },
  computed: {
    confirmButtonClass: function () {
      return this.confirmBtnType === 'danger' ? 'btn-danger' : 'btn-primary';
    }
  },
  methods: {
    /**
     * Membuka modal secara programatis
     * Contoh: this.$refs.modal.open({
     *   title: 'Hapus Bahan Ajar',
     *   message: 'Apakah Anda yakin ingin menghapus data ini?',
     *   confirmType: 'danger',
     *   confirmText: 'Ya, Hapus',
     *   onConfirm: () => { ... }
     * })
     */
    open: function (options) {
      var opt = options || {};
      this.modalTitle = opt.title || this.title || 'Konfirmasi';
      this.modalMessage = opt.message || this.message || '';
      this.confirmLabel = opt.confirmText || this.confirmText || 'Konfirmasi';
      this.cancelLabel = opt.cancelText || this.cancelText || 'Batal';
      this.confirmBtnType = opt.confirmType || this.confirmType || 'primary';
      this.showConfirmBtn = typeof opt.showConfirm !== 'undefined' ? opt.showConfirm : true;
      this.onConfirmCallback = typeof opt.onConfirm === 'function' ? opt.onConfirm : null;
      this.onCancelCallback = typeof opt.onCancel === 'function' ? opt.onCancel : null;
      this.isOpen = true;
    },
    close: function () {
      this.isOpen = false;
      this.$emit('close');
    },
    handleConfirm: function () {
      if (this.onConfirmCallback) {
        this.onConfirmCallback();
      }
      this.$emit('confirm');
      this.isOpen = false;
    },
    handleCancel: function () {
      if (this.onCancelCallback) {
        this.onCancelCallback();
      }
      this.$emit('cancel');
      this.isOpen = false;
    }
  }
});

