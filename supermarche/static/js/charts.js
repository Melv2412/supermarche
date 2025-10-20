window.Charts = (function(){
  function createLineChart(canvasId, labels, datasets){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    return new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function createBarChart(canvasId, labels, datasets){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    return new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function createPieChart(canvasId, labels, data){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    return new Chart(ctx, {
      type: 'pie',
      data: { 
        labels, 
        datasets: [{ data, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function createDoughnutChart(canvasId, labels, data){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    return new Chart(ctx, {
      type: 'doughnut',
      data: { 
        labels, 
        datasets: [{ data, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  return { createLineChart, createBarChart, createPieChart, createDoughnutChart };
})();
