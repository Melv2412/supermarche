// Configuration des graphiques
const chartColors = {
    primary: '#8B5CF6',
    secondary: '#3B82F6',
    tertiary: '#FFD700',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    gradient: function(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        return gradient;
    }
};

// Configuration commune pour les graphiques
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: 'white',
            titleColor: '#1F2937',
            bodyColor: '#1F2937',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
                label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString('fr-FR')} FCFA`;
                }
            }
        }
    }
};

// Initialisation des graphiques
document.addEventListener('DOMContentLoaded', function() {
    initEvolutionChart();
    initPeakHoursChart();
});

// Graphique d'évolution des ventes
function initEvolutionChart() {
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    
    const evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: evolutionData.labels,
            datasets: [{
                label: 'Ventes',
                data: evolutionData.data,
                borderColor: chartColors.primary,
                backgroundColor: function(context) {
                    return context.chart.ctx ? chartColors.gradient(context.chart.ctx) : 'rgba(139, 92, 246, 0.5)';
                },
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                pointBorderColor: chartColors.primary,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 2]
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value.toLocaleString('fr-FR') + ' FCFA';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Graphique des heures de pointe
function initPeakHoursChart() {
    const ctx = document.getElementById('peakHoursChart').getContext('2d');
    
    const peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: peakHoursData.labels,
            datasets: [{
                label: 'Transactions',
                data: peakHoursData.data,
                backgroundColor: chartColors.tertiary,
                borderRadius: 4
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 2]
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                delay: function(context) {
                    return context.dataIndex * 50;
                },
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Changement de période pour les graphiques
function changeChartPeriod(period) {
    // Implémenter la logique de changement de période
    fetch(`/api/sales/evolution/${period}/`)
        .then(response => response.json())
        .then(data => {
            evolutionChart.data.labels = data.labels;
            evolutionChart.data.datasets[0].data = data.data;
            evolutionChart.update();
        });
}

function changeHeatmapView(view) {
    // Implémenter la logique de changement de vue
    fetch(`/api/sales/peak-hours/${view}/`)
        .then(response => response.json())
        .then(data => {
            peakHoursChart.data.labels = data.labels;
            peakHoursChart.data.datasets[0].data = data.data;
            peakHoursChart.update();
        });
}