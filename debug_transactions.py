import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'supermarche.settings')
django.setup()

from sales.models import Transaction

rows = []
for t in Transaction.objects.order_by('-date_transaction')[:20]:
    rows.append({
        'id': t.id_transaction,
        'ticket': t.numero_ticket,
        'montant_total': float(t.montant_total) if t.montant_total is not None else None,
        'statut': t.statut,
        'date': t.date_transaction.isoformat() if t.date_transaction else None,
        'client_email': t.id_client.email if t.id_client else None
    })

print(json.dumps(rows, ensure_ascii=False, indent=2))
