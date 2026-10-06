const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setText(id, value) { document.getElementById(id).textContent = value; }
function setStatus(id, message = "", type = "") {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function copyValue(id) {
  const value = document.getElementById(id)?.textContent ?? "";
  if (!value || value === "—") return;
  navigator.clipboard.writeText(value).then(() => {
    const btn = document.querySelector(`[data-copy-target="${id}"]`);
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = old; }, 900);
  }).catch(() => {});
}
$$('.copy-btn').forEach(btn => btn.addEventListener('click', () => copyValue(btn.dataset.copyTarget)));

// ---------- Tabs ----------
$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.remove('active'));
  $$('.panel').forEach(p => p.classList.remove('active-panel'));
  tab.classList.add('active');
  document.getElementById(tab.dataset.tab).classList.add('active-panel');
}));

// ---------- Theme ----------
$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  $('#themeToggle').textContent = document.body.classList.contains('light') ? '☀' : '☾';
});

// ============================================================
// Exact base arithmetic
// A rational is stored as signed numerator / positive denominator.
// No floating-point arithmetic is used for base-number calculations.
// ============================================================
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT_VALUES = new Map([...DIGITS].map((ch, i) => [ch, i]));

function absBigInt(n) { return n < 0n ? -n : n; }
function gcd(a, b) {
  a = absBigInt(a); b = absBigInt(b);
  while (b !== 0n) { const t = a % b; a = b; b = t; }
  return a;
}
function powBigInt(base, exponent) {
  let result = 1n;
  let b = BigInt(base);
  let e = exponent;
  while (e > 0) {
    if (e % 2 === 1) result *= b;
    b *= b;
    e = Math.floor(e / 2);
  }
  return result;
}
function rational(numerator, denominator = 1n) {
  if (denominator === 0n) throw new Error('Division by zero is not allowed.');
  if (numerator === 0n) return { n: 0n, d: 1n };
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  const g = gcd(numerator, denominator);
  return { n: numerator / g, d: denominator / g };
}
function add(a, b) { return rational(a.n * b.d + b.n * a.d, a.d * b.d); }
function subtract(a, b) { return rational(a.n * b.d - b.n * a.d, a.d * b.d); }
function multiply(a, b) { return rational(a.n * b.n, a.d * b.d); }
function divide(a, b) { if (b.n === 0n) throw new Error('Division by zero is not allowed.'); return rational(a.n * b.d, a.d * b.n); }

function parseDigitsExact(text, base) {
  let value = 0n;
  for (const char of text.toUpperCase()) {
    const digit = DIGIT_VALUES.get(char);
    if (digit === undefined || digit >= base) throw new Error(`"${char}" is not valid in base ${base}.`);
    value = value * BigInt(base) + BigInt(digit);
  }
  return value;
}

function parseBaseNumber(raw, base) {
  let s = raw.trim().replace(/[\s,_]/g, '');
  if (!s) throw new Error('Enter a number.');

  let sign = 1n;
  if (s.startsWith('-')) { sign = -1n; s = s.slice(1); }
  else if (s.startsWith('+')) { s = s.slice(1); }

  if (base === 2 && /^0b/i.test(s)) s = s.slice(2);
  if (base === 8 && /^0o/i.test(s)) s = s.slice(2);
  if (base === 16 && /^0x/i.test(s)) s = s.slice(2);

  if ((s.match(/\./g) || []).length > 1) throw new Error('A number may contain only one decimal point.');
  const [integerPartRaw, fractionalPartRaw = ''] = s.split('.');
  const integerPart = integerPartRaw || '0';
  const fractionalPart = fractionalPartRaw;
  if (!integerPart && !fractionalPart) throw new Error('Invalid number.');
  if (!/^[0-9A-Za-z]+$/.test(integerPart) || (fractionalPart && !/^[0-9A-Za-z]+$/.test(fractionalPart))) {
    throw new Error(`Invalid number for base ${base}.`);
  }

  const coefficient = parseDigitsExact(integerPart + fractionalPart, base);
  const denominator = powBigInt(base, fractionalPart.length);
  return rational(sign * coefficient, denominator);
}

function bigintToBase(n, base) {
  return n.toString(base).toUpperCase();
}

function formatRational(value, base, maxFractionDigits = 32) {
  if (value.n === 0n) return '0';
  const sign = value.n < 0n ? '-' : '';
  const numerator = absBigInt(value.n);
  const denominator = value.d;
  const integerPart = numerator / denominator;
  let remainder = numerator % denominator;
  const output = sign + bigintToBase(integerPart, base);
  if (remainder === 0n || maxFractionDigits === 0) return output;

  let fraction = '';
  const seen = new Set();
  let repeating = false;

  for (let i = 0; i < maxFractionDigits && remainder !== 0n; i++) {
    const key = remainder.toString();
    if (seen.has(key)) { repeating = true; break; }
    seen.add(key);

    remainder *= BigInt(base);
    const digit = remainder / denominator;
    remainder %= denominator;
    fraction += DIGITS[Number(digit)];
  }
  if (remainder !== 0n) repeating = true;
  return output + '.' + fraction + (repeating ? '…' : '');
}

function detectBase(raw) {
  const s = raw.trim().replace(/[\s,_]/g, '').toLowerCase();
  if (/^[+-]?0b[01]+(?:\.[01]+)?$/.test(s)) return 2;
  if (/^[+-]?0o[0-7]+(?:\.[0-7]+)?$/.test(s)) return 8;
  if (/^[+-]?0x[0-9a-f]+(?:\.[0-9a-f]+)?$/.test(s)) return 16;
  if (/^[+-]?[0-9a-f]+(?:\.[0-9a-f]+)?$/.test(s) && /[a-f]/.test(s)) return 16;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) return 10;
  return null;
}

// ---------- Number converter ----------
function convertNumber() {
  const raw = $('#numberInput').value.trim();
  if (!raw) {
    ['outBinary','outDecimal','outOctal','outHex','outDigits','outFractionDigits'].forEach(id => setText(id, '—'));
    setStatus('numberStatus', '');
    return;
  }
  const selected = $('#numberBase').value;
  const base = selected === 'auto' ? detectBase(raw) : Number(selected);
  if (!base) {
    setStatus('numberStatus', 'Could not detect the base. For digit-only input such as 1010, select the intended base.', 'error');
    return;
  }
  try {
    const value = parseBaseNumber(raw, base);
    setText('outBinary', formatRational(value, 2, 48));
    setText('outDecimal', formatRational(value, 10, 48));
    setText('outOctal', formatRational(value, 8, 48));
    setText('outHex', formatRational(value, 16, 48));
    const signless = raw.replace(/^[+-]/, '').replace(/[\s,_]/g, '').replace(/^0[bBoOxX]/, '');
    const [i = '0', f = ''] = signless.split('.');
    setText('outDigits', String(i.length));
    setText('outFractionDigits', String(f.length));
    setStatus('numberStatus', `Interpreted as base ${base}. Hexadecimal and fractional values are supported.`, 'success');
  } catch (error) {
    ['outBinary','outDecimal','outOctal','outHex','outDigits','outFractionDigits'].forEach(id => setText(id, '—'));
    setStatus('numberStatus', error.message, 'error');
  }
}
$('#numberInput').addEventListener('input', convertNumber);
$('#numberBase').addEventListener('change', convertNumber);
$('#clearNumber').addEventListener('click', () => { $('#numberInput').value = ''; convertNumber(); $('#numberInput').focus(); });

// ---------- Expression parser ----------
let calcBase = 2;

function normalizeOperator(char) {
  if (char === '−') return '-';
  if (char === '×') return '*';
  if (char === '÷') return '/';
  return char;
}

function tokenizeExpression(input) {
  const s = input.replace(/[\u00A0\s]/g, '');
  if (!s) throw new Error('Enter an expression.');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const char = normalizeOperator(s[i]);
    if ('+*/()-'.includes(char)) {
      tokens.push({ type: 'op', value: char });
      i++;
      continue;
    }
    let j = i;
    while (j < s.length && !'+*/()-'.includes(normalizeOperator(s[j]))) j++;
    tokens.push({ type: 'number', value: s.slice(i, j) });
    i = j;
  }
  return tokens;
}

function parseExpression(input) {
  const tokens = tokenizeExpression(input);
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume(value) {
    if (tokens[pos]?.value === value) { pos++; return true; }
    return false;
  }

  function parseFactor() {
    if (consume('+')) return parseFactor();
    if (consume('-')) return rational(-parseFactor().n, parseFactor().d);
    if (consume('(')) {
      const value = parseAddSub();
      if (!consume(')')) throw new Error('Missing closing parenthesis.');
      return value;
    }
    const token = peek();
    if (!token || token.type !== 'number') throw new Error('A number was expected.');
    pos++;
    return parseBaseNumber(token.value, calcBase);
  }

  function parseMulDiv() {
    let value = parseFactor();
    while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = peek().value; pos++;
      const rhs = parseFactor();
      value = op === '*' ? multiply(value, rhs) : divide(value, rhs);
    }
    return value;
  }

  function parseAddSub() {
    let value = parseMulDiv();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = peek().value; pos++;
      const rhs = parseMulDiv();
      value = op === '+' ? add(value, rhs) : subtract(value, rhs);
    }
    return value;
  }

  const result = parseAddSub();
  if (pos !== tokens.length) throw new Error('Unexpected characters in the expression.');
  return result;
}

function setCalcBase(base) {
  calcBase = base;
  $$('.base-pill').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.calcBase) === base));
  const placeholders = {
    2: '110110101.101001 + 11010010.01010',
    8: '2734.3421 + 23452.562',
    16: '12A34BD345F.DFC + 2313DFCA.ACBDFE'
  };
  $('#calcExpression').placeholder = placeholders[base];
  $$('.example-btn').forEach(btn => { btn.style.display = Number(btn.dataset.exampleBase) === base ? '' : 'none'; });
}
$$('.base-pill').forEach(btn => btn.addEventListener('click', () => setCalcBase(Number(btn.dataset.calcBase))));
$$('.example-btn').forEach(btn => btn.addEventListener('click', () => {
  setCalcBase(Number(btn.dataset.exampleBase));
  $('#calcExpression').value = btn.textContent;
  calculateExpression();
}));

function calculateExpression() {
  const input = $('#calcExpression').value;
  if (!input.trim()) {
    ['calcResult','calcBinary','calcOctal','calcDecimal','calcHex'].forEach(id => setText(id, '—'));
    setStatus('calcStatus', '');
    return;
  }
  try {
    const result = parseExpression(input);
    const precision = Math.max(0, Math.min(64, Number($('#calcPrecision').value) || 32));
    const selectedResult = formatRational(result, calcBase, precision);
    setText('calcResult', selectedResult);
    setText('calcBinary', formatRational(result, 2, precision));
    setText('calcOctal', formatRational(result, 8, precision));
    setText('calcDecimal', formatRational(result, 10, precision));
    setText('calcHex', formatRational(result, 16, precision));
    const repeating = [2, 8, 10, 16].some(base => formatRational(result, base, precision).endsWith('…'));
    setStatus('calcStatus', repeating ? `Calculated exactly. Repeating/non-terminating displays are limited to ${precision} fractional digits and marked with …` : 'Calculated exactly with integer/fraction arithmetic.', 'success');
  } catch (error) {
    ['calcResult','calcBinary','calcOctal','calcDecimal','calcHex'].forEach(id => setText(id, '—'));
    setStatus('calcStatus', error.message, 'error');
  }
}
$('#calculateBtn').addEventListener('click', calculateExpression);
$('#calcExpression').addEventListener('keydown', e => { if (e.key === 'Enter') calculateExpression(); });
$('#calcPrecision').addEventListener('input', calculateExpression);
$('#clearCalc').addEventListener('click', () => { $('#calcExpression').value = ''; calculateExpression(); $('#calcExpression').focus(); });

// ---------- Text & Unicode ----------
function utf8Bytes(text) { return [...new TextEncoder().encode(text)]; }
function byteToBinary(byte) { return byte.toString(2).padStart(8, '0'); }
function codePointLabel(cp) { return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'); }
function escapeHTML(value) { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function renderTextConversion() {
  const text = $('#textInput').value;
  if (!text) {
    ['textBinary','textHex','textDecimalBytes'].forEach(id => setText(id, '—'));
    $('#unicodeTable').innerHTML = '<tr><td colspan="4" class="empty-cell">Enter text to see character details.</td></tr>';
    setStatus('textStatus', '');
    return;
  }
  const bytes = utf8Bytes(text);
  const binaries = bytes.map(byteToBinary);
  setText('textBinary', $('#groupBytes').checked ? binaries.join(' ') : binaries.join(''));
  setText('textHex', bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' '));
  setText('textDecimalBytes', bytes.join(' '));
  $('#unicodeTable').innerHTML = [...text].map(char => {
    const cp = char.codePointAt(0);
    const charBytes = utf8Bytes(char);
    return `<tr><td>${escapeHTML(char)}</td><td>${codePointLabel(cp)}</td><td>${charBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</td><td>${charBytes.map(byteToBinary).join(' ')}</td></tr>`;
  }).join('');
  setStatus('textStatus', `${[...text].length} Unicode character(s), ${bytes.length} UTF-8 byte(s).`, 'success');
}
$('#textInput').addEventListener('input', renderTextConversion);
$('#groupBytes').addEventListener('change', renderTextConversion);
$('#clearText').addEventListener('click', () => { $('#textInput').value=''; renderTextConversion(); $('#textInput').focus(); });

// ---------- Binary -> Text ----------
function decodeBinary() {
  const raw = $('#binaryInput').value.trim();
  if (!raw) {
    ['decodedText','binaryHex','binaryDecimal'].forEach(id => setText(id,'—'));
    setStatus('binaryStatus',''); return;
  }
  try {
    if (/[^01\s]/.test(raw)) throw new Error('Binary can contain only 0 and 1.');
    const continuous = raw.replace(/\s+/g,'');
    if (continuous.length % 8 !== 0) throw new Error('The binary length must be a multiple of 8 for UTF-8 byte decoding.');
    const bytes = [];
    for (let i=0; i<continuous.length; i+=8) bytes.push(parseInt(continuous.slice(i,i+8),2));
    const text = new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(bytes));
    setText('decodedText', text || '(empty)');
    setText('binaryHex', bytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' '));
    setText('binaryDecimal', bytes.join(' '));
    setStatus('binaryStatus', `${bytes.length} byte(s) decoded as UTF-8.`, 'success');
  } catch(error) {
    ['decodedText','binaryHex','binaryDecimal'].forEach(id => setText(id,'—'));
    setStatus('binaryStatus', error.message, 'error');
  }
}
$('#binaryInput').addEventListener('input', decodeBinary);
$('#clearBinary').addEventListener('click', () => { $('#binaryInput').value=''; decodeBinary(); $('#binaryInput').focus(); });

setCalcBase(2);
convertNumber();
renderTextConversion();
decodeBinary();
