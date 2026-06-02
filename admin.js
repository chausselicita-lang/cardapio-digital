// ===== ADMIN — Cardápio Digital =====

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const CONFIG_KEY = 'cardapio_config';

function carregarConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; }
}

function salvarConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// ===== CARREGAR VALORES SALVOS NO FORMULÁRIO =====
const config = carregarConfig();
$('#chavePix').value = config.chavePix || '';
$('#linkCartao').value = config.linkCartao || '';
$('#whatsapp').value = config.whatsapp || '';

// Auto-detecta URL base (troca admin.html por index.html)
const autoUrl = window.location.href.replace(/[?#].*$/, '').replace(/admin\.html$/, 'index.html');
$('#urlBase').value = config.urlBase || autoUrl;
$('#numMesas').value = config.numMesas || 10;

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
$('#btnSalvarConfig').addEventListener('click', () => {
  const cfg = {
    ...carregarConfig(),
    chavePix: $('#chavePix').value.trim(),
    linkCartao: $('#linkCartao').value.trim(),
    whatsapp: $('#whatsapp').value.trim().replace(/\D/g, ''),
  };
  salvarConfig(cfg);
  mostrarToast('✅ Configurações salvas com sucesso!');
});

// ===== GERAR QR CODES =====
$('#btnGerarQR').addEventListener('click', gerarQRCodes);
$('#btnRegerar').addEventListener('click', gerarQRCodes);

function gerarQRCodes() {
  const urlBase = $('#urlBase').value.trim();
  const numMesas = Math.min(Math.max(parseInt($('#numMesas').value) || 10, 1), 200);

  if (!urlBase) {
    mostrarToast('⚠️ Informe a URL base do cardápio');
    return;
  }

  // Salva URL e número de mesas na config
  const cfg = { ...carregarConfig(), urlBase, numMesas };
  salvarConfig(cfg);

  const qrGrid = $('#qrGrid');
  qrGrid.innerHTML = '';

  for (let i = 1; i <= numMesas; i++) {
    // Garante que a URL base não termine com /
    const base = urlBase.replace(/\/$/, '');
    const url = `${base}?mesa=${i}`;

    const card = document.createElement('div');
    card.className = 'qr-card';
    card.innerHTML = `
      <div class="qr-code" id="qr-mesa-${i}"></div>
      <div class="qr-card-info">
        <strong>Mesa ${i}</strong>
        <span class="qr-url">${url}</span>
      </div>
    `;
    qrGrid.appendChild(card);

    new QRCode(document.getElementById(`qr-mesa-${i}`), {
      text: url,
      width: 160,
      height: 160,
      colorDark: '#1A0F00',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  $('#qrActionsWrap').style.display = 'block';
  mostrarToast(`✅ ${numMesas} QR Code${numMesas > 1 ? 's' : ''} gerado${numMesas > 1 ? 's' : ''}!`);

  // Scroll para os QR Codes
  setTimeout(() => {
    $('#qrActionsWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ===== IMPRIMIR =====
$('#btnImprimirQR').addEventListener('click', () => {
  window.print();
});

// ===== TOAST =====
let toastTimer;
function mostrarToast(msg) {
  const el = $('#adminToast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
