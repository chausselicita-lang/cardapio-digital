// ===== ADMIN — Cardápio Digital =====

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const CONFIG_KEY    = 'cardapio_config';
const SENHA_PADRAO  = 'admin123';

// Modo: 'supabase' se tiver ?rid na URL, 'local' caso contrário
const rid  = new URLSearchParams(location.search).get('rid');
const modo = rid ? 'supabase' : 'local';

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
  if (modo === 'supabase') {
    if (sessionStorage.getItem('admin_auth') === '1' &&
        sessionStorage.getItem('admin_rid')   === rid) {
      carregarDadosRestaurante();
      abrirTabCardapio();
      return; // autenticado — overlay permanece oculto
    }
  } else {
    if (sessionStorage.getItem('admin_auth') === '1') {
      return; // autenticado — overlay permanece oculto
    }
  }
  // Não autenticado — exibe o overlay de login
  loginOverlay.style.display = 'flex';
}

async function tentarLogin() {
  const senha = senhaInput.value;
  loginError.style.display = 'none';

  if (modo === 'supabase') {
    // Valida senha contra Supabase
    try {
      const { data, error } = await db
        .from('restaurantes')
        .select('id, nome_restaurante, senha_admin')
        .eq('id', rid).single();

      if (error || !data) throw new Error();
      if (data.senha_admin !== senha) throw new Error('senha errada');

      sessionStorage.setItem('admin_auth', '1');
      sessionStorage.setItem('admin_rid',  rid);
      sessionStorage.setItem('admin_nome', data.nome_restaurante);
      loginOverlay.style.display = 'none';
      senhaInput.value = '';
      carregarDadosRestaurante();
      abrirTabCardapio();

    } catch {
      loginError.style.display = 'block';
      senhaInput.value = '';
      senhaInput.focus();
    }

  } else {
    // Modo local: compara com localStorage
    const config = carregarConfig();
    const correta = config.senhaAdmin || SENHA_PADRAO;
    if (senha === correta) {
      sessionStorage.setItem('admin_auth', '1');
      loginOverlay.style.display = 'none';
      senhaInput.value = '';
      loginError.style.display = 'none';
      abrirTabCardapio();
    } else {
      loginError.style.display = 'block';
      senhaInput.value = '';
      senhaInput.focus();
    }
  }
}

$('#btnEntrar').addEventListener('click', tentarLogin);
senhaInput.addEventListener('keydown', e => { if (e.key === 'Enter') tentarLogin(); });

$('#btnSair').addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth');
  sessionStorage.removeItem('admin_rid');
  sessionStorage.removeItem('admin_nome');
  loginOverlay.style.display = 'flex';
  senhaInput.value = '';
  loginError.style.display = 'none';
  // Se veio via Supabase, redireciona para login
  if (modo === 'supabase') window.location.href = 'login.html';
  else setTimeout(() => senhaInput.focus(), 100);
});

// ===== CARREGAR DADOS DO RESTAURANTE (modo Supabase) =====
async function carregarDadosRestaurante() {
  if (modo !== 'supabase' || !rid) return;
  try {
    const { data } = await db.from('restaurantes')
      .select('nome_restaurante, tipo, telefone, email, endereco, horario, senha_admin, num_mesas, plano')
      .eq('id', rid).single();
    if (!data) return;

    // Atualiza header do admin
    const sub = document.querySelector('.admin-header-sub');
    if (sub) sub.textContent = `| ${data.nome_restaurante}`;

    // Configura limite de QR por plano
    atualizarBadgePlano(data.num_mesas || 0, data.plano);

  } catch {}
}

// Verifica sessão ao carregar
verificarSessao();

// ===== CONFIGURAÇÕES EM LISTA =====
const autoUrl = window.location.href.replace(/[?#].*$/, '').replace(/admin\.html$/, 'index.html');

// Mapeamento: chave interna → { storageKey, inputId, valId, itemId, label }
const CONFIG_MAP = {
  pix:      { key: 'chavePix',   inputId: 'inp-pix',      valId: 'val-pix',      itemId: 'ci-pix'      },
  cartao:   { key: 'linkCartao', inputId: 'inp-cartao',   valId: 'val-cartao',   itemId: 'ci-cartao'   },
  whatsapp: { key: 'whatsapp',   inputId: 'inp-whatsapp', valId: 'val-whatsapp', itemId: 'ci-whatsapp' },
  senha:    { key: 'senhaAdmin', inputId: 'inp-senha',    valId: 'val-senha',    itemId: 'ci-senha'    },
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

  // Senha também no Supabase
  if (name === 'senha' && modo === 'supabase') {
    await db.from('restaurantes').update({ senha_admin: val }).eq('id', rid);
  }

  document.getElementById(itemId).classList.remove('open');
  renderConfigList();
  mostrarToast('✅ ' + ({ pix:'Chave PIX', cartao:'Link do Cartão', whatsapp:'WhatsApp', senha:'Senha' }[name]) + ' salvo!');
}

// Inicializa lista ao carregar
renderConfigList();

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
    if (btn.dataset.tab === 'cardapio') carregarCardapio();
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

// --- Renderizar grid ---
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

    const card = document.createElement('div');
    card.className = `prato-card${disponivel ? '' : ' indisponivel'}`;
    card.dataset.id = p.id;
    card.innerHTML = `
      ${foto
        ? `<img class="prato-foto" src="${foto}" alt="${p.nome}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="prato-foto-placeholder" style="display:none">🍽️</div>`
        : `<div class="prato-foto-placeholder">🍽️</div>`}
      <div class="prato-body">
        <div class="prato-cat-tag">${cat}${!disponivel ? ' · <em>Indisponível</em>' : ''}</div>
        <div class="prato-top">
          <div class="prato-nome">${p.nome}</div>
          ${badge}
        </div>
        ${p.descricao ? `<div class="prato-desc">${p.descricao}</div>` : ''}
        <div class="prato-footer">
          <div class="prato-preco">${preco}</div>
          <div class="prato-acoes">
            <button class="btn-prato-acao btn-prato-editar" data-id="${p.id}">✏️ Editar</button>
            <button class="btn-prato-acao btn-prato-excluir" data-id="${p.id}" data-nome="${p.nome}">🗑️</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  // Eventos nos botões
  $$('.btn-prato-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const prato = pratosCache.find(p => String(p.id) === btn.dataset.id);
      if (prato) abrirModalPrato(prato);
    });
  });
  $$('.btn-prato-excluir').forEach(btn => {
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

// ===== TOAST =====
let toastTimer;
function mostrarToast(msg) {
  const el = $('#adminToast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
