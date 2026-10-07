/* Python and C++ are registered automatically when their highlight.js scripts load —
   calling registerLanguage() again is not needed and used to break the whole script */

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const gutter = document.getElementById('gutter');
const cursorInfo = document.getElementById('cursorInfo');
const charCount = document.getElementById('charCount');
const tabsbar = document.getElementById('tabsbar');
const activeFileName = document.getElementById('activeFileName');
const importInput = document.getElementById('importInput');
const contextMenu = document.getElementById('contextMenu');
const consoleEl = document.getElementById('console');
const outputLabel = document.getElementById('outputLabel');
const outputHint = document.getElementById('outputHint');
const outputControls = document.getElementById('outputControls');
const btnRun = document.getElementById('btnRun');
const btnClear = document.getElementById('btnClear');
const viewToggle = document.getElementById('viewToggle');
const resizer = document.getElementById('resizer');
const editorPane = document.querySelector('.pane-editor');
const mainEl = document.querySelector('main');

const btnSettings = document.getElementById('btnSettings');
const settingsPanel = document.getElementById('settingsPanel');
const themePhotoInput = document.getElementById('themePhotoInput');
const btnChoosePhoto = document.getElementById('btnChoosePhoto');
const btnRemovePhoto = document.getElementById('btnRemovePhoto');
const photoThumb = document.getElementById('photoThumb');
const colorGrid = document.getElementById('colorGrid');
const customColor = document.getElementById('customColor');
const bgPhotoEl = document.getElementById('bgPhoto');
const bgOverlayEl = document.getElementById('bgOverlay');

/* ---------- Markdown + code highlighting ---------- */

const renderer = new marked.Renderer();

renderer.code = function (token) {
  const code = typeof token === 'object' ? token.text : token;
  const infostring = typeof token === 'object' ? token.lang : arguments[1];
  const lang = (infostring || '').trim().split(/\s+/)[0].toLowerCase();

  let highlighted, langLabel;

  if (lang && hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(code, { language: lang }).value;
    langLabel = lang;
  } else {
    highlighted = hljs.highlightAuto(code).value;
    langLabel = lang || 'text';
  }

  return `<div class="code-block">
    <div class="code-block-head"><span class="lang-tag">${langLabel}</span></div>
    <pre><code class="hljs language-${langLabel}">${highlighted}</code></pre>
  </div>`;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

/* ---------- File system (in memory + localStorage) ---------- */

const DEMO_CONTENT = `# Multi-language note

This is regular **Markdown**: lists, *italic* and \`inline code\`.

## How to use this .mult file

**How to write.** Write text in regular Markdown. Put code in blocks:
three backticks, then the language name (\`python\` or \`cpp\`), the code, and three closing backticks.
On the left you edit the source text; on the right you see the rendered result right away.

**How to run.** Click **▶ Run** — all \`python\` and \`cpp\` blocks run top to bottom in order,
as one program. The results appear on the **Output** tab (switch between "Preview / Output").

**How to pass values between blocks.**
- in Python, print a line \`@@export name=value\`;
- in the next block, write \`{{name}}\` instead of the value — it is replaced before the block runs.

**Clear output** with the "Clear" button. To return to the rendered text, click "Preview".

## Python

\`\`\`python
class Greeter:
    def __init__(self, name):
        self.name = name

    def greet(self):
        for i in range(3):
            print(f"Hello, {self.name}!")

Greeter("world").greet()
\`\`\`

## C++

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int nums[] = {1, 2, 3};
    for (int i = 0; i < 3; i++) {
        cout << nums[i] << endl;
    }
    return 0;
}
\`\`\`

> Add new python or cpp blocks — the highlighting is applied automatically.
`;

const DEMO_PY = `class Greeter:
    def __init__(self, name):
        self.name = name

    def greet(self):
        for i in range(3):
            print(f"Hello, {self.name}!")

Greeter("world").greet()
`;

const DEMO_CPP = `#include <iostream>
using namespace std;

int value = 0;

void increment() { value++; }

int main() {
    int nums[] = {1, 2, 3};
    for (int i = 0; i < 3; i++) {
        if (nums[i] % 2 == 0) {
            increment();
        }
        cout << nums[i] << endl;
    }
    cout << "even count: " << value << endl;
    return 0;
}
`;

const DEMO_C = `#include <stdio.h>

int value = 0;

void increment() {
    value++;
}

int main() {
    int nums[3] = {1, 2, 3};
    for (int i = 0; i < 3; i++) {
        if (nums[i] % 2 == 0) {
            increment();
        }
        printf("%d\\n", nums[i]);
    }
    printf("even count: %d\\n", value);
    return 0;
}
`;

const DEMO_CALC = `# Calculator: Python + C++ + C in one file

This is a single script: the blocks below run in order, as one program.
To pass a value from one block to the next:

- **export** — print a line \`@@export name=value\`
- **import** — write \`{{name}}\` directly in the code of the next block;
  it is replaced with the text before running

Click **▶ Run** to execute the whole file top to bottom —
the result opens on the "Output" tab.

## Step 1 — input and the first half of the calculation in Python

\`\`\`python
a = 18
b = 24

half = (a + b) / 2
print(f"Python computed the average ({a} + {b}) / 2 = {half}")
print(f"@@export half={half}")
\`\`\`

## Step 2 — the second half in C++

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    double half = {{half}};
    double total = half * 2;
    cout << "C++ received from Python: " << half << endl;
    cout << "C++ restored the sum: " << total << endl;
    cout << "@@export total=" << total << endl;
    return 0;
}
\`\`\`

## Step 3 — a third language, C, to finish the job

\`\`\`c
#include <stdio.h>

int main() {
    double total = {{total}};
    printf("C received from C++: %.0f\\n", total);
    printf("C doubled it again: %.0f\\n", total * 2);
    return 0;
}
\`\`\`
`;

const DEMO_FILES = [
  { id: 'f1', name: 'calculator.mult', content: DEMO_CALC },
  { id: 'f2', name: 'note.mult', content: DEMO_CONTENT },
  { id: 'f3', name: 'hello.py', content: DEMO_PY },
  { id: 'f4', name: 'hello.cpp', content: DEMO_CPP },
  { id: 'f5', name: 'hello.c', content: DEMO_C }
];

let state = {
  files: DEMO_FILES.map(f => ({ ...f })),
  activeId: 'f1'
};

/* Replaces the demo files with their original content (matched by id).
   Other files the user created are kept. Needed because saved data in
   localStorage is not updated automatically when the demo files change. */
function restoreDemoFiles() {
  if (!confirm('Restore the demo files to their original content? Your other files are kept.')) return;
  DEMO_FILES.forEach(demo => {
    const existing = state.files.find(f => f.id === demo.id);
    if (existing) {
      existing.name = demo.name;
      existing.content = demo.content;
    } else {
      state.files.push({ ...demo });
    }
  });
  if (!state.files.some(f => f.id === state.activeId)) state.activeId = state.files[0].id;
  renderAll();
  saveState();
}

function loadState() {
  try {
    const raw = localStorage.getItem('polyglot-notebook-state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.files) && parsed.files.length) {
        state = parsed;
      }
    }
  } catch (e) {
    /* localStorage unavailable or data corrupted — stay on the demo files */
  }
}

function saveState() {
  try {
    localStorage.setItem('polyglot-notebook-state', JSON.stringify(state));
  } catch (e) {
    /* nowhere to store — continue without persistence */
  }
}

function activeFile() {
  return state.files.find(f => f.id === state.activeId) || state.files[0];
}

/* Decide what to do with a file based on its extension:
   .py -> run as Python, .cpp/.cc/.cxx/.h/.hpp -> run as C++, anything else -> Markdown preview */
function fileKind(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'py') return 'python';
  if (ext === 'c') return 'c';
  if (['cpp', 'cc', 'cxx', 'h', 'hpp'].includes(ext)) return 'cpp';
  return 'markdown'; // includes .mult (this app's notebook extension) and plain .md
}

/* Console output is stored per file, in memory (not in localStorage) */
const consoleLogs = {}; // fileId -> [{type, text}]
const viewModes = {};   // fileId -> 'preview' | 'output' (for .mult files with code)

function getLog(fileId) {
  if (!consoleLogs[fileId]) consoleLogs[fileId] = [];
  return consoleLogs[fileId];
}

function getViewMode(fileId) {
  return viewModes[fileId] || 'preview';
}
function setViewMode(fileId, mode) {
  viewModes[fileId] = mode;
}

/* ---------- Extract ```python / ```cpp / ```c blocks from one .mult file ---------- */

function extractBlocks(content) {
  const blocks = [];
  const re = /```(\w+)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    blocks.push({ lang: m[1].toLowerCase(), code: m[2] });
  }
  return blocks;
}

function hasRunnableBlocks(content) {
  return extractBlocks(content).some(b => b.lang === 'python' || b.lang === 'cpp' || b.lang === 'c');
}

/* replaces {{name}} with values exported by earlier blocks */
function substituteBridge(code, bridge) {
  return code.replace(/\{\{(\w+)\}\}/g, (full, key) => {
    return Object.prototype.hasOwnProperty.call(bridge, key) ? bridge[key] : full;
  });
}

/* Line-by-line output router: lines like "@@export name=value" go into the bridge
   and are not shown as normal output; everything else is shown as output */
function createLineRouter(fileId, bridge) {
  let buf = '';
  function routeLine(line) {
    const m = line.match(/^@@export\s+([A-Za-z_]\w*)\s*=\s*(.*)$/);
    if (m) {
      bridge[m[1]] = m[2];
      appendConsole(fileId, 'info', `✓ exported: ${m[1]} = ${m[2]}`);
    } else {
      appendConsole(fileId, 'out', line);
    }
  }
  return {
    handle(chunk) {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        routeLine(buf.slice(0, idx));
        buf = buf.slice(idx + 1);
      }
    },
    flush() {
      if (buf) { routeLine(buf); buf = ''; }
    }
  };
}

function uid() {
  return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function ensureMultExt(name) {
  name = (name || '').trim();
  if (!name) return 'untitled.mult';
  if (!/\.[a-zA-Z0-9]+$/.test(name)) return name + '.mult';
  return name;
}

/* ---------- Interface rendering ---------- */

function renderTabs() {
  tabsbar.innerHTML = '';
  state.files.forEach(file => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (file.id === state.activeId ? ' active' : '');
    tab.dataset.fileId = file.id;
    tab.innerHTML = `
      <svg class="tab-icon" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v10H2z" stroke="currentColor" stroke-width="1.1"/><path d="M4.5 6h7M4.5 8h7M4.5 10h4" stroke="currentColor" stroke-width="1.1"/></svg>
      <span class="tab-name"></span>
      <button class="tab-close" title="Close and delete file">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </button>
    `;
    tab.querySelector('.tab-name').textContent = file.name;

    tab.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) return;
      switchFile(file.id);
    });
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFile(file.id);
    });
    tab.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      switchFile(file.id);
      openContextMenu(e.clientX, e.clientY, file.id);
    });

    tabsbar.appendChild(tab);
  });

  const addBtn = document.createElement('div');
  addBtn.className = 'tab-add';
  addBtn.title = 'New file';
  addBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  addBtn.addEventListener('click', newFile);
  tabsbar.appendChild(addBtn);
}

/* ---------- Context menu (right-click on a tab) ---------- */

function openContextMenu(x, y, fileId) {
  contextMenu.dataset.fileId = fileId;
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.add('open');

  // keep the menu inside the right/bottom edge of the screen
  requestAnimationFrame(() => {
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = Math.max(4, window.innerWidth - rect.width - 8) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = Math.max(4, window.innerHeight - rect.height - 8) + 'px';
    }
  });
}

function closeContextMenu() {
  contextMenu.classList.remove('open');
  delete contextMenu.dataset.fileId;
}

document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});
document.addEventListener('scroll', closeContextMenu, true);
window.addEventListener('resize', closeContextMenu);

contextMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const fileId = contextMenu.dataset.fileId;
  closeContextMenu();
  switch (btn.dataset.action) {
    case 'rename': renameFile(fileId); break;
    case 'export': exportFile(fileId); break;
    case 'import': importFile(); break;
    case 'delete': deleteFile(fileId); break;
    case 'restore': restoreDemoFiles(); break;
  }
});

function renderPreview() {
  preview.innerHTML = marked.parse(activeFile().content || '');
}

/* ---------- Switching between Markdown preview and run output ---------- */

function renderOutputPane() {
  const file = activeFile();
  const kind = fileKind(file.name);

  if (kind === 'python' || kind === 'cpp' || kind === 'c') {
    preview.hidden = true;
    consoleEl.hidden = false;
    outputControls.hidden = false;
    viewToggle.hidden = true;
    outputLabel.textContent = 'OUTPUT';
    outputHint.textContent = kind === 'python' ? 'Python (Pyodide)' : kind === 'c' ? 'C (JSCPP)' : 'C++ (JSCPP)';
    renderConsole();
    return;
  }

  // kind === 'markdown'
  const runnable = hasRunnableBlocks(file.content);

  if (!runnable) {
    preview.hidden = false;
    consoleEl.hidden = true;
    outputControls.hidden = true;
    viewToggle.hidden = true;
    outputLabel.textContent = 'PREVIEW';
    outputHint.textContent = 'Markdown';
    renderPreview();
    return;
  }

  // a .mult file with mixed ```python / ```cpp blocks —
  // both the preview and running the whole file are available
  outputControls.hidden = false;
  viewToggle.hidden = false;
  outputHint.textContent = 'Python + C + C++ in one .mult';

  const mode = getViewMode(file.id);
  viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'output') {
    outputLabel.textContent = 'OUTPUT';
    preview.hidden = true;
    consoleEl.hidden = false;
    renderConsole();
  } else {
    outputLabel.textContent = 'PREVIEW';
    preview.hidden = false;
    consoleEl.hidden = true;
    renderPreview();
  }
}

viewToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-toggle-btn');
  if (!btn) return;
  setViewMode(activeFile().id, btn.dataset.mode);
  renderOutputPane();
});

function renderConsole() {
  const log = getLog(activeFile().id);
  if (!log.length) {
    consoleEl.innerHTML = '<span class="line-empty">Click “Run” to execute the file.</span>';
    return;
  }
  consoleEl.innerHTML = log
    .map(entry => `<span class="line-${entry.type}">${escapeHtml(entry.text)}</span>`)
    .join('');
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function appendConsole(fileId, type, text) {
  if (!text) return;
  getLog(fileId).push({ type, text: text.endsWith('\n') ? text : text + '\n' });
  if (fileId === state.activeId) renderConsole();
}

function clearConsole() {
  consoleLogs[activeFile().id] = [];
  renderConsole();
}

/* ---------- Lazy loading of Python (Pyodide) and C++ (JSCPP) ---------- */

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error('load failed')));
      if (existing.dataset.loaded === 'true') resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.src = src;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = () => reject(new Error('load failed: ' + src));
    document.head.appendChild(s);
  });
}

let pyodidePromise = null;
function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadScriptOnce('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js')
      .then(() => window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }));
  }
  return pyodidePromise;
}

const JSCPP_SOURCES = [
  'https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/dist/JSCPP.es5.min.js',
  'https://cdn.jsdelivr.net/gh/felixhao28/JSCPP@gh-pages/dist/JSCPP.es5.min.js',
  'https://raw.githubusercontent.com/felixhao28/JSCPP/gh-pages/dist/JSCPP.es5.min.js'
];

let jscppPromise = null;
function getJSCPP() {
  if (!jscppPromise) {
    jscppPromise = (async () => {
      let lastError;
      for (const src of JSCPP_SOURCES) {
        try {
          await loadScriptOnce(src);
          if (window.JSCPP) return window.JSCPP;
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error('JSCPP not found on any source');
    })();
  }
  return jscppPromise;
}

/* ---------- Running the active file ---------- */

let isRunning = false;

async function runActiveFile() {
  if (isRunning) return;
  const file = activeFile();
  const kind = fileKind(file.name);

  isRunning = true;
  btnRun.disabled = true;

  try {
    if (kind === 'python') {
      appendConsole(file.id, 'info', `▶ Running ${file.name}…`);
      await runPythonBlock(file.id, file.content, {});
      appendConsole(file.id, 'info', '— execution finished —');
    } else if (kind === 'cpp' || kind === 'c') {
      appendConsole(file.id, 'info', `▶ Running ${file.name}…`);
      await runCppBlock(file.id, file.content, {});
      appendConsole(file.id, 'info', '— execution finished —');
    } else if (hasRunnableBlocks(file.content)) {
      setViewMode(file.id, 'output');
      renderOutputPane();
      await runNotebook(file);
    }
  } finally {
    isRunning = false;
    btnRun.disabled = false;
  }
}

/* Runs one .mult file as a single program: ```python / ```cpp blocks run in order,
   values are passed through the bridge (@@export in one block's output ->
   {{name}} in the next block's code). */
async function runNotebook(file) {
  const blocks = extractBlocks(file.content);
  const bridge = {};

  appendConsole(file.id, 'info', `▶ Running .mult file ${file.name} (${blocks.length} block(s))…`);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.lang !== 'python' && block.lang !== 'cpp' && block.lang !== 'c') continue;

    appendConsole(file.id, 'info', `— Block ${i + 1}: ${block.lang} —`);
    const code = substituteBridge(block.code, bridge);

    if (block.lang === 'python') {
      await runPythonBlock(file.id, code, bridge);
    } else {
      await runCppBlock(file.id, code, bridge);
    }
  }

  appendConsole(file.id, 'info', '— .mult file finished —');
}

async function runPythonBlock(fileId, code, bridge) {
  let pyodide;
  try {
    pyodide = await getPyodide();
  } catch (e) {
    appendConsole(fileId, 'err', 'Could not load the Python runtime — blocked by this page’s network settings.');
    return;
  }

  const router = createLineRouter(fileId, bridge);
  pyodide.setStdout({ batched: (s) => router.handle(s + '\n') });
  pyodide.setStderr({ batched: (s) => appendConsole(fileId, 'err', s) });

  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    // an error in user code does not kill the interpreter —
    // it can be run again any number of times, including the next block
    appendConsole(fileId, 'err', String(err));
  } finally {
    router.flush();
  }
}

/* JSCPP 2.0.9's parser has no :: operator in expressions (std::cout),
   but its standard names are global — after #include <iostream>, cout, endl, etc.
   are available. So the std:: qualifier is removed; the meaning of the code does not change. */
function toJSCPPSource(code) {
  return code.replace(/\bstd::/g, '');
}

async function runCppBlock(fileId, code, bridge) {
  let JSCPPlib;
  try {
    JSCPPlib = await getJSCPP();
  } catch (e) {
    appendConsole(fileId, 'err', 'Could not load the C++ runtime — blocked by this page’s network settings.');
    return;
  }

  const router = createLineRouter(fileId, bridge);
  try {
    JSCPPlib.run(toJSCPPSource(code), '', {
      stdio: { write: (s) => router.handle(s) },
      maxExecutionSteps: 1e7
    });
  } catch (err) {
    // JSCPP is a teaching interpreter: it supports basic C++ and part of the STL,
    // not the whole standard; the error does not break the page or the next block/run
    appendConsole(fileId, 'err', String((err && err.message) || err));
  } finally {
    router.flush();
  }
}

btnRun.addEventListener('click', runActiveFile);
btnClear.addEventListener('click', clearConsole);

function renderGutter() {
  const lineCount = (activeFile().content.match(/\n/g) || []).length + 1;
  let lines = '';
  for (let i = 1; i <= lineCount; i++) lines += i + '\n';
  gutter.textContent = lines;
}

function renderCursorInfo() {
  const value = editor.value;
  const pos = editor.selectionStart;
  const before = value.slice(0, pos);
  const line = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n');
  cursorInfo.textContent = `Ln ${line}, Col ${col}`;
}

function renderCharCount() {
  charCount.textContent = `${editor.value.length} characters`;
}

function renderFileName() {
  activeFileName.textContent = activeFile().name;
}

function renderAll() {
  editor.value = activeFile().content;
  renderTabs();
  renderOutputPane();
  renderGutter();
  renderCharCount();
  renderCursorInfo();
  renderFileName();
}

/* ---------- File actions ---------- */

function switchFile(id) {
  state.activeId = id;
  renderAll();
}

function newFile() {
  const name = ensureMultExt(prompt('New file name:', 'note-' + (state.files.length + 1) + '.mult'));
  if (name === null) return;
  const file = { id: uid(), name, content: '' };
  state.files.push(file);
  state.activeId = file.id;
  renderAll();
  saveState();
  editor.focus();
}

function renameFile(fileId) {
  const file = state.files.find(f => f.id === fileId) || activeFile();
  const name = ensureMultExt(prompt('New file name:', file.name));
  if (name === null) return;
  file.name = name;
  renderAll();
  saveState();
}

function deleteFile(fileId) {
  if (state.files.length <= 1) {
    alert('You cannot delete the last file.');
    return;
  }
  const file = state.files.find(f => f.id === fileId) || activeFile();
  const idx = state.files.findIndex(f => f.id === file.id);
  state.files.splice(idx, 1);
  if (state.activeId === file.id) {
    state.activeId = state.files[Math.max(0, idx - 1)].id;
  }
  renderAll();
  saveState();
}

function exportFile(fileId) {
  const file = state.files.find(f => f.id === fileId) || activeFile();
  const blob = new Blob([file.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFile() {
  importInput.value = '';
  importInput.click();
}

importInput.addEventListener('change', () => {
  const inputFile = importInput.files && importInput.files[0];
  if (!inputFile) return;
  const reader = new FileReader();
  reader.onload = () => {
    const file = { id: uid(), name: inputFile.name, content: String(reader.result || '') };
    state.files.push(file);
    state.activeId = file.id;
    renderAll();
    saveState();
  };
  reader.readAsText(inputFile);
});

/* ---------- Typing in the editor ---------- */

editor.addEventListener('input', () => {
  activeFile().content = editor.value;
  if (fileKind(activeFile().name) === 'markdown') renderPreview();
  renderGutter();
  renderCharCount();
  renderCursorInfo();
  saveState();
});
editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });
editor.addEventListener('click', renderCursorInfo);
editor.addEventListener('keyup', renderCursorInfo);

/* ---------- Resizing the split between source and output ----------
   Guarded: if index.html does not have the #resizer element (an older
   copy of the file, for example), this block is skipped instead of
   throwing and stopping every script below it, including loadState()
   and renderAll() at the bottom of this file. */

if (resizer && editorPane && mainEl) {
  let dragging = false;
  let dragStartY = 0;
  let dragStartH = 0;

  resizer.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartY = e.clientY;
    dragStartH = editorPane.getBoundingClientRect().height;
    resizer.setPointerCapture(e.pointerId);
    resizer.classList.add('dragging');
    document.body.style.userSelect = 'none';
  });

  resizer.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const total = mainEl.getBoundingClientRect().height;
    const minH = 60;
    const maxH = total - resizer.offsetHeight - 80; // keep at least 80px for the output pane
    const h = Math.min(maxH, Math.max(minH, dragStartH + (e.clientY - dragStartY)));
    editorPane.style.flex = `0 0 ${h}px`;
  });

  function endDrag() {
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.userSelect = '';
  }
  resizer.addEventListener('pointerup', endDrag);
  resizer.addEventListener('pointercancel', endDrag);
} else {
  console.warn('Resizer handle not found — skipping drag-to-resize setup. Make sure index.html and script.js are the same version.');
}

/* ---------- Theme: background photo + accent color ----------
   Guarded like the resizer block above: if any of these elements are
   missing from index.html, this whole block is skipped instead of
   throwing and stopping loadState() / renderAll() below. */

const THEME_KEY = 'polyglot-notebook-theme';
const DEFAULT_ACCENT = '#007acc';

const ACCENT_PALETTE = [
  { hex: '#007acc', name: 'Blue' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#8957e5', name: 'Purple' },
  { hex: '#d6409f', name: 'Magenta' },
  { hex: '#e5484d', name: 'Red' },
  { hex: '#f2994a', name: 'Orange' },
  { hex: '#f2c94c', name: 'Yellow' },
  { hex: '#27ae60', name: 'Green' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#22d3ee', name: 'Cyan' },
  { hex: '#fb7185', name: 'Rose' },
  { hex: '#64748b', name: 'Slate' }
];

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return { r: 0, g: 122, b: 204 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

if (btnSettings && settingsPanel && themePhotoInput && btnChoosePhoto &&
    btnRemovePhoto && photoThumb && colorGrid && customColor && bgPhotoEl && bgOverlayEl) {

  let theme = { accent: DEFAULT_ACCENT, photo: null };

  function loadTheme() {
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          theme = { accent: parsed.accent || DEFAULT_ACCENT, photo: parsed.photo || null };
        }
      }
    } catch (e) {
      /* localStorage unavailable or data corrupted — stay on the default theme */
    }
  }

  function saveTheme() {
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch (e) {
      // most likely the photo is too large for localStorage's quota (~5–10 MB per origin)
      alert('Could not save the theme — the image may be too large for this browser to store. The accent color and image still apply to this session, but will not persist after reload.');
    }
  }

  function applyTheme() {
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-soft', hexToRgba(theme.accent, 0.14));

    if (theme.photo) {
      bgPhotoEl.style.backgroundImage = `url("${theme.photo}")`;
      bgOverlayEl.style.backgroundColor = hexToRgba(theme.accent, 0.38);
      document.body.classList.add('has-bg-photo');
      photoThumb.style.backgroundImage = `url("${theme.photo}")`;
      photoThumb.classList.add('visible');
    } else {
      bgPhotoEl.style.backgroundImage = '';
      bgOverlayEl.style.backgroundColor = 'transparent';
      document.body.classList.remove('has-bg-photo');
      photoThumb.style.backgroundImage = '';
      photoThumb.classList.remove('visible');
    }

    customColor.value = theme.accent;
    renderColorGrid();
  }

  function renderColorGrid() {
    colorGrid.innerHTML = '';
    ACCENT_PALETTE.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'color-swatch' + (c.hex.toLowerCase() === theme.accent.toLowerCase() ? ' active' : '');
      btn.style.background = c.hex;
      btn.title = c.name;
      btn.addEventListener('click', () => {
        theme.accent = c.hex;
        applyTheme();
        saveTheme();
      });
      colorGrid.appendChild(btn);
    });
  }

  function openSettingsPanel() {
    settingsPanel.classList.add('open');
  }
  function closeSettingsPanel() {
    settingsPanel.classList.remove('open');
  }

  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.contains('open') ? closeSettingsPanel() : openSettingsPanel();
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== btnSettings && !btnSettings.contains(e.target)) {
      closeSettingsPanel();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettingsPanel();
  });

  btnChoosePhoto.addEventListener('click', () => {
    themePhotoInput.value = '';
    themePhotoInput.click();
  });

  themePhotoInput.addEventListener('change', () => {
    const file = themePhotoInput.files && themePhotoInput.files[0];
    if (!file) return;
    const MAX_BYTES = 4 * 1024 * 1024; // keep comfortably under typical localStorage quotas
    if (file.size > MAX_BYTES) {
      alert('That image is too large (over 4 MB). Please choose a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      theme.photo = String(reader.result || '');
      applyTheme();
      saveTheme();
    };
    reader.onerror = () => {
      alert('Could not read that image file.');
    };
    reader.readAsDataURL(file);
  });

  btnRemovePhoto.addEventListener('click', () => {
    theme.photo = null;
    applyTheme();
    saveTheme();
  });

  customColor.addEventListener('input', () => {
    theme.accent = customColor.value;
    applyTheme();
    saveTheme();
  });

  loadTheme();
  applyTheme();
} else {
  console.warn('Theme settings elements not found — skipping theme setup. Make sure index.html and script.js are the same version.');
}

/* ---------- Start ---------- */

loadState();
renderAll();