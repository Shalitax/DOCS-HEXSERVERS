// Modales
function showUserModal() {
  document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('password').required = true;
  document.getElementById('passwordLabel').textContent = '(requerida)';
  document.getElementById('userModal').classList.remove('hidden');
}

// Form de usuario
document.getElementById('userForm').addEventListener('submit', async (e) => {
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
      showAlertModal('Usuario guardado exitosamente', 'success');
    } else {
      showAlertModal(result.error || 'Error al guardar el usuario', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlertModal('Error al guardar el usuario', 'error');
  }
});

// Editar usuario
function editUser(id, username, email) {
  document.getElementById('userModalTitle').textContent = 'Editar Usuario';
  document.getElementById('userId').value = id;
  document.getElementById('username').value = username;
  document.getElementById('email').value = email;
  document.getElementById('password').value = '';
  document.getElementById('password').required = false;
  document.getElementById('passwordLabel').textContent = '(dejar vacío para no cambiar)';
  document.getElementById('userModal').classList.remove('hidden');
}

// Eliminar usuario
async function deleteUser(id, username) {
  showConfirmModal(
    `¿Eliminar el usuario "${username}"? Esta acción no se puede deshacer.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
          showAlertModal('Usuario eliminado exitosamente', 'success');
        } else {
          showAlertModal(result.error || 'Error al eliminar el usuario', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error al eliminar el usuario', 'error');
      }
    },
    'danger'
  );
}

// Cerrar modal al hacer clic fuera
document.getElementById('userModal').addEventListener('click', (e) => {
  if (e.target.id === 'userModal') {
    document.getElementById('userModal').classList.add('hidden');
  }
});
