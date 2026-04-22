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

// ===== MÁSCARAS DE INPUT =====

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export function mascaraCPF(valor) {
  valor = valor.replace(/\D/g, '');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return valor;
}

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function mascaraCNPJ(valor) {
  valor = valor.replace(/\D/g, '');
  valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
  valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
  valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
  return valor;
}

/**
 * Aplica máscara de moeda (R$ 0,00)
 */
export function mascaraMoeda(valor) {
  valor = valor.replace(/\D/g, '');
  valor = (parseInt(valor) / 100).toFixed(2);
  valor = valor.replace('.', ',');
  valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return 'R$ ' + valor;
}

/**
 * Aplica máscara de telefone ((00) 00000-0000)
 */
export function mascaraTelefone(valor) {
  valor = valor.replace(/\D/g, '');
  valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
  valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
  return valor;
}

/**
 * Aplica máscara de acordo com o tipo
 */
export function aplicarMascara(valor, tipo) {
  switch (tipo) {
    case 'cpf': return mascaraCPF(valor);
    case 'cnpj': return mascaraCNPJ(valor);
    case 'moeda': return mascaraMoeda(valor);
    case 'telefone': return mascaraTelefone(valor);
    default: return valor;
  }
}

/**
 * Desfaz máscara (retorna apenas números)
 */
export function limparMascara(valor) {
  return valor.replace(/\D/g, '');
}

/**
 * Formata um número para exibição como moeda
 */
export function formatarParaMoeda(valor) {
  return 'R$ ' + (valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}