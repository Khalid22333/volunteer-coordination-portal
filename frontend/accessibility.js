/**
 Sprint 2 Adding accessibility features
  Adds a floating accessibility widget with:
 - Font size controls (increase / decrease / reset)
 - High contrast mode toggle
 *
TO USE: add ONE line before </body> on any portal page:
 <script src="accessibility.js"></script>
 
  Preferences are saved to localStorage and restored on every page.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'vcp_a11y';
  const FONT_MIN = 12;
  const FONT_MAX = 32;
  const FONT_STEP = 2;
  const FONT_DEFAULT = 16;

  /* ── Load saved prefs ─────────────────────────────────────────── */
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  /* ── Apply prefs to <html> ────────────────────────────────────── */
  function applyFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
  }

  function applyContrast(on) {
    document.documentElement.classList.toggle('a11y-high-contrast', on);
  }

  /* ── Inject CSS ───────────────────────────────────────────────── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── High contrast overrides ── */
      .a11y-high-contrast,
      .a11y-high-contrast body {
        background: #000 !important;
        color: #fff !important;
      }
      .a11y-high-contrast a {
        color: #ffee00 !important;
      }
      .a11y-high-contrast button,
      .a11y-high-contrast .btn,
      .a11y-high-contrast .btn-primary {
        background: #ffee00 !important;
        color: #000 !important;
        border: 2px solid #fff !important;
      }
      .a11y-high-contrast input,
      .a11y-high-contrast select,
      .a11y-high-contrast textarea {
        background: #111 !important;
        color: #fff !important;
        border: 2px solid #fff !important;
      }
      .a11y-high-contrast .header,
      .a11y-high-contrast header {
        background: #000 !important;
        border-bottom: 2px solid #ffee00 !important;
      }
      .a11y-high-contrast .logo,
      .a11y-high-contrast .brand {
        color: #ffee00 !important;
      }
      .a11y-high-contrast .card,
      .a11y-high-contrast .shell,
      .a11y-high-contrast .left,
      .a11y-high-contrast .right {
        background: #111 !important;
        border: 1px solid #fff !important;
      }
      .a11y-high-contrast :focus-visible {
        outline: 3px solid #ffee00 !important;
        outline-offset: 3px !important;
      }

      /* ── Widget ── */
      #a11y-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
      }

      #a11y-toggle-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #1b3d1b;
        color: #f5c518;
        border: 2px solid #f5c518;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
        transition: transform .2s, background .2s;
        margin-left: auto;
      }

      #a11y-toggle-btn:hover {
        transform: scale(1.08);
        background: #2e5e2e;
      }

      #a11y-toggle-btn:focus-visible {
        outline: 3px solid #f5c518;
        outline-offset: 3px;
      }

      #a11y-panel {
        background: #fff;
        border: 1.5px solid #d1d5db;
        border-radius: 14px;
        padding: 18px 18px 14px;
        width: 230px;
        box-shadow: 0 8px 32px rgba(0,0,0,.18);
        margin-bottom: 10px;
        display: none;
        animation: a11y-pop .15s ease;
      }

      #a11y-panel.open { display: block; }

      @keyframes a11y-pop {
        from { opacity: 0; transform: translateY(8px) scale(.97); }
        to   { opacity: 1; transform: translateY(0)  scale(1);    }
      }

      .a11y-panel-title {
        font-weight: 700;
        font-size: 12px;
        letter-spacing: .8px;
        text-transform: uppercase;
        color: #1b3d1b;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .a11y-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .a11y-row-label {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .a11y-row-sub {
        font-size: 11px;
        color: #6b7280;
        margin-top: 1px;
      }

      /* stepper */
      .a11y-stepper {
        display: flex;
        align-items: center;
        background: #f3f4f6;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }

      .a11y-stepper button {
        width: 30px;
        height: 30px;
        background: none;
        border: none;
        font-size: 16px;
        font-weight: 700;
        color: #1b3d1b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s;
        flex-shrink: 0;
      }

      .a11y-stepper button:hover { background: #e5e7eb; }

      .a11y-stepper button:focus-visible {
        outline: 2px solid #f5c518;
        outline-offset: -2px;
      }

      .a11y-stepper-val {
        min-width: 36px;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        color: #1b3d1b;
      }

      /* toggle */
      .a11y-switch {
        position: relative;
        width: 42px;
        height: 24px;
        flex-shrink: 0;
      }

      .a11y-switch input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }

      .a11y-switch-track {
        position: absolute;
        inset: 0;
        background: #d1d5db;
        border-radius: 24px;
        cursor: pointer;
        transition: background .2s;
      }

      .a11y-switch-track::after {
        content: '';
        position: absolute;
        left: 3px;
        top: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,.2);
        transition: transform .2s;
      }

      .a11y-switch input:checked + .a11y-switch-track {
        background: #3a5a2e;
      }

      .a11y-switch input:checked + .a11y-switch-track::after {
        transform: translateX(18px);
      }

      .a11y-switch input:focus-visible + .a11y-switch-track {
        outline: 2px solid #f5c518;
        outline-offset: 2px;
        border-radius: 24px;
      }

      .a11y-divider {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 12px 0;
      }

      .a11y-reset {
        width: 100%;
        background: none;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        font-family: 'DM Sans', sans-serif;
        font-size: 12px;
        font-weight: 500;
        padding: 7px;
        border-radius: 7px;
        cursor: pointer;
        transition: all .15s;
      }

      .a11y-reset:hover {
        border-color: #dc2626;
        color: #dc2626;
        background: #fff5f5;
      }

      .a11y-reset:focus-visible {
        outline: 2px solid #f5c518;
        outline-offset: 2px;
      }

      /* high-contrast overrides for the widget itself */
      .a11y-high-contrast #a11y-panel {
        background: #111 !important;
        border-color: #fff !important;
        color: #fff !important;
      }
      .a11y-high-contrast .a11y-panel-title { color: #ffee00 !important; }
      .a11y-high-contrast .a11y-row-label   { color: #fff !important; }
      .a11y-high-contrast .a11y-stepper     { background: #000 !important; border-color: #fff !important; }
      .a11y-high-contrast .a11y-stepper button { color: #ffee00 !important; }
      .a11y-high-contrast .a11y-stepper-val { color: #ffee00 !important; }
    `;
    document.head.appendChild(style);
  }

  /* ── Build widget HTML ────────────────────────────────────────── */
  function buildWidget(prefs) {
    const widget = document.createElement('div');
    widget.id = 'a11y-widget';
    widget.setAttribute('role', 'region');
    widget.setAttribute('aria-label', 'Accessibility controls');

    widget.innerHTML = `
      <div id="a11y-panel" role="dialog" aria-label="Accessibility settings" aria-modal="false">
        <div class="a11y-panel-title">♿ Accessibility</div>

        <!-- Font size -->
        <div class="a11y-row">
          <div>
            <div class="a11y-row-label">Text size</div>
            <div class="a11y-row-sub" id="a11y-font-hint">Currently ${prefs.fontSize || FONT_DEFAULT}px</div>
          </div>
          <div class="a11y-stepper" role="group" aria-label="Font size">
            <button id="a11y-font-down" aria-label="Decrease text size">−</button>
            <div class="a11y-stepper-val" id="a11y-font-val" aria-live="polite">${prefs.fontSize || FONT_DEFAULT}px</div>
            <button id="a11y-font-up"   aria-label="Increase text size">+</button>
          </div>
        </div>

        <hr class="a11y-divider"/>

        <!-- High contrast -->
        <div class="a11y-row">
          <div>
            <div class="a11y-row-label">High contrast</div>
            <div class="a11y-row-sub">Bold colors, dark bg</div>
          </div>
          <label class="a11y-switch" aria-label="High contrast mode">
            <input type="checkbox" id="a11y-contrast-toggle" ${prefs.highContrast ? 'checked' : ''}/>
            <span class="a11y-switch-track"></span>
          </label>
        </div>

        <hr class="a11y-divider"/>

        <button class="a11y-reset" id="a11y-reset">↺ Reset to defaults</button>
      </div>

      <button id="a11y-toggle-btn" aria-expanded="false" aria-controls="a11y-panel" aria-label="Open accessibility settings">
        ♿
      </button>
    `;

    return widget;
  }

  /* ── Wire up interactions ─────────────────────────────────────── */
  function init() {
    injectStyles();

    const prefs = loadPrefs();
    if (!prefs.fontSize) prefs.fontSize = FONT_DEFAULT;

    // Apply saved prefs immediately (before paint)
    applyFontSize(prefs.fontSize);
    applyContrast(!!prefs.highContrast);

    // Wait for DOM ready to inject widget
    function mount() {
      const widget = buildWidget(prefs);
      document.body.appendChild(widget);

      const panel      = document.getElementById('a11y-panel');
      const toggleBtn  = document.getElementById('a11y-toggle-btn');
      const fontUp     = document.getElementById('a11y-font-up');
      const fontDown   = document.getElementById('a11y-font-down');
      const fontVal    = document.getElementById('a11y-font-val');
      const fontHint   = document.getElementById('a11y-font-hint');
      const contrastCb = document.getElementById('a11y-contrast-toggle');
      const resetBtn   = document.getElementById('a11y-reset');

      // Open / close panel
      toggleBtn.addEventListener('click', () => {
        const open = panel.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', open);
        if (open) {
          // focus first interactive element
          setTimeout(() => fontDown.focus(), 50);
        }
      });

      // Close on Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
          panel.classList.remove('open');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.focus();
        }
      });

      // Font size
      function updateFont(newSize) {
        prefs.fontSize = newSize;
        applyFontSize(newSize);
        fontVal.textContent  = newSize + 'px';
        fontHint.textContent = 'Currently ' + newSize + 'px';
        fontUp.disabled   = newSize >= FONT_MAX;
        fontDown.disabled = newSize <= FONT_MIN;
        savePrefs(prefs);
      }

      fontUp.addEventListener('click',   () => updateFont(Math.min(FONT_MAX, prefs.fontSize + FONT_STEP)));
      fontDown.addEventListener('click', () => updateFont(Math.max(FONT_MIN, prefs.fontSize - FONT_STEP)));

      // High contrast
      contrastCb.addEventListener('change', () => {
        prefs.highContrast = contrastCb.checked;
        applyContrast(prefs.highContrast);
        savePrefs(prefs);
      });

      // Reset
      resetBtn.addEventListener('click', () => {
        prefs.fontSize     = FONT_DEFAULT;
        prefs.highContrast = false;
        applyFontSize(FONT_DEFAULT);
        applyContrast(false);
        contrastCb.checked = false;
        fontVal.textContent  = FONT_DEFAULT + 'px';
        fontHint.textContent = 'Currently ' + FONT_DEFAULT + 'px';
        fontUp.disabled      = false;
        fontDown.disabled    = false;
        savePrefs(prefs);
      });

      // Init button states
      fontUp.disabled   = prefs.fontSize >= FONT_MAX;
      fontDown.disabled = prefs.fontSize <= FONT_MIN;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }

  init();
})();
