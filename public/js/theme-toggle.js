/**
 * Sistema de Dark/Light Mode
 * Gestiona el cambio de tema y persistencia en localStorage
 */

(function() {
  'use strict';

  // Función para aplicar el tema
  function applyTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    
    if (theme === 'light') {
      html.classList.add('light-mode');
      body.classList.add('light-mode');
      if (icon) {
        icon.className = 'fas fa-sun text-yellow-500';
      }
    } else {
      html.classList.remove('light-mode');
      body.classList.remove('light-mode');
      if (icon) {
        icon.className = 'fas fa-moon text-white';
      }
    }
  }

  // Función para obtener el tema actual
  function getCurrentTheme() {
    return localStorage.getItem('theme') || 'dark';
  }

  // Función para cambiar el tema
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }

  // Inicializar tema al cargar la página
  function initTheme() {
    const savedTheme = getCurrentTheme();
    applyTheme(savedTheme);
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Configurar el botón de toggle cuando esté disponible
  window.addEventListener('load', function() {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }
  });
})();
