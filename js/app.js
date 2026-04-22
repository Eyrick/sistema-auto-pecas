// app.js - Ponto de entrada da aplicação

import { inicializarProdutos } from './produtos.js';
import { inicializarEventos, renderDashboard, populateSelects } from './ui.js';

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
  
  console.log('✅ Sistema pronto!');
}

// Iniciar quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', init);