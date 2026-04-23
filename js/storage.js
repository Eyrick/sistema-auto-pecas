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

// ===== BACKUP E RESTORE =====

/**
 * Cria um backup completo dos dados e faz download
 */
export function criarBackup() {
  const backup = {
    versao: '1.0.0',
    data: new Date().toISOString(),
    produtos: Storage.getProdutos(),
    movimentos: Storage.getMovimentos(),
    notas: Storage.getNotas(),
    nfCounter: Storage.getNfCounter()
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_autopecas_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  
  return backup;
}

/**
 * Restaura dados de um arquivo de backup
 */
export function restaurarBackup(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        // Valida estrutura do backup
        if (!backup.produtos || !backup.movimentos || !backup.notas) {
          reject(new Error('Arquivo de backup inválido!'));
          return;
        }
        
        // Confirma restauração
        if (confirm(
          `Deseja restaurar o backup de ${new Date(backup.data).toLocaleDateString('pt-BR')}?\n\n` +
          `• ${backup.produtos.length} produtos\n` +
          `• ${backup.movimentos.length} movimentos\n` +
          `• ${backup.notas.length} notas fiscais\n\n` +
          `⚠️ Os dados atuais serão substituídos!`
        )) {
          Storage.setProdutos(backup.produtos);
          Storage.setMovimentos(backup.movimentos);
          Storage.setNotas(backup.notas);
          localStorage.setItem('ap_nf_counter', (backup.nfCounter || 1000).toString());
          resolve(backup);
        } else {
          reject(new Error('Restauração cancelada.'));
        }
      } catch (err) {
        reject(new Error('Arquivo de backup corrompido!'));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo!'));
    reader.readAsText(arquivo);
  });
}

/**
 * Salva backup automático no localStorage (diário)
 */
export function salvarBackupAutomatico() {
  const backup = {
    versao: '1.0.0',
    data: new Date().toISOString(),
    produtos: Storage.getProdutos(),
    movimentos: Storage.getMovimentos(),
    notas: Storage.getNotas(),
    nfCounter: Storage.getNfCounter()
  };
  localStorage.setItem('ap_backup_automatico', JSON.stringify(backup));
}

/**
 * Restaura do backup automático
 */
export function restaurarBackupAutomatico() {
  const backupStr = localStorage.getItem('ap_backup_automatico');
  if (!backupStr) return false;
  
  try {
    const backup = JSON.parse(backupStr);
    Storage.setProdutos(backup.produtos);
    Storage.setMovimentos(backup.movimentos);
    Storage.setNotas(backup.notas);
    localStorage.setItem('ap_nf_counter', (backup.nfCounter || 1000).toString());
    return true;
  } catch {
    return false;
  }
}