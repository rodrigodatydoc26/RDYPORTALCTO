/**
 * RDY Supply Common Utilities
 */

// Initialize Lucide Icons
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Sync Theme with Parent Iframe
function syncThemeWithParent() {
  if (window.parent === window) return;

  function applyTheme() {
    try {
      const parentDoc = window.parent.document.documentElement;
      const theme = parentDoc.getAttribute('data-theme') || 'dark';
      const accent = parentDoc.getAttribute('data-accent') || 'gold';
      
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-accent', accent);
    } catch (e) {
      console.warn("Could not sync theme with parent", e);
    }
  }

  const observer = new MutationObserver(applyTheme);
  observer.observe(window.parent.document.documentElement, { 
    attributes: true, 
    attributeFilter: ['data-theme', 'data-accent'] 
  });
  
  applyTheme();
}

// Format Currency
function fmtBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Format Date
function fmtDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

// Run on Load
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  syncThemeWithParent();
});
