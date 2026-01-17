// Utilidades compartidas para el panel de administración

// Mostrar modal de confirmación
function showConfirmModal(message, onConfirm, type = 'danger') {
  const modal = document.createElement('div');
  modal.id = 'tempConfirmModal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="glass rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 animate-slide-up shadow-2xl">
      <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        type === 'danger' ? 'bg-red-500/20' : type === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
      }">
        <i class="fas ${
          type === 'danger' ? 'fa-exclamation-triangle text-red-400' : 
          type === 'warning' ? 'fa-exclamation-circle text-yellow-400' : 
          'fa-info-circle text-blue-400'
        } text-2xl"></i>
      </div>
      <p class="text-lg text-gray-200 mb-6 text-center">${message}</p>
      <div class="flex space-x-3">
        <button id="confirmBtn" class="flex-1 bg-gradient-to-r ${
          type === 'danger' ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 
          type === 'warning' ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 
          'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        } px-4 py-2 rounded-lg transition-all text-white font-semibold">
          Confirmar
        </button>
        <button id="cancelBtn" class="glass px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
          Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('confirmBtn').onclick = () => {
    modal.remove();
    if (onConfirm) onConfirm();
  };
  
  document.getElementById('cancelBtn').onclick = () => {
    modal.remove();
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

// Mostrar modal de alerta
function showAlertModal(message, type = 'success') {
  const modal = document.createElement('div');
  modal.id = 'tempAlertModal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="glass rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 animate-slide-up shadow-2xl">
      <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        type === 'success' ? 'bg-green-500/20' : type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
      }">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle text-green-400' : 
          type === 'error' ? 'fa-times-circle text-red-400' : 
          'fa-info-circle text-blue-400'
        } text-2xl"></i>
      </div>
      <p class="text-lg text-gray-200 mb-6 text-center">${message}</p>
      <button onclick="this.closest('#tempAlertModal').remove()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-white font-semibold">
        Cerrar
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  // Auto-cerrar después de 1.5 segundos si es success
  if (type === 'success') {
    setTimeout(() => {
      modal.remove();
      location.reload();
    }, 1500);
  }
}
