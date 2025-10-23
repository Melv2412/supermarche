from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Employee
from security.models import User
from django import forms

class EmployeeAdminForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(), required=False)
    
    class Meta:
        model = Employee
        fields = '__all__'

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    form = EmployeeAdminForm
    list_display = ('nom', 'prenom', 'email', 'poste', 'date_embauche', 'actif')
    list_filter = ('poste', 'actif')
    search_fields = ('nom', 'prenom', 'email')
    ordering = ('nom', 'prenom')
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        
        # Si un mot de passe est fourni, créer ou mettre à jour l'utilisateur
        password = form.cleaned_data.get('password')
        if password:
            user, created = User.objects.get_or_create(
                email=obj.email,
                defaults={'role': obj.poste}
            )
            user.set_password(password)
            user.save()
