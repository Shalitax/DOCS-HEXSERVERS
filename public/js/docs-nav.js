/**
 * Navegación interactiva (SPA-like) para las páginas de documentación.
 *
 * Al hacer clic en un enlace interno /docs/... se evita la recarga completa:
 * se obtiene el HTML de la nueva página, se reemplaza solo el contenido
 * principal (#docMain) y se actualiza la URL con history.pushState.
 * Así el scroll no se pierde y la experiencia es más fluida.
 *
 * Si el navegador no soporta fetch/history o algo falla, se recarga normal.
 */
(function () {
  'use strict';

  const DOC_LINK_SELECTOR = 'a[href^="/docs/"]';

  // Obtener el pathname de una URL (para comparar rutas)
  function getPath(url) {
    try {
      const a = document.createElement('a');
      a.href = url;
      return a.pathname;
    } catch (e) {
      return url;
    }
  }

  // Indica si el enlace es una ruta interna de documentación
  function isInternalDocLink(href) {
    return typeof href === 'string' && href.indexOf('/docs/') === 0;
  }

  // Cargar y reemplazar el contenido de una ruta
  async function loadContent(url, push) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin'
      });

      // 404/500 u otros errores → recarga normal para mostrar la página de error
      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newMain = doc.getElementById('docMain');
      const currentMain = document.getElementById('docMain');
      if (!newMain || !currentMain) {
        window.location.href = url;
        return;
      }

      // Reemplazar solo el contenido principal
      currentMain.innerHTML = newMain.innerHTML;

      // Actualizar el título de la pestaña
      const titleEl = doc.querySelector('title');
      if (titleEl) document.title = titleEl.textContent;

      // Actualizar el id del documento actual (para el modo edición rápida)
      const newDocId = doc.body.getAttribute('data-doc-id');
      if (newDocId) {
        document.body.setAttribute('data-doc-id', newDocId);
      } else {
        document.body.removeAttribute('data-doc-id');
      }

      // Resaltar el enlace activo en el sidebar
      updateActiveSidebar(response.url || url);

      // Cerrar cualquier buscador abierto
      closeSearchUI();

      // Actualizar la URL en el historial (usa la URL final tras redirects)
      const finalUrl = response.url || url;
      if (push) {
        history.pushState({ url: finalUrl }, '', finalUrl);
      } else {
        history.replaceState({ url: finalUrl }, '', finalUrl);
      }

      // Ajustar el scroll: mantener la posición pero no quedar más abajo
      // de lo que permite el nuevo contenido
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY > maxScroll) {
        window.scrollTo(0, Math.max(0, maxScroll));
      }

      // Notificar a otros módulos (re-inicializar botones de copiar, etc.)
      document.dispatchEvent(new CustomEvent('docs:navigated', { detail: { url: finalUrl } }));
    } catch (error) {
      console.error('Error en navegación interactiva:', error);
      window.location.href = url;
    }
  }

  // Marcar el enlace activo en el sidebar
  function updateActiveSidebar(url) {
    const path = getPath(url);
    document.querySelectorAll('#sidebar a[href^="/docs/"]').forEach(function (a) {
      const active = getPath(a.getAttribute('href')) === path;
      a.classList.toggle('bg-white/20', active);
      a.classList.toggle('text-white', active);
      a.classList.toggle('font-semibold', active);
      a.classList.toggle('text-gray-300', !active);
    });
  }

  // Cerrar y limpiar los buscadores tras navegar
  function closeSearchUI() {
    ['search-results', 'mobile-search-results', 'mobile-search-panel'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    ['search-input', 'mobile-search-input'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  // Delegación de clics: interceptar enlaces internos de documentación
  document.addEventListener('click', function (e) {
    const target = e.target;
    const anchor = target && target.closest ? target.closest(DOC_LINK_SELECTOR) : null;
    if (!anchor) return;

    // No interceptar si hay modificadores, target _blank o descarga
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('download')) return;

    const href = anchor.getAttribute('href');
    if (!isInternalDocLink(href)) return;

    e.preventDefault();
    loadContent(href, true);
  });

  // Navegación hacia atrás/adelante del navegador
  window.addEventListener('popstate', function (e) {
    const url = (e.state && e.state.url) || window.location.href;
    loadContent(url, false);
  });

  // Sembrar el estado inicial para que popstate funcione desde el primer ingreso
  history.replaceState({ url: window.location.pathname + window.location.search }, '');
})();
