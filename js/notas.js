// notas.js - Gerenciamento de notas fiscais

import { Storage } from './storage.js';
import { formatarMoeda, formatarData } from './utils.js';

// Estado global das notas fiscais
export let notas = Storage.getNotas();

/**
 * Cria uma nova nota fiscal
 * @param {Object} dados - Dados da nota
 * @returns {Object} Nota fiscal criada
 */
export function criarNotaFiscal(dados) {
  const { cliente, doc, itens, subtotal, desconto, total, pagamento } = dados;
  
  const numero = Storage.incrementNfCounter();
  
  const nota = {
    numero,
    data: new Date().toISOString(),
    cliente,
    doc,
    itens,
    subtotal,
    desconto,
    total,
    pagamento
  };
  
  notas.push(nota);
  Storage.setNotas(notas);
  
  return nota;
}

/**
 * Busca uma nota fiscal pelo número
 * @param {number} numero - Número da NF
 * @returns {Object|undefined} Nota encontrada
 */
export function getNota(numero) {
  return notas.find(n => n.numero === numero);
}

/**
 * Gera o HTML para exibição/impressão da nota fiscal
 * @param {Object} nota - Nota fiscal
 * @returns {string} HTML formatado
 */
export function gerarHTMLNota(nota) {
  return `
    <div class="nf-print" id="nf-printable">
      <div class="nf-header">
        <div>
          <div class="nf-company-name">AUTOPEÇAS LTDA.</div>
          <div class="nf-company-sub">CNPJ: 00.000.000/0001-00 · IE: 000.000.000.000</div>
          <div class="nf-company-sub">Rua das Peças, 123 · Centro · Fortaleza - CE</div>
          <div class="nf-company-sub">Tel: (85) 99999-0000</div>
        </div>
        <div class="nf-number">
          <div class="nf-number-label">NOTA FISCAL</div>
          <div class="nf-number-value">NF-${nota.numero}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">${formatarData(nota.data)}</div>
        </div>
      </div>
      <div class="nf-info">
        <div>
          <div class="nf-section-title">Cliente</div>
          <div class="nf-value">${nota.cliente}</div>
          <div style="font-size:12px;color:#666">${nota.doc || 'CPF/CNPJ não informado'}</div>
        </div>
        <div>
          <div class="nf-section-title">Pagamento</div>
          <div class="nf-value">${nota.pagamento}</div>
          <div style="font-size:12px;color:#666">${formatarData(nota.data)}</div>
        </div>
      </div>
      <table class="nf-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th style="text-align:center">Qtd</th>
            <th style="text-align:right">Unit. (R$)</th>
            <th style="text-align:right">Total (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${nota.itens.map(i => `
            <tr>
              <td>${i.codigo}</td>
              <td>${i.nome}</td>
              <td style="text-align:center">${i.qty}</td>
              <td style="text-align:right">${formatarMoeda(i.preco)}</td>
              <td style="text-align:right">${formatarMoeda(i.preco * i.qty)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align:right">
        <div style="font-size:13px;color:#666">Subtotal: R$ ${formatarMoeda(nota.subtotal)}</div>
        ${nota.desconto > 0 ? `<div style="font-size:13px;color:#666">Desconto: -R$ ${formatarMoeda(nota.desconto)}</div>` : ''}
        <div class="nf-total">TOTAL: R$ ${formatarMoeda(nota.total)}</div>
      </div>
      <div class="nf-footer">
        Documento emitido pelo sistema AutoPeças Gestão de Estoque · NF-${nota.numero} · ${formatarData(nota.data)}
      </div>
    </div>
  `;
}

/**
 * Abre uma nova janela para impressão da nota fiscal
 * @param {string} htmlContent - Conteúdo HTML da nota
 */
export function imprimirNota(htmlContent) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Nota Fiscal</title>
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=JetBrains+Mono:wght@700&family=Barlow:wght@400;600;900&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Barlow', sans-serif; padding: 24px; }
      .nf-print { max-width: 720px; margin: 0 auto; background: white; color: #111; padding: 32px; border-radius: 8px; }
      .nf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #111; }
      .nf-company-name { font-size: 24px; font-weight: 900; font-family: 'Barlow Condensed', sans-serif; }
      .nf-company-sub { font-size: 11px; color: #666; margin-top: 2px; }
      .nf-number { text-align: right; }
      .nf-number-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888; }
      .nf-number-value { font-size: 22px; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
      .nf-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .nf-section-title { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
      .nf-value { font-size: 14px; font-weight: 600; }
      .nf-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      .nf-table th { background: #111; color: white; padding: 8px 12px; font-size: 11px; text-align: left; }
      .nf-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
      .nf-total { text-align: right; font-size: 20px; font-weight: 900; margin-top: 12px; }
      .nf-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
      @media print { body { padding: 0; } }
    </style></head><body>${htmlContent}</body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

/**
 * Retorna todas as notas em ordem reversa
 * @returns {Array} Notas fiscais
 */
export function getTodasNotas() {
  return [...notas].reverse();
}