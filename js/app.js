/**
 * App - Punto de entrada principal
 */

const App = {
    // Mes seleccionado actualmente
    currentMonth: null,

    // Vista activa
    activeView: 'dashboard',

    // Modal activo
    activeModal: null,

    // Item siendo editado
    editingItem: null,

    /**
     * Inicializar la aplicación
     */
    async init() {
        // Registrar Service Worker
        this.registerServiceWorker();

        // Inicializar storage
        await Storage.init();

        // Establecer mes actual
        this.currentMonth = Storage.getCurrentMonth();

        // Inicializar gráficos
        Charts.init();

        // Configurar eventos
        this.setupEventListeners();

        // Renderizar vista inicial
        this.updateMonthDisplay();
        this.switchView('dashboard');

        console.log('App inicializada');
    },

    /**
     * Registrar Service Worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrado'))
                .catch(err => console.log('Error registrando SW:', err));
        }
    },

    /**
     * Configurar todos los event listeners
     */
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Selector de mes
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));

        // FAB (Floating Action Button)
        document.getElementById('fab')?.addEventListener('click', () => this.showQuickAddMenu());

        // Botones de añadir en cada sección
        document.getElementById('addIngreso')?.addEventListener('click', () => this.showModal('ingreso'));
        document.getElementById('addGastoFijo')?.addEventListener('click', () => this.showModal('gastoFijo'));
        document.getElementById('addGastoVariable')?.addEventListener('click', () => this.showModal('gastoVariable'));
        document.getElementById('addCategoria')?.addEventListener('click', () => this.showModal('categoria'));

        // Cerrar modales
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) this.closeModal();
            });
        });

        // Prevenir cierre al hacer clic dentro del modal
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => e.stopPropagation());
        });

        // Formularios
        document.getElementById('formIngreso')?.addEventListener('submit', (e) => this.handleIngresoSubmit(e));
        document.getElementById('formGastoFijo')?.addEventListener('submit', (e) => this.handleGastoFijoSubmit(e));
        document.getElementById('formGastoVariable')?.addEventListener('submit', (e) => this.handleGastoVariableSubmit(e));
        document.getElementById('formCategoria')?.addEventListener('submit', (e) => this.handleCategoriaSubmit(e));

        // Delegación de eventos para elementos dinámicos
        document.addEventListener('click', (e) => {
            // Toggle de gastos fijos
            if (e.target.closest('.toggle-switch')) {
                const toggle = e.target.closest('.toggle-switch');
                const id = toggle.dataset.id;
                const month = toggle.dataset.month;
                const isActive = toggle.classList.contains('active');

                Transactions.toggleGastoFijoForMonth(id, month, !isActive);
                toggle.classList.toggle('active');
                this.refreshCurrentView();
            }

            // Editar ingreso
            if (e.target.closest('.edit-ingreso')) {
                const id = e.target.closest('.edit-ingreso').dataset.id;
                this.editIngreso(id);
            }

            // Eliminar ingreso
            if (e.target.closest('.delete-ingreso')) {
                const id = e.target.closest('.delete-ingreso').dataset.id;
                if (confirm('¿Eliminar este ingreso?')) {
                    Transactions.deleteIngreso(id);
                    this.refreshCurrentView();
                }
            }

            // Editar gasto fijo
            if (e.target.closest('.edit-gasto-fijo')) {
                const id = e.target.closest('.edit-gasto-fijo').dataset.id;
                this.editGastoFijo(id);
            }

            // Eliminar gasto fijo
            if (e.target.closest('.delete-gasto-fijo')) {
                const id = e.target.closest('.delete-gasto-fijo').dataset.id;
                if (confirm('¿Eliminar este gasto fijo?')) {
                    Transactions.deleteGastoFijo(id);
                    this.refreshCurrentView();
                }
            }

            // Editar gasto variable
            if (e.target.closest('.edit-gasto-variable')) {
                const id = e.target.closest('.edit-gasto-variable').dataset.id;
                this.editGastoVariable(id);
            }

            // Eliminar gasto variable
            if (e.target.closest('.delete-gasto-variable')) {
                const id = e.target.closest('.delete-gasto-variable').dataset.id;
                if (confirm('¿Eliminar este gasto?')) {
                    Transactions.deleteGastoVariable(id);
                    this.refreshCurrentView();
                }
            }

            // Editar categoría
            if (e.target.closest('.edit-category')) {
                const id = e.target.closest('.edit-category').dataset.id;
                this.editCategoria(id);
            }

            // Eliminar categoría
            if (e.target.closest('.delete-category')) {
                const id = e.target.closest('.delete-category').dataset.id;
                if (Categories.isInUse(id)) {
                    alert('Esta categoría está en uso. Elimina o modifica los elementos que la usan primero.');
                } else if (confirm('¿Eliminar esta categoría?')) {
                    Categories.delete(id);
                    this.refreshCurrentView();
                }
            }
        });

        // Tabs de gráficos
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.chart-panel').forEach(p => p.classList.add('hidden'));

                tab.classList.add('active');
                const panelId = tab.dataset.chart + 'Panel';
                document.getElementById(panelId)?.classList.remove('hidden');
            });
        });

        // Exportar/Importar
        document.getElementById('exportData')?.addEventListener('click', () => Storage.exportData());
        document.getElementById('importData')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });
        document.getElementById('importFile')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await Storage.importData(file);
                    alert('Datos importados correctamente');
                    this.refreshCurrentView();
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        });
    },

    /**
     * Cambiar de vista
     */
    switchView(view) {
        this.activeView = view;

        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Mostrar/ocultar secciones
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.toggle('active', section.id === view + 'View');
        });

        // Renderizar contenido de la vista
        this.renderView(view);
    },

    /**
     * Renderizar contenido de una vista
     */
    renderView(view) {
        switch (view) {
            case 'dashboard':
                Balance.renderBalanceCards(this.currentMonth);
                Balance.renderDashboardSummary('dashboardSummary', this.currentMonth);
                Charts.updateAll(this.currentMonth);
                break;

            case 'ingresos':
                Categories.renderSelect('ingresoCategoria', 'ingreso');
                Transactions.renderIngresosList('ingresosList', this.currentMonth);
                break;

            case 'gastosFijos':
                Categories.renderSelect('gastoFijoCategoria', 'gasto');
                Transactions.renderGastosFijosList('gastosFijosList', this.currentMonth);
                break;

            case 'gastosVariables':
                Categories.renderSelect('gastoVariableCategoria', 'gasto');
                Transactions.renderGastosVariablesList('gastosVariablesList', this.currentMonth);
                break;

            case 'categorias':
                Categories.renderList('categoriasList');
                break;
        }
    },

    /**
     * Refrescar la vista actual
     */
    refreshCurrentView() {
        this.renderView(this.activeView);

        // Siempre actualizar el balance
        Balance.renderBalanceCards(this.currentMonth);
    },

    /**
     * Cambiar mes
     */
    changeMonth(delta) {
        if (delta > 0) {
            this.currentMonth = Storage.getNextMonth(this.currentMonth);
        } else {
            this.currentMonth = Storage.getPreviousMonth(this.currentMonth);
        }

        this.updateMonthDisplay();
        this.refreshCurrentView();
    },

    /**
     * Actualizar display del mes
     */
    updateMonthDisplay() {
        const display = document.getElementById('currentMonth');
        if (display) {
            display.textContent = Storage.formatMonth(this.currentMonth);
        }
    },

    /**
     * Mostrar modal
     */
    showModal(type) {
        this.activeModal = type;
        this.editingItem = null;

        const modalId = 'modal' + type.charAt(0).toUpperCase() + type.slice(1);
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');

        if (modal && overlay) {
            // Resetear formulario
            const form = modal.querySelector('form');
            if (form) form.reset();

            // Configurar fecha por defecto
            const fechaInput = modal.querySelector('input[type="date"]');
            if (fechaInput) {
                fechaInput.value = new Date().toISOString().split('T')[0];
            }

            // Actualizar título
            const title = modal.querySelector('.modal-title');
            if (title) {
                title.textContent = this.getModalTitle(type, false);
            }

            // Mostrar color picker para categorías
            if (type === 'categoria') {
                Categories.renderColorPicker(null, 'colorPicker');
            }

            // Actualizar selectores de categoría
            if (type === 'ingreso') {
                Categories.renderSelect('ingresoCategoria', 'ingreso');
            } else if (type === 'gastoFijo' || type === 'gastoVariable') {
                Categories.renderSelect(type + 'Categoria', 'gasto');
            }

            overlay.classList.add('active');
            modal.classList.add('active');

            // Focus en primer input
            setTimeout(() => {
                const firstInput = modal.querySelector('input:not([type="hidden"]), select');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    },

    /**
     * Cerrar modal
     */
    closeModal() {
        const overlay = document.getElementById('modalOverlay');
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');

        this.activeModal = null;
        this.editingItem = null;
    },

    /**
     * Obtener título del modal
     */
    getModalTitle(type, isEdit) {
        const titles = {
            ingreso: isEdit ? 'Editar Ingreso' : 'Nuevo Ingreso',
            gastoFijo: isEdit ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo',
            gastoVariable: isEdit ? 'Editar Gasto Variable' : 'Nuevo Gasto Variable',
            categoria: isEdit ? 'Editar Categoría' : 'Nueva Categoría'
        };
        return titles[type] || 'Modal';
    },

    /**
     * Menú rápido de añadir
     */
    showQuickAddMenu() {
        // Por simplicidad, mostramos el modal de gasto variable (más común)
        this.showModal('gastoVariable');
    },

    // =====================
    // HANDLERS DE FORMULARIOS
    // =====================

    handleIngresoSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const data = {
            fecha: form.fecha.value,
            descripcion: form.descripcion.value,
            cantidad: form.cantidad.value,
            categoriaId: form.categoria.value
        };

        if (this.editingItem) {
            Transactions.updateIngreso(this.editingItem.id, data);
        } else {
            Transactions.createIngreso(data);
        }

        this.closeModal();
        this.refreshCurrentView();
    },

    handleGastoFijoSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const data = {
            descripcion: form.descripcion.value,
            cantidad: form.cantidad.value,
            categoriaId: form.categoria.value
        };

        if (this.editingItem) {
            Transactions.updateGastoFijo(this.editingItem.id, data);
        } else {
            Transactions.createGastoFijo(data);
        }

        this.closeModal();
        this.refreshCurrentView();
    },

    handleGastoVariableSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const data = {
            fecha: form.fecha.value,
            descripcion: form.descripcion.value,
            cantidad: form.cantidad.value,
            categoriaId: form.categoria.value
        };

        if (this.editingItem) {
            Transactions.updateGastoVariable(this.editingItem.id, data);
        } else {
            Transactions.createGastoVariable(data);
        }

        this.closeModal();
        this.refreshCurrentView();
    },

    handleCategoriaSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const nombre = form.nombre.value;
        const tipo = form.tipo.value;
        const color = Categories.getSelectedColor('colorPicker');

        if (this.editingItem) {
            Categories.update(this.editingItem.id, { nombre, tipo, color });
        } else {
            Categories.create(nombre, tipo, color);
        }

        this.closeModal();
        this.refreshCurrentView();
    },

    // =====================
    // FUNCIONES DE EDICIÓN
    // =====================

    editIngreso(id) {
        const ingreso = Transactions.getAllIngresos().find(i => i.id === id);
        if (!ingreso) return;

        this.editingItem = ingreso;
        this.showModal('ingreso');

        const form = document.getElementById('formIngreso');
        if (form) {
            form.fecha.value = ingreso.fecha;
            form.descripcion.value = ingreso.descripcion;
            form.cantidad.value = ingreso.cantidad;
            form.categoria.value = ingreso.categoriaId || '';
        }

        const title = document.querySelector('#modalIngreso .modal-title');
        if (title) title.textContent = 'Editar Ingreso';
    },

    editGastoFijo(id) {
        const gasto = Transactions.getAllGastosFijos().find(g => g.id === id);
        if (!gasto) return;

        this.editingItem = gasto;
        this.showModal('gastoFijo');

        const form = document.getElementById('formGastoFijo');
        if (form) {
            form.descripcion.value = gasto.descripcion;
            form.cantidad.value = gasto.cantidad;
            form.categoria.value = gasto.categoriaId || '';
        }

        const title = document.querySelector('#modalGastoFijo .modal-title');
        if (title) title.textContent = 'Editar Gasto Fijo';
    },

    editGastoVariable(id) {
        const gasto = Transactions.getAllGastosVariables().find(g => g.id === id);
        if (!gasto) return;

        this.editingItem = gasto;
        this.showModal('gastoVariable');

        const form = document.getElementById('formGastoVariable');
        if (form) {
            form.fecha.value = gasto.fecha;
            form.descripcion.value = gasto.descripcion;
            form.cantidad.value = gasto.cantidad;
            form.categoria.value = gasto.categoriaId || '';
        }

        const title = document.querySelector('#modalGastoVariable .modal-title');
        if (title) title.textContent = 'Editar Gasto Variable';
    },

    editCategoria(id) {
        const categoria = Categories.getById(id);
        if (!categoria) return;

        this.editingItem = categoria;
        this.showModal('categoria');

        const form = document.getElementById('formCategoria');
        if (form) {
            form.nombre.value = categoria.nombre;
            form.tipo.value = categoria.tipo;
        }

        Categories.renderColorPicker(categoria.color, 'colorPicker');

        const title = document.querySelector('#modalCategoria .modal-title');
        if (title) title.textContent = 'Editar Categoría';
    }
};

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());

// Exportar para uso global
window.App = App;
