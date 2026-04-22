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

// ===== VALIDAÇÃO DE CPF/CNPJ =====

/**
 * Valida um CPF
 */
export function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Valida um CNPJ
 */
export function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj.charAt(i)) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(cnpj.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj.charAt(i)) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(cnpj.charAt(13))) return false;
  
  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente
 */
export function validarDocumento(doc) {
  const numeros = doc.replace(/\D/g, '');
  if (numeros.length === 11) {
    return validarCPF(doc);
  } else if (numeros.length === 14) {
    return validarCNPJ(doc);
  }
  return false;
}