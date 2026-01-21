// Utilidades compartidas para el panel de administración

// ===== FUNCIONES DE GESTIÓN DE USUARIOS =====

/**
 * Mostrar modal para crear nuevo usuario
 */
function showUserModal() {
  document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  const passwordField = document.getElementById('password');
  const passwordLabel = document.getElementById('passwordLabel');
  if (passwordField) passwordField.required = true;
  if (passwordLabel) passwordLabel.textContent = '(requerida)';
  document.getElementById('userModal').classList.remove('hidden');
}

/**
 * Editar usuario existente
 * @param {number} id - ID del usuario
 * @param {string} username - Nombre de usuario
 * @param {string} email - Email del usuario
 */
function editUser(id, username, email) {
  document.getElementById('userModalTitle').textContent = 'Editar Usuario';
  document.getElementById('userId').value = id;
  document.getElementById('username').value = username;
  document.getElementById('email').value = email;
  document.getElementById('password').value = '';
  const passwordField = document.getElementById('password');
  const passwordLabel = document.getElementById('passwordLabel');
  if (passwordField) passwordField.required = false;
  if (passwordLabel) passwordLabel.textContent = '(dejar vacío para no cambiar)';
  document.getElementById('userModal').classList.remove('hidden');
}

/**
 * Eliminar usuario con confirmación
 * @param {number} id - ID del usuario
 * @param {string} username - Nombre de usuario
 */
async function deleteUser(id, username) {
  showConfirmModal(
    '¿Eliminar usuario?',
    `Se eliminará el usuario "${username}". Esta acción no se puede deshacer.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
          showAlertModal('¡Eliminado!', 'Usuario eliminado exitosamente', 'success');
        } else {
          showAlertModal('Error', result.error || 'Error al eliminar el usuario', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error', 'Error al eliminar el usuario', 'error');
      }
    },
    'danger'
  );
}

// ===== INICIALIZACIÓN DE FORMULARIOS =====

// Inicializar formulario de usuarios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('userId').value;
      const data = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      };

      // Si es edición y no hay contraseña, no enviarla
      if (id && !data.password) {
        delete data.password;
      }

      try {
        const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          showAlertModal('¡Guardado!', 'Usuario guardado exitosamente', 'success');
        } else {
          showAlertModal('Error', result.error || 'Error al guardar el usuario', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error', 'Error al guardar el usuario', 'error');
      }
    });
  }
  
  // Cerrar modal de usuario al hacer clic fuera
  const userModal = document.getElementById('userModal');
  if (userModal) {
    userModal.addEventListener('click', (e) => {
      if (e.target.id === 'userModal') {
        userModal.classList.add('hidden');
      }
    });
  }
});

// ===== FUNCIONES HEREDADAS (DEPRECADAS - Usar admin-modals.js) =====

// Mostrar modal de confirmación (usar showConfirmModal de admin-modals.js)
function showConfirmModal(message, onConfirm, type = 'danger') {
  const modal = document.createElement('div');
  modal.id = 'tempConfirmModal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
  modal.innerHTML = `
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
        <button id="confirmBtn" class="flex-1 bg-gradient-to-r ${
          type === 'danger' ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 
          type === 'warning' ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 
          'from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
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

// Mostrar modal de alerta (usar showAlertModal de admin-modals.js)
function showAlertModal(message, type = 'success') {
  const modal = document.createElement('div');
  modal.id = 'tempAlertModal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="glass rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 animate-slide-up shadow-2xl">
      <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        type === 'success' ? 'bg-green-500/20' : type === 'error' ? 'bg-red-500/20' : 'bg-green-500/20'
      }">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle text-green-400' : 
          type === 'error' ? 'fa-times-circle text-red-400' : 
          'fa-info-circle text-green-400'
        } text-2xl"></i>
      </div>
      <p class="text-lg text-gray-200 mb-6 text-center">${message}</p>
      <button onclick="this.closest('#tempAlertModal').remove()" class="w-full bg-gradient-to-r from-green-600 to-green-800 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-900 transition-all text-white font-semibold">
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

