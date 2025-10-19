window.Reporting = (function(){
  let charts = { daily:null, categories:null, payments:null };
  const els = {
    period: () => document.getElementById('period'),
    refresh: () => document.getElementById('refresh'),
    kSales: () => document.getElementById('kpi-period-sales'),
    kMargin: () => document.getElementById('kpi-margin'),
    kTickets: () => document.getElementById('kpi-tickets'),
    kAvg: () => document.getElementById('kpi-avg'),
    cDaily: () => document.getElementById('chart-daily'),
    cCats: () => document.getElementById('chart-categories'),
    cPay: () => document.getElementById('chart-payments'),
  };

  function fmtPrice(v){ 
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  }

  function destroy(chart){ if(chart){ chart.destroy(); } }

  function renderKPIs(data){
    els.kSales().textContent = fmtPrice(data.kpis.sales);
    els.kMargin().textContent = fmtPrice(data.kpis.margin);
    els.kTickets().textContent = (data.kpis.tickets||0).toLocaleString('fr-FR');
    els.kAvg().textContent = fmtPrice(data.kpis.average);
  }

  function renderDaily(data){
    destroy(charts.daily);
    charts.daily = new Chart(els.cDaily().getContext('2d'), {
      type: 'line',
      data: { labels: data.daily.labels, datasets: [{
        label: 'Ventes', data: data.daily.values, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.15)', tension:.25, fill:true
      }]},
      options: { plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:(v)=>fmtPrice(v) } } } }
    });
  }

  function renderCategories(data){
    destroy(charts.categories);
    charts.categories = new Chart(els.cCats().getContext('2d'), {
      type: 'bar',
      data: { labels: data.categories.labels, datasets: [{
        label: 'Ventes', data: data.categories.values, backgroundColor: '#20c997'
      }]},
      options: { plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:(v)=>fmtPrice(v) } } } }
    });
  }

  function renderPayments(data){
    destroy(charts.payments);
    charts.payments = new Chart(els.cPay().getContext('2d'), {
      type: 'doughnut',
      data: { labels: data.payments.labels, datasets: [{
        data: data.payments.values,
        backgroundColor: ['#0d6efd','#198754','#ffc107','#dc3545']
      }]},
      options: { plugins:{ legend:{ position:'bottom' } } }
    });
  }

  async function load(){
    const days = Number(els.period().value||30);
    const url = '/static/data/reporting.json';
    const res = await fetch(url);
    const json = await res.json();
    // naive slice by period if arrays are longer
    const take = (arr) => arr.slice(-days);
    const data = {
      kpis: json.kpis,
      daily: { labels: take(json.daily.labels), values: take(json.daily.values) },
      categories: json.categories,
      payments: json.payments,
    };
    renderKPIs(data);
    renderDaily(data);
    renderCategories(data);
    renderPayments(data);
  }

  function wire(){
    els.refresh()?.addEventListener('click', load);
    els.period()?.addEventListener('change', load);
  }

  async function init(){
    try { wire(); await load(); } catch(e){ console.error('Reporting load error:', e); }
  }

  return { init };
})();
