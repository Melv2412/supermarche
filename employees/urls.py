from django.urls import path
from django.views.generic import TemplateView

app_name = 'employees'

urlpatterns = [
    # Dashboard RH
    path('', TemplateView.as_view(template_name='employees/rh_dashboard.html'), name='rh_dashboard'),
    
    # URLs pour la gestion des employés
    path('list/', TemplateView.as_view(template_name='employees/employee_list.html'), name='employee_list'),
    path('create/', TemplateView.as_view(template_name='employees/employee_form.html'), name='employee_form'),
    path('detail/', TemplateView.as_view(template_name='employees/employee_detail.html'), name='employee_detail'),
    path('schedule/', TemplateView.as_view(template_name='employees/schedule_management.html'), name='schedule_management'),
    path('shifts/', TemplateView.as_view(template_name='employees/shift_planning.html'), name='shift_planning'),
    path('leaves/', TemplateView.as_view(template_name='employees/leave_requests.html'), name='leave_requests'),
    path('performance/', TemplateView.as_view(template_name='employees/performance_review.html'), name='performance_review'),
]
