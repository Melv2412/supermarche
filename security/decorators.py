from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages

def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not hasattr(request.user, 'role') or request.user.role not in roles:
                messages.error(request, "Vous n'avez pas les permissions nécessaires pour accéder à cette page.")
                return redirect('login')
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator