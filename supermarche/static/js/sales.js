window.Sales = (function(){
  // Fonction de formatage de prix en FCFA
  const fmtPrice = (v)=> {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  // Simulation des données de vente
  const mockData = {
    daily: {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      values: [1200, 1500, 1800, 1600, 2000, 2200, 1900]
    },
    categories: {
      labels: ['Épicerie', 'Frais', 'Fruits & Légumes', 'Boucherie'],
      values: [2500, 1800, 1200, 900]
    },
    payments: {
      labels: ['Carte', 'Espèces', 'Mobile', 'Chèque'],
      values: [60, 25, 10, 5]
    }
  };

  function initDashboard() {
    console.log('Sales dashboard initialized');
    // Ici on pourrait initialiser des graphiques ou des KPIs
  }

  return { initDashboard, fmtPrice };
})();
