// app.js - Ponto de entrada da aplicação

import { inicializarProdutos } from './produtos.js';
import { inicializarEventos, renderDashboard, populateSelects, iniciarMonitoramentoEstoque } from './ui.js';
import { salvarBackupAutomatico } from './storage.js';

/**
 * Inicializa a aplicação
 */
function init() {
  console.log('🚗 AutoPeças — Sistema de Gestão de Estoque');
  console.log('📦 Inicializando...');
  
  // Inicializa dados
  inicializarProdutos();
  
  // Configura event listeners
  inicializarEventos();
  
  // Renderiza a interface inicial
  renderDashboard();
  populateSelects();
  
  // Inicia monitoramento de estoque baixo
  iniciarMonitoramentoEstoque();


  // Backup automático diário (a cada 24 horas)
  setInterval(salvarBackupAutomatico, 86400000);
  // Primeiro backup após 10 segundos
  setTimeout(salvarBackupAutomatico, 10000);
  
  console.log('✅ Sistema pronto!');
}

// Iniciar quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', init);