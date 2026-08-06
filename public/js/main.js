// Funcionalidad del buscador
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout = null;

// ===== Sistema de Acordeón para Categorías y Subcategorías =====

// Mini buscador del sidebar
const sidebarSearch = document.getElementById('sidebar-search');
const clearButton = document.getElementById('clear-sidebar-search');

// Función para normalizar texto (quitar acentos)
function normalizeText(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

if (sidebarSearch) {
  sidebarSearch.addEventListener('input', (e) => {
    const query = normalizeText(e.target.value.trim());
    
    // Mostrar/ocultar botón de limpiar
    if (e.target.value.trim()) {
      clearButton.classList.remove('hidden');
    } else {
      clearButton.classList.add('hidden');
    }
    
    // Filtrar contenido
    filterSidebarContent(query);
  });
}

function clearSidebarSearch() {
  sidebarSearch.value = '';
  clearButton.classList.add('hidden');
  filterSidebarContent('');
}

function filterSidebarContent(query) {
  const categories = document.querySelectorAll('[data-category-id]');
  
  if (!query) {
    // Mostrar todo primero
    categories.forEach(cat => {
      cat.style.display = '';
      const subcategories = cat.querySelectorAll('[data-subcategory-id]');
      subcategories.forEach(sub => {
        sub.style.display = '';
        const guides = sub.querySelectorAll('li');
        guides.forEach(guide => guide.style.display = '');
      });
    });
    
    // Usar setTimeout para permitir que el DOM se actualice antes de restaurar estados
    setTimeout(() => {
      categories.forEach(cat => {
        const categoryId = cat.dataset.categoryId;
        const content = document.getElementById(`category-content-${categoryId}`);
        const chevron = document.getElementById(`chevron-${categoryId}`);
        
        // Restaurar estado desde localStorage
        const categoryState = localStorage.getItem(`category-${categoryId}`);
        if (content && chevron) {
          if (categoryState === 'collapsed') {
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            chevron.style.transform = 'rotate(-90deg)';
          } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            chevron.style.transform = 'rotate(0deg)';
          }
        }
        
        const subcategories = cat.querySelectorAll('[data-subcategory-id]');
        subcategories.forEach(sub => {
          const subcategoryId = sub.dataset.subcategoryId;
          const subContent = document.getElementById(`subcategory-content-${subcategoryId}`);
          const subChevron = document.getElementById(`chevron-sub-${subcategoryId}`);
          
          // Restaurar estado desde localStorage
          const subcategoryState = localStorage.getItem(`subcategory-${subcategoryId}`);
          if (subContent && subChevron) {
            if (subcategoryState === 'collapsed') {
              subContent.style.maxHeight = '0px';
              subContent.style.opacity = '0';
              subChevron.style.transform = 'rotate(-90deg)';
            } else {
              subContent.style.maxHeight = subContent.scrollHeight + 'px';
              subContent.style.opacity = '1';
              subChevron.style.transform = 'rotate(0deg)';
            }
          }
        });
      });
      
      // Aplicar visibilidad inicial
      if (typeof updateCategoryVisibility === 'function') {
        updateCategoryVisibility();
      }
    }, 10);
    return;
  }
  
  categories.forEach(cat => {
    const categoryId = cat.dataset.categoryId;
    const categoryH3 = cat.querySelector('h3');
    const categoryName = categoryH3 ? normalizeText(categoryH3.textContent.trim()) : '';
    const content = document.getElementById(`category-content-${categoryId}`);
    const chevron = document.getElementById(`chevron-${categoryId}`);
    
    let categoryHasMatch = categoryName.includes(query);
    let categoryHasVisibleContent = false;
    
    const subcategories = cat.querySelectorAll('[data-subcategory-id]');
    subcategories.forEach(sub => {
      const subcategoryId = sub.dataset.subcategoryId;
      const subcategoryH4 = sub.querySelector('h4');
      const subcategoryName = subcategoryH4 ? normalizeText(subcategoryH4.textContent.trim()) : '';
      const subContent = document.getElementById(`subcategory-content-${subcategoryId}`);
      const subChevron = document.getElementById(`chevron-sub-${subcategoryId}`);
      
      let subcategoryHasMatch = subcategoryName.includes(query);
      let subcategoryHasVisibleGuides = false;
      
      const guides = sub.querySelectorAll('li a');
      guides.forEach(guide => {
        const guideText = normalizeText(guide.textContent.trim());
        const li = guide.closest('li');
        if (li) {
          if (guideText.includes(query)) {
            li.style.display = '';
            subcategoryHasVisibleGuides = true;
            categoryHasVisibleContent = true;
          } else {
            li.style.display = 'none';
          }
        }
      });
      
      // Mostrar subcategoría si coincide o tiene guías visibles
      if (subcategoryHasMatch || subcategoryHasVisibleGuides) {
        sub.style.display = '';
        categoryHasVisibleContent = true;
        // Expandir subcategoría automáticamente
        if (subContent && subChevron) {
          subContent.style.maxHeight = subContent.scrollHeight + 'px';
          subContent.style.opacity = '1';
          subChevron.style.transform = 'rotate(0deg)';
        }
      } else {
        sub.style.display = 'none';
      }
    });
    
    // Mostrar categoría si coincide o tiene contenido visible
    if (categoryHasMatch || categoryHasVisibleContent) {
      cat.style.display = '';
      // Expandir categoría automáticamente
      if (content && chevron) {
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.opacity = '1';
        chevron.style.transform = 'rotate(0deg)';
      }
    } else {
      cat.style.display = 'none';
    }
  });
}

function toggleCategory(categoryId) {
  const content = document.getElementById(`category-content-${categoryId}`);
  const chevron = document.getElementById(`chevron-${categoryId}`);
  const currentCategory = document.querySelector(`[data-category-id="${categoryId}"]`);
  const allCategories = document.querySelectorAll('.category-item');
  
  if (content.style.maxHeight && content.style.maxHeight !== '0px') {
    // Colapsar
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
    chevron.style.transform = 'rotate(-90deg)';
    localStorage.setItem(`category-${categoryId}`, 'collapsed');
    
    // Restaurar visibilidad de todas las categorías
    updateCategoryVisibility();
  } else {
    // Expandir
    content.style.maxHeight = content.scrollHeight + 'px';
    content.style.opacity = '1';
    chevron.style.transform = 'rotate(0deg)';
    localStorage.setItem(`category-${categoryId}`, 'expanded');
    
    // Actualizar visibilidad
    updateCategoryVisibility();
  }
}

// Función para actualizar separadores y opacidad de categorías
function updateCategoryVisibility() {
  const allCategories = document.querySelectorAll('.category-item');
  let hasExpandedCategory = false;
  let expandedCategoryId = null;
  
  // Detectar si hay alguna categoría expandida
  allCategories.forEach(cat => {
    const catId = cat.dataset.categoryId;
    const content = document.getElementById(`category-content-${catId}`);
    if (content && content.style.maxHeight && content.style.maxHeight !== '0px') {
      hasExpandedCategory = true;
      expandedCategoryId = catId;
    }
  });
  
  // Aplicar estilos según el estado
  allCategories.forEach(cat => {
    const catId = cat.dataset.categoryId;
    const separator = cat.querySelector('.category-separator');
    const content = document.getElementById(`category-content-${catId}`);
    const isExpanded = content && content.style.maxHeight && content.style.maxHeight !== '0px';
    
    if (hasExpandedCategory) {
      // Mostrar separador en la categoría expandida
      if (isExpanded && separator) {
        separator.classList.remove('hidden');
      } else if (separator) {
        separator.classList.add('hidden');
      }
      
      // Reducir opacidad de categorías no expandidas
      if (!isExpanded) {
        cat.style.opacity = '0.4';
      } else {
        cat.style.opacity = '1';
      }
    } else {
      // Sin categorías expandidas: todo normal
      if (separator) separator.classList.add('hidden');
      cat.style.opacity = '1';
    }
  });
}

function toggleSubcategory(subcategoryId) {
  const content = document.getElementById(`subcategory-content-${subcategoryId}`);
  const chevron = document.getElementById(`chevron-sub-${subcategoryId}`);
  
  if (content.style.maxHeight && content.style.maxHeight !== '0px') {
    // Colapsar
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
    chevron.style.transform = 'rotate(-90deg)';
    localStorage.setItem(`subcategory-${subcategoryId}`, 'collapsed');
  } else {
    // Expandir
    content.style.maxHeight = content.scrollHeight + 'px';
    content.style.opacity = '1';
    chevron.style.transform = 'rotate(0deg)';
    localStorage.setItem(`subcategory-${subcategoryId}`, 'expanded');
  }
}

// Inicializar estado de acordeón al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar categorías
  document.querySelectorAll('[data-category-id]').forEach(categoryDiv => {
    const categoryId = categoryDiv.dataset.categoryId;
    const content = document.getElementById(`category-content-${categoryId}`);
    const chevron = document.getElementById(`chevron-${categoryId}`);
    const savedState = localStorage.getItem(`category-${categoryId}`);
    
    if (savedState === 'expanded') {
      // Solo expandir si se guardó explícitamente como expandido
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      chevron.style.transform = 'rotate(0deg)';
    } else {
      // Por defecto colapsado
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      chevron.style.transform = 'rotate(-90deg)';
    }
    
    // Agregar transición
    content.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
  });
  
  // Inicializar subcategorías
  document.querySelectorAll('[data-subcategory-id]').forEach(subcategoryDiv => {
    const subcategoryId = subcategoryDiv.dataset.subcategoryId;
    const content = document.getElementById(`subcategory-content-${subcategoryId}`);
    const chevron = document.getElementById(`chevron-sub-${subcategoryId}`);
    const savedState = localStorage.getItem(`subcategory-${subcategoryId}`);
    
    if (savedState === 'expanded') {
      // Solo expandir si se guardó explícitamente como expandido
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      chevron.style.transform = 'rotate(0deg)';
    } else {
      // Por defecto colapsado
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      chevron.style.transform = 'rotate(-90deg)';
    }
    
    // Agregar transición
    content.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
  });
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        // Buscar en la base de datos a través del API (incluye categorías ocultas)
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
          searchResults.innerHTML = '<div class="p-4 text-gray-400 text-sm">No se encontraron resultados</div>';
          searchResults.classList.remove('hidden');
          return;
        }
        
        const html = results.map(result => `
          <a href="${result.url}" class="block p-4 hover:bg-gray-900 transition-all duration-200 border-b border-white/5 last:border-b-0">
            <div class="font-medium text-white">${result.title}</div>
            <div class="text-xs text-gray-400 mt-1">
              <i class="fas fa-folder mr-1"></i>${result.category} 
              <i class="fas fa-chevron-right mx-1 text-xs"></i> 
              ${result.subcategory}
            </div>
          </a>
        `).join('');
        
        searchResults.innerHTML = html;
        searchResults.classList.remove('hidden');
      } catch (error) {
        console.error('Error en búsqueda:', error);
        searchResults.innerHTML = '<div class="p-4 text-red-400 text-sm">Error al buscar</div>';
        searchResults.classList.remove('hidden');
      }
    }, 300);
  });
}

// Cerrar resultados al hacer clic fuera
document.addEventListener('click', (e) => {
  if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add('hidden');
  }
});

// Buscador móvil
const mobileSearchToggle = document.getElementById('mobile-search-toggle');
const mobileSearchPanel = document.getElementById('mobile-search-panel');
const mobileSearchInput = document.getElementById('mobile-search-input');
const mobileSearchResults = document.getElementById('mobile-search-results');
const mobileSearchClose = document.getElementById('mobile-search-close');
let mobileSearchTimeout;

if (mobileSearchToggle) {
  mobileSearchToggle.addEventListener('click', () => {
    mobileSearchPanel.classList.toggle('hidden');
    if (!mobileSearchPanel.classList.contains('hidden')) {
      mobileSearchInput.focus();
    }
  });
}

if (mobileSearchClose) {
  mobileSearchClose.addEventListener('click', () => {
    mobileSearchPanel.classList.add('hidden');
    mobileSearchInput.value = '';
    mobileSearchResults.classList.add('hidden');
  });
}

if (mobileSearchInput) {
  mobileSearchInput.addEventListener('input', (e) => {
    clearTimeout(mobileSearchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      mobileSearchResults.classList.add('hidden');
      return;
    }
    
    mobileSearchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
          mobileSearchResults.innerHTML = '<div class="p-4 text-gray-400 text-sm">No se encontraron resultados</div>';
          mobileSearchResults.classList.remove('hidden');
          return;
        }
        
        const html = results.map(result => `
          <a href="${result.url}" class="block p-3 hover:bg-gray-900 transition-all duration-200 border-b border-white/5 last:border-b-0">
            <div class="font-medium text-white text-sm">${result.title}</div>
            <div class="text-xs text-gray-400 mt-1">
              <i class="fas fa-folder mr-1"></i>${result.category} 
              <i class="fas fa-chevron-right mx-1 text-xs"></i> 
              ${result.subcategory}
            </div>
          </a>
        `).join('');
        
        mobileSearchResults.innerHTML = html;
        mobileSearchResults.classList.remove('hidden');
      } catch (error) {
        console.error('Error en búsqueda móvil:', error);
        mobileSearchResults.innerHTML = '<div class="p-4 text-red-400 text-sm">Error al buscar</div>';
        mobileSearchResults.classList.remove('hidden');
      }
    }, 300);
  });
  
  // Cerrar resultados móviles al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (mobileSearchPanel && !mobileSearchPanel.contains(e.target) && e.target !== mobileSearchToggle) {
      if (!mobileSearchPanel.classList.contains('hidden')) {
        mobileSearchPanel.classList.add('hidden');
        mobileSearchInput.value = '';
        mobileSearchResults.classList.add('hidden');
      }
    }
  });
}

// Menu toggle para móvil
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  });
}

// Copiar código al portapapeles
function initCopyButtons() {
  document.querySelectorAll('pre:not([data-copy-init])').forEach((pre) => {
    pre.setAttribute('data-copy-init', 'true');
    const button = document.createElement('button');
    button.className = 'absolute top-2 right-2 glass px-3 py-1 rounded text-xs hover:bg-white/20 transition-all';
    button.innerHTML = '<i class="fas fa-copy mr-1"></i>Copiar';
    
    pre.style.position = 'relative';
    pre.appendChild(button);
    
    button.addEventListener('click', () => {
      const code = pre.querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.innerHTML = '<i class="fas fa-check mr-1"></i>¡Copiado!';
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-copy mr-1"></i>Copiar';
        }, 2000);
      });
    });
  });
}
initCopyButtons();

// Re-inicializar botones de copiar tras la navegación interactiva (docs-nav.js)
document.addEventListener('docs:navigated', initCopyButtons);

// Edición en tiempo real (solo para admin)
let originalContent = '';

// El id del documento actual cambia con la navegación interactiva (docs-nav.js),
// por lo que se lee dinámicamente del body en lugar de capturarlo una sola vez.
function getCurrentDocId() {
  return document.body.dataset.docId;
}

function toggleEditMode() {
  const editContainer = document.getElementById('editContainer');
  const contentDisplay = document.getElementById('contentDisplay');
  const editBtn = document.getElementById('editBtn');
  
  if (!editContainer || !contentDisplay || !editBtn) return;
  
  if (editContainer.classList.contains('hidden')) {
    // Obtener el contenido markdown original
    const docId = getCurrentDocId();
    if (!docId) {
      showAlertModal('Error', 'No se puede identificar el documento', 'error');
      return;
    }
    fetch(`/api/admin/docs/content/${docId}`)
      .then(res => res.json())
      .then(data => {
        originalContent = data.content;
        document.getElementById('contentEditor').value = originalContent;
        editContainer.classList.remove('hidden');
        contentDisplay.classList.add('hidden');
        editBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>Ver Documento';
      })
      .catch(err => {
        console.error('Error loading content:', err);
        showAlertModal('Error', 'No se pudo cargar el contenido', 'error');
      });
  } else {
    editContainer.classList.add('hidden');
    contentDisplay.classList.remove('hidden');
    editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Editar Documento';
  }
}

function saveContent() {
  const newContent = document.getElementById('contentEditor').value;
  const docId = getCurrentDocId();
  
  if (!docId) {
    showAlertModal('Error', 'No se puede identificar el documento', 'error');
    return;
  }

  fetch(`/api/admin/docs/quick-edit/${docId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: newContent })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showAlertModal('¡Guardado!', 'Contenido guardado correctamente', 'success');
      setTimeout(() => location.reload(), 1500);
    } else {
      showAlertModal('Error', 'No se pudo guardar el contenido', 'error');
    }
  })
  .catch(err => {
    console.error('Error saving content:', err);
    showAlertModal('Error', 'No se pudo guardar el contenido', 'error');
  });
}

function cancelEdit() {
  showConfirmModal(
    '¿Descartar cambios?',
    'Los cambios no guardados se perderán.',
    () => toggleEditMode(),
    'warning'
  );
}

// ===== Gestión de Categorías y Subcategorías =====

function showCategoryModal(id = null, name = '', displayName = '', slug = '', icon = 'fa-folder', order = 0, isHidden = false, iconType = 'fontawesome') {
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  const form = document.getElementById('categoryForm');
  
  // Verificar que el modal existe
  if (!modal) {
    return;
  }
  
  // Campos del formulario
  const idField = document.getElementById('categoryId');
  const nameField = document.getElementById('categoryName');
  const displayNameField = document.getElementById('categoryDisplayName');
  const slugField = document.getElementById('categorySlug');
  const iconTypeField = document.getElementById('categoryIconType');
  const orderField = document.getElementById('categoryOrder');
  const hiddenField = document.getElementById('categoryHidden');
  
  // Reset form
  if (idField) idField.value = id || '';
  if (nameField) nameField.value = name;
  if (displayNameField) displayNameField.value = displayName;
  if (slugField) slugField.value = slug;
  if (iconTypeField) iconTypeField.value = iconType;
  if (orderField) orderField.value = order;
  if (hiddenField) hiddenField.checked = isHidden;
  
  // Manejar el tipo de icono (solo si existen los elementos)
  const iconField = document.getElementById('categoryIcon');
  const iconImageField = document.getElementById('categoryIconImage');
  const iconFAGroup = document.getElementById('categoryIconFAGroup');
  const iconImageGroup = document.getElementById('categoryIconImageGroup');
  
  if (iconType === 'image') {
    if (iconField) iconField.value = '';
    if (iconImageField) iconImageField.value = icon;
    if (iconFAGroup) iconFAGroup.classList.add('hidden');
    if (iconImageGroup) iconImageGroup.classList.remove('hidden');
  } else {
    if (iconField) iconField.value = icon;
    if (iconImageField) iconImageField.value = '';
    if (iconFAGroup) iconFAGroup.classList.remove('hidden');
    if (iconImageGroup) iconImageGroup.classList.add('hidden');
  }
  
  if (title) title.textContent = id ? 'Editar Categoría' : 'Nueva Categoría';
  modal.classList.remove('hidden');
  
  // Auto-generar slug
  if (nameField && slugField) {
    nameField.addEventListener('input', (e) => {
      if (!id) {
        slugField.value = e.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });
  }
}

function editCategory(id, name, displayName, slug, icon, order, isHidden, iconType = 'fontawesome') {
  showCategoryModal(id, name, displayName, slug, icon, order, isHidden, iconType);
}

function editCategoryModal(id, name, displayName, slug, icon, order, isHidden, iconType = 'fontawesome') {
  showCategoryModal(id, name, displayName, slug, icon, order, isHidden, iconType);
}

function showSubcategoryModal(categoryId, categoryName, parentSubcategoryId = null, id = null, name = '', displayName = '', slug = '', icon = 'fa-folder-open', order = 0, isHidden = false, iconType = 'fontawesome') {
  const modal = document.getElementById('subcategoryModal');
  const title = document.getElementById('subcategoryModalTitle');
  
  // Verificar que el modal existe
  if (!modal) {
    return;
  }
  
  // Campos requeridos
  const categoryIdField = document.getElementById('subcategoryCategoryId');
  const parentIdField = document.getElementById('subcategoryParentId');
  const idField = document.getElementById('subcategoryId');
  const nameField = document.getElementById('subcategoryName');
  const displayNameField = document.getElementById('subcategoryDisplayName');
  const slugField = document.getElementById('subcategorySlug');
  const iconTypeField = document.getElementById('subcategoryIconType');
  const orderField = document.getElementById('subcategoryOrder');
  const hiddenField = document.getElementById('subcategoryHidden');
  
  if (categoryIdField) categoryIdField.value = categoryId;
  if (parentIdField) parentIdField.value = parentSubcategoryId || '';
  if (idField) idField.value = id || '';
  if (nameField) nameField.value = name;
  if (displayNameField) displayNameField.value = displayName;
  if (slugField) slugField.value = slug;
  if (iconTypeField) iconTypeField.value = iconType;
  if (orderField) orderField.value = order;
  if (hiddenField) hiddenField.checked = isHidden;
  
  // Manejar el tipo de icono (solo si existen los elementos)
  const iconField = document.getElementById('subcategoryIcon');
  const iconImageField = document.getElementById('subcategoryIconImage');
  const iconFAGroup = document.getElementById('subcategoryIconFAGroup');
  const iconImageGroup = document.getElementById('subcategoryIconImageGroup');
  
  if (iconType === 'image') {
    if (iconField) iconField.value = '';
    if (iconImageField) iconImageField.value = icon;
    if (iconFAGroup) iconFAGroup.classList.add('hidden');
    if (iconImageGroup) iconImageGroup.classList.remove('hidden');
  } else {
    if (iconField) iconField.value = icon;
    if (iconImageField) iconImageField.value = '';
    if (iconFAGroup) iconFAGroup.classList.remove('hidden');
    if (iconImageGroup) iconImageGroup.classList.add('hidden');
  }
  
  const levelText = parentSubcategoryId ? 'Sub-subcategoría' : 'Subcategoría';
  if (title) title.textContent = id ? `Editar ${levelText}` : `Nueva ${levelText} en ${categoryName}`;
  modal.classList.remove('hidden');
  
  // Auto-generar slug
  if (nameField && slugField) {
    nameField.addEventListener('input', (e) => {
      if (!id) {
        slugField.value = e.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });
  }
}

function editSubcategory(id, name, displayName, slug, icon, order, categoryId, isHidden, iconType = 'fontawesome', parentSubcategoryId = null) {
  const categoryName = document.querySelector(`button[onclick*="showSubcategoryModal(${categoryId}"]`)
    ?.closest('.mb-6')?.querySelector('h3')?.textContent.trim() || '';
  showSubcategoryModal(categoryId, categoryName, parentSubcategoryId, id, name, displayName, slug, icon, order, isHidden, iconType);
}

function editSubcategoryModal(id, name, displayName, slug, icon, order, categoryId, isHidden, iconType = 'fontawesome', parentSubcategoryId = null) {
  const categoryName = document.querySelector(`button[onclick*="showSubcategoryModal(${categoryId}"]`)
    ?.closest('.mb-6')?.querySelector('h3')?.textContent.trim() || '';
  showSubcategoryModal(categoryId, categoryName, parentSubcategoryId, id, name, displayName, slug, icon, order, isHidden, iconType);
}

// Form handlers
document.addEventListener('DOMContentLoaded', () => {
  const categoryForm = document.getElementById('categoryForm');
  const subcategoryForm = document.getElementById('subcategoryForm');
  
  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('categoryId').value;
      const iconType = document.getElementById('categoryIconType').value;
      const icon = iconType === 'image' 
        ? document.getElementById('categoryIconImage').value 
        : document.getElementById('categoryIcon').value;
      
      const data = {
        name: document.getElementById('categoryName').value,
        display_name: document.getElementById('categoryDisplayName').value,
        slug: document.getElementById('categorySlug').value,
        icon: icon,
        icon_type: iconType,
        order_index: parseInt(document.getElementById('categoryOrder').value),
        is_hidden: document.getElementById('categoryHidden').checked
      };
      
      const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
      const method = id ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showAlertModal('¡Éxito!', `Categoría ${id ? 'actualizada' : 'creada'} correctamente`, 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo guardar la categoría', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo guardar la categoría', 'error');
      }
    });
  }
  
  if (subcategoryForm) {
    subcategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('subcategoryId').value;
      const categoryId = document.getElementById('subcategoryCategoryId').value;
      const parentSubcategoryId = document.getElementById('subcategoryParentId').value;
      const iconType = document.getElementById('subcategoryIconType').value;
      const icon = iconType === 'image' 
        ? document.getElementById('subcategoryIconImage').value 
        : document.getElementById('subcategoryIcon').value;
      
      const data = {
        category_id: parseInt(categoryId),
        parent_subcategory_id: parentSubcategoryId ? parseInt(parentSubcategoryId) : null,
        name: document.getElementById('subcategoryName').value,
        display_name: document.getElementById('subcategoryDisplayName').value,
        slug: document.getElementById('subcategorySlug').value,
        icon: icon,
        icon_type: iconType,
        order_index: parseInt(document.getElementById('subcategoryOrder').value),
        is_hidden: document.getElementById('subcategoryHidden').checked
      };
      
      const url = id ? `/api/admin/subcategories/${id}` : '/api/admin/subcategories';
      const method = id ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showAlertModal('¡Éxito!', `Subcategoría ${id ? 'actualizada' : 'creada'} correctamente`, 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo guardar la subcategoría', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo guardar la subcategoría', 'error');
      }
    });
  }
  
  // Event listeners para cambio de tipo de icono
  const categoryIconType = document.getElementById('categoryIconType');
  if (categoryIconType) {
    categoryIconType.addEventListener('change', (e) => {
      const isFontAwesome = e.target.value === 'fontawesome';
      document.getElementById('categoryIconFAGroup').classList.toggle('hidden', !isFontAwesome);
      document.getElementById('categoryIconImageGroup').classList.toggle('hidden', isFontAwesome);
    });
  }
  
  const subcategoryIconType = document.getElementById('subcategoryIconType');
  if (subcategoryIconType) {
    subcategoryIconType.addEventListener('change', (e) => {
      const isFontAwesome = e.target.value === 'fontawesome';
      document.getElementById('subcategoryIconFAGroup').classList.toggle('hidden', !isFontAwesome);
      document.getElementById('subcategoryIconImageGroup').classList.toggle('hidden', isFontAwesome);
    });
  }
});

async function deleteCategory(id, name) {
  showConfirmModal(
    '¿Eliminar categoría?',
    `Se eliminará "${name}" junto con todas sus subcategorías y documentos asociados. Esta acción no se puede deshacer.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          showAlertModal('¡Eliminado!', 'Categoría eliminada correctamente', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo eliminar la categoría', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo eliminar la categoría', 'error');
      }
    },
    'danger'
  );
}

async function deleteSubcategory(id, name) {
  showConfirmModal(
    '¿Eliminar subcategoría?',
    `Se eliminará "${name}" junto con todos sus documentos asociados. Esta acción no se puede deshacer.`,
    async () => {
      try {
        const response = await fetch(`/api/admin/subcategories/${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          showAlertModal('¡Eliminado!', 'Subcategoría eliminada correctamente', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showAlertModal('Error', result.error || 'No se pudo eliminar la subcategoría', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo eliminar la subcategoría', 'error');
      }
    },
    'danger'
  );
}

async function deleteDocument(id, title) {
  showConfirmModal(
    '¿Eliminar documento?',
    `Se eliminará "${title}". Esta acción no se puede deshacer.`,
    async () => {
      try {
        const response = await fetch(`/admin/docs/delete/${id}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          showAlertModal('¡Eliminado!', 'Documento eliminado correctamente', 'success');
          setTimeout(() => location.href = '/', 1500);
        } else {
          showAlertModal('Error', 'No se pudo eliminar el documento', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showAlertModal('Error', 'No se pudo eliminar el documento', 'error');
      }
    },
    'danger'
  );
}

// ===== Gestión de Documentación =====
// Las funciones de documentación (showDocModal, editDocModal, loadCategoriesForDoc,
// loadSubcategoriesForDoc, etc.) viven en /js/admin-docs.js para evitar duplicados
// y dobles listeners de formulario en la página /admin/docs.

