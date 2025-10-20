window.Performance = (function(){
  async function loadReviews(){ 
    const res = await fetch('/static/data/reviews.json'); 
    return await res.json(); 
  }

  function gotoList(){ window.location.href = '/employees/performance/'; }
  function gotoCreate(){ window.location.href = '/employees/performance/create/'; }

  async function initList(){
    try{
      const reviews = await loadReviews();
      renderReviewsTable(reviews);
    }catch(e){ console.error('Reviews load error:', e); }
  }

  function renderReviewsTable(reviews){
    const tbody = document.getElementById('reviews-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    reviews.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.employee}</td><td>${r.date}</td><td class="text-center">${r.score}/5</td><td>${r.reviewer}</td><td class="text-center"><button class="btn-sm btn-primary" onclick="Performance.viewDetail(${r.id})">Voir</button></td>`;
      tbody.appendChild(tr);
    });
  }

  function viewDetail(id){ alert('Détail évaluation #' + id); }

  return { initList, gotoList, gotoCreate, viewDetail };
})();
