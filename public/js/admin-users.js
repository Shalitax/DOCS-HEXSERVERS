/**
 * Funciones para la gestión de usuarios en el panel de administración
 */

// Mostrar modal de usuario (nuevo o editar)
function showUserModal(id = null, username = '', email = '') {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const passwordLabel = document.getElementById('passwordLabel');
  const passwordInput = document.getElementById('password');
  
  // Reset form
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = id || '';
  document.getElementById('username').value = username;
  document.getElementById('email').value = email;
  
  if (id) {
    title.textContent = 'Editar Usuario';
    passwordLabel.textContent = '(dejar vacío para mantener)';
    passwordInput.removeAttribute('required');
  } else {
    title.textContent = 'Nuevo Usuario';
    passwordLabel.textContent = '(requerida)';
    passwordInput.setAttribute('required', 'required');
  }
  
  modal.classList.remove('hidden');
}

// Alias para compatibilidad
function editUser(id, username, email) {
  showUserModal(id, username, email);
}

// Eliminar usuario
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
        
        if (result.success) {
          showAlertModal('¡Eliminado!', 'Usuario eliminado correctamente', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo eliminar el usuario', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo eliminar el usuario', 'error');
      }
    },
    'danger'
  );
}

// Manejar formulario de usuario
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
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          hideModal('userModal');
          showAlertModal('¡Guardado!', 'Usuario guardado correctamente', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo guardar el usuario', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo guardar el usuario', 'error');
      }
    });
  }
});
