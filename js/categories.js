/**
 * Categories - Gestión de categorías personalizadas
 */

const Categories = {
    // Colores predefinidos para elegir
    colors: [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e'
    ],

    /**
     * Obtener todas las categorías
     */
    getAll() {
        return Storage.data.categorias || [];
    },

    /**
     * Obtener categoría por ID
     */
    getById(id) {
        return this.getAll().find(cat => cat.id === id);
    },

    /**
     * Obtener categorías por tipo
     */
    getByType(tipo) {
        return this.getAll().filter(cat => cat.tipo === tipo);
    },

    /**
     * Crear nueva categoría
     */
    create(nombre, tipo, color) {
        const categoria = {
            id: Storage.generateId(),
            nombre,
            tipo, // 'ingreso' o 'gasto'
            color: color || this.colors[Math.floor(Math.random() * this.colors.length)]
        };

        Storage.data.categorias.push(categoria);
        Storage.save();

        return categoria;
    },

    /**
     * Actualizar categoría
     */
    update(id, updates) {
        const index = Storage.data.categorias.findIndex(cat => cat.id === id);
        if (index !== -1) {
            Storage.data.categorias[index] = {
                ...Storage.data.categorias[index],
                ...updates
            };
            Storage.save();
            return Storage.data.categorias[index];
        }
        return null;
    },

    /**
     * Eliminar categoría
     */
    delete(id) {
        const index = Storage.data.categorias.findIndex(cat => cat.id === id);
        if (index !== -1) {
            Storage.data.categorias.splice(index, 1);
            Storage.save();
            return true;
        }
        return false;
    },

    /**
     * Verificar si una categoría está en uso
     */
    isInUse(id) {
        const inIngresos = Storage.data.ingresos.some(i => i.categoriaId === id);
        const inFijos = Storage.data.gastosFijos.some(g => g.categoriaId === id);
        const inVariables = Storage.data.gastosVariables.some(g => g.categoriaId === id);
        return inIngresos || inFijos || inVariables;
    },

    /**
     * Renderizar el picker de colores
     */
    renderColorPicker(selectedColor, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.colors.map(color => `
      <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
           data-color="${color}"
           style="background-color: ${color}">
      </div>
    `).join('');

        // Añadir eventos
        container.querySelectorAll('.color-option').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                el.classList.add('selected');
            });
        });
    },

    /**
     * Obtener color seleccionado del picker
     */
    getSelectedColor(containerId) {
        const container = document.getElementById(containerId);
        const selected = container?.querySelector('.color-option.selected');
        return selected?.dataset.color || this.colors[0];
    },

    /**
     * Renderizar lista de categorías
     */
    renderList(containerId, tipo = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let categorias = tipo ? this.getByType(tipo) : this.getAll();

        if (categorias.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <div class="empty-state-title">Sin categorías</div>
          <div class="empty-state-text">Crea tu primera categoría para empezar</div>
        </div>
      `;
            return;
        }

        container.innerHTML = `
      <div class="category-grid">
        ${categorias.map(cat => `
          <div class="category-item" data-id="${cat.id}">
            <div class="category-color" style="background-color: ${cat.color}"></div>
            <div class="category-name">${cat.nombre}</div>
            <div class="category-type text-muted">${cat.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</div>
            <div class="transaction-actions" style="opacity: 1; margin-top: 8px;">
              <button class="action-btn edit-category" data-id="${cat.id}" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="action-btn delete delete-category" data-id="${cat.id}" title="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    },

    /**
     * Renderizar selector de categorías para formularios
     */
    renderSelect(selectId, tipo, selectedId = null) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const categorias = this.getByType(tipo);

        select.innerHTML = `
      <option value="">Seleccionar categoría...</option>
      ${categorias.map(cat => `
        <option value="${cat.id}" ${cat.id === selectedId ? 'selected' : ''}>
          ${cat.nombre}
        </option>
      `).join('')}
    `;
    }
};

// Exportar para uso global
window.Categories = Categories;
