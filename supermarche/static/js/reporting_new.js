window.ReportingNew = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadKPIs(){ const res = await fetch('/static/data/kpis.json'); return await res.json(); }
  async function loadSalesReports(){ const res = await fetch('/static/data/sales_reports.json'); return await res.json(); }

  async function initDashboard(){
    try{
      const [kpis, reports] = await Promise.all([loadKPIs(), loadSalesReports()]);
      renderKPIs(kpis);
      renderRecentReports(reports);
      if(reports.length > 0) createCharts(reports[0]);
    }catch(e){ console.error('Dashboard error:', e); }
  }

  function renderKPIs(kpis){
    kpis.forEach(kpi => {
      const el = document.getElementById(`kpi-${kpi.code_kpi}`);
      if(el) el.textContent = kpi.unite === 'FCFA' ? formatPrice(kpi.valeur_actuelle) : kpi.valeur_actuelle + (kpi.unite === '%' ? '%' : '');
    });
  }

  function renderRecentReports(reports){
    const tbody = document.getElementById('reports-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    reports.slice(0, 5).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date_rapport}</td><td>${r.type_rapport}</td><td class="text-end">${formatPrice(r.chiffre_affaires)}</td><td class="text-center">${r.nombre_transactions}</td><td class="text-end">${formatPrice(r.ticket_moyen)}</td>`;
      tbody.appendChild(tr);
    });
  }

  function createCharts(report){
    if(report.categories_ventes){
      const labels = report.categories_ventes.map(c => c.categorie);
      const data = report.categories_ventes.map(c => c.montant);
      Charts.createPieChart('chart-categories', labels, data);
    }
  }

  return { initDashboard };
})();
