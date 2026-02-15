/**
 * Header Sync: Sincroniza la barra de navegación entre todas las páginas
 * Almacena la estructura del menú en localStorage con clave 'suic_header_config'
 */

(function(){
  const CONFIG_KEY = 'suic_header_config'
  
  // Configuración por defecto si no existe en localStorage
  const DEFAULT_CONFIG = {
    logo: {
      src: 'SUIC Data-01.png',
      alt: 'Logo',
      href: 'SUIC Data.html'
    },
    menus: [
      {
        name: 'Herramientas',
        items: [
          { text: 'Registros', href: 'Registros.html' },
          { text: 'Opciones', href: 'Opciones.html' }
        ]
      },
      {
        name: 'Sección 2',
        items: [
          { text: 'Opción 1', href: '#' },
          { text: 'Opción 2', href: '#' }
        ]
      },
      {
        name: 'Enlaces',
        items: [
          { text: 'Link 1', href: '...', target: '_blank' },
          { text: 'Link 2', href: '...', target: '_blank' },
          { text: 'Link 3', href: '...', target: '_blank' }
        ]
      }
    ]
  }

  // Obtener configuración desde localStorage
  function getConfig(){
    try{
      const raw = localStorage.getItem(CONFIG_KEY)
      return raw ? JSON.parse(raw) : DEFAULT_CONFIG
    }catch(e){
      console.warn('Header-sync: error al leer config', e)
      return DEFAULT_CONFIG
    }
  }

  // Guardar configuración en localStorage
  function saveConfig(config){
    try{
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
      // Disparar evento para que otras pestañas se actualicen
      window.dispatchEvent(new StorageEvent('storage', {
        key: CONFIG_KEY,
        newValue: JSON.stringify(config),
        oldValue: null,
        storageArea: localStorage
      }))
    }catch(e){
      console.error('Header-sync: error al guardar config', e)
    }
  }

  // Renderizar header-bar desde config
  function renderHeader(){
    const headerBar = document.querySelector('.header-bar')
    if(!headerBar) return
    
    const config = getConfig()
    
    // Limpiar nav (pero mantener el logo y profile preview)
    const oldNav = headerBar.querySelector('nav.menu')
    if(oldNav) oldNav.remove()
    
    // Recrear nav desde config
    const navHTML = config.menus.map((menu, idx) => `
      <div class="menu-item">
        <span>${escapeHtml(menu.name)}</span>
        <div class="submenu">
          ${menu.items.map(item => `
            <a href="${escapeHtml(item.href)}" ${item.target ? `target="${escapeHtml(item.target)}"` : ''}>
              ${escapeHtml(item.text)}
            </a>
          `).join('')}
        </div>
      </div>
      ${idx < config.menus.length - 1 ? '<div class="divider"></div>' : ''}
    `).join('')
    
    // Insertar nav después del logo
    const logo = headerBar.querySelector('.logo')
    const newNav = document.createElement('nav')
    newNav.className = 'menu'
    newNav.innerHTML = navHTML
    logo.after(newNav)
  }

  // HTML escape para seguridad
  function escapeHtml(text){
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  // Inicializar al cargar
  document.addEventListener('DOMContentLoaded', renderHeader)

  // Sincronizar si hay cambios desde otra pestaña
  window.addEventListener('storage', (e) => {
    if(e.key === CONFIG_KEY){
      renderHeader()
    }
  })

  // Exponer para Opciones
  window.SUIC_HEADER = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    renderHeader: renderHeader,
    DEFAULT_CONFIG: DEFAULT_CONFIG
  }
})()
