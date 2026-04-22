// ui.js - Gerenciamento da interface do usuário

import { produtos, getCategorias, editarProduto, excluirProduto, limparFormProduto, editProdId } from './produtos.js';
import { movimentos, getMovimentosFiltrados, getSaidaItems, adicionarItemSaida, removerItemSaida, calcularTotaisSaida, finalizarSaida, cancelarSaida, registrarEntrada, limparFormEntrada } from './movimentos.js';
import { notas, getNota, gerarHTMLNota, imprimirNota, getTodasNotas } from './notas.js';
import { formatarMoeda, formatarData, mostrarToast, abrirModal, fecharModal } from './utils.js';

// Estado da UI
let paginaAtual = 'dashboard';
let filtroMovimentos = 'todos';

// ===== NAVEGAÇÃO =====

/**
 * Muda a página ativa
 * @param {string} nome - Nome da página
 */
export function mostrarPagina(nome) {
  // Atualiza classes das páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${nome}`).classList.add('active');
  
  // Atualiza botões de navegação
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${nome}"]`)?.classList.add('active');
  
  // Atualiza título
  const titulos = {
    dashboard: 'Dashboard',
    estoque: 'Estoque',
    movimentos: 'Movimentos',
    entrada: 'Entrada de Peças',
    saida: 'Saída / Venda',
    notas: 'Notas Fiscais'
  };
  document.getElementById('page-title').textContent = titulos[nome] || nome;
  
  paginaAtual = nome;
  renderizarPaginaAtual();
}

/**
 * Renderiza a página atual
 */
function renderizarPaginaAtual() {
  switch(paginaAtual) {
    case 'dashboard': renderDashboard(); break;
    case 'estoque': renderEstoque(); break;
    case 'movimentos': renderMovimentos(); break;
    case 'entrada': populateSelects(); break;
    case 'saida': populateSelects(); renderSaidaItems(); break;
    case 'notas': renderNotas(); break;
  }
}

// ===== DASHBOARD =====

export function renderDashboard() {
  const total = produtos.length;
  const valorEstoque = produtos.reduce((s, p) => s + (p.custo * p.qty), 0);
  const criticos = produtos.filter(p => p.qty <= p.min);
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-valor').textContent = 'R$ ' + formatarMoeda(valorEstoque);
  document.getElementById('stat-baixo').textContent = criticos.length;
  document.getElementById('stat-notas').textContent = notas.length;
  document.getElementById('alert-badge').textContent = `● ${criticos.length} ALERTA${criticos.length !== 1 ? 'S' : ''}`;
  
  // Lista de itens críticos
  const listaBaixo = document.getElementById('lista-baixo');
  if (criticos.length === 0) {
    listaBaixo.innerHTML = '<p style="color:var(--text3);padding:20px;text-align:center">✅ Nenhum item crítico.</p>';
  } else {
    listaBaixo.innerHTML = criticos.map(p => `
      <div class="mov-item">
        <div class="mov-icon ${p.qty === 0 ? 'mov-out' : 'mov-in'}">${p.qty === 0 ? '❌' : '⚠️'}</div>
        <div class="mov-info">
          <div class="mov-name">${p.nome}</div>
          <div class="mov-meta">${p.codigo} · ${p.categoria}</div>
        </div>
        <span class="stock-badge ${p.qty === 0 ? 'stock-out' : 'stock-low'}">${p.qty} un.</span>
      </div>
    `).join('');
  }
  
  // Últimos movimentos
  const recentes = [...movimentos].reverse().slice(0, 6);
  const listaMov = document.getElementById('lista-mov-dash');
  if (recentes.length === 0) {
    listaMov.innerHTML = '<p style="color:var(--text3);padding:20px;text-align:center">Nenhum movimento.</p>';
  } else {
    listaMov.innerHTML = recentes.map(m => `
      <div class="mov-item">
        <div class="mov-icon ${m.tipo === 'entrada' ? 'mov-in' : 'mov-out'}">${m.tipo === 'entrada' ? '⬇️' : '⬆️'}</div>
        <div class="mov-info">
          <div class="mov-name">${m.peca}</div>
          <div class="mov-meta">${formatarData(m.data)} · ${m.resp}</div>
        </div>
        <div class="mov-qty ${m.tipo === 'entrada' ? 'qty-in' : 'qty-out'}">${m.tipo === 'entrada' ? '+' : '-'}${m.qty}</div>
      </div>
    `).join('');
  }
}

// ===== ESTOQUE =====

export function renderEstoque() {
  const search = document.getElementById('search-estoque')?.value.toLowerCase() || '';
  const cat = document.getElementById('filter-cat')?.value || '';
  
  let lista = produtos.filter(p => {
    const matchSearch = !search || 
      p.nome.toLowerCase().includes(search) || 
      p.codigo.toLowerCase().includes(search) ||
      (p.categoria || '').toLowerCase().includes(search);
    const matchCat = !cat || p.categoria === cat;
    return matchSearch && matchCat;
  });
  
  // Popula filtro de categorias
  const filterCat = document.getElementById('filter-cat');
  if (filterCat) {
    const cats = getCategorias();
    filterCat.innerHTML = '<option value="">Todas categorias</option>' + 
      cats.map(c => `<option ${c === cat ? 'selected' : ''}>${c}</option>`).join('');
  }
  
  document.getElementById('count-estoque').textContent = lista.length + ' itens';
  
  const tbody = document.getElementById('tbody-estoque');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text3)">Nenhuma peça encontrada.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(p => {
    let statusCls = 'stock-ok', statusTxt = 'OK';
    if (p.qty === 0) { statusCls = 'stock-out'; statusTxt = 'ZERADO'; }
    else if (p.qty <= p.min) { statusCls = 'stock-low'; statusTxt = 'BAIXO'; }
    
    return `
      <tr>
        <td><span class="code-tag">${p.codigo}</span></td>
        <td>
          <div style="font-weight:600">${p.nome}</div>
          <div style="font-size:11px;color:var(--text3)">${p.marca||''}</div>
        </td>
        <td style="color:var(--text2)">${p.categoria}</td>
        <td style="font-size:12px;color:var(--text3)">${p.localizacao||'—'}</td>
        <td style="font-family:var(--font-mono);font-size:15px;font-weight:700">${p.qty}</td>
        <td style="font-family:var(--font-mono);color:var(--text3)">${p.min}</td>
        <td><span class="stock-badge ${statusCls}">${statusTxt}</span></td>
        <td style="font-family:var(--font-mono)">R$ ${formatarMoeda(p.venda)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm btn-editar-produto" data-id="${p.id}">✏️</button>
            <button class="btn btn-red btn-sm btn-excluir-produto" data-id="${p.id}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Adiciona event listeners aos botões
  document.querySelectorAll('.btn-editar-produto').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const produto = editarProduto(id);
      if (produto) {
        document.getElementById('modal-prod-title').textContent = '✏️ Editar Peça';
        document.getElementById('prod-codigo').value = produto.codigo;
        document.getElementById('prod-nome').value = produto.nome;
        document.getElementById('prod-cat').value = produto.categoria;
        document.getElementById('prod-desc').value = produto.desc || '';
        document.getElementById('prod-qty').value = produto.qty;
        document.getElementById('prod-min').value = produto.min;
        document.getElementById('prod-custo').value = produto.custo.toFixed(2);
        document.getElementById('prod-venda').value = produto.venda.toFixed(2);
        document.getElementById('prod-loc').value = produto.localizacao || '';
        document.getElementById('prod-marca').value = produto.marca || '';
        abrirModal('modal-produto');
      }
    });
  });
  
  document.querySelectorAll('.btn-excluir-produto').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      excluirProduto(id);
    });
  });
}

// ===== MOVIMENTOS =====

export function renderMovimentos() {
  const lista = getMovimentosFiltrados(filtroMovimentos);
  const tbody = document.getElementById('tbody-mov');
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text3)">Nenhum movimento.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td style="font-size:12px;color:var(--text3);font-family:var(--font-mono)">${formatarData(m.data)}</td>
      <td><span class="stock-badge ${m.tipo === 'entrada' ? 'stock-ok' : 'stock-out'}">${m.tipo.toUpperCase()}</span></td>
      <td>
        <div style="font-weight:600">${m.peca}</div>
        <div style="font-size:11px;color:var(--text3)">${m.codigo}</div>
      </td>
      <td style="font-family:var(--font-mono);font-weight:700;color:${m.tipo==='entrada'?'var(--green)':'var(--red)'}">${m.tipo==='entrada'?'+':'-'}${m.qty}</td>
      <td>${m.resp||'—'}</td>
      <td style="font-size:12px;color:var(--text3)">${m.obs||'—'}</td>
    </tr>
  `).join('');
}

export function setFiltroMovimentos(filtro) {
  filtroMovimentos = filtro;
  renderMovimentos();
}

// ===== NOTAS FISCAIS =====

export function renderNotas() {
  const tbody = document.getElementById('tbody-notas');
  const lista = getTodasNotas();
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">Nenhuma nota emitida.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(n => `
    <tr>
      <td><span class="code-tag">NF-${n.numero}</span></td>
      <td style="font-size:12px;font-family:var(--font-mono)">${formatarData(n.data)}</td>
      <td style="font-weight:600">${n.cliente}</td>
      <td style="font-size:12px;color:var(--text3)">${n.doc||'—'}</td>
      <td>${n.itens.length} item(s)</td>
      <td style="font-family:var(--font-mono);font-weight:700;color:var(--accent)">R$ ${formatarMoeda(n.total)}</td>
      <td>${n.pagamento}</td>
      <td><button class="btn btn-blue btn-sm btn-ver-nf" data-nf="${n.numero}">🧾 Ver</button></td>
    </tr>
  `).join('');
  
  document.querySelectorAll('.btn-ver-nf').forEach(btn => {
    btn.addEventListener('click', () => {
      const numero = parseInt(btn.dataset.nf);
      const nota = getNota(numero);
      if (nota) {
        document.getElementById('nf-content').innerHTML = gerarHTMLNota(nota);
        abrirModal('modal-nf');
      }
    });
  });
}

// ===== SAÍDA =====

export function renderSaidaItems() {
  const items = getSaidaItems();
  const el = document.getElementById('out-items');
  
  if (items.length === 0) {
    el.innerHTML = '<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">Nenhum item adicionado.</p>';
    atualizarTotaisSaida();
    return;
  }
  
  el.innerHTML = `
    <table style="width:100%;font-size:13px">
      <thead>
        <tr>
          <th>Peça</th>
          <th>Qtd</th>
          <th>Unit.</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${items.map((i, idx) => `
          <tr>
            <td>
              <div style="font-weight:600">${i.nome}</div>
              <div style="font-size:11px;color:var(--text3)">${i.codigo}</div>
            </td>
            <td style="font-family:var(--font-mono)">${i.qty}</td>
            <td style="font-family:var(--font-mono)">R$ ${formatarMoeda(i.preco)}</td>
            <td style="font-family:var(--font-mono);font-weight:700">R$ ${formatarMoeda(i.preco * i.qty)}</td>
            <td><button class="btn btn-red btn-sm btn-remover-item" data-idx="${idx}">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.querySelectorAll('.btn-remover-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      removerItemSaida(idx);
      renderSaidaItems();
    });
  });
  
  atualizarTotaisSaida();
}

function atualizarTotaisSaida() {
  const { subtotal } = calcularTotaisSaida();
  const desconto = parseFloat(document.getElementById('out-desc')?.value) || 0;
  const total = Math.max(0, subtotal - desconto);
  
  const outSub = document.getElementById('out-sub');
  const outTotal = document.getElementById('out-total');
  if (outSub) outSub.textContent = 'R$ ' + formatarMoeda(subtotal);
  if (outTotal) outTotal.textContent = 'R$ ' + formatarMoeda(total);
}

// ===== SELECTS =====

export function populateSelects() {
  const selects = ['ent-peca', 'out-peca'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">Selecione a peça...</option>' +
      produtos.map(p => `<option value="${p.id}">${p.codigo} — ${p.nome} (${p.qty} un.)</option>`).join('');
  });
}

// ===== ATUALIZAÇÃO GERAL =====

export function atualizarUI() {
  populateSelects();
  renderizarPaginaAtual();
}

// ===== INICIALIZAÇÃO DE EVENTOS =====

export function inicializarEventos() {
  // Navegação
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      mostrarPagina(page);
    });
  });
  
  // Modais - abrir
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.currentTarget.dataset.modal;
      if (modal === 'modal-produto') {
        limparFormProduto();
      }
      abrirModal(modal);
    });
  });
  
  // Modais - fechar
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.currentTarget.dataset.closeModal;
      fecharModal(modal);
    });
  });
  
  // Fechar modal ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
  
  // Salvar produto
  document.getElementById('btn-salvar-produto')?.addEventListener('click', () => {
    const dados = {
      codigo: document.getElementById('prod-codigo').value,
      nome: document.getElementById('prod-nome').value,
      categoria: document.getElementById('prod-cat').value,
      desc: document.getElementById('prod-desc').value,
      qty: document.getElementById('prod-qty').value,
      min: document.getElementById('prod-min').value,
      custo: document.getElementById('prod-custo').value,
      venda: document.getElementById('prod-venda').value,
      localizacao: document.getElementById('prod-loc').value,
      marca: document.getElementById('prod-marca').value
    };
    
    import('./produtos.js').then(module => {
      module.salvarProduto(dados);
    });

		// Máscaras de input
const campoCPF = document.getElementById('out-doc');
const campoCNPJ = document.getElementById('out-doc');
const camposMoeda = document.querySelectorAll('#prod-custo, #prod-venda, #out-desc');

// Detecta se é CPF ou CNPJ pelo tamanho
if (campoCPF) {
  campoCPF.addEventListener('input', (e) => {
    let valor = e.target.value;
    const numeros = limparMascara(valor);
    
    if (numeros.length <= 11) {
      e.target.value = mascaraCPF(valor);
      e.target.setAttribute('data-tipo', 'cpf');
    } else {
      e.target.value = mascaraCNPJ(valor);
      e.target.setAttribute('data-tipo', 'cnpj');
    }
  });
}

// Máscara para campos de moeda
camposMoeda.forEach(campo => {
  if (campo) {
    campo.addEventListener('input', (e) => {
      let valor = e.target.value;
      valor = valor.replace(/\D/g, '');
      if (valor) {
        e.target.value = mascaraMoeda(valor);
      }
    });
    
    // Formata ao perder o foco
    campo.addEventListener('blur', (e) => {
      let valor = e.target.value;
      const numeros = parseFloat(limparMascara(valor)) / 100;
      if (!isNaN(numeros)) {
        e.target.value = formatarParaMoeda(numeros);
      }
    });
  }
});
  });
  
  // Busca no estoque
  document.getElementById('search-estoque')?.addEventListener('input', renderEstoque);
  document.getElementById('filter-cat')?.addEventListener('change', renderEstoque);
  
  // Filtros de movimentos
  document.querySelectorAll('[data-mov-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filtro = e.currentTarget.dataset.movFilter;
      document.querySelectorAll('[data-mov-filter]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      setFiltroMovimentos(filtro);
    });
  });
  
  // Entrada
  document.getElementById('btn-confirmar-entrada')?.addEventListener('click', () => {
    const pecaId = parseInt(document.getElementById('ent-peca').value);
    const qty = parseInt(document.getElementById('ent-qty').value);
    const resp = document.getElementById('ent-resp').value;
    const obs = document.getElementById('ent-obs').value;
    
    if (registrarEntrada(pecaId, qty, resp, obs)) {
      limparFormEntrada();
    }
  });
  
  document.getElementById('btn-limpar-entrada')?.addEventListener('click', limparFormEntrada);
  
  // Saída - adicionar item
  document.getElementById('btn-add-item')?.addEventListener('click', () => {
    const pecaId = parseInt(document.getElementById('out-peca').value);
    const qty = parseInt(document.getElementById('out-qty').value);
    
    if (adicionarItemSaida(pecaId, qty)) {
      document.getElementById('out-peca').value = '';
      document.getElementById('out-qty').value = 1;
      renderSaidaItems();
    }
  });
  
  // Saída - atualizar total ao mudar desconto
  document.getElementById('out-desc')?.addEventListener('input', atualizarTotaisSaida);
  
  // Saída - finalizar
  document.getElementById('btn-finalizar-saida')?.addEventListener('click', () => {
    const cliente = document.getElementById('out-cliente').value;
    const doc = document.getElementById('out-doc').value;
    const pagamento = document.getElementById('out-pag').value;
    const desconto = parseFloat(document.getElementById('out-desc').value) || 0;
    
    const nota = finalizarSaida({ cliente, doc, pagamento, desconto });
    if (nota) {
      // Limpa formulário
      document.getElementById('out-cliente').value = '';
      document.getElementById('out-doc').value = '';
      document.getElementById('out-desc').value = 0;
      renderSaidaItems();
      
      // Mostra a NF
      document.getElementById('nf-content').innerHTML = gerarHTMLNota(nota);
      abrirModal('modal-nf');
    }
  });
  
  // Saída - cancelar
  document.getElementById('btn-cancelar-saida')?.addEventListener('click', () => {
    cancelarSaida();
    document.getElementById('out-cliente').value = '';
    document.getElementById('out-doc').value = '';
    document.getElementById('out-desc').value = 0;
    renderSaidaItems();
  });
  
  // Imprimir NF
  document.getElementById('btn-imprimir-nf')?.addEventListener('click', () => {
    const content = document.getElementById('nf-printable');
    if (content) {
      imprimirNota(content.outerHTML);
    }
  });
}