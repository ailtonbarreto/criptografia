// script.js - Enigma Simulada (3 rotores fixos, plugboard por palavras)
const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Rotores fixos (I, II, III)
const rotores = {
  I:   "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
  II:  "AJDKSIRUXBLHWTMCQGZNPYFVOE",
  III: "BDFHJLCPRTXVZNYEIWGAKMUSQO"
};

const refletor = "YRUHQSLDPXNGOKMIEBFZCWVJAT";

// Estado dos rotores (posição atual da sessão)
let pos1 = 0, pos2 = 0, pos3 = 0;
let rotor1Sel = rotores.I, rotor2Sel = rotores.II, rotor3Sel = rotores.III;

// Layout QWERTY (teclado e lampboard)
const qwertyLayout = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];

// Avança os rotores (simples stepping)
function avancarRotores() {
  pos1 = (pos1 + 1) % 26;
  if (pos1 === 0) pos2 = (pos2 + 1) % 26;
  if (pos2 === 0) pos3 = (pos3 + 1) % 26;
}

// Passagem direta pelo rotor com deslocamento
function passarRotor(letra, rotor, posicao) {
  const index = (alfabeto.indexOf(letra) + posicao) % 26;
  return rotor[index];
}

// Passagem inversa pelo rotor (retorno)
function voltarRotor(letra, rotor, posicao) {
  const index = rotor.indexOf(letra);
  return alfabeto[(index - posicao + 26) % 26];
}

// Aplica plugboard (mapa de pares)
function aplicarPlugboard(letra, mapa) {
  return mapa[letra] || letra;
}

// Constrói mapa do plugboard a partir da string "AB CD EF"
function criarMapaPlugboard(config) {
  const mapa = {};
  if (!config || typeof config !== 'string') return mapa;
  const pares = config.trim().split(/\s+/).filter(Boolean);
  pares.forEach(par => {
    if (par.length === 2) {
      const [a, b] = par.toUpperCase().split("");
      if (a && b && a !== b) {
        mapa[a] = b;
        mapa[b] = a;
      }
    }
  });
  return mapa;
}

// Núcleo Enigma: aplica plugboard, rotores, refletor, volta e plugboard
function enigma(letra, plugboardMapa) {
  if (!alfabeto.includes(letra)) return letra;

  let l = aplicarPlugboard(letra, plugboardMapa);

  l = passarRotor(l, rotor1Sel, pos1);
  l = passarRotor(l, rotor2Sel, pos2);
  l = passarRotor(l, rotor3Sel, pos3);

  l = refletor[alfabeto.indexOf(l)];

  l = voltarRotor(l, rotor3Sel, pos3);
  l = voltarRotor(l, rotor2Sel, pos2);
  l = voltarRotor(l, rotor1Sel, pos1);

  l = aplicarPlugboard(l, plugboardMapa);

  avancarRotores();
  return l;
}

// --- Inicialização da UI e eventos ---
window.addEventListener('DOMContentLoaded', () => {
  montarTeclado();
  montarLampboard();
  preencherPlugboardComPalavras(); // popula select plugboard com 20+ opções
  iniciarSessao();

  document.getElementById('translate_btn').addEventListener('click', traduzir);
  document.getElementById('copy_btn').addEventListener('click', copiarTexto);
  document.getElementById('clear_btn').addEventListener('click', limparTudo);

  // reinicia sessão quando posições mudam
  document.getElementById('rotor1_pos').addEventListener('change', iniciarSessao);
  document.getElementById('rotor2_pos').addEventListener('change', iniciarSessao);
  document.getElementById('rotor3_pos').addEventListener('change', iniciarSessao);

  // teclado físico
  window.addEventListener('keydown', (ev) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const key = ev.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      ev.preventDefault();
      pressionarTecla(key);
    }
  });
});

// Monta teclado QWERTY (divs .key)
function montarTeclado() {
  const keyboardDiv = document.getElementById('keyboard');
  keyboardDiv.innerHTML = '';
  qwertyLayout.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    row.split('').forEach(ch => {
      const btn = document.createElement('div');
      btn.className = 'key';
      btn.textContent = ch;
      btn.addEventListener('click', () => pressionarTecla(ch));
      rowDiv.appendChild(btn);
    });
    keyboardDiv.appendChild(rowDiv);
  });
}

// Monta lampboard (divs .lamp)
function montarLampboard() {
  const lampsDiv = document.getElementById('lamps');
  lampsDiv.innerHTML = '';
  qwertyLayout.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'lamp-row';
    row.split('').forEach(ch => {
      const lamp = document.createElement('div');
      lamp.className = 'lamp';
      lamp.id = 'lamp_' + ch;
      lamp.textContent = ch;
      rowDiv.appendChild(lamp);
    });
    lampsDiv.appendChild(rowDiv);
  });
}

// Preenche o select #plugboard com 20+ palavras (cada uma tem pares "AB CD EF")
function preencherPlugboardComPalavras() {
  const plugboardSelect = document.getElementById('plugboard');
  plugboardSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecione uma configuração';
  plugboardSelect.appendChild(placeholder);

  const opcoes = [
    { pares: "AB CD EF", nome: "AMOR" },
    { pares: "PQ RS TU", nome: "ÓDIO" },
    { pares: "JK LM NO", nome: "CASAMENTO" },
    { pares: "XZ YW VU", nome: "CARRO" },
    { pares: "GH IJ KL", nome: "FUTEBOL" },
    { pares: "MN OP QR", nome: "MÚSICA" },
    { pares: "ST UV WX", nome: "VIAGEM" },
    { pares: "YZ AB CD", nome: "AMIZADE" },
    { pares: "EF GH IJ", nome: "TRABALHO" },
    { pares: "KL MN OP", nome: "ESCOLA" },
    { pares: "QR ST UV", nome: "FAMÍLIA" },
    { pares: "WX YZ AB", nome: "DINHEIRO" },
    { pares: "CD EF GH", nome: "SAÚDE" },
    { pares: "IJ KL MN", nome: "FÉ" },
    { pares: "OP QR ST", nome: "PODER" },
    { pares: "UV WX YZ", nome: "ALEGRIA" },
    { pares: "AB IJ KL", nome: "TRISTEZA" },
    { pares: "CD MN OP", nome: "FORÇA" },
    { pares: "EF QR ST", nome: "CORAGEM" },
    { pares: "GH UV WX", nome: "ESPERANÇA" },
    { pares: "YZ CD EF", nome: "SAUDADE" },
    { pares: "KL QR ST", nome: "SILÊNCIO" },
    { pares: "MN UV WX", nome: "NATUREZA" },
    { pares: "OP YZ AB", nome: "CINEMA" }
  ];

  opcoes.forEach(op => {
    const opt = document.createElement('option');
    opt.value = op.pares;
    opt.textContent = op.nome;
    plugboardSelect.appendChild(opt);
  });
}

// Valida se rotores e plugboard estão configurados; retorna mensagem ou null
function validarConfiguracao() {
  const r1 = document.getElementById('rotor1_pos').value;
  const r2 = document.getElementById('rotor2_pos').value;
  const r3 = document.getElementById('rotor3_pos').value;
  if (r1 === "" || r2 === "" || r3 === "") {
    return "Configure as posições dos 3 rotores antes de usar!";
  }
  const plug = document.getElementById('plugboard').value;
  if (!plug) {
    return "Selecione uma configuração de plugboard!";
  }
  return null;
}

// Pressiona tecla (UI) — valida antes de processar
function pressionarTecla(letra) {
  const erro = validarConfiguracao();
  if (erro) {
    alert(erro);
    return;
  }

  const plugboardMapa = criarMapaPlugboard(document.getElementById('plugboard').value);
  const resultado = enigma(letra, plugboardMapa);
  const out = document.getElementById('output');
  out.value += resultado;
  acenderLampada(resultado);
}

// Acende lâmpada correspondente e apaga as outras
function acenderLampada(letra) {
  qwertyLayout.join('').split('').forEach(ch => {
    const lamp = document.getElementById('lamp_' + ch);
    if (lamp) lamp.classList.remove('on');
  });
  const lamp = document.getElementById('lamp_' + letra);
  if (lamp) lamp.classList.add('on');
}

// Traduz (processa string inteira via prompt) — valida antes
function traduzir() {
  const erro = validarConfiguracao();
  if (erro) {
    alert(erro);
    return;
  }

  iniciarSessao(); // define posições iniciais antes de processar
  const texto = (prompt("Digite a mensagem (A–Z):") || "").toUpperCase();
  if (!texto) return;

  const plugboardMapa = criarMapaPlugboard(document.getElementById('plugboard').value);
  let resultadoTotal = '';
  for (let ch of texto) {
    resultadoTotal += /^[A-Z]$/.test(ch) ? enigma(ch, plugboardMapa) : ch;
  }
  document.getElementById('output').value += resultadoTotal;
}

// Inicia sessão: lê posições dos selects e aplica como chave inicial
function iniciarSessao() {
  pos1 = parseInt(document.getElementById('rotor1_pos').value, 10);
  pos2 = parseInt(document.getElementById('rotor2_pos').value, 10);
  pos3 = parseInt(document.getElementById('rotor3_pos').value, 10);

  if (Number.isNaN(pos1)) pos1 = 0;
  if (Number.isNaN(pos2)) pos2 = 0;
  if (Number.isNaN(pos3)) pos3 = 0;

  pos1 = ((pos1 % 26) + 26) % 26;
  pos2 = ((pos2 % 26) + 26) % 26;
  pos3 = ((pos3 % 26) + 26) % 26;

  // garante rotores fixos I, II, III
  rotor1Sel = rotores.I;
  rotor2Sel = rotores.II;
  rotor3Sel = rotores.III;
}

// Copia texto do output para a área de transferência
function copiarTexto() {
  const output = document.getElementById('output');
  navigator.clipboard.writeText(output.value || '')
    .then(() => alert("Texto copiado!"))
    .catch(() => alert("Falha ao copiar."));
}

// Limpa output e lâmpadas; reinicia sessão (mantendo selects)
function limparTudo() {
  document.getElementById('output').value = '';
  qwertyLayout.join('').split('').forEach(ch => {
    const lamp = document.getElementById('lamp_' + ch);
    if (lamp) lamp.classList.remove('on');
  });
  iniciarSessao();
}
