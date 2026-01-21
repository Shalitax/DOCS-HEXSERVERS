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

  // Función para configurar el botón con reintentos
  function setupToggleButton(attempts = 0) {
    const toggleButton = document.getElementById('theme-toggle');
    console.log('Setup attempt', attempts, 'Button found:', !!toggleButton);
    
    if (toggleButton) {
      // Remover listener anterior si existe
      toggleButton.removeEventListener('click', toggleTheme);
      toggleButton.addEventListener('click', toggleTheme);
      console.log('Theme toggle button configured successfully');
    } else if (attempts < 20) {
      // Reintentar hasta 20 veces (2 segundos total)
      setTimeout(() => setupToggleButton(attempts + 1), 100);
    } else {
      console.error('Theme toggle button not found after 20 attempts');
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initTheme();
      setupToggleButton();
    });
  } else {
    initTheme();
    setupToggleButton();
  }
})();
