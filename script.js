const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const rotores = {
  I: "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
  II: "AJDKSIRUXBLHWTMCQGZNPYFVOE",
  III: "BDFHJLCPRTXVZNYEIWGAKMUSQO",
  IV: "ESOVPZJAYQUIRHXLNFTGKDCMWB",
  V: "VZBRGITYUPSDNHLXAWMJQOFECK"
};

const refletor = "YRUHQSLDPXNGOKMIEBFZCWVJAT";

// posições e rotores selecionados (estado da sessão)
// Rotores fixos: I, II, III
let pos1 = 0, pos2 = 0, pos3 = 0;
let rotor1Sel = rotores.I, rotor2Sel = rotores.II, rotor3Sel = rotores.III;

// Layout QWERTY (mesma ordem para teclado e lampboard)
const qwertyLayout = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM"
];

// --- Funções Enigma ---
function avancarRotores() {
  pos1 = (pos1 + 1) % 26;
  if (pos1 === 0) pos2 = (pos2 + 1) % 26;
  if (pos2 === 0) pos3 = (pos3 + 1) % 26;
}

function passarRotor(letra, rotor, posicao) {
  const index = (alfabeto.indexOf(letra) + posicao) % 26;
  return rotor[index];
}

function voltarRotor(letra, rotor, posicao) {
  const index = rotor.indexOf(letra);
  return alfabeto[(index - posicao + 26) % 26];
}

function aplicarPlugboard(letra, mapa) {
  return mapa[letra] || letra;
}

function criarMapaPlugboard(config) {
  const pares = config.trim().split(/\s+/).filter(Boolean);
  const mapa = {};
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

// --- Montagem do teclado e lampboard ---
window.addEventListener('DOMContentLoaded', () => {
  const keyboardDiv = document.getElementById('keyboard');
  const lampsDiv = document.getElementById('lamps');

  // teclado QWERTY
  qwertyLayout.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    row.split('').forEach(ch => {
      const btn = document.createElement('div');
      btn.className = 'key';
      btn.textContent = ch;
      btn.tabIndex = 0;
      btn.addEventListener('click', () => pressionarTecla(ch));
      rowDiv.appendChild(btn);
    });
    keyboardDiv.appendChild(rowDiv);
  });

  // lampboard com mesmo layout (centralizado)
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

  // eventos dos botões
  document.getElementById('translate_btn').addEventListener('click', traduzir);
  document.getElementById('copy_btn').addEventListener('click', copiarTexto);
  document.getElementById('clear_btn').addEventListener('click', limparTudo);

  // quando o usuário muda as posições, reinicia a sessão (define nova chave)
  document.getElementById('rotor1_pos').addEventListener('change', iniciarSessao);
  document.getElementById('rotor2_pos').addEventListener('change', iniciarSessao);
  document.getElementById('rotor3_pos').addEventListener('change', iniciarSessao);

  // sincronizar teclado físico
  window.addEventListener('keydown', (ev) => {
    // ignora se foco estiver em input/textarea/select para não atrapalhar controles
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return;
    }

    const key = ev.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      ev.preventDefault();
      pressionarTecla(key);
    }
  });

  // inicializa sessão com valores atuais das posições
  iniciarSessao();
});

// --- Interação principal ---
function pressionarTecla(letra) {
  const plugboardSelect = document.getElementById('plugboard');
  if (!plugboardSelect.value) {
    alert('Você deve escolher uma configuração de plugboard antes de digitar!');
    return;
  }

  const plugboardMapa = criarMapaPlugboard(plugboardSelect.value);

  const resultado = enigma(letra, plugboardMapa);

  const out = document.getElementById('output');
  out.value += resultado;

  acenderLampada(resultado);
}

function acenderLampada(letra) {
  // apaga todas as lâmpadas do layout QWERTY
  qwertyLayout.join('').split('').forEach(ch => {
    const lamp = document.getElementById('lamp_' + ch);
    if (lamp) lamp.classList.remove('on');
  });
  const lamp = document.getElementById('lamp_' + letra);
  if (lamp) lamp.classList.add('on');
}

// traduzir toda a mensagem via prompt (sem campo de input)
function traduzir() {
  const plugboardSelect = document.getElementById('plugboard');
  if (!plugboardSelect.value) {
    alert('Você deve escolher uma configuração de plugboard antes de traduzir!');
    return;
  }

  // iniciar sessão com as posições atuais antes de processar a string inteira
  iniciarSessao();

  const texto = (prompt('Cole ou digite a mensagem a ser traduzida (A–Z). Espaços e pontuação serão mantidos):') || '').toUpperCase();
  if (!texto) return;

  const plugboardMapa = criarMapaPlugboard(plugboardSelect.value);

  let resultadoTotal = '';
  for (let ch of texto) {
    if (/^[A-Z]$/.test(ch)) {
      const r = enigma(ch, plugboardMapa);
      resultadoTotal += r;
      acenderLampada(r);
    } else {
      // mantém caracteres não-alfabéticos sem avançar rotores
      resultadoTotal += ch;
    }
  }

  document.getElementById('output').value += resultadoTotal;
}

// configura a sessão: define rotores fixos e posições iniciais (chave)
function iniciarSessao() {
  // rotores fixos: I, II, III
  rotor1Sel = rotores.I;
  rotor2Sel = rotores.II;
  rotor3Sel = rotores.III;

  pos1 = parseInt(document.getElementById('rotor1_pos').value, 10);
  pos2 = parseInt(document.getElementById('rotor2_pos').value, 10);
  pos3 = parseInt(document.getElementById('rotor3_pos').value, 10);

  if (Number.isNaN(pos1)) pos1 = 0;
  if (Number.isNaN(pos2)) pos2 = 0;
  if (Number.isNaN(pos3)) pos3 = 0;

  pos1 = ((pos1 % 26) + 26) % 26;
  pos2 = ((pos2 % 26) + 26) % 26;
  pos3 = ((pos3 % 26) + 26) % 26;
}

// utilitários
function copiarTexto() {
  const output = document.getElementById('output');
  navigator.clipboard.writeText(output.value || '')
    .then(() => { alert('Texto copiado!'); })
    .catch(() => { alert('Falha ao copiar.'); });
}

function limparTudo() {
  document.getElementById('output').value = '';
  qwertyLayout.join('').split('').forEach(ch => {
    const lamp = document.getElementById('lamp_' + ch);
    if (lamp) lamp.classList.remove('on');
  });
  // reinicia sessão mantendo as posições atuais (não altera inputs)
  iniciarSessao();
}