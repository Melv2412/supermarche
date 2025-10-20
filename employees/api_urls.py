from django.urls import path
from . import api_views

urlpatterns = [
    # Employees
    path('employees/', api_views.employee_list, name='api_employee_list'),
    path('employees/<int:pk>/', api_views.employee_detail, name='api_employee_detail'),
    
    # Schedules
    path('schedules/', api_views.schedule_list, name='api_schedule_list'),
    
    # Leave Requests
    path('leaves/', api_views.leave_request_list, name='api_leave_request_list'),
    path('leaves/<int:pk>/', api_views.leave_request_detail, name='api_leave_request_detail'),
    path('leaves/<int:pk>/approve/', api_views.leave_request_approve, name='api_leave_request_approve'),
    path('leaves/<int:pk>/reject/', api_views.leave_request_reject, name='api_leave_request_reject'),
    
    # Performance Reviews
    path('performance/', api_views.performance_review_list, name='api_performance_review_list'),
    path('performance/<int:pk>/', api_views.performance_review_detail, name='api_performance_review_detail'),
    
    # Dashboard
    path('rh/dashboard/', api_views.rh_dashboard, name='api_rh_dashboard'),
]
