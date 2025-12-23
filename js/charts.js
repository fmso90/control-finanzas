/**
 * Charts - Visualizaciones con Chart.js
 */

const Charts = {
    // Instancias de gráficos
    barChart: null,
    pieChart: null,
    lineChart: null,

    // Configuración común
    commonOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        family: "'Inter', sans-serif"
                    }
                }
            }
        }
    },

    /**
     * Inicializar los gráficos
     */
    init() {
        // Configurar colores por defecto de Chart.js
        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    },

    /**
     * Gráfico de barras: Ingresos vs Gastos por mes
     */
    renderBarChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destruir gráfico anterior si existe
        if (this.barChart) {
            this.barChart.destroy();
        }

        const historico = Balance.getHistorico(6);

        const data = {
            labels: historico.map(h => h.monthLabel.split(' ')[0]), // Solo mes
            datasets: [
                {
                    label: 'Ingresos',
                    data: historico.map(h => h.totalIngresos),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Gastos',
                    data: historico.map(h => h.totalGastos),
                    backgroundColor: 'rgba(244, 63, 94, 0.8)',
                    borderColor: '#f43f5e',
                    borderWidth: 2,
                    borderRadius: 6
                }
            ]
        };

        this.barChart = new Chart(canvas, {
            type: 'bar',
            data,
            options: {
                ...this.commonOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            callback: (value) => '€' + value
                        }
                    }
                }
            }
        });
    },

    /**
     * Gráfico circular: Gastos por categoría
     */
    renderPieChart(canvasId, month) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destruir gráfico anterior si existe
        if (this.pieChart) {
            this.pieChart.destroy();
        }

        const gastosPorCat = Balance.gastosPorCategoria(month);

        if (gastosPorCat.length === 0) {
            // Mostrar mensaje si no hay datos
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sin datos para mostrar', canvas.width / 2, canvas.height / 2);
            return;
        }

        const data = {
            labels: gastosPorCat.map(g => g.nombre),
            datasets: [{
                data: gastosPorCat.map(g => g.total),
                backgroundColor: gastosPorCat.map(g => g.color),
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        this.pieChart = new Chart(canvas, {
            type: 'doughnut',
            data,
            options: {
                ...this.commonOptions,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return ` ${context.label}: €${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Gráfico de línea: Evolución del balance
     */
    renderLineChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destruir gráfico anterior si existe
        if (this.lineChart) {
            this.lineChart.destroy();
        }

        const historico = Balance.getHistorico(6);

        // Calcular balance acumulado
        let balanceAcumulado = 0;
        const balancesAcumulados = historico.map(h => {
            balanceAcumulado += h.balance;
            return balanceAcumulado;
        });

        const data = {
            labels: historico.map(h => h.monthLabel.split(' ')[0]),
            datasets: [{
                label: 'Balance Acumulado',
                data: balancesAcumulados,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        };

        this.lineChart = new Chart(canvas, {
            type: 'line',
            data,
            options: {
                ...this.commonOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            callback: (value) => '€' + value
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Actualizar todos los gráficos
     */
    updateAll(month) {
        this.renderBarChart('barChart');
        this.renderPieChart('pieChart', month);
        this.renderLineChart('lineChart');
    }
};

// Exportar para uso global
window.Charts = Charts;
