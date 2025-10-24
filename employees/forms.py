from django import forms
from .models import Employee
from datetime import datetime, time

class PlanningForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['horaire_debut', 'horaire_fin', 'pause_debut', 'pause_fin', 'statut']
        widgets = {
            'horaire_debut': forms.TimeInput(attrs={'type': 'time'}),
            'horaire_fin': forms.TimeInput(attrs={'type': 'time'}),
            'pause_debut': forms.TimeInput(attrs={'type': 'time'}),
            'pause_fin': forms.TimeInput(attrs={'type': 'time'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        horaire_debut = cleaned_data.get('horaire_debut')
        horaire_fin = cleaned_data.get('horaire_fin')
        pause_debut = cleaned_data.get('pause_debut')
        pause_fin = cleaned_data.get('pause_fin')

        if horaire_debut and horaire_fin:
            if horaire_debut >= horaire_fin:
                raise forms.ValidationError("L'heure de début doit être avant l'heure de fin")

        if pause_debut and pause_fin:
            if pause_debut >= pause_fin:
                raise forms.ValidationError("L'heure de début de pause doit être avant l'heure de fin de pause")
            
            if horaire_debut and horaire_fin:
                if pause_debut < horaire_debut or pause_fin > horaire_fin:
                    raise forms.ValidationError("La pause doit être comprise dans les horaires de travail")

        return cleaned_data