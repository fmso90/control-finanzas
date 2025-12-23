/**
 * Balance - Cálculos de balance mensual
 */

const Balance = {

    /**
     * Calcular totales para un mes
     */
    calcularMes(month) {
        // Ingresos del mes
        const ingresos = Transactions.getIngresosByMonth(month);
        const totalIngresos = ingresos.reduce((sum, i) => sum + i.cantidad, 0);

        // Gastos fijos activos para el mes
        const gastosFijos = Transactions.getGastosFijosForMonth(month);
        const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + g.cantidad, 0);

        // Gastos variables del mes
        const gastosVariables = Transactions.getGastosVariablesByMonth(month);
        const totalGastosVariables = gastosVariables.reduce((sum, g) => sum + g.cantidad, 0);

        // Totales
        const totalGastos = totalGastosFijos + totalGastosVariables;
        const balance = totalIngresos - totalGastos;

        return {
            totalIngresos,
            totalGastosFijos,
            totalGastosVariables,
            totalGastos,
            balance,
            isPositive: balance >= 0
        };
    },

    /**
     * Calcular gastos por categoría para un mes
     */
    gastosPorCategoria(month) {
        const gastosFijos = Transactions.getGastosFijosForMonth(month);
        const gastosVariables = Transactions.getGastosVariablesByMonth(month);

        const porCategoria = {};

        // Sumar gastos fijos
        gastosFijos.forEach(gasto => {
            const catId = gasto.categoriaId || 'sin-categoria';
            if (!porCategoria[catId]) {
                porCategoria[catId] = 0;
            }
            porCategoria[catId] += gasto.cantidad;
        });

        // Sumar gastos variables
        gastosVariables.forEach(gasto => {
            const catId = gasto.categoriaId || 'sin-categoria';
            if (!porCategoria[catId]) {
                porCategoria[catId] = 0;
            }
            porCategoria[catId] += gasto.cantidad;
        });

        // Convertir a array con datos de categoría
        return Object.entries(porCategoria).map(([catId, total]) => {
            const categoria = Categories.getById(catId);
            return {
                categoriaId: catId,
                nombre: categoria?.nombre || 'Sin categoría',
                color: categoria?.color || '#6b7280',
                total
            };
        }).sort((a, b) => b.total - a.total);
    },

    /**
     * Obtener histórico de balances (últimos N meses)
     */
    getHistorico(monthCount = 6) {
        const historico = [];
        let currentMonth = Storage.getCurrentMonth();

        for (let i = 0; i < monthCount; i++) {
            const datos = this.calcularMes(currentMonth);
            historico.unshift({
                month: currentMonth,
                monthLabel: Storage.formatMonth(currentMonth),
                ...datos
            });
            currentMonth = Storage.getPreviousMonth(currentMonth);
        }

        return historico;
    },

    /**
     * Renderizar tarjetas de balance
     */
    renderBalanceCards(month) {
        const datos = this.calcularMes(month);

        // Actualizar ingresos
        const ingresosCard = document.querySelector('.balance-card.income .balance-amount');
        if (ingresosCard) {
            ingresosCard.textContent = Transactions.formatCurrency(datos.totalIngresos);
        }

        // Actualizar gastos
        const gastosCard = document.querySelector('.balance-card.expense .balance-amount');
        if (gastosCard) {
            gastosCard.textContent = Transactions.formatCurrency(datos.totalGastos);
        }

        // Actualizar balance
        const balanceCard = document.querySelector('.balance-card.total');
        const balanceAmount = balanceCard?.querySelector('.balance-amount');
        if (balanceCard && balanceAmount) {
            balanceCard.classList.remove('positive', 'negative');
            balanceCard.classList.add(datos.isPositive ? 'positive' : 'negative');
            balanceAmount.textContent = Transactions.formatCurrency(datos.balance);
        }
    },

    /**
     * Renderizar resumen en el dashboard
     */
    renderDashboardSummary(containerId, month) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const datos = this.calcularMes(month);
        const gastosPorCat = this.gastosPorCategoria(month);

        // Mostrar top categorías de gasto
        const topCategorias = gastosPorCat.slice(0, 5);

        if (topCategorias.length === 0) {
            container.innerHTML = `
        <p class="text-muted">No hay gastos registrados este mes</p>
      `;
            return;
        }

        container.innerHTML = `
      <div class="category-breakdown">
        ${topCategorias.map(cat => {
            const porcentaje = datos.totalGastos > 0
                ? Math.round((cat.total / datos.totalGastos) * 100)
                : 0;
            return `
            <div class="category-bar-item">
              <div class="category-bar-header">
                <span class="category-bar-name">
                  <span class="category-dot" style="background: ${cat.color}"></span>
                  ${cat.nombre}
                </span>
                <span class="category-bar-amount">${Transactions.formatCurrency(cat.total)} <span class="category-percent">(${porcentaje}%)</span></span>
              </div>
              <div class="category-bar-track">
                <div class="category-bar-fill" style="width: ${porcentaje}%; background: ${cat.color}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <style>
        .category-breakdown { display: flex; flex-direction: column; gap: 12px; }
        .category-bar-item { }
        .category-bar-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.875rem; }
        .category-bar-name { display: flex; align-items: center; gap: 8px; }
        .category-dot { width: 10px; height: 10px; border-radius: 50%; }
        .category-bar-amount { font-weight: 600; }
        .category-percent { color: rgba(255,255,255,0.5); font-weight: 400; font-size: 0.8rem; }
        .category-bar-track { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
        .category-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
      </style>
    `;
    }
};

// Exportar para uso global
window.Balance = Balance;
