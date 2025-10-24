// theme-toggle.js
// Inicializador robusto que tolera carga temprana del script y reconsulta elementos del DOM

let toggleBtn = null;
let icon = null;
let body = null;

// Canal para sincronizar tema entre pestañas (si está disponible)
let bc = null;
try {
  if ('BroadcastChannel' in window) {
    bc = new BroadcastChannel('suic-theme');
  }
} catch (e) {
  bc = null;
}

function applyTheme(theme, save = false) {
  theme = theme === 'dark' ? 'dark' : 'light';
  if (!body) body = document.body || document.getElementsByTagName('body')[0];
  if (body) {
    body.classList.remove('dark-theme', 'light-theme');
    body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
  }
  if (!icon) icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌞' : '🌙';

  if (save) {
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    if (bc) {
      try { bc.postMessage(theme); } catch (e) { /* ignore */ }
    }
  }
}

// Leer tema guardado
const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();

function attachToggle() {
  toggleBtn = document.getElementById('toggle-theme');
  icon = document.getElementById('theme-icon');
  body = document.body || document.getElementsByTagName('body')[0];

  applyTheme(savedTheme || 'light', false);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = body && body.classList.contains('dark-theme');
      applyTheme(isDark ? 'light' : 'dark', true);
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachToggle);
else attachToggle();

// Escuchar cambios desde BroadcastChannel (sin recargar)
if (bc) {
  bc.onmessage = (ev) => { if (ev && typeof ev.data === 'string') applyTheme(ev.data, false); };
}

// Fallback: escuchar el evento storage (se dispara en otras pestañas)
window.addEventListener('storage', (e) => {
  if (!e) return;
  if (e.key === 'theme') applyTheme(e.newValue || 'light', false);
});
