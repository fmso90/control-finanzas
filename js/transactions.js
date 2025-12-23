/**
 * Transactions - Gestión de ingresos y gastos
 */

const Transactions = {

  // =====================
  // INGRESOS
  // =====================

  /**
   * Obtener todos los ingresos
   */
  getAllIngresos() {
    return Storage.data.ingresos || [];
  },

  /**
   * Obtener ingresos de un mes específico
   */
  getIngresosByMonth(month) {
    return this.getAllIngresos().filter(i => i.fecha.startsWith(month));
  },

  /**
   * Crear nuevo ingreso
   */
  createIngreso(data) {
    const ingreso = {
      id: Storage.generateId(),
      fecha: data.fecha,
      descripcion: data.descripcion,
      cantidad: parseFloat(data.cantidad),
      categoriaId: data.categoriaId
    };

    Storage.data.ingresos.push(ingreso);
    Storage.save();

    return ingreso;
  },

  /**
   * Actualizar ingreso
   */
  updateIngreso(id, updates) {
    const index = Storage.data.ingresos.findIndex(i => i.id === id);
    if (index !== -1) {
      if (updates.cantidad) updates.cantidad = parseFloat(updates.cantidad);
      Storage.data.ingresos[index] = {
        ...Storage.data.ingresos[index],
        ...updates
      };
      Storage.save();
      return Storage.data.ingresos[index];
    }
    return null;
  },

  /**
   * Eliminar ingreso
   */
  deleteIngreso(id) {
    const index = Storage.data.ingresos.findIndex(i => i.id === id);
    if (index !== -1) {
      Storage.data.ingresos.splice(index, 1);
      Storage.save();
      return true;
    }
    return false;
  },

  // =====================
  // GASTOS FIJOS
  // =====================

  /**
   * Obtener todos los gastos fijos
   */
  getAllGastosFijos() {
    return Storage.data.gastosFijos || [];
  },

  /**
   * Crear nuevo gasto fijo
   */
  createGastoFijo(data) {
    const gastoFijo = {
      id: Storage.generateId(),
      descripcion: data.descripcion,
      cantidad: parseFloat(data.cantidad),
      categoriaId: data.categoriaId,
      activo: true
    };

    Storage.data.gastosFijos.push(gastoFijo);
    Storage.save();

    return gastoFijo;
  },

  /**
   * Actualizar gasto fijo
   */
  updateGastoFijo(id, updates) {
    const index = Storage.data.gastosFijos.findIndex(g => g.id === id);
    if (index !== -1) {
      if (updates.cantidad) updates.cantidad = parseFloat(updates.cantidad);
      Storage.data.gastosFijos[index] = {
        ...Storage.data.gastosFijos[index],
        ...updates
      };
      Storage.save();
      return Storage.data.gastosFijos[index];
    }
    return null;
  },

  /**
   * Eliminar gasto fijo
   */
  deleteGastoFijo(id) {
    const index = Storage.data.gastosFijos.findIndex(g => g.id === id);
    if (index !== -1) {
      Storage.data.gastosFijos.splice(index, 1);
      Storage.save();
      return true;
    }
    return false;
  },

  /**
   * Toggle activo/inactivo de gasto fijo para un mes
   */
  toggleGastoFijoForMonth(gastoFijoId, month, activo) {
    if (!Storage.data.meses[month]) {
      Storage.data.meses[month] = {
        gastosFijosDesactivados: [],
        ajustes: []
      };
    }

    const mes = Storage.data.meses[month];
    if (!mes.gastosFijosDesactivados) {
      mes.gastosFijosDesactivados = [];
    }

    if (activo) {
      // Activar: quitar de la lista de desactivados
      mes.gastosFijosDesactivados = mes.gastosFijosDesactivados.filter(id => id !== gastoFijoId);
    } else {
      // Desactivar: añadir a la lista
      if (!mes.gastosFijosDesactivados.includes(gastoFijoId)) {
        mes.gastosFijosDesactivados.push(gastoFijoId);
      }
    }

    Storage.save();
  },

  /**
   * Verificar si un gasto fijo está activo para un mes
   */
  isGastoFijoActiveForMonth(gastoFijoId, month) {
    const mes = Storage.data.meses[month];
    if (!mes || !mes.gastosFijosDesactivados) return true;
    return !mes.gastosFijosDesactivados.includes(gastoFijoId);
  },

  /**
   * Obtener gastos fijos activos para un mes
   * Solo retorna gastos fijos si el mes es actual o futuro
   */
  getGastosFijosForMonth(month) {
    const currentMonth = Storage.getCurrentMonth();

    // Solo mostrar gastos fijos para el mes actual y futuros
    // Para meses pasados, verificar si hay alguna transacción
    if (month < currentMonth) {
      // Para meses pasados, solo mostrar si hubo actividad explícita
      const mesData = Storage.data.meses[month];
      if (!mesData) {
        // No hay datos para este mes, no mostrar gastos fijos
        return [];
      }
    }

    return this.getAllGastosFijos().filter(gf =>
      gf.activo && this.isGastoFijoActiveForMonth(gf.id, month)
    );
  },

  // =====================
  // GASTOS VARIABLES
  // =====================

  /**
   * Obtener todos los gastos variables
   */
  getAllGastosVariables() {
    return Storage.data.gastosVariables || [];
  },

  /**
   * Obtener gastos variables de un mes específico
   */
  getGastosVariablesByMonth(month) {
    return this.getAllGastosVariables().filter(g => g.fecha.startsWith(month));
  },

  /**
   * Crear nuevo gasto variable
   */
  createGastoVariable(data) {
    const gasto = {
      id: Storage.generateId(),
      fecha: data.fecha,
      descripcion: data.descripcion,
      cantidad: parseFloat(data.cantidad),
      categoriaId: data.categoriaId
    };

    Storage.data.gastosVariables.push(gasto);
    Storage.save();

    return gasto;
  },

  /**
   * Actualizar gasto variable
   */
  updateGastoVariable(id, updates) {
    const index = Storage.data.gastosVariables.findIndex(g => g.id === id);
    if (index !== -1) {
      if (updates.cantidad) updates.cantidad = parseFloat(updates.cantidad);
      Storage.data.gastosVariables[index] = {
        ...Storage.data.gastosVariables[index],
        ...updates
      };
      Storage.save();
      return Storage.data.gastosVariables[index];
    }
    return null;
  },

  /**
   * Eliminar gasto variable
   */
  deleteGastoVariable(id) {
    const index = Storage.data.gastosVariables.findIndex(g => g.id === id);
    if (index !== -1) {
      Storage.data.gastosVariables.splice(index, 1);
      Storage.save();
      return true;
    }
    return false;
  },

  // =====================
  // RENDERIZADO
  // =====================

  /**
   * Renderizar lista de ingresos
   */
  renderIngresosList(containerId, month) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ingresos = this.getIngresosByMonth(month);

    if (ingresos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="empty-state-title">Sin ingresos este mes</div>
          <div class="empty-state-text">Añade tu primer ingreso</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="transaction-list">
        ${ingresos.map(ingreso => {
      const categoria = Categories.getById(ingreso.categoriaId);
      return `
            <div class="transaction-item" data-id="${ingreso.id}">
              <div class="transaction-icon income" style="${categoria ? `background-color: ${categoria.color}20; color: ${categoria.color}` : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div class="transaction-details">
                <div class="transaction-description">${ingreso.descripcion}</div>
                <div class="transaction-category">${categoria?.nombre || 'Sin categoría'} · ${this.formatDate(ingreso.fecha)}</div>
              </div>
              <div class="transaction-amount income">+${this.formatCurrency(ingreso.cantidad)}</div>
              <div class="transaction-actions">
                <button class="action-btn edit-ingreso" data-id="${ingreso.id}" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="action-btn delete delete-ingreso" data-id="${ingreso.id}" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  /**
   * Renderizar lista de gastos fijos
   */
  renderGastosFijosList(containerId, month) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const gastosFijos = this.getAllGastosFijos().filter(gf => gf.activo);

    if (gastosFijos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div class="empty-state-title">Sin gastos fijos</div>
          <div class="empty-state-text">Añade gastos que se repiten cada mes</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="transaction-list">
        ${gastosFijos.map(gasto => {
      const categoria = Categories.getById(gasto.categoriaId);
      const isActive = this.isGastoFijoActiveForMonth(gasto.id, month);
      return `
            <div class="transaction-item ${!isActive ? 'text-muted' : ''}" data-id="${gasto.id}">
              <div class="toggle-switch ${isActive ? 'active' : ''}" 
                   data-id="${gasto.id}" 
                   data-month="${month}"
                   title="${isActive ? 'Desactivar este mes' : 'Activar este mes'}">
              </div>
              <div class="transaction-details">
                <div class="transaction-description" style="${!isActive ? 'text-decoration: line-through; opacity: 0.5' : ''}">${gasto.descripcion}</div>
                <div class="transaction-category">${categoria?.nombre || 'Sin categoría'}</div>
              </div>
              <div class="transaction-amount expense" style="${!isActive ? 'opacity: 0.5' : ''}">-${this.formatCurrency(gasto.cantidad)}</div>
              <div class="transaction-actions">
                <button class="action-btn edit-gasto-fijo" data-id="${gasto.id}" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="action-btn delete delete-gasto-fijo" data-id="${gasto.id}" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  /**
   * Renderizar lista de gastos variables
   */
  renderGastosVariablesList(containerId, month) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const gastos = this.getGastosVariablesByMonth(month);

    if (gastos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="empty-state-title">Sin gastos variables este mes</div>
          <div class="empty-state-text">Añade gastos puntuales</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="transaction-list">
        ${gastos.map(gasto => {
      const categoria = Categories.getById(gasto.categoriaId);
      return `
            <div class="transaction-item" data-id="${gasto.id}">
              <div class="transaction-icon expense" style="${categoria ? `background-color: ${categoria.color}20; color: ${categoria.color}` : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </div>
              <div class="transaction-details">
                <div class="transaction-description">${gasto.descripcion}</div>
                <div class="transaction-category">${categoria?.nombre || 'Sin categoría'} · ${this.formatDate(gasto.fecha)}</div>
              </div>
              <div class="transaction-amount expense">-${this.formatCurrency(gasto.cantidad)}</div>
              <div class="transaction-actions">
                <button class="action-btn edit-gasto-variable" data-id="${gasto.id}" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="action-btn delete delete-gasto-variable" data-id="${gasto.id}" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  // =====================
  // UTILIDADES
  // =====================

  /**
   * Formatear cantidad como moneda
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  },

  /**
   * Formatear fecha
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  }
};

// Exportar para uso global
window.Transactions = Transactions;
