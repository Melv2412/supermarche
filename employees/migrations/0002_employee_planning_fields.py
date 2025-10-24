from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='departement',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('caisse', 'Caisse'),
                    ('rayons', 'Rayons'),
                    ('logistique', 'Logistique'),
                    ('administration', 'Administration'),
                    ('securite', 'Sécurité'),
                ],
                default='caisse'
            ),
        ),
        migrations.AddField(
            model_name='employee',
            name='horaire_debut',
            field=models.TimeField(null=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='horaire_fin',
            field=models.TimeField(null=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='pause_debut',
            field=models.TimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='pause_fin',
            field=models.TimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='statut',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('present', 'Présent'),
                    ('absent', 'Absent'),
                    ('conge', 'En congé'),
                    ('malade', 'Malade'),
                ],
                default='present'
            ),
        ),
    ]