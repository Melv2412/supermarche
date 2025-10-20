window.Loyalty = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');

  async function loadLoyaltyCard(){ 
    const res = await fetch('/static/data/loyalty_cards.json'); 
    const cards = await res.json();
    return cards[0];
  }
  async function loadRewards(){ 
    const res = await fetch('/static/data/recompenses.json'); 
    return await res.json(); 
  }
  async function loadOffers(){ 
    const res = await fetch('/static/data/offres_personnalisees.json'); 
    return await res.json(); 
  }

  function gotoCard(){ window.location.href = '/customers/card/'; }
  function gotoRewards(){ window.location.href = '/customers/rewards/'; }

  async function initCard(){
    try{
      const card = await loadLoyaltyCard();
      document.getElementById('card-number').textContent = card.numero_carte;
      document.getElementById('card-level').textContent = card.niveau_fidelite.toUpperCase();
      document.getElementById('card-points').textContent = fmt(card.solde_points);
      
      const qrContainer = document.getElementById('qr-code');
      if(qrContainer){
        qrContainer.innerHTML = `<div style="width:200px;height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;border:2px solid #ddd;border-radius:8px;"><div style="text-align:center;"><div style="font-size:48px;">📱</div><div style="font-size:12px;color:#666;margin-top:8px;">${card.qr_code}</div></div></div>`;
      }
    }catch(e){ console.error('Card load error:', e); }
  }

  async function initRewards(){
    try{
      const [card, rewards] = await Promise.all([loadLoyaltyCard(), loadRewards()]);
      document.getElementById('user-points').textContent = fmt(card.solde_points);
      renderRewards(rewards, card.solde_points);
    }catch(e){ console.error('Rewards load error:', e); }
  }

  function renderRewards(rewards, userPoints){
    const container = document.getElementById('rewards-container');
    if(!container) return;
    container.innerHTML = '';
    rewards.forEach(r => {
      const canAfford = userPoints >= r.cout_en_points;
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `<div class="card ${!canAfford ? 'opacity-50' : ''}"><div class="card-body"><h5>${r.nom}</h5><p>${r.description}</p><div class="d-flex justify-content-between mb-3"><span class="badge bg-primary">${fmt(r.cout_en_points)} pts</span>${r.est_disponible ? '<span class="badge bg-success">Dispo</span>' : '<span class="badge bg-secondary">Épuisé</span>'}</div><button class="btn btn-primary w-100" ${!canAfford || !r.est_disponible ? 'disabled' : ''} onclick="Loyalty.exchangeReward(${r.id_recompense})">${canAfford && r.est_disponible ? 'Échanger' : 'Insuffisant'}</button></div></div>`;
      container.appendChild(card);
    });
  }

  function exchangeReward(id){
    if(confirm('Échanger vos points ?')){
      alert('Récompense échangée !');
      window.location.reload();
    }
  }

  return { initCard, initRewards, gotoCard, gotoRewards, exchangeReward };
})();
