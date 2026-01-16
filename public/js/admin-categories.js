// Modales
function showCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function showSubcategoryModal(categoryId, categoryName) {
  document.getElementById('subcategoryModalTitle').textContent = `Nueva Subcategoría en ${categoryName}`;
  document.getElementById('subcategoryForm').reset();
  document.getElementById('subcategoryCategoryId').value = categoryId;
  document.getElementById('subcategoryModal').classList.remove('hidden');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Auto-generar slug
document.getElementById('categoryName').addEventListener('input', (e) => {
  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.getElementById('categorySlug').value = slug;
});

document.getElementById('subcategoryName').addEventListener('input', (e) => {
  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.getElementById('subcategorySlug').value = slug;
});

// Form de categoría
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('categoryId').value;
  const data = {
    name: document.getElementById('categoryName').value,
    display_name: document.getElementById('categoryDisplayName').value,
    slug: document.getElementById('categorySlug').value,
    icon: document.getElementById('categoryIcon').value,
    order_index: parseInt(document.getElementById('categoryOrder').value),
    is_hidden: document.getElementById('categoryHidden').checked
  };

  try {
    const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showAlertModal('Categoría guardada exitosamente', 'success');
    } else {
      showAlertModal('Error al guardar la categoría', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlertModal('Error al guardar la categoría', 'error');
  }
});

// Form de subcategoría
document.getElementById('subcategoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('subcategoryId').value;
  const data = {
    category_id: parseInt(document.getElementById('subcategoryCategoryId').value),
    name: document.getElementById('subcategoryName').value,
    display_name: document.getElementById('subcategoryDisplayName').value,
    slug: document.getElementById('subcategorySlug').value,
    icon: document.getElementById('subcategoryIcon').value,
    order_index: parseInt(document.getElementById('subcategoryOrder').value),
    is_hidden: document.getElementById('subcategoryHidden').checked
  };

  try {
    const url = id ? `/api/admin/subcategories/${id}` : '/api/admin/subcategories';
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showAlertModal('Subcategoría guardada exitosamente', 'success');
    } else {
      showAlertModal('Error al guardar la subcategoría', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlertModal('Error al guardar la subcategoría', 'error');
  }
});

// Editar categoría
function editCategory(id, name, displayName, slug, icon, order, isHidden = 0) {
  document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
  document.getElementById('categoryId').value = id;
  document.getElementById('categoryName').value = name;
  document.getElementById('categoryDisplayName').value = displayName;
  document.getElementById('categorySlug').value = slug;
  document.getElementById('categoryIcon').value = icon;
  document.getElementById('categoryOrder').value = order;
  document.getElementById('categoryHidden').checked = isHidden == 1;
  document.getElementById('categoryModal').classList.remove('hidden');
}

// Eliminar categoría
async function deleteCategory(id, name) {
  showConfirmModal(
    `¿Eliminar la categoría "${name}"? Esto eliminará también todas sus subcategorías y documentación.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlertModal('Categoría eliminada exitosamente', 'success');
        } else {
          showAlertModal('Error al eliminar la categoría', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error al eliminar la categoría', 'error');
      }
    },
    'danger'
  );
}

// Editar subcategoría
function editSubcategory(id, name, displayName, slug, icon, order, categoryId, isHidden = 0) {
  document.getElementById('subcategoryModalTitle').textContent = 'Editar Subcategoría';
  document.getElementById('subcategoryCategoryId').value = categoryId;
  document.getElementById('subcategoryId').value = id;
  document.getElementById('subcategoryName').value = name;
  document.getElementById('subcategoryDisplayName').value = displayName;
  document.getElementById('subcategorySlug').value = slug;
  document.getElementById('subcategoryIcon').value = icon;
  document.getElementById('subcategoryOrder').value = order;
  document.getElementById('subcategoryHidden').checked = isHidden == 1;
  document.getElementById('subcategoryModal').classList.remove('hidden');
}

// Eliminar subcategoría
async function deleteSubcategory(id, name) {
  showConfirmModal(
    `¿Eliminar la subcategoría "${name}"? Esto eliminará también toda su documentación.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/subcategories/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlertModal('Subcategoría eliminada exitosamente', 'success');
        } else {
          showAlertModal('Error al eliminar la subcategoría', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error al eliminar la subcategoría', 'error');
      }
    },
    'danger'
  );
}

// Cerrar modales al hacer clic fuera
document.getElementById('categoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'categoryModal') {
    hideModal('categoryModal');
  }
});

document.getElementById('subcategoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'subcategoryModal') {
    hideModal('subcategoryModal');
  }
});
