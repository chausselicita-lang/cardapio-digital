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

async function verificarSessao() {
  if (modo === 'supabase') {
    // Sessão via Supabase: verificar sessionStorage com rid correto
    if (sessionStorage.getItem('admin_auth') === '1' &&
        sessionStorage.getItem('admin_rid')   === rid) {
      loginOverlay.style.display = 'none';
      carregarDadosRestaurante();
    }
  } else {
    // Modo local: sessionStorage simples
    if (sessionStorage.getItem('admin_auth') === '1') {
      loginOverlay.style.display = 'none';
    }
  }
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

    // Preenche campos de configuração
    $('#chavePix').value   = carregarConfig().chavePix  || '';
    $('#linkCartao').value = carregarConfig().linkCartao || '';
    $('#whatsapp').value   = (data.telefone || '').replace(/^55/, '');

    // Configura limite de QR por plano
    atualizarBadgePlano(data.num_mesas || 0, data.plano);

  } catch {}
}

// Verifica sessão ao carregar
verificarSessao();

// ===== FORMULÁRIO DE CONFIGURAÇÕES =====
const config = carregarConfig();
$('#chavePix').value   = config.chavePix   || '';
$('#linkCartao').value = config.linkCartao  || '';
$('#whatsapp').value   = config.whatsapp    || '';

const autoUrl = window.location.href.replace(/[?#].*$/, '').replace(/admin\.html$/, 'index.html');
$('#urlBase').value   = config.urlBase   || (rid ? `${autoUrl}?rid=${rid}` : autoUrl);
$('#numMesas').value  = config.numMesas  || 10;

// ===== TABS =====
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(t => t.style.display = 'none');
    btn.classList.add('active');
    $(`#tab-${btn.dataset.tab}`).style.display = 'block';
  });
});

// ===== SALVAR CONFIGURAÇÕES =====
$('#btnSalvarConfig').addEventListener('click', async () => {
  const novaSenha = $('#senhaAdminNova').value;
  const cfg = {
    ...carregarConfig(),
    chavePix:   $('#chavePix').value.trim(),
    linkCartao: $('#linkCartao').value.trim(),
    whatsapp:   $('#whatsapp').value.trim().replace(/\D/g, ''),
  };
  if (novaSenha) cfg.senhaAdmin = novaSenha;
  salvarConfig(cfg);

  // Se modo Supabase, salva senha também no banco
  if (modo === 'supabase' && novaSenha) {
    await db.from('restaurantes').update({ senha_admin: novaSenha }).eq('id', rid);
  }

  if (novaSenha) $('#senhaAdminNova').value = '';
  mostrarToast(novaSenha ? '✅ Configurações e senha salvos!' : '✅ Configurações salvas!');
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
