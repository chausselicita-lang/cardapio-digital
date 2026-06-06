// ===== ADMIN — Cardápio Digital =====

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const CONFIG_KEY    = 'cardapio_config';
const SENHA_PADRAO  = 'admin123';

// Sempre usa Supabase com o ID fixo do restaurante
const rid  = SUPA_RID;
const modo = 'supabase';

// ===== LIMITE POR PLANO =====
let limiteQR = Infinity;

const PLANOS_LIMITE = [
  { max: 5,        nome: 'Starter',    limite: 5  },
  { max: 10,       nome: 'Popular',    limite: 10 },
  { max: 20,       nome: 'Pro',        limite: 20 },
  { max: 50,       nome: 'Business',   limite: 50 },
  { max: Infinity, nome: 'Enterprise', limite: Infinity },
];

function getLimitePlano(numMesas) {
  const entry = PLANOS_LIMITE.find(p => numMesas <= p.max) || PLANOS_LIMITE[PLANOS_LIMITE.length - 1];
  return entry;
}

function atualizarBadgePlano(numMesas, plano) {
  const badge    = $('#planoInfoBadge');
  const nomeEl   = $('#planoNomeBadge');
  const limiteEl = $('#planoLimiteTag');
  if (!badge) return;

  const entry = getLimitePlano(numMesas || 0);
  limiteQR = entry.limite;

  nomeEl.textContent   = plano || entry.nome;
  limiteEl.textContent = entry.limite === Infinity ? 'Mesas ilimitadas' : `Máx. ${entry.limite} mesas`;
  badge.style.display  = 'flex';

  // Ajusta o max do input
  const inputMesas = $('#numMesas');
  if (entry.limite !== Infinity) {
    inputMesas.max = entry.limite;
    if (parseInt(inputMesas.value) > entry.limite) inputMesas.value = entry.limite;
  }
}

function carregarConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; }
}
function salvarConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// ===== LOGIN =====
const loginOverlay = $('#adminLoginOverlay');
const senhaInput   = $('#senhaInput');
const loginError   = $('#loginError');

function verificarSessao() {
  if (sessionStorage.getItem('admin_auth') === '1') {
    carregarDadosRestaurante();
    abrirTabCardapio();
    return;
  }
  loginOverlay.style.display = 'flex';
}

async function tentarLogin() {
  const senha = senhaInput.value;
  loginError.style.display = 'none';

  const config = carregarConfig();
  const correta = config.senhaAdmin || SENHA_PADRAO;

  if (senha === correta) {
    sessionStorage.setItem('admin_auth', '1');
    loginOverlay.style.display = 'none';
    senhaInput.value = '';
    carregarDadosRestaurante();
    abrirTabCardapio();
  } else {
    loginError.style.display = 'block';
    senhaInput.value = '';
    senhaInput.focus();
  }
}

$('#btnEntrar').addEventListener('click', tentarLogin);
senhaInput.addEventListener('keydown', e => { if (e.key === 'Enter') tentarLogin(); });

$('#btnSair').addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth');
  loginOverlay.style.display = 'flex';
  senhaInput.value = '';
  loginError.style.display = 'none';
  setTimeout(() => senhaInput.focus(), 100);
});

// ===== CARREGAR DADOS DO RESTAURANTE =====
function carregarDadosRestaurante() {
  const config = carregarConfig();
  const nome = config.nomeRestaurante || 'Sabor & Arte';
  const sub = document.querySelector('.admin-header-sub');
  if (sub) sub.textContent = `| ${nome}`;
}

// Verifica sessão ao carregar
verificarSessao();

// ===== CONFIGURAÇÕES EM LISTA =====
const autoUrl = window.location.href.replace(/[?#].*$/, '').replace(/admin\.html$/, 'index.html');

// Mapeamento: chave interna → { storageKey, inputId, valId, itemId, label }
const CONFIG_MAP = {
  nomeEstab:{ key: 'nomeRestaurante', inputId: 'inp-nome',     valId: 'val-nome',     itemId: 'ci-nome'     },
  tipoEstab:{ key: 'tipoEstab',       inputId: 'inp-tipo',     valId: 'val-tipo',     itemId: 'ci-tipo'     },
  pix:      { key: 'chavePix',        inputId: 'inp-pix',      valId: 'val-pix',      itemId: 'ci-pix'      },
  cartao:   { key: 'linkCartao',      inputId: 'inp-cartao',   valId: 'val-cartao',   itemId: 'ci-cartao'   },
  whatsapp: { key: 'whatsapp',        inputId: 'inp-whatsapp', valId: 'val-whatsapp', itemId: 'ci-whatsapp' },
  senha:    { key: 'senhaAdmin',      inputId: 'inp-senha',    valId: 'val-senha',    itemId: 'ci-senha'    },
};

function renderConfigList() {
  const cfg = carregarConfig();
  Object.entries(CONFIG_MAP).forEach(([name, { key, valId }]) => {
    const el  = document.getElementById(valId);
    if (!el) return;
    const val = cfg[key] || '';
    if (name === 'senha') {
      el.textContent = val ? '••••••  (configurada)' : '••••••  (padrão: admin123)';
      el.className   = 'config-item-val' + (val ? ' set' : '');
    } else if (val) {
      el.textContent = val.length > 40 ? val.slice(0, 40) + '…' : val;
      el.className   = 'config-item-val set';
    } else {
      el.textContent = 'Não configurado';
      el.className   = 'config-item-val';
    }
  });
}

function toggleConfig(name) {
  const { inputId, itemId, key } = CONFIG_MAP[name];
  const item = document.getElementById(itemId);
  const isOpen = item.classList.contains('open');

  // Fecha todos
  Object.values(CONFIG_MAP).forEach(({ itemId: id }) =>
    document.getElementById(id).classList.remove('open')
  );

  if (!isOpen) {
    item.classList.add('open');
    const cfg = carregarConfig();
    const inp = document.getElementById(inputId);
    inp.value = name === 'senha' ? '' : (cfg[key] || '');
    setTimeout(() => inp.focus(), 50);
  }
}

function fecharConfig(name) {
  document.getElementById(CONFIG_MAP[name].itemId).classList.remove('open');
}

async function salvarConfigItem(name) {
  const { key, inputId, itemId } = CONFIG_MAP[name];
  const inp = document.getElementById(inputId);
  let val   = inp.value.trim();

  if (name === 'senha') {
    if (!val) { mostrarToast('⚠️ Digite a nova senha'); inp.focus(); return; }
    if (val.length < 6) { mostrarToast('⚠️ Mínimo 6 caracteres'); inp.focus(); return; }
  }
  if (name === 'whatsapp') val = val.replace(/\D/g, '');

  const cfg = { ...carregarConfig(), [key]: val };
  salvarConfig(cfg);

  // Senha salva apenas no localStorage

  document.getElementById(itemId).classList.remove('open');
  renderConfigList();
  mostrarToast('✅ ' + ({ nomeEstab:'Nome', tipoEstab:'Tipo', pix:'Chave PIX', cartao:'Link do Cartão', whatsapp:'WhatsApp', senha:'Senha' }[name]) + ' salvo!');
}

// Inicializa lista ao carregar
renderConfigList();

// Toggle: mostrar WhatsApp no comprovante do cliente
function renderToggleWhats() {
  const cfg = carregarConfig();
  const el = document.getElementById('toggleWhatsRecibo');
  if (el) el.checked = cfg.mostrarWhatsRecibo !== false;
}
function salvarToggleWhats() {
  const el = document.getElementById('toggleWhatsRecibo');
  if (!el) return;
  const cfg = { ...carregarConfig(), mostrarWhatsRecibo: el.checked };
  salvarConfig(cfg);
  mostrarToast(el.checked ? '✅ Botão WhatsApp ativado no comprovante' : '✅ Botão WhatsApp oculto no comprovante');
}
renderToggleWhats();

// URL base e num mesas para o tab de QR
$('#urlBase').value  = carregarConfig().urlBase  || (rid ? `${autoUrl}?rid=${rid}` : autoUrl);
$('#numMesas').value = carregarConfig().numMesas || 10;

// ===== TABS =====
function abrirTabCardapio() {
  $$('.tab-btn').forEach(b => b.classList.remove('active'));
  $$('.tab-content').forEach(t => t.style.display = 'none');
  const btn = $('[data-tab="cardapio"]');
  if (btn) btn.classList.add('active');
  const tab = $('#tab-cardapio');
  if (tab) tab.style.display = 'block';
  carregarCardapio();
}

$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(t => t.style.display = 'none');
    btn.classList.add('active');
    $(`#tab-${btn.dataset.tab}`).style.display = 'block';
    if (btn.dataset.tab === 'cardapio')   carregarCardapio();
    if (btn.dataset.tab === 'pedidos')   { carregarPedidos(); iniciarRealtimePedidos(); }
    if (btn.dataset.tab === 'relatorios') renderRelatorios();
  });
});

// Atualiza link "Ver Cardápio" com o rid do restaurante
if (rid) {
  const linkCardapio = $('.btn-ver-cardapio');
  if (linkCardapio) linkCardapio.href = `index.html?rid=${rid}`;
}

// ===== GERENCIAR CARDÁPIO =====
const PRATOS_LS_KEY = 'cardapio_pratos';
let pratosCache  = [];
let editandoId   = null;
let filtroCatAtivo = 'todos';
let excluindoId  = null;

const CATEGORIAS_LABEL = {
  entradas:'Entradas', pratos:'Pratos', lanches:'Lanches',
  pizzas:'Pizzas', petiscos:'Petiscos', bebidas:'Bebidas',
  sobremesas:'Sobremesas', combos:'Combos'
};
const BADGES_LABEL = { popular:'⭐ Popular', novo:'🆕 Novo', chef:'👨‍🍳 Chef Indica' };

// --- Carregar pratos ---
async function carregarCardapio() {
  $('#pratosLoading').style.display = 'block';
  $('#pratosVazio').style.display   = 'none';
  $('#pratosGrid').innerHTML        = '';

  if (modo === 'supabase') {
    try {
      const { data, error } = await db
        .from('cardapio_items')
        .select('*')
        .eq('restaurante_id', rid)
        .order('categoria').order('ordem');
      if (error) throw error;
      pratosCache = data || [];
    } catch {
      pratosCache = [];
    }
  } else {
    // Modo local: localStorage sobrescreve data.js
    const salvo = localStorage.getItem(PRATOS_LS_KEY);
    pratosCache = salvo ? JSON.parse(salvo) : (window.MENU_DEFAULT?.produtos || []);
  }

  $('#pratosLoading').style.display = 'none';
  renderPratos();
}

// --- Renderizar lista vertical ---
function renderPratos() {
  const grid  = $('#pratosGrid');
  const vazio = $('#pratosVazio');
  grid.innerHTML = '';

  const lista = filtroCatAtivo === 'todos'
    ? pratosCache
    : pratosCache.filter(p => p.categoria === filtroCatAtivo);

  if (lista.length === 0) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  lista.forEach(p => {
    const preco = parseFloat(p.preco || p.preco_original || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    const cat   = CATEGORIAS_LABEL[p.categoria] || p.categoria || '';
    const badge = p.tag ? `<span class="prato-badge ${p.tag}">${BADGES_LABEL[p.tag] || p.tag}</span>` : '';
    const foto  = p.foto_url || p.foto || '';
    const disponivel = p.disponivel !== false;

    const item = document.createElement('div');
    item.className = `prato-item${disponivel ? '' : ' indisponivel'}`;
    item.dataset.id = p.id;
    item.innerHTML = `
      ${foto
        ? `<div class="prato-item-foto"><img src="${foto}" alt="${p.nome}" onerror="this.parentElement.innerHTML='<div style=\\'width:72px;height:72px;background:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:26px\\'>🍽️</div>'" /></div>`
        : `<div class="prato-item-foto-ph">🍽️</div>`}
      <div class="prato-item-info">
        <div class="prato-item-top">
          <div class="prato-nome">${p.nome}</div>
          ${badge}
        </div>
        <div class="prato-item-meta">
          <span class="prato-cat-tag">${cat}${!disponivel ? ' · Indisponível' : ''}</span>
          <span class="prato-preco">${preco}</span>
        </div>
        ${p.descricao ? `<div class="prato-desc">${p.descricao}</div>` : ''}
      </div>
      <div class="prato-item-acoes">
        <button class="btn-editar-prato" data-id="${p.id}">✏️ Editar Prato</button>
        <button class="btn-excluir-prato" data-id="${p.id}" data-nome="${p.nome}">🗑️ Excluir</button>
      </div>`;
    grid.appendChild(item);
  });

  $$('.btn-editar-prato').forEach(btn => {
    btn.addEventListener('click', () => {
      const prato = pratosCache.find(p => String(p.id) === btn.dataset.id);
      if (prato) abrirModalPrato(prato);
    });
  });
  $$('.btn-excluir-prato').forEach(btn => {
    btn.addEventListener('click', () => confirmarExcluir(btn.dataset.id, btn.dataset.nome));
  });
}

// --- Filtros de categoria ---
$$('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroCatAtivo = btn.dataset.cat;
    renderPratos();
  });
});

// --- Abrir modal ---
function abrirModalPrato(prato = null) {
  editandoId = prato ? prato.id : null;
  $('#modalPratoTitulo').textContent = prato ? 'Editar Prato' : 'Novo Prato';

  // Preenche ou limpa campos
  $('#pratoFoto').value       = prato?.foto_url || prato?.foto || '';
  $('#pratoNome').value       = prato?.nome        || '';
  $('#pratoDesc').value       = prato?.descricao   || '';
  $('#pratoPreco').value      = prato?.preco        || '';
  $('#pratoCat').value        = prato?.categoria    || '';
  $('#pratoBadge').value      = prato?.tag          || '';
  $('#pratoDisponivel').checked = prato ? prato.disponivel !== false : true;

  atualizarPreviewFoto();
  $('#modalPratoOverlay').classList.add('open');
  setTimeout(() => $('#pratoNome').focus(), 100);
}

function fecharModal() {
  $('#modalPratoOverlay').classList.remove('open');
}

$('#btnNovoPrato').addEventListener('click',    () => abrirModalPrato());
$('#btnFecharModal').addEventListener('click',  fecharModal);
$('#btnCancelarModal').addEventListener('click', fecharModal);
$('#modalPratoOverlay').addEventListener('click', e => {
  if (e.target === $('#modalPratoOverlay')) fecharModal();
});

// Preview de foto
$('#pratoFoto').addEventListener('input', atualizarPreviewFoto);
function atualizarPreviewFoto() {
  const url = $('#pratoFoto').value.trim();
  const wrap = $('#previewWrap');
  if (url) {
    $('#pratoFotoPreview').src = url;
    wrap.classList.add('show');
  } else {
    wrap.classList.remove('show');
  }
}

// --- Salvar prato ---
$('#btnSalvarPrato').addEventListener('click', salvarPrato);

async function salvarPrato() {
  const nome       = $('#pratoNome').value.trim();
  const preco      = parseFloat($('#pratoPreco').value);
  const categoria  = $('#pratoCat').value;
  const descricao  = $('#pratoDesc').value.trim();
  const foto_url   = $('#pratoFoto').value.trim();
  const tag        = $('#pratoBadge').value;
  const disponivel = $('#pratoDisponivel').checked;

  if (!nome)      { mostrarToast('⚠️ Informe o nome do prato');    return; }
  if (!preco || preco <= 0) { mostrarToast('⚠️ Informe um preço válido'); return; }
  if (!categoria) { mostrarToast('⚠️ Selecione uma categoria');    return; }

  const btn = $('#btnSalvarPrato');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if (modo === 'supabase') {
      const payload = { nome, descricao, preco, categoria, foto_url, tag, disponivel, restaurante_id: rid };

      if (editandoId) {
        const { error } = await db.from('cardapio_items').update(payload).eq('id', editandoId);
        if (error) throw error;
      } else {
        const { error } = await db.from('cardapio_items').insert(payload);
        if (error) throw error;
      }
    } else {
      // Modo local
      if (editandoId) {
        const idx = pratosCache.findIndex(p => String(p.id) === String(editandoId));
        if (idx !== -1) pratosCache[idx] = { ...pratosCache[idx], nome, descricao, preco, categoria, foto_url, tag, disponivel };
      } else {
        pratosCache.push({ id: Date.now(), nome, descricao, preco, categoria, foto_url, tag, disponivel });
      }
      localStorage.setItem(PRATOS_LS_KEY, JSON.stringify(pratosCache));
    }

    fecharModal();
    await carregarCardapio();
    mostrarToast(editandoId ? '✅ Prato atualizado!' : '✅ Prato adicionado!');
  } catch (err) {
    mostrarToast('❌ Erro ao salvar: ' + (err.message || err));
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Salvar Prato';
  }
}

// --- Confirmar e excluir ---
function confirmarExcluir(id, nome) {
  excluindoId = id;
  $('#confirmDelNome').textContent = `Excluir "${nome}"? Esta ação não pode ser desfeita.`;
  $('#confirmDel').classList.add('open');
}

$('#btnCancelDel').addEventListener('click', () => {
  excluindoId = null;
  $('#confirmDel').classList.remove('open');
});

$('#btnConfirmDel').addEventListener('click', async () => {
  if (!excluindoId) return;
  const btn = $('#btnConfirmDel');
  btn.disabled = true;

  try {
    if (modo === 'supabase') {
      const { error } = await db.from('cardapio_items').delete().eq('id', excluindoId);
      if (error) throw error;
    } else {
      pratosCache = pratosCache.filter(p => String(p.id) !== String(excluindoId));
      localStorage.setItem(PRATOS_LS_KEY, JSON.stringify(pratosCache));
    }
    $('#confirmDel').classList.remove('open');
    excluindoId = null;
    await carregarCardapio();
    mostrarToast('🗑️ Prato excluído!');
  } catch (err) {
    mostrarToast('❌ Erro ao excluir: ' + (err.message || err));
  } finally {
    btn.disabled = false;
  }
});


// ===== GERAR QR CODES =====
$('#btnGerarQR').addEventListener('click', gerarQRCodes);
$('#btnRegerar').addEventListener('click', gerarQRCodes);

function gerarQRCodes() {
  const urlBase  = $('#urlBase').value.trim();
  const numMesas = Math.min(Math.max(parseInt($('#numMesas').value) || 10, 1), 200);
  const avisoEl  = $('#limiteAviso');

  if (!urlBase) { mostrarToast('⚠️ Informe a URL base do cardápio'); return; }

  // Verifica limite do plano (somente no modo Supabase)
  if (modo === 'supabase' && limiteQR !== Infinity && numMesas > limiteQR) {
    if (avisoEl) {
      $('#limiteAvisoTexto').textContent =
        `Seu plano permite até ${limiteQR} mesa${limiteQR > 1 ? 's' : ''}. ` +
        `Faça upgrade para adicionar mais mesas.`;
      avisoEl.style.display = 'flex';
    }
    $('#qrActionsWrap').style.display = 'none';
    return;
  }
  if (avisoEl) avisoEl.style.display = 'none';

  salvarConfig({ ...carregarConfig(), urlBase, numMesas });

  const qrGrid = $('#qrGrid');
  qrGrid.innerHTML = '';

  for (let i = 1; i <= numMesas; i++) {
    const base = urlBase.replace(/\/$/, '').replace(/[?#].*$/, '');
    const ridParam = rid ? `&rid=${rid}` : '';
    const url = `${base}?mesa=${i}${ridParam}`;

    const card = document.createElement('div');
    card.className = 'qr-card';
    card.innerHTML = `
      <div class="qr-card-titulo">🍽️ CARDÁPIO</div>
      <div class="qr-code" id="qr-mesa-${i}"></div>
      <div class="qr-card-info">
        <strong>Mesa ${i}</strong>
        <span class="qr-url">${url}</span>
      </div>`;
    qrGrid.appendChild(card);

    new QRCode(document.getElementById(`qr-mesa-${i}`), {
      text: url, width: 160, height: 160,
      colorDark: '#1A0F00', colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  $('#qrActionsWrap').style.display = 'block';
  mostrarToast(`✅ ${numMesas} QR Code${numMesas > 1 ? 's' : ''} gerado${numMesas > 1 ? 's' : ''}!`);
  setTimeout(() => $('#qrActionsWrap').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

// ===== IMPRIMIR =====
$('#btnImprimirQR').addEventListener('click', () => window.print());

// ===== PEDIDOS =====
let pedidosFiltroAtivo = 'ativos';
let pedidosAutoTimer = null;
let pedidosCache = [];

$$('.ped-filtro').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.ped-filtro').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pedidosFiltroAtivo = btn.dataset.status;
    carregarPedidos();
  });
});

$('#btnAtualizarPedidos')?.addEventListener('click', carregarPedidos);

async function carregarPedidos() {
  const loading = $('#pedidosLoading');
  const vazio   = $('#pedidosVazio');
  const lista   = $('#pedidosLista');
  if (!loading) return;

  loading.style.display = 'block';
  vazio.style.display   = 'none';
  lista.innerHTML       = '';

  if (typeof db === 'undefined') {
    loading.textContent = '⚠️ Supabase não configurado.';
    return;
  }

  let query = db.from('cardapio_pedidos')
    .select('*')
    .eq('restaurante_id', rid)
    .order('created_at', { ascending: false });

  if (pedidosFiltroAtivo === 'ativos') {
    query = query.neq('status', 'entregue').neq('status', 'fechado');
  } else if (pedidosFiltroAtivo === 'fechado') {
    query = query.eq('status', 'fechado');
  }

  const { data, error } = await query.limit(80);
  loading.style.display = 'none';

  if (error || !data || data.length === 0) {
    vazio.style.display = 'block';
    atualizarContadorPedidos(0);
    return;
  }

  pedidosCache = data;
  renderPedidos(data);
  atualizarContadorPedidos(data.filter(p => p.status === 'novo').length);

  clearTimeout(pedidosAutoTimer);
  pedidosAutoTimer = setTimeout(carregarPedidos, 20000);
}

function atualizarContadorPedidos(n) {
  const el = $('#pedidosContador');
  if (!el) return;
  if (n > 0) { el.textContent = n; el.style.display = 'inline-flex'; }
  else { el.style.display = 'none'; }
}

const STATUS_LABEL = {
  novo:        '🔴 Novo',
  em_preparo:  '🟡 Em Preparo',
  pronto:      '🟢 Pronto',
  entregue:    '✅ Entregue',
  fechado:     '💰 Conta Fechada',
};

const PAG_STATUS_LABEL = {
  pendente:    '⏳ Aguardando pagamento',
  confirmado:  '✅ Pago',
  presencial:  '💵 Presencial',
};

function renderPedidos(pedidos) {
  const lista = $('#pedidosLista');
  lista.innerHTML = '';

  pedidos.forEach(p => {
    const hora  = new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const data  = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const total = parseFloat(p.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const status = p.status || 'novo';
    const itens  = Array.isArray(p.itens) ? p.itens : [];

    const linhasItens = itens.map(it =>
      `<div class="pedido-linha-item">${it.emoji || '•'} <strong>${it.nome}</strong> x${it.qty} — ${parseFloat(it.preco * it.qty).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>`
    ).join('');

    const payStatus = p.payment_status || 'pendente';

    const botoesStatus = [];
    // Botão de confirmação de pagamento — aparece para PIX/Cartão ainda pendentes
    if (payStatus === 'pendente' && status !== 'fechado') {
      botoesStatus.push(`<button class="btn-ped btn-ped-confirmar-pag" onclick="confirmarPagamento('${p.id}')">✅ Confirmar Pag.</button>`);
    }
    if (status === 'novo')       botoesStatus.push(`<button class="btn-ped btn-ped-preparo" onclick="mudarStatusPedido('${p.id}','em_preparo')">👨‍🍳 Em Preparo</button>`);
    if (status === 'em_preparo') botoesStatus.push(`<button class="btn-ped btn-ped-pronto"  onclick="mudarStatusPedido('${p.id}','pronto')">✅ Pronto</button>`);
    if (status === 'pronto')     botoesStatus.push(`<button class="btn-ped btn-ped-entregue" onclick="mudarStatusPedido('${p.id}','entregue')">🚀 Entregue</button>`);
    if (status !== 'fechado')    botoesStatus.push(`<button class="btn-ped btn-ped-fechar"  onclick="fecharContaPedido('${p.id}')">💰 Fechar Conta</button>`);
    botoesStatus.push(`<button class="btn-ped btn-ped-print" onclick="imprimirPedidoAdmin('${p.id}')" title="Imprimir nota">🖨️</button>`);

    const card = document.createElement('div');
    card.className = `pedido-card status-${status}${payStatus === 'pendente' ? ' pag-pendente' : ''}`;
    card.id = `pedido-${p.id}`;
    card.innerHTML = `
      <div class="pedido-header">
        <span class="pedido-mesa">🪑 Mesa ${p.mesa || 'Balcão'}</span>
        <span class="pedido-status-chip chip-${status}">${STATUS_LABEL[status] || status}</span>
        <span class="pedido-hora">${data} ${hora}</span>
      </div>
      <div class="pedido-itens">${linhasItens}</div>
      <div class="pedido-footer">
        <div class="pedido-footer-left">
          <span class="pedido-total">${total}</span>
          <span class="pedido-pag">· ${p.forma_pagamento || ''}</span>
          <span class="pedido-pag-badge chip-pag-${payStatus}">${PAG_STATUS_LABEL[payStatus] || payStatus}</span>
        </div>
        <div class="pedido-acoes">${botoesStatus.join('')}</div>
      </div>`;
    lista.appendChild(card);
  });
}

async function mudarStatusPedido(id, novoStatus) {
  if (typeof db === 'undefined') return;
  const { error } = await db.from('cardapio_pedidos').update({ status: novoStatus }).eq('id', id);
  if (error) { mostrarToast('❌ Erro ao atualizar status'); return; }
  mostrarToast(`✅ Status: ${STATUS_LABEL[novoStatus]}`);
  carregarPedidos();
}

async function fecharContaPedido(id) {
  if (typeof db === 'undefined') return;
  const { error } = await db.from('cardapio_pedidos').update({ status: 'fechado' }).eq('id', id);
  if (error) { mostrarToast('❌ Erro ao fechar conta'); return; }
  mostrarToast('💰 Conta fechada!');
  carregarPedidos();
}

async function confirmarPagamento(id) {
  if (typeof db === 'undefined') return;
  const { error } = await db.from('cardapio_pedidos').update({ payment_status: 'confirmado' }).eq('id', id);
  if (error) { mostrarToast('❌ Erro ao confirmar pagamento'); return; }
  mostrarToast('✅ Pagamento confirmado!');
  carregarPedidos();
}

function imprimirPedidoAdmin(id) {
  const p = pedidosCache.find(x => x.id === id);
  if (!p) return;

  const config     = carregarConfig();
  const nomeEstab  = config.nomeRestaurante || 'Sabor & Arte';
  const subEstab   = config.tipoEstab       || 'Bar & Restaurante';
  const num        = '#' + p.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  const agora      = new Date(p.created_at);
  const dataHora   = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const total      = parseFloat(p.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const itens      = Array.isArray(p.itens) ? p.itens : [];

  const itensHtml = itens.map(it => `
    <div class="rc-item">
      <div class="rc-item-nome">${it.emoji || '•'} ${it.nome}<span class="rc-item-qty"> x${it.qty}</span></div>
      <div class="rc-item-preco">${parseFloat(it.preco * it.qty).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
    </div>`).join('');

  const pw = window.open('', '_blank', 'width=400,height=680');
  pw.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Nota ${num} — ${nomeEstab}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier New',Courier,monospace;background:#fff;color:#111;padding:20px 24px;max-width:300px;margin:0 auto;font-size:13px}
    .rc-header{text-align:center;margin-bottom:10px}
    .rc-icon{font-size:28px;display:block;margin-bottom:6px}
    .rc-estab-nome{font-size:16px;font-weight:bold}
    .rc-estab-sub{font-size:11px;color:#666;margin-top:2px}
    .rc-dots{text-align:center;color:#bbb;letter-spacing:3px;font-size:10px;margin:10px 0}
    .rc-meta-row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;color:#333}
    .rc-meta-row span:first-child{color:#888}
    .rc-meta-row strong{font-weight:700;color:#111}
    .rc-item{display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px dotted #ddd;font-size:12px}
    .rc-item:last-child{border-bottom:none}
    .rc-item-nome{flex:1;line-height:1.4}
    .rc-item-qty{color:#aaa;font-size:11px}
    .rc-item-preco{font-weight:700;margin-left:10px;white-space:nowrap}
    .rc-total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:15px;padding:5px 0}
    .rc-pag-row{display:flex;justify-content:space-between;font-size:11px;color:#777;padding:2px 0}
    .rc-status-row{text-align:center;font-size:11px;color:#555;margin-top:6px}
    .rc-thanks{text-align:center;font-size:11px;color:#aaa;margin-top:14px}
    @media print{body{padding:0;max-width:100%}}
  </style>
</head>
<body>
  <div class="rc-header">
    <span class="rc-icon">🍽️</span>
    <div class="rc-estab-nome">${nomeEstab}</div>
    <div class="rc-estab-sub">${subEstab}</div>
  </div>
  <div class="rc-dots">· · · · · · · · · · · ·</div>
  <div class="rc-meta-row"><span>Pedido</span><strong>${num}</strong></div>
  <div class="rc-meta-row"><span>Mesa</span><span>${p.mesa || 'Balcão'}</span></div>
  <div class="rc-meta-row"><span>Data / Hora</span><span>${dataHora}</span></div>
  <div class="rc-dots">· · · · · · · · · · · ·</div>
  ${itensHtml}
  <div class="rc-dots">· · · · · · · · · · · ·</div>
  <div class="rc-total-row"><span>TOTAL</span><span>${total}</span></div>
  <div class="rc-pag-row"><span>Pagamento</span><span>${p.forma_pagamento || '—'}</span></div>
  <div class="rc-status-row">Status: ${STATUS_LABEL[p.status] || p.status}</div>
  <div class="rc-dots">· · · · · · · · · · · ·</div>
  <p class="rc-thanks">Obrigado pela preferência! 🙏</p>
</body>
</html>`);
  pw.document.close();
  setTimeout(() => { pw.print(); }, 450);
}

// ===== REALTIME — PEDIDOS =====
let pedidosRealtime = null;

function iniciarRealtimePedidos() {
  if (pedidosRealtime || typeof db === 'undefined') return;
  pedidosRealtime = db.channel('pedidos-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cardapio_pedidos' }, () => {
      mostrarToast('🆕 Novo pedido recebido!');
      carregarPedidos();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cardapio_pedidos' }, () => {
      carregarPedidos();
    })
    .subscribe();
}

// ===== RELATÓRIOS =====
async function renderRelatorios() {
  const loading = document.getElementById('rel-loading');
  const content = document.getElementById('rel-content');
  if (!loading || !content) return;

  loading.style.display = 'block';
  content.innerHTML = '';

  const today     = new Date();
  const todayStr  = today.toISOString().split('T')[0];
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 6); weekAgo.setHours(0,0,0,0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const queryFrom  = weekAgo < monthStart ? weekAgo : monthStart;

  let pedidos = [];
  try {
    const { data, error } = await db
      .from('cardapio_pedidos')
      .select('*')
      .eq('restaurante_id', rid)
      .gte('created_at', queryFrom.toISOString())
      .order('created_at', { ascending: false })
      .limit(2000);
    if (!error) pedidos = data || [];
  } catch { }

  loading.style.display = 'none';

  const R       = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const isToday = p => p.created_at.startsWith(todayStr);
  const isWeek  = p => new Date(p.created_at) >= weekAgo;
  const isMonth = p => new Date(p.created_at) >= monthStart;
  const isPago  = p => ['confirmado', 'presencial'].includes(p.payment_status);

  const fatDay   = pedidos.filter(p => isToday(p) && isPago(p)).reduce((s,p) => s + parseFloat(p.total||0), 0);
  const fatWeek  = pedidos.filter(p => isWeek(p)  && isPago(p)).reduce((s,p) => s + parseFloat(p.total||0), 0);
  const fatMonth = pedidos.filter(p => isMonth(p) && isPago(p)).reduce((s,p) => s + parseFloat(p.total||0), 0);

  const cntDay   = pedidos.filter(p => isToday(p)).length;
  const cntWeek  = pedidos.filter(p => isWeek(p)).length;
  const cntMonth = pedidos.filter(p => isMonth(p)).length;
  const pendentes = pedidos.filter(p => isMonth(p) && p.payment_status === 'pendente').length;
  const fechados  = pedidos.filter(p => isMonth(p) && p.status === 'fechado').length;

  // Gráfico últimos 7 dias
  const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const fat = pedidos.filter(p => p.created_at.startsWith(ds) && isPago(p))
      .reduce((s,p) => s + parseFloat(p.total||0), 0);
    const cnt = pedidos.filter(p => p.created_at.startsWith(ds)).length;
    days7.push({ ds, fat, cnt, lbl: DAYS[d.getDay()], isToday: ds === todayStr });
  }
  const maxFat = Math.max(...days7.map(d => d.fat), 1);
  const BAR_MAX = 90;

  const chartBars = days7.map(d => {
    const h = d.fat > 0 ? Math.max(Math.round((d.fat / maxFat) * BAR_MAX), 3) : 0;
    const cls = ['chart-bar', d.isToday ? 'today' : '', d.fat > 0 ? 'nonzero' : ''].filter(Boolean).join(' ');
    return `<div class="chart-col"><div class="${cls}" style="height:${h}px" title="${R(d.fat)}"></div></div>`;
  }).join('');
  const chartDays = days7.map(d =>
    `<div class="chart-day${d.isToday ? ' today' : ''}">${d.lbl}</div>`).join('');

  // Formas de pagamento (mês)
  const pagMap = {};
  pedidos.filter(p => isMonth(p) && isPago(p)).forEach(p => {
    const f = p.forma_pagamento || 'Outros';
    if (!pagMap[f]) pagMap[f] = { cnt: 0, total: 0 };
    pagMap[f].cnt++;
    pagMap[f].total += parseFloat(p.total || 0);
  });
  const pagRows = Object.entries(pagMap).sort((a,b) => b[1].total - a[1].total).map(([nome, v]) =>
    `<div class="pag-row">
       <span class="pag-nome">${nome}</span>
       <span><span class="pag-total">${R(v.total)}</span><span class="pag-cnt">${v.cnt} pedido${v.cnt !== 1 ? 's' : ''}</span></span>
     </div>`
  ).join('') || '<div style="color:var(--text3);font-size:13px;padding:8px 0">Nenhum pagamento confirmado este mês</div>';

  // Pratos mais pedidos (mês)
  const pratoMap = {};
  pedidos.filter(p => isMonth(p)).forEach(p => {
    (Array.isArray(p.itens) ? p.itens : []).forEach(it => {
      pratoMap[it.nome] = (pratoMap[it.nome] || 0) + (it.qty || 1);
    });
  });
  const topPratos = Object.entries(pratoMap).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const maxPrato  = topPratos[0]?.[1] || 1;

  const pratoRows = topPratos.length > 0
    ? topPratos.map(([nome, cnt], i) => `
        <div class="rank-item">
          <div class="rank-item-hdr">
            <span class="rank-pos">#${i+1}</span>
            <span class="rank-nome">${nome}</span>
            <span class="rank-val">${cnt} vendido${cnt !== 1 ? 's' : ''}</span>
          </div>
          <div class="rank-track"><div class="rank-fill" style="width:${Math.round((cnt/maxPrato)*100)}%"></div></div>
        </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:8px 0">Nenhum pedido este mês</div>';

  content.innerHTML = `
    <div class="rel-section">
      <div class="sec-hdr">💰 Faturamento Confirmado</div>
      <div class="rel-cards">
        <div class="rel-card">
          <div class="rel-card-lbl">Hoje</div>
          <div class="rel-card-val green">${R(fatDay)}</div>
          <div class="rel-card-sub">${cntDay} pedido${cntDay !== 1 ? 's' : ''}</div>
        </div>
        <div class="rel-card">
          <div class="rel-card-lbl">Últimos 7 dias</div>
          <div class="rel-card-val">${R(fatWeek)}</div>
          <div class="rel-card-sub">${cntWeek} pedido${cntWeek !== 1 ? 's' : ''}</div>
        </div>
        <div class="rel-card wide">
          <div class="rel-card-lbl">Este mês</div>
          <div class="rel-card-val accent">${R(fatMonth)}</div>
          <div class="rel-card-sub">${cntMonth} pedidos · ${pendentes} aguard. pagamento · ${fechados} fechados</div>
        </div>
      </div>
    </div>

    <div class="rel-section">
      <div class="sec-hdr">📊 Faturamento — Últimos 7 dias</div>
      <div class="rel-chart-wrap">
        <div class="rel-chart">${chartBars}</div>
        <div class="chart-days">${chartDays}</div>
      </div>
    </div>

    <div class="rel-section">
      <div class="sec-hdr">💳 Por Forma de Pagamento — Este mês</div>
      <div class="pag-breakdown">${pagRows}</div>
    </div>

    <div class="rel-section">
      <div class="sec-hdr">🍽️ Pratos Mais Pedidos — Este mês</div>
      ${pratoRows}
    </div>`;
}

function exportarPDF() {
  const config = carregarConfig();
  document.getElementById('rel-print-nome').textContent = config.nomeRestaurante || 'Cardápio Digital';
  document.getElementById('rel-print-data').textContent =
    'Relatório gerado em ' + new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  window.print();
}

// ===== TOAST =====
let toastTimer;
function mostrarToast(msg) {
  const el = $('#adminToast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
