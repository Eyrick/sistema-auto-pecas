// utils.js - Funções utilitárias

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export function formatarMoeda(valor) {
  return (valor || 0).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
 * Formata uma data ISO para o formato brasileiro com hora
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada (dd/mm/aaaa hh:mm)
 */
export function formatarData(isoString) {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR') + ' ' + 
         data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata uma data ISO para o formato brasileiro (apenas data)
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada (dd/mm/aaaa)
 */
export function formatarDataCurta(isoString) {
  return new Date(isoString).toLocaleDateString('pt-BR');
}

/**
 * Gera um ID único baseado em timestamp + número aleatório
 * @returns {number} ID único
 */
export function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Exibe uma mensagem toast na tela
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - 'success' ou 'error'
 */
export function mostrarToast(mensagem, tipo = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  
  el.textContent = (tipo === 'success' ? '✅ ' : '❌ ') + mensagem;
  el.className = `toast toast-${tipo} show`;
  
  setTimeout(() => { 
    el.className = 'toast'; 
  }, 3000);
}

/**
 * Fecha um modal pelo ID
 * @param {string} modalId - ID do modal
 */
export function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

/**
 * Abre um modal pelo ID
 * @param {string} modalId - ID do modal
 */
export function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}