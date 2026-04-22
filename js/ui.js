// ui.js - Gerenciamento da interface do usuário

import { 
  produtos, 
  getCategorias, 
  editarProduto, 
  excluirProduto,
  solicitarExclusaoProduto,
  limparFormProduto, 
  editProdId 
} from './produtos.js';

import { 
  movimentos, 
  getMovimentosFiltrados, 
  getSaidaItems, 
  adicionarItemSaida, 
  removerItemSaida, 
  calcularTotaisSaida, 
  finalizarSaida, 
  cancelarSaida, 
  registrarEntrada, 
  limparFormEntrada 
} from './movimentos.js';

import { 
  notas, 
  getNota, 
  gerarHTMLNota, 
  imprimirNota, 
  getTodasNotas 
} from './notas.js';

import { 
  formatarMoeda, 
  formatarData, 
  mostrarToast, 
  abrirModal, 
  fecharModal,
  validarCPF,
  validarCNPJ,
  limparMascara
} from './utils.js';

// ===== ESTADO DA UI =====
let paginaAtual = 'dashboard';
let filtroMovimentos = 'todos';
let confirmCallback = null;

// ===== NOTIFICAÇÕES =====
let notificacaoAtiva = false;
let intervaloNotificacao = null;
let chartCategorias = null;

// ===== NAVEGAÇÃO =====
export function mostrarPagina(nome) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${nome}`).classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${nome}"]`)?.classList.add('active');
  
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
  
  const badge = document.getElementById('alert-badge');
  if (badge) {
    badge.textContent = `● ${criticos.length} ALERTA${criticos.length !== 1 ? 'S' : ''}`;
  }
  
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
  
  renderGraficoCategorias();
}

// ===== GRÁFICO =====
export function renderGraficoCategorias() {
  const canvas = document.getElementById('chart-categorias');
  if (!canvas || typeof Chart === 'undefined') return;
  
  const categorias = {};
  produtos.forEach(p => {
    categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
  });
  
  const labels = Object.keys(categorias);
  const data = Object.values(categorias);
  const cores = ['#f97316', '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  
  if (chartCategorias) {
    chartCategorias.destroy();
  }
  
  chartCategorias = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: cores.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#1e242d'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#e2e8f0', font: { family: 'Barlow', size: 12 } }
        }
      }
    }
  });
}

// ===== ESTOQUE =====
export function renderEstoque() {
  const search = document.getElementById('search-estoque')?.value.toLowerCase() || '';
  const cat = document.getElementById('filter-cat')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const ordem = document.getElementById('filter-ordem')?.value || 'nome-asc';
  
  let lista = produtos.filter(p => {
    const matchSearch = !search || p.nome.toLowerCase().includes(search) || p.codigo.toLowerCase().includes(search);
    const matchCat = !cat || p.categoria === cat;
    let matchStatus = true;
    if (status === 'ok') matchStatus = p.qty > p.min;
    else if (status === 'baixo') matchStatus = p.qty <= p.min && p.qty > 0;
    else if (status === 'zerado') matchStatus = p.qty === 0;
    return matchSearch && matchCat && matchStatus;
  });
  
  switch (ordem) {
    case 'nome-asc': lista.sort((a, b) => a.nome.localeCompare(b.nome)); break;
    case 'nome-desc': lista.sort((a, b) => b.nome.localeCompare(a.nome)); break;
    case 'preco-asc': lista.sort((a, b) => a.venda - b.venda); break;
    case 'preco-desc': lista.sort((a, b) => b.venda - a.venda); break;
    case 'qty-asc': lista.sort((a, b) => a.qty - b.qty); break;
    case 'qty-desc': lista.sort((a, b) => b.qty - a.qty); break;
  }
  
  const filterCat = document.getElementById('filter-cat');
  if (filterCat) {
    const cats = getCategorias();
    const currentVal = filterCat.value;
    filterCat.innerHTML = '<option value="">Todas categorias</option>' + 
      cats.map(c => `<option ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
  }
  
  const countEl = document.getElementById('count-estoque');
  if (countEl) countEl.textContent = `${lista.length} itens encontrados`;
  
  const tbody = document.getElementById('tbody-estoque');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px">Nenhuma peça encontrada.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(p => {
    let statusCls = 'stock-ok', statusTxt = 'OK';
    if (p.qty === 0) { statusCls = 'stock-out'; statusTxt = 'ZERADO'; }
    else if (p.qty <= p.min) { statusCls = 'stock-low'; statusTxt = 'BAIXO'; }
    
    return `
      <tr>
        <td><span class="code-tag">${p.codigo}</span></td>
        <td><div style="font-weight:600">${p.nome}</div><div style="font-size:11px;color:var(--text3)">${p.marca||''}</div></td>
        <td>${p.categoria}</td>
        <td>${p.localizacao||'—'}</td>
        <td>${p.qty}</td>
        <td>${p.min}</td>
        <td><span class="stock-badge ${statusCls}">${statusTxt}</span></td>
        <td>R$ ${formatarMoeda(p.venda)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-editar-produto" data-id="${p.id}">✏️</button>
          <button class="btn btn-red btn-sm btn-excluir-produto" data-id="${p.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
  
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
      solicitarExclusaoProduto(id);
    });
  });
}

// ===== MOVIMENTOS =====
export function renderMovimentos() {
  const lista = getMovimentosFiltrados(filtroMovimentos);
  const tbody = document.getElementById('tbody-mov');
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px">Nenhum movimento.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td>${formatarData(m.data)}</td>
      <td><span class="stock-badge ${m.tipo === 'entrada' ? 'stock-ok' : 'stock-out'}">${m.tipo.toUpperCase()}</span></td>
      <td><div style="font-weight:600">${m.peca}</div><div style="font-size:11px">${m.codigo}</div></td>
      <td style="color:${m.tipo==='entrada'?'var(--green)':'var(--red)'}">${m.tipo==='entrada'?'+':'-'}${m.qty}</td>
      <td>${m.resp||'—'}</td>
      <td>${m.obs||'—'}</td>
    </tr>
  `).join('');
}

export function setFiltroMovimentos(filtro) {
  filtroMovimentos = filtro;
  renderMovimentos();
}

// ===== NOTAS =====
export function renderNotas() {
  const tbody = document.getElementById('tbody-notas');
  const lista = getTodasNotas();
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px">Nenhuma nota emitida.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(n => `
    <tr>
      <td><span class="code-tag">NF-${n.numero}</span></td>
      <td>${formatarData(n.data)}</td>
      <td>${n.cliente}</td>
      <td>${n.doc||'—'}</td>
      <td>${n.itens.length} item(s)</td>
      <td>R$ ${formatarMoeda(n.total)}</td>
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
    el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px">Nenhum item adicionado.</p>';
    atualizarTotaisSaida();
    return;
  }
  
  el.innerHTML = `
    <table style="width:100%;font-size:13px">
      <thead><tr><th>Peça</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead>
      <tbody>
        ${items.map((i, idx) => `
          <tr>
            <td><div style="font-weight:600">${i.nome}</div><div style="font-size:11px">${i.codigo}</div></td>
            <td>${i.qty}</td>
            <td>R$ ${formatarMoeda(i.preco)}</td>
            <td>R$ ${formatarMoeda(i.preco * i.qty)}</td>
            <td><button class="btn btn-red btn-sm btn-remover-item" data-idx="${idx}">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.querySelectorAll('.btn-remover-item').forEach(btn => {
    btn.addEventListener('click', () => {
      removerItemSaida(parseInt(btn.dataset.idx));
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

// ===== NOTIFICAÇÕES DE ESTOQUE =====
export function verificarEstoqueBaixo() {
  const criticos = produtos.filter(p => p.qty <= p.min);
  const badge = document.getElementById('alert-badge');
  if (!badge) return;
  
  if (criticos.length > 0) {
    badge.textContent = `⚠️ ${criticos.length} ALERTA${criticos.length !== 1 ? 'S' : ''}`;
    badge.classList.add('alert-active');
    
    if (!notificacaoAtiva) {
      notificacaoAtiva = true;
      const nomesCriticos = criticos.slice(0, 3).map(p => p.nome).join(', ');
      const mensagem = criticos.length > 3 ? `${nomesCriticos} e mais ${criticos.length - 3} itens...` : `${nomesCriticos}`;
      mostrarToast(`⚠️ Estoque baixo: ${mensagem}`, 'error');
    }
  } else {
    badge.textContent = `● 0 ALERTAS`;
    badge.classList.remove('alert-active');
    notificacaoAtiva = false;
  }
}

export function iniciarMonitoramentoEstoque() {
  intervaloNotificacao = setInterval(verificarEstoqueBaixo, 30000);
  setTimeout(verificarEstoqueBaixo, 2000);
}

// ===== CONFIRMAÇÃO =====
export function confirmarAcao(titulo, mensagem, onConfirm) {
  document.getElementById('confirm-title').textContent = titulo;
  document.getElementById('confirm-message').textContent = mensagem;
  confirmCallback = onConfirm;
  abrirModal('modal-confirmacao');
}

// ===== INICIALIZAÇÃO DE EVENTOS =====
export function inicializarEventos() {
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => mostrarPagina(e.currentTarget.dataset.page));
  });
  
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.currentTarget.dataset.modal === 'modal-produto') limparFormProduto();
      abrirModal(e.currentTarget.dataset.modal);
    });
  });
  
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => fecharModal(e.currentTarget.dataset.closeModal));
  });
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  
  document.getElementById('btn-salvar-produto')?.addEventListener('click', () => {
    import('./produtos.js').then(m => {
      m.salvarProduto({
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
      });
    });
  });
  
  document.getElementById('search-estoque')?.addEventListener('input', renderEstoque);
  document.getElementById('filter-cat')?.addEventListener('change', renderEstoque);
  document.getElementById('filter-status')?.addEventListener('change', renderEstoque);
  document.getElementById('filter-ordem')?.addEventListener('change', renderEstoque);
  document.getElementById('btn-limpar-filtros')?.addEventListener('click', () => {
    document.getElementById('search-estoque').value = '';
    document.getElementById('filter-cat').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-ordem').value = 'nome-asc';
    renderEstoque();
  });
  
  document.querySelectorAll('[data-mov-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-mov-filter]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      setFiltroMovimentos(e.currentTarget.dataset.movFilter);
    });
  });
  
  document.getElementById('btn-confirmar-entrada')?.addEventListener('click', () => {
    if (registrarEntrada(
      parseInt(document.getElementById('ent-peca').value),
      parseInt(document.getElementById('ent-qty').value),
      document.getElementById('ent-resp').value,
      document.getElementById('ent-obs').value
    )) limparFormEntrada();
  });
  
  document.getElementById('btn-limpar-entrada')?.addEventListener('click', limparFormEntrada);
  
  document.getElementById('btn-add-item')?.addEventListener('click', () => {
    if (adicionarItemSaida(
      parseInt(document.getElementById('out-peca').value),
      parseInt(document.getElementById('out-qty').value)
    )) {
      document.getElementById('out-peca').value = '';
      document.getElementById('out-qty').value = 1;
      renderSaidaItems();
    }
  });
  
  document.getElementById('out-desc')?.addEventListener('input', atualizarTotaisSaida);
  
  document.getElementById('btn-finalizar-saida')?.addEventListener('click', () => {
    const cliente = document.getElementById('out-cliente').value;
    const doc = document.getElementById('out-doc').value;
    const pagamento = document.getElementById('out-pag').value;
    const desconto = parseFloat(document.getElementById('out-desc').value) || 0;
    
    if (doc && doc.trim() !== '') {
      const numerosDoc = doc.replace(/\D/g, '');
      if (numerosDoc.length === 11 && !validarCPF(doc)) {
        mostrarToast('CPF inválido!', 'error');
        return;
      }
      if (numerosDoc.length === 14 && !validarCNPJ(doc)) {
        mostrarToast('CNPJ inválido!', 'error');
        return;
      }
    }
    
    const nota = finalizarSaida({ cliente, doc, pagamento, desconto });
    if (nota) {
      document.getElementById('out-cliente').value = '';
      document.getElementById('out-doc').value = '';
      document.getElementById('out-desc').value = 0;
      renderSaidaItems();
      document.getElementById('nf-content').innerHTML = gerarHTMLNota(nota);
      abrirModal('modal-nf');
    }
  });
  
  document.getElementById('btn-cancelar-saida')?.addEventListener('click', () => {
    cancelarSaida();
    document.getElementById('out-cliente').value = '';
    document.getElementById('out-doc').value = '';
    document.getElementById('out-desc').value = 0;
    renderSaidaItems();
  });
  
  document.getElementById('btn-imprimir-nf')?.addEventListener('click', () => {
    const content = document.getElementById('nf-printable');
    if (content) imprimirNota(content.outerHTML);
  });
  
  document.getElementById('btn-confirmar-acao')?.addEventListener('click', () => {
    if (confirmCallback) { confirmCallback(); confirmCallback = null; }
    fecharModal('modal-confirmacao');
  });
}