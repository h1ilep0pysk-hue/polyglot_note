# Polyglot Notebook

A single-page, browser-only Markdown editor that can also run Python and C++
code blocks. Everything runs in the browser: there is no backend and no build step.

## Features

- **Live Markdown editor.** Source on the top pane, rendered preview below it,
  with line numbers, cursor position, and character count.
- **Multiple files in tabs.** Create, rename, import, export, and delete files
  from the tab bar. Right-click a tab for the context menu.
- **Run Python.** `.py` files, or `python` blocks inside a `.mult` file, run in
  Pyodide (CPython compiled to WebAssembly).
- **Run C++.** `.cpp`/`.cc`/`.cxx`/`.h`/`.hpp` files, or `cpp` blocks inside a
  `.mult` file, run in JSCPP (a C++ interpreter written in JavaScript).
- **Mixed notebooks.** A `.mult` file with `python` and `cpp` blocks runs as one
  program, top to bottom, and values can be passed between blocks.
- **Resizable panes.** Drag the splitter between the source and the output.
- **Custom theme.** Pick an accent color from a palette (or any custom color)
  and an optional background photo, via the gear icon in the title bar.
- **Persistence.** Files and the chosen theme are saved to `localStorage` in
  your browser.

## Project structure

| File         | Purpose                                                        |
|--------------|------------------------------------------------------------------|
| `index.html` | Layout, toolbar, theme panel, context menu, CDN script tags    |
| `script.js`  | All logic: file state, Markdown rendering, running code, theme, UI |
| `style.css`  | Dark, VS Code–style theme and layout                           |
| `README.md`  | This document                                                  |

External libraries (loaded from CDNs):

- marked 12.0.2, Markdown parser
- highlight.js 11.9.0, syntax highlighting (plus Python and C++ grammars)
- Pyodide 0.26.4, loaded only on the first Python run
- JSCPP 2.0.9, loaded only on the first C++ run

## Getting started

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
   Internet access is required for the CDN libraries.
2. Pick a file from the tab bar. Demo files are `calculator.mult`, `note.mult`,
   `hello.py`, and `hello.cpp`.
3. Click **Run** to execute the file.

No installation is needed. To host it, copy the three files to any static web server.

## Theme: accent color and background photo

Click the **gear icon** (⚙) in the top-right corner of the title bar to open
the theme panel.

- **Background image.** Click **Choose image** to pick a photo from your
  device (4 MB max). It becomes a full-screen background behind the whole
  interface. Click **Remove** to clear it. The photo never covers any part of
  the UI — the title bar, tabs, panes, and status bar always sit above it, and
  turn slightly translucent with a blur so the photo shows through without
  hurting readability.
- **Accent color.** Pick one of the 12 preset colors in the palette, or use the
  **Custom** color picker for any hex value. The accent color is used for tab
  highlights, the Run button, borders, and — when a background photo is set —
  it is blended as a soft tint over the photo, so the photo and the interface
  color always match.
- Click the gear icon again, click outside the panel, or press **Esc** to
  close it.
- Both the accent color and the background photo are saved to `localStorage`
  (key `polyglot-notebook-theme`) and restored automatically on reload. If the
  chosen photo is too large for the browser to store, the app shows a warning;
  the theme still applies for the current session, it just will not persist
  after a reload.

## What `.mult` is

`.mult` is this app's own extension for a notebook file: plain Markdown text
with `python`, `c`, and `cpp` code blocks that can be run. It is not a
standard file format outside this app — the content is ordinary Markdown,
only the extension is custom, so other Markdown tools may not recognize it.
Plain `.md` files still open and render normally; they are just treated as
non-runnable unless they also contain `python`, `c`, or `cpp` blocks.

## How to use a `.mult` file

### Writing

Write regular Markdown. Put code in fenced blocks, using a language name that
the runner understands:

````markdown
```python
print("hello")
```

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "hello" << endl;
    return 0;
}
```
````

Other fence languages are rendered and highlighted but not executed.

### Running

- **Run** executes every `python` and `cpp` block in order, as one program.
- The **Output** tab shows the results. **Preview** shows the rendered document.
- **Clear** empties the output for the current file.

### Passing values between blocks

- **Export.** Print a line of the form `@@export name=value` from a block.
  The line is removed from the output and recorded.
- **Import.** Write `{{name}}` in the code of a later block. It is replaced with
  the exported text before that block runs.

```python
half = 21.0
print(f"@@export half={half}")
```

```cpp
#include <iostream>
using namespace std;

int main() {
    double half = {{half}};
    cout << half * 2 << endl;
    return 0;
}
```

Values are substituted as text, so a Python `21.0` becomes `21.0` in the C++ code.

## Supported languages

### Python

Full CPython 3.12 running in the browser through Pyodide, including the standard library.
Output via `print` appears in the Output tab. Errors are shown in red.
The interpreter stays alive between runs in the same page session.

### C++ (JSCPP): important limits

JSCPP is a teaching interpreter, not a compiler. It implements a subset of C++.

Works:

- `#include <iostream>` with `cout`, `cin`, and `endl`
- `using namespace std;`
- Functions, global and local variables, `if`, `for`, `while`
- Arrays such as `int nums[] = {1, 2, 3};`
- Basic arithmetic, `double`, and `int`

Does **not** work (as of JSCPP 2.0.9):

- `class` and `struct` definitions. The parser fails on `class Name {`.
- `#include <vector>` and other headers that are not built in. The error is
  `cannot find library: <name>`.
- The `::` operator in expressions. Qualified names such as `std::cout` are rewritten
  to `cout` before the code is run. The file itself keeps `std::cout`.

Workarounds: use plain arrays instead of `vector`, use functions instead of
classes, and add `using namespace std;` if you prefer to write `cout` without the prefix.

## Persistence and resetting

All files and their content are stored in `localStorage` under the key
`polyglot-notebook-state`. The theme (accent color and background photo) is
stored separately under `polyglot-notebook-theme`. Console output is not
saved; it exists only for the current page session.

To reset files to the demo content, run this in the browser console (F12):

```js
localStorage.removeItem('polyglot-notebook-state'); location.reload();
```

To reset the theme back to the default blue accent with no photo:

```js
localStorage.removeItem('polyglot-notebook-theme'); location.reload();
```

These delete your files or theme in this browser. Export anything you need first.

## Known issues and limits

Fixed:

- The `note.mult` blockquote no longer contains literal triple backticks, so the
  Markdown preview renders it correctly.
- Demo files saved in `localStorage` can be brought back to their original content:
  right-click any tab and choose **Restore demo files**. Your other files are kept.

Limits that are inherent to the design (not bugs):

- Pyodide and JSCPP are loaded from CDNs. If a CDN is blocked, the runtime
  reports that it could not load. Python and C++ then do not run until the CDN is reachable.
- Code runs in the page with no sandbox beyond the browser's own. Only run code you trust.
- A background photo is stored as a data URL in `localStorage`, which typically
  has a 5–10 MB quota per browser origin; very large photos may fail to persist
  (see above).

## Keyboard and mouse

- **Tab bar:** click to switch, right-click for Rename / Export / Import / Restore demo files / Delete.
- **Gear icon:** opens/closes the theme panel; click outside the panel or press Esc to close it.
- **Splitter:** drag up or down to resize the source and output panes.
- **Editor:** tabs are inserted as 4 spaces (`tab-size: 4`); the gutter follows the scroll position.

## Development notes

- No build step, no package manager. Edit the files and reload.
- Keep `script.js` free of framework code. It is intentionally a single file.
- Run `node --check script.js` before committing to catch syntax errors.