// Save-code panel. A DOM overlay so the code can be copied and pasted.
// Game clock callers set session.modal while this is open.

import { session } from './session.js?v=1';
import { exportCode, importCode } from './save.js?v=1';

let root = null;
let onDone = null;

function el(tag, css, text) {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text != null) node.textContent = text;
  return node;
}

export function isCodeOpen() {
  return !!root;
}

export function closeCodePanel() {
  if (root && root.parentNode) root.parentNode.removeChild(root);
  root = null;
  session.modal = false;
  const done = onDone;
  onDone = null;
  if (done) done(false);
}

function fallbackCopy(text) {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    area.parentNode.removeChild(area);
    return !!ok;
  } catch (err) {
    return false;
  }
}

function copyText(text, status) {
  const done = (ok) => {
    status.textContent = ok ? 'Copied.' : 'Select the code and copy it.';
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => done(true)).catch(() => done(fallbackCopy(text)));
      return;
    }
  } catch (err) {
    // Fall through to the selection copy.
  }
  done(fallbackCopy(text));
}

export function openCodePanel(opts) {
  closeCodePanel();
  session.modal = true;
  onDone = opts && opts.onDone ? opts.onDone : null;
  const code = exportCode();
  root = el('div', 'position:fixed;inset:0;z-index:40;background:rgba(58,42,34,0.45);display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:auto;');
  root.id = 'codepanel';
  const card = el('div', 'width:min(640px,92vw);background:#FFF8EA;border:6px solid #3A2A22;border-radius:28px;padding:22px;box-sizing:border-box;user-select:text;-webkit-user-select:text;');
  card.appendChild(el('div', 'font:700 28px Trebuchet MS,sans-serif;color:#3A2A22;margin-bottom:8px;', 'Save code'));
  const area = document.createElement('textarea');
  area.id = 'savecode';
  area.readOnly = true;
  area.value = code;
  area.style.cssText = 'width:100%;height:140px;box-sizing:border-box;font:16px/1.4 ui-monospace,monospace;color:#3A2A22;background:#fff;border:4px solid #E7B56A;border-radius:12px;padding:10px;user-select:text;-webkit-user-select:text;touch-action:auto;';
  card.appendChild(area);
  const status = el('div', 'min-height:28px;margin:8px 0;font:700 18px Trebuchet MS,sans-serif;color:#8A7568;', '');
  card.appendChild(status);
  const row = el('div', 'display:flex;gap:12px;flex-wrap:wrap;');
  const btnCss = 'flex:1;min-width:140px;min-height:96px;border:4px solid #3A2A22;border-radius:18px;background:#FFE08A;font:700 22px Trebuchet MS,sans-serif;color:#3A2A22;touch-action:manipulation;';
  const copyBtn = el('button', btnCss, 'COPY');
  copyBtn.type = 'button';
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyText(area.value, status);
  });
  const loadLabel = el('div', 'width:100%;margin-top:12px;font:700 18px Trebuchet MS,sans-serif;color:#3A2A22;', 'Load code');
  const input = document.createElement('textarea');
  input.id = 'loadcode';
  input.style.cssText = area.style.cssText;
  input.placeholder = 'Paste a code';
  const loadBtn = el('button', btnCss + 'background:#B6E89A;', 'LOAD');
  loadBtn.type = 'button';
  loadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = importCode(input.value || '');
    if (!ok) {
      status.textContent = "That code didn't work";
      return;
    }
    status.textContent = 'Loaded.';
    const done = onDone;
    onDone = null;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    session.modal = false;
    if (done) done(true);
  });
  const closeBtn = el('button', btnCss + 'background:#FFF4D2;', 'CLOSE');
  closeBtn.type = 'button';
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeCodePanel();
  });
  row.appendChild(copyBtn);
  row.appendChild(loadBtn);
  row.appendChild(closeBtn);
  card.appendChild(row);
  card.appendChild(loadLabel);
  card.appendChild(input);
  root.appendChild(card);
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.body.appendChild(root);
  area.focus();
  area.select();
}
