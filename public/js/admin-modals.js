// Sistema de modales para el panel de administración

// Mostrar modal de confirmación
function showConfirmModal(message, onConfirm, type = 'danger') {
  const modal = document.getElementById('adminConfirmModal');
  const messageEl = document.getElementById('adminConfirmMessage');
  const confirmBtn = document.getElementById('adminConfirmBtn');
  const iconEl = document.getElementById('adminConfirmIcon');
  const icon = iconEl.querySelector('i');
  
  // Configurar mensaje
  messageEl.textContent = message;
  
  // Configurar icono y colores según el tipo
  if (type === 'danger') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-500/20';
    icon.className = 'fas fa-exclamation-triangle text-2xl text-red-400';
    confirmBtn.className = 'flex-1 bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all text-white font-semibold';
  } else if (type === 'info') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-500/20';
    icon.className = 'fas fa-info-circle text-2xl text-blue-400';
    confirmBtn.className = 'flex-1 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-white font-semibold';
  } else if (type === 'warning') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-yellow-500/20';
    icon.className = 'fas fa-exclamation-circle text-2xl text-yellow-400';
    confirmBtn.className = 'flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-white font-semibold';
  }
  
  // Configurar botón de confirmar
  confirmBtn.onclick = () => {
    hideConfirmModal();
    if (onConfirm) onConfirm();
  };
  
  // Mostrar modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Ocultar modal de confirmación
function hideConfirmModal() {
  const modal = document.getElementById('adminConfirmModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Mostrar modal de alerta
function showAlertModal(message, type = 'success') {
  const modal = document.getElementById('adminAlertModal');
  const messageEl = document.getElementById('adminAlertMessage');
  const iconEl = document.getElementById('adminAlertIcon');
  const icon = iconEl.querySelector('i');
  
  // Configurar mensaje
  messageEl.textContent = message;
  
  // Configurar icono y colores según el tipo
  if (type === 'success') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-500/20';
    icon.className = 'fas fa-check-circle text-2xl text-green-400';
  } else if (type === 'error') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-500/20';
    icon.className = 'fas fa-times-circle text-2xl text-red-400';
  } else if (type === 'info') {
    iconEl.className = 'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-500/20';
    icon.className = 'fas fa-info-circle text-2xl text-blue-400';
  }
  
  // Mostrar modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  // Auto-cerrar después de 1.5 segundos si es success
  if (type === 'success') {
    setTimeout(() => {
      hideAlertModal();
      location.reload();
    }, 1500);
  }
}

// Ocultar modal de alerta
function hideAlertModal() {
  const modal = document.getElementById('adminAlertModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Cerrar modales con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideConfirmModal();
    hideAlertModal();
  }
});
