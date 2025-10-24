from django import template
from decimal import Decimal

register = template.Library()

@register.filter
def calc_promotion_price(price, promotion):
    """Calcule le prix après promotion"""
    try:
        price = float(price)
        if not promotion or not hasattr(promotion, 'type_promotion'):
            return price
            
        if promotion.type_promotion == 'pourcentage':
            reduction = price * (float(promotion.valeur) / 100)
            return price - reduction
        elif promotion.type_promotion == 'montant_fixe':
            return max(0, price - float(promotion.valeur))
        elif promotion.type_promotion in ['2_pour_1', 'gratuit']:
            return 0
        
        return price
    except (ValueError, TypeError, AttributeError):
        return None