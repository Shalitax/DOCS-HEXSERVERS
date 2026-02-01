/**
 * Funciones para la gestión de documentación en el panel de administración
 */

// Mostrar modal de documentación (nuevo o editar)
function showDocModal(subcategoryId = null) {
  document.getElementById('docModalTitle').textContent = 'Nueva Documentación';
  document.getElementById('docForm').reset();
  document.getElementById('docId').value = '';
  
  loadCategoriesForDoc();
  
  if (subcategoryId) {
    setTimeout(() => {
      const subcategorySelect = document.getElementById('docSubcategoryId');
      const option = Array.from(subcategorySelect.options).find(opt => opt.value == subcategoryId);
      if (option) {
        const categoryId = option.dataset.categoryId;
        document.getElementById('docCategory').value = categoryId;
        loadSubcategoriesForDoc(categoryId, subcategoryId);
      }
    }, 100);
  }
  
  document.getElementById('docModal').classList.remove('hidden');
}

// Editar documentación
async function editDocModal(docId) {
  try {
    // Obtener datos del documento
    const response = await fetch(`/api/admin/docs/${docId}`);
    const doc = await response.json();
    
    document.getElementById('docModalTitle').textContent = 'Editar Documentación';
    document.getElementById('docId').value = doc.id;
    document.getElementById('docTitle').value = doc.title;
    document.getElementById('docSlug').value = doc.slug;
    document.getElementById('docDescription').value = doc.description || '';
    document.getElementById('docContent').value = doc.content;
    document.getElementById('docOrder').value = doc.order_index;
    
    // Cargar todas las categorías primero
    await loadCategoriesForDoc();
    
    // Determinar la categoría del documento
    let categoryId = null;
    
    if (doc.subcategory && doc.subcategory.category_id) {
      categoryId = doc.subcategory.category_id;
    } else if (doc.subcategory_id) {
      // Fallback: obtener subcategoría manualmente
      const subResponse = await fetch(`/api/admin/subcategories/${doc.subcategory_id}`);
      if (subResponse.ok) {
        const subcategory = await subResponse.json();
        if (subcategory && subcategory.category_id) {
          categoryId = subcategory.category_id;
        }
      }
    }
    
    if (!categoryId) {
      showAlertModal('Error', 'No se pudo determinar la categoría del documento.', 'error');
      return;
    }
    
    // Seleccionar la categoría (con pequeño delay para asegurar que el DOM esté listo)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categorySelect = document.getElementById('docCategory');
    
    // Intentar seleccionar con diferentes conversiones
    categorySelect.value = String(categoryId);
    if (!categorySelect.value) {
      categorySelect.value = categoryId;
    }
    
    // Cargar y seleccionar subcategoría
    await loadSubcategoriesForDoc(categoryId, doc.subcategory_id);
    
    // Mostrar el modal
    document.getElementById('docModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error al cargar documento:', error);
    showAlertModal('Error', 'Error al cargar el documento: ' + error.message, 'error');
  }
}

// Cargar categorías para el selector
async function loadCategoriesForDoc() {
  const categories = await fetch('/api/admin/categories').then(res => res.json());
  const select = document.getElementById('docCategory');
  select.innerHTML = '<option value="">Selecciona una categoría</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.display_name;
    select.appendChild(option);
  });
  return categories;
}

// Cargar subcategorías para el selector
function loadSubcategoriesForDoc(categoryId, selectedId = null) {
  if (!categoryId) {
    const select = document.getElementById('docSubcategoryId');
    select.innerHTML = '<option value="">Primero selecciona categoría</option>';
    return Promise.resolve();
  }
  
  return fetch(`/api/admin/subcategories/${categoryId}/flat`)
    .then(res => res.json())
    .then(subcategories => {
      const select = document.getElementById('docSubcategoryId');
      select.innerHTML = '<option value="">Selecciona una subcategoría</option>';
      subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.id;
        option.textContent = sub.indentedName;
        option.dataset.categoryId = categoryId;
        if (selectedId && sub.id == selectedId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    });
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Event listener para cambio de categoría
  const docCategory = document.getElementById('docCategory');
  if (docCategory) {
    docCategory.addEventListener('change', function() {
      loadSubcategoriesForDoc(this.value);
    });
  }

  // Auto-generar slug desde título
  const docTitle = document.getElementById('docTitle');
  if (docTitle) {
    docTitle.addEventListener('input', function() {
      const slug = this.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      document.getElementById('docSlug').value = slug;
    });
  }

  // Submit del formulario
  const docForm = document.getElementById('docForm');
  if (docForm) {
    docForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const id = document.getElementById('docId').value;
      const data = {
        subcategory_id: document.getElementById('docSubcategoryId').value,
        title: document.getElementById('docTitle').value,
        slug: document.getElementById('docSlug').value,
        description: document.getElementById('docDescription').value,
        content: document.getElementById('docContent').value,
        order_index: document.getElementById('docOrder').value
      };
      
      try {
        const response = await fetch(id ? `/admin/docs/edit/${id}` : '/admin/docs/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          hideModal('docModal');
          showAlertModal('¡Guardado!', 'Documentación guardada correctamente', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'Error al guardar la documentación', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlertModal('Error', 'Error al guardar la documentación', 'error');
      }
    });
  }
});
