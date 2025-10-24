from django.contrib.auth.decorators import user_passes_test
from functools import wraps
from django.core.exceptions import PermissionDenied

def is_admin_or_hr(user):
    """Vérifie si l'utilisateur est admin ou RH"""
    if user.is_authenticated:
        return user.is_superuser or hasattr(user, 'employee') and user.employee.poste == 'rh'
    return False

def admin_or_hr_required(view_func):
    """Décorateur qui vérifie si l'utilisateur est admin ou RH"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not is_admin_or_hr(request.user):
            raise PermissionDenied("Accès réservé aux administrateurs et RH")
        return view_func(request, *args, **kwargs)
    return _wrapped_view