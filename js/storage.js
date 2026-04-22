// storage.js - Gerenciamento do localStorage

const STORAGE_KEYS = {
  PRODUTOS: 'ap_produtos',
  MOVIMENTOS: 'ap_movimentos',
  NOTAS: 'ap_notas',
  NF_COUNTER: 'ap_nf_counter'
};

export const Storage = {
  // ===== PRODUTOS =====
  getProdutos() {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
    return data ? JSON.parse(data) : [];
  },
  
  setProdutos(produtos) {
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
  },

  // ===== MOVIMENTOS =====
  getMovimentos() {
    const data = localStorage.getItem(STORAGE_KEYS.MOVIMENTOS);
    return data ? JSON.parse(data) : [];
  },
  
  setMovimentos(movimentos) {
    localStorage.setItem(STORAGE_KEYS.MOVIMENTOS, JSON.stringify(movimentos));
  },

  // ===== NOTAS FISCAIS =====
  getNotas() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTAS);
    return data ? JSON.parse(data) : [];
  },
  
  setNotas(notas) {
    localStorage.setItem(STORAGE_KEYS.NOTAS, JSON.stringify(notas));
  },

  // ===== CONTADOR NF =====
  getNfCounter() {
    const counter = localStorage.getItem(STORAGE_KEYS.NF_COUNTER);
    return counter ? parseInt(counter) : 1000;
  },
  
  incrementNfCounter() {
    const next = this.getNfCounter() + 1;
    localStorage.setItem(STORAGE_KEYS.NF_COUNTER, next.toString());
    return next;
  },

  // ===== SALVAR TUDO =====
  salvarTudo(produtos, movimentos, notas) {
    this.setProdutos(produtos);
    this.setMovimentos(movimentos);
    this.setNotas(notas);
  },

  // ===== LIMPAR TUDO (para debug) =====
  limparTudo() {
    localStorage.removeItem(STORAGE_KEYS.PRODUTOS);
    localStorage.removeItem(STORAGE_KEYS.MOVIMENTOS);
    localStorage.removeItem(STORAGE_KEYS.NOTAS);
    localStorage.removeItem(STORAGE_KEYS.NF_COUNTER);
  }
};