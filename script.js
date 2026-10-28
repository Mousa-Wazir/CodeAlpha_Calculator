const state = {
  currentInput: '0',
  previousInput: '',
  operator: null,
  shouldResetInput: false,
  history: []
};

const expressionDisplay = document.getElementById('expressionDisplay');
const mainDisplay = document.getElementById('mainDisplay');
const livePreviewDisplay = document.getElementById('livePreviewDisplay');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const statusBadge = document.getElementById('statusBadge');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

const operatorSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function formatNumber(numStr) {
  if (numStr === 'Cannot divide by 0') return numStr;
  if (!numStr || numStr === '-') return numStr || '0';
  const [intPart, decPart] = String(numStr).split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const cleanInt = intPart.replace('-', '');
  if (isNaN(Number(cleanInt))) return numStr;
  return sign + Number(cleanInt).toLocaleString('en-US') + (decPart !== undefined ? '.' + decPart : '');
}

function calculate(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) return null;
  switch (op) {
    case '+': return String(Math.round(((numA + numB) + Number.EPSILON) * 1e10) / 1e10);
    case '-': return String(Math.round(((numA - numB) + Number.EPSILON) * 1e10) / 1e10);
    case '*': return String(Math.round(((numA * numB) + Number.EPSILON) * 1e10) / 1e10);
    case '/': return numB === 0 ? 'Cannot divide by 0' : String(Math.round(((numA / numB) + Number.EPSILON) * 1e10) / 1e10);
    default: return null;
  }
}

function updateDisplay() {
  mainDisplay.textContent = formatNumber(state.currentInput);
  if (state.operator && state.previousInput !== '') {
    expressionDisplay.textContent = `${formatNumber(state.previousInput)} ${operatorSymbols[state.operator]}`;
    if (!state.shouldResetInput) {
      const preview = calculate(state.previousInput, state.currentInput, state.operator);
      livePreviewDisplay.textContent = preview ? (preview === 'Cannot divide by 0' ? preview : `= ${formatNumber(preview)}`) : '\u00A0';
    } else {
      livePreviewDisplay.textContent = '\u00A0';
    }
  } else {
    expressionDisplay.textContent = '0';
    livePreviewDisplay.textContent = '\u00A0';
  }
}

function appendNumber(num) {
  if (state.currentInput === 'Cannot divide by 0') clearAll();
  if (state.shouldResetInput) {
    state.currentInput = num;
    state.shouldResetInput = false;
  } else {
    if (state.currentInput.replace(/[-.]/g, '').length >= 14) return;
    state.currentInput = state.currentInput === '0' ? num : state.currentInput + num;
  }
  updateDisplay();
}

function appendDecimal() {
  if (state.shouldResetInput) {
    state.currentInput = '0.';
    state.shouldResetInput = false;
  } else if (!state.currentInput.includes('.')) {
    state.currentInput += '.';
  }
  updateDisplay();
}

function chooseOperator(op) {
  if (state.currentInput === 'Cannot divide by 0') {
    clearAll();
    return;
  }
  if (state.operator !== null && !state.shouldResetInput) evaluate();
  state.previousInput = state.currentInput;
  state.operator = op;
  state.shouldResetInput = true;
  updateDisplay();
}

function evaluate() {
  if (state.operator === null || state.shouldResetInput) return;
  const result = calculate(state.previousInput, state.currentInput, state.operator);
  if (result === 'Cannot divide by 0') {
    expressionDisplay.textContent = `${formatNumber(state.previousInput)} ÷ ${formatNumber(state.currentInput)}`;
    state.currentInput = result;
    state.previousInput = '';
    state.operator = null;
    state.shouldResetInput = true;
    mainDisplay.textContent = result;
    livePreviewDisplay.textContent = '\u00A0';
    return;
  }
  if (result !== null) {
    const expr = `${formatNumber(state.previousInput)} ${operatorSymbols[state.operator]} ${formatNumber(state.currentInput)}`;
    state.history.unshift({ expression: expr, result });
    renderHistory();
    expressionDisplay.textContent = `${expr} =`;
    state.currentInput = result;
    state.previousInput = '';
    state.operator = null;
    state.shouldResetInput = true;
    mainDisplay.textContent = formatNumber(result);
    livePreviewDisplay.textContent = '\u00A0';
  }
}

function clearAll() {
  state.currentInput = '0';
  state.previousInput = '';
  state.operator = null;
  state.shouldResetInput = false;
  updateDisplay();
}

function deleteLast() {
  if (state.shouldResetInput || state.currentInput === 'Cannot divide by 0') {
    clearAll();
    return;
  }
  state.currentInput = state.currentInput.length <= 1 ? '0' : state.currentInput.slice(0, -1);
  updateDisplay();
}

function renderHistory() {
  if (state.history.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No calculations yet.</p>';
    return;
  }
  historyList.innerHTML = state.history.map((item, i) => `
    <div class="history-item" data-index="${i}">
      <small>${item.expression} =</small>
      <strong>${formatNumber(item.result)}</strong>
    </div>
  `).join('');
}

document.getElementById('keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.number !== undefined) appendNumber(btn.dataset.number);
  else if (btn.dataset.operator !== undefined) chooseOperator(btn.dataset.operator);
  else if (btn.dataset.action === 'clear') clearAll();
  else if (btn.dataset.action === 'delete') deleteLast();
  else if (btn.dataset.action === 'decimal') appendDecimal();
  else if (btn.dataset.action === 'equals') evaluate();
  else if (btn.dataset.action === 'percent') {
    state.currentInput = String(parseFloat(state.currentInput || '0') / 100);
    updateDisplay();
  } else if (btn.dataset.action === 'negate') {
    if (state.currentInput !== '0') {
      state.currentInput = state.currentInput.startsWith('-') ? state.currentInput.slice(1) : '-' + state.currentInput;
      updateDisplay();
    }
  }
});

historyList.addEventListener('click', (e) => {
  const itemEl = e.target.closest('.history-item');
  if (!itemEl) return;
  const item = state.history[Number(itemEl.dataset.index)];
  if (item) {
    state.currentInput = item.result;
    state.shouldResetInput = false;
    updateDisplay();
  }
});

clearHistoryBtn.addEventListener('click', () => {
  state.history = [];
  renderHistory();
});

copyResultBtn.addEventListener('click', () => {
  navigator.clipboard?.writeText(state.currentInput);
  copyResultBtn.textContent = 'Copied!';
  setTimeout(() => { copyResultBtn.textContent = 'Copy'; }, 1200);
});

toggleThemeBtn.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  themeText.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
});

window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k >= '0' && k <= '9') { e.preventDefault(); appendNumber(k); }
  else if (k === '.') { e.preventDefault(); appendDecimal(); }
  else if (['+', '-', '*', '/'].includes(k)) { e.preventDefault(); chooseOperator(k); }
  else if (k === 'Enter' || k === '=') { e.preventDefault(); evaluate(); }
  else if (k === 'Backspace') { e.preventDefault(); deleteLast(); }
  else if (k === 'Escape' || k.toLowerCase() === 'c') { e.preventDefault(); clearAll(); }
  statusBadge.textContent = `Key: ${k}`;
});

updateDisplay();
