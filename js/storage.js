/**
 * Storage - Gestión de datos con Supabase
 */

// Configuración de Supabase
const SUPABASE_URL = 'https://unvkgrjvnaxcyfqdvilg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmtncmp2bmF4Y3lmcWR2aWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTA2OTgsImV4cCI6MjA4MDY4NjY5OH0.EY2uU7z72-H4mf9NuET3X0iN_j7Hads6a3v4enJyCq4';

const Storage = {
    // Clave para LocalStorage (caché y user_id)
    CACHE_KEY: 'finanzas_cache',
    USER_ID_KEY: 'finanzas_user_id',

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

    // User ID para sincronización
    userId: null,

    // Estado de sincronización
    isSyncing: false,
    lastSyncTime: null,

    /**
     * Inicializar el storage
     */
    async init() {
        // Obtener o crear user ID
        this.userId = localStorage.getItem(this.USER_ID_KEY);
        if (!this.userId) {
            this.userId = this.generateId();
            localStorage.setItem(this.USER_ID_KEY, this.userId);
        }

        // Cargar desde caché primero (más rápido)
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

        // Asegurar estructura completa
        this.ensureStructure();

        // Intentar sincronizar con Supabase
        await this.syncFromCloud();

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
     * Guardar datos (local + nube)
     */
    async save() {
        // Guardar en caché local inmediatamente
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.data));

        // Sincronizar con la nube (sin bloquear)
        this.syncToCloud();
    },

    /**
     * Sincronizar datos hacia Supabase
     */
    async syncToCloud() {
        if (this.isSyncing) return;

        this.isSyncing = true;
        this.showSyncStatus('syncing');

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/finanzas_data?user_id=eq.${this.userId}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const existing = await response.json();

            if (existing && existing.length > 0) {
                // Actualizar registro existente
                await fetch(`${SUPABASE_URL}/rest/v1/finanzas_data?user_id=eq.${this.userId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ data: this.data })
                });
            } else {
                // Crear nuevo registro
                await fetch(`${SUPABASE_URL}/rest/v1/finanzas_data`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        user_id: this.userId,
                        data: this.data
                    })
                });
            }

            this.lastSyncTime = new Date();
            this.showSyncStatus('synced');
            console.log('✅ Datos sincronizados con la nube');

        } catch (error) {
            console.error('❌ Error sincronizando:', error);
            this.showSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    },

    /**
     * Sincronizar datos desde Supabase
     */
    async syncFromCloud() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/finanzas_data?user_id=eq.${this.userId}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result && result.length > 0 && result[0].data) {
                const cloudData = result[0].data;

                // Comparar timestamps o usar datos de la nube si son más recientes
                const cloudUpdated = new Date(result[0].updated_at);

                // Usar datos de la nube
                this.data = cloudData;
                this.ensureStructure();

                // Actualizar caché local
                localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.data));

                console.log('✅ Datos cargados desde la nube');
                this.showSyncStatus('synced');
            } else {
                // No hay datos en la nube, subir los locales
                await this.syncToCloud();
            }

        } catch (error) {
            console.error('⚠️ No se pudo conectar con la nube, usando datos locales:', error);
            this.showSyncStatus('offline');
        }
    },

    /**
     * Forzar sincronización
     */
    async forceSync() {
        await this.syncFromCloud();
        return this.data;
    },

    /**
     * Mostrar estado de sincronización en la UI
     */
    showSyncStatus(status) {
        let indicator = document.getElementById('syncIndicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncIndicator';
            indicator.style.cssText = `
        position: fixed;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
      `;
            document.body.appendChild(indicator);
        }

        const states = {
            syncing: {
                bg: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                text: '⟳ Sincronizando...'
            },
            synced: {
                bg: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                text: '✓ Sincronizado'
            },
            error: {
                bg: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                text: '✗ Error de sync'
            },
            offline: {
                bg: 'rgba(234, 179, 8, 0.2)',
                color: '#eab308',
                text: '○ Offline'
            }
        };

        const state = states[status] || states.offline;
        indicator.style.background = state.bg;
        indicator.style.color = state.color;
        indicator.innerHTML = state.text;

        // Ocultar después de 3 segundos si está sincronizado
        if (status === 'synced') {
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.opacity = '1';
                    indicator.innerHTML = '☁️';
                    indicator.style.background = 'rgba(255,255,255,0.1)';
                    indicator.style.color = 'rgba(255,255,255,0.5)';
                }, 300);
            }, 2000);
        }
    },

    /**
     * Obtener el User ID para compartir entre dispositivos
     */
    getUserId() {
        return this.userId;
    },

    /**
     * Establecer User ID (para sincronizar con otro dispositivo)
     */
    async setUserId(newUserId) {
        this.userId = newUserId;
        localStorage.setItem(this.USER_ID_KEY, newUserId);

        // Cargar datos del nuevo usuario
        await this.syncFromCloud();

        return this.data;
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
        const exportObj = {
            userId: this.userId,
            data: this.data,
            exportedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportObj, null, 2);
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
            reader.onload = async (e) => {
                try {
                    const imported = JSON.parse(e.target.result);

                    // Si tiene userId, usarlo para sincronizar
                    if (imported.userId) {
                        await this.setUserId(imported.userId);
                    }

                    // Importar datos
                    if (imported.data) {
                        this.data = imported.data;
                    } else {
                        this.data = imported;
                    }

                    this.ensureStructure();
                    await this.save();

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
