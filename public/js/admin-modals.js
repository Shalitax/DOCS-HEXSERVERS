/**
 * Sistema centralizado de modales para el panel de administración
 * Incluye modales de confirmación, alerta y gestión de visibilidad
 */

// Variable global para callback de confirmación
let confirmCallback = null;

/**
 * Ocultar cualquier modal por ID
 * @param {string} modalId - ID del modal a ocultar
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Mostrar modal de confirmación con callback
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {string} type - Tipo de modal: 'danger', 'warning', 'info'
 */
function showConfirmModal(title, message, onConfirm, type = 'warning') {
  const modal = document.getElementById('confirmModal');
  
  // Si existe el modal en el DOM (main.js)
  if (modal) {
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const iconEl = document.getElementById('confirmIcon');
    const icon = iconEl.querySelector('i');
    const confirmBtn = document.getElementById('confirmButton');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    // Configurar icono y colores según el tipo
    if (type === 'danger') {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-500/20';
      icon.className = 'fas fa-exclamation-triangle text-2xl text-red-400';
      confirmBtn.className = 'flex-1 bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all text-white font-semibold';
    } else if (type === 'info') {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-500/20';
      icon.className = 'fas fa-info-circle text-2xl text-green-400';
      confirmBtn.className = 'flex-1 bg-gradient-to-r from-green-600 to-green-800 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-900 transition-all text-white font-semibold';
    } else {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-yellow-500/20';
      icon.className = 'fas fa-exclamation-circle text-2xl text-yellow-400';
      confirmBtn.className = 'flex-1 bg-gradient-to-r from-green-600 to-green-800 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-900 transition-all text-white font-semibold';
    }
    
    confirmCallback = onConfirm;
    modal.classList.remove('hidden');
  } else {
    // Fallback: crear modal temporal (admin-utils.js style)
    const tempModal = document.createElement('div');
    tempModal.id = 'tempConfirmModal';
    tempModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
    tempModal.innerHTML = `
      <div class="glass rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 animate-slide-up shadow-2xl">
        <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          type === 'danger' ? 'bg-red-500/20' : type === 'warning' ? 'bg-yellow-500/20' : 'bg-green-500/20'
        }">
          <i class="fas ${
            type === 'danger' ? 'fa-exclamation-triangle text-red-400' : 
            type === 'warning' ? 'fa-exclamation-circle text-yellow-400' : 
            'fa-info-circle text-green-400'
          } text-2xl"></i>
        </div>
        <p class="text-lg text-gray-200 mb-6 text-center">${message}</p>
        <div class="flex space-x-3">
          <button id="tempConfirmBtn" class="flex-1 bg-gradient-to-r ${
            type === 'danger' ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 
            type === 'warning' ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 
            'from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
          } px-4 py-2 rounded-lg transition-all text-white font-semibold">
            Confirmar
          </button>
          <button id="tempCancelBtn" class="glass px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
            Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(tempModal);
    
    document.getElementById('tempConfirmBtn').onclick = () => {
      tempModal.remove();
      if (onConfirm) onConfirm();
    };
    
    document.getElementById('tempCancelBtn').onclick = () => {
      tempModal.remove();
    };
    
    tempModal.onclick = (e) => {
      if (e.target === tempModal) {
        tempModal.remove();
      }
    };
  }
}

/**
 * Ocultar modal de confirmación
 */
function hideConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.add('hidden');
    confirmCallback = null;
  }
}

/**
 * Mostrar modal de alerta
 * @param {string} title - Título del modal o mensaje (si solo se pasan 2 parámetros)
 * @param {string} message - Mensaje del modal o tipo (si solo se pasan 2 parámetros)
 * @param {string} type - Tipo: 'success', 'error', 'info'
 */
function showAlertModal(title, message, type) {
  // Títulos por defecto en español
  const defaultTitles = {
    'success': '¡Éxito!',
    'error': 'Error',
    'info': 'Información'
  };
  
  let finalTitle, finalMessage, finalType;
  
  // Detectar si se llamó con 2 parámetros (mensaje, tipo) o 3 (título, mensaje, tipo)
  if (arguments.length === 2 || (arguments.length === 3 && ['success', 'error', 'info'].includes(message))) {
    // Formato antiguo: showAlertModal(message, type)
    finalMessage = title;
    finalType = message || 'success';
    finalTitle = defaultTitles[finalType] || 'Aviso';
  } else {
    // Formato nuevo: showAlertModal(title, message, type)
    finalTitle = title || defaultTitles[type || 'success'];
    finalMessage = message;
    finalType = type || 'success';
  }
  
  const modal = document.getElementById('alertModal');
  
  // Si existe el modal en el DOM (main.js)
  if (modal) {
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const iconEl = document.getElementById('alertIcon');
    const icon = iconEl.querySelector('i');
    
    if (titleEl) titleEl.textContent = finalTitle;
    if (messageEl) messageEl.textContent = finalMessage;
    
    // Configurar icono y colores según el tipo
    if (finalType === 'success') {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-500/20';
      icon.className = 'fas fa-check-circle text-2xl text-green-400';
    } else if (finalType === 'error') {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-500/20';
      icon.className = 'fas fa-times-circle text-2xl text-red-400';
    } else if (finalType === 'info') {
      iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-500/20';
      icon.className = 'fas fa-info-circle text-2xl text-blue-400';
    }
    
    modal.classList.remove('hidden');
  } else {
    // Fallback: crear modal temporal (admin-utils.js style)
    const tempModal = document.createElement('div');
    tempModal.id = 'tempAlertModal';
    tempModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
    tempModal.innerHTML = `
      <div class="glass rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 animate-slide-up shadow-2xl">
        <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          finalType === 'success' ? 'bg-green-500/20' : finalType === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
        }">
          <i class="fas ${
            finalType === 'success' ? 'fa-check-circle text-green-400' : 
            finalType === 'error' ? 'fa-times-circle text-red-400' : 
            'fa-info-circle text-blue-400'
          } text-2xl"></i>
        </div>
        <h3 class="text-xl font-bold mb-3 text-center">${finalTitle}</h3>
        <p class="text-lg text-gray-200 mb-6 text-center">${finalMessage}</p>
        <button onclick="this.closest('#tempAlertModal').remove()" class="w-full bg-gradient-to-r from-green-600 to-green-800 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-900 transition-all text-white font-semibold">
          Cerrar
        </button>
      </div>
    `;
    
    document.body.appendChild(tempModal);
    
    tempModal.onclick = (e) => {
      if (e.target === tempModal) {
        tempModal.remove();
      }
    };
    
    // Auto-cerrar después de 1.5 segundos si es success
    if (finalType === 'success') {
      setTimeout(() => {
        tempModal.remove();
        location.reload();
      }, 1500);
    }
  }
}

/**
 * Ocultar modal de alerta
 */
function hideAlertModal() {
  const modal = document.getElementById('alertModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Inicializar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Botón de confirmación
  const confirmBtn = document.getElementById('confirmButton');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (confirmCallback) {
        confirmCallback();
      }
      hideConfirmModal();
    };
  }
  
  // Botón de cancelar confirmación
  const cancelBtn = document.getElementById('cancelButton');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      hideConfirmModal();
    };
  }
  
  // Botón de cerrar alerta
  const alertBtn = document.getElementById('alertButton');
  if (alertBtn) {
    alertBtn.onclick = () => {
      hideAlertModal();
    };
  }
});
