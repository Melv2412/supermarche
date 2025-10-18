window.App = window.App || {};
App.formatPrice = (v) => (v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
