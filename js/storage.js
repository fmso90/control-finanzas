/**
 * Storage - Gestión de datos y sincronización con iCloud
 */

const Storage = {
    // Clave para LocalStorage (caché)
    CACHE_KEY: 'finanzas_cache',

    // Estructura de datos por defecto
    defaultData: {
        categorias: [],
        ingresos: [],
        gastosFijos: [],
        gastosVariables: [],
        meses: {}
    },

    // Datos en memoria
    data: null,

    /**
     * Inicializar el storage
     */
    async init() {
        // Intentar cargar desde caché primero (más rápido)
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
            try {
                this.data = JSON.parse(cached);
            } catch (e) {
                console.error('Error parsing cached data:', e);
            }
        }

        // Si no hay caché, usar datos por defecto
        if (!this.data) {
            this.data = { ...this.defaultData };
        }

        // Asegurar que la estructura esté completa
        this.ensureStructure();

        return this.data;
    },

    /**
     * Asegurar que la estructura de datos esté completa
     */
    ensureStructure() {
        if (!this.data.categorias) this.data.categorias = [];
        if (!this.data.ingresos) this.data.ingresos = [];
        if (!this.data.gastosFijos) this.data.gastosFijos = [];
        if (!this.data.gastosVariables) this.data.gastosVariables = [];
        if (!this.data.meses) this.data.meses = {};
    },

    /**
     * Guardar datos
     */
    async save() {
        // Guardar en caché local
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.data));

        // Nota: El archivo finanzas.json en iCloud se sincroniza automáticamente
        // cuando el usuario guarda/exporta manualmente
    },

    /**
     * Generar UUID único
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Obtener mes actual en formato YYYY-MM
     */
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    /**
     * Formatear mes para mostrar
     */
    formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${months[parseInt(month) - 1]} ${year}`;
    },

    /**
     * Obtener mes anterior
     */
    getPreviousMonth(monthStr) {
        const [year, month] = monthStr.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    },

    /**
     * Obtener mes siguiente
     */
    getNextMonth(monthStr) {
        const [year, month] = monthStr.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    },

    /**
     * Exportar datos a JSON
     */
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Importar datos desde JSON
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    this.data = imported;
                    this.ensureStructure();
                    this.save();
                    resolve(this.data);
                } catch (error) {
                    reject(new Error('El archivo no es válido'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }
};

// Exportar para uso global
window.Storage = Storage;
