from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Employee, Schedule, LeaveRequest, PerformanceReview
from .serializers import (
    EmployeeSerializer, EmployeeListSerializer,
    ScheduleSerializer, LeaveRequestSerializer, PerformanceReviewSerializer
)


# ========== EMPLOYEES ==========

@api_view(['GET', 'POST'])
def employee_list(request):
    """Liste tous les employés ou crée un nouveau"""
    if request.method == 'GET':
        employees = Employee.objects.filter(actif=True)
        
        # Filtres
        poste = request.query_params.get('poste', None)
        search = request.query_params.get('search', None)
        
        if poste:
            employees = employees.filter(poste=poste)
        if search:
            employees = employees.filter(nom__icontains=search) | employees.filter(email__icontains=search)
        
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def employee_detail(request, pk):
    """Récupère, modifie ou supprime un employé"""
    employee = get_object_or_404(Employee, pk=pk)
    
    if request.method == 'GET':
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        employee.actif = False
        employee.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========== SCHEDULES ==========

@api_view(['GET', 'POST'])
def schedule_list(request):
    """Liste les plannings ou crée un nouveau"""
    if request.method == 'GET':
        schedules = Schedule.objects.filter(actif=True).select_related('id_employe')
        
        # Filtres
        semaine = request.query_params.get('semaine', None)
        annee = request.query_params.get('annee', None)
        employee_id = request.query_params.get('employee', None)
        
        if semaine:
            schedules = schedules.filter(semaine=semaine)
        if annee:
            schedules = schedules.filter(annee=annee)
        if employee_id:
            schedules = schedules.filter(id_employe=employee_id)
        
        serializer = ScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== LEAVE REQUESTS ==========

@api_view(['GET', 'POST'])
def leave_request_list(request):
    """Liste les demandes de congés ou crée une nouvelle"""
    if request.method == 'GET':
        leaves = LeaveRequest.objects.select_related('id_employe')
        
        # Filtres
        statut = request.query_params.get('statut', None)
        employee_id = request.query_params.get('employee', None)
        
        if statut:
            leaves = leaves.filter(statut=statut)
        if employee_id:
            leaves = leaves.filter(id_employe=employee_id)
        
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = LeaveRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def leave_request_detail(request, pk):
    """Récupère ou modifie une demande de congé"""
    leave = get_object_or_404(LeaveRequest, pk=pk)
    
    if request.method == 'GET':
        serializer = LeaveRequestSerializer(leave)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = LeaveRequestSerializer(leave, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def leave_request_approve(request, pk):
    """Approuve une demande de congé"""
    leave = get_object_or_404(LeaveRequest, pk=pk)
    
    if leave.statut != 'pending':
        return Response({'error': 'Cette demande a déjà été traitée'}, status=status.HTTP_400_BAD_REQUEST)
    
    leave.statut = 'approved'
    leave.valideur = request.data.get('valideur', 'Manager')
    leave.date_validation = timezone.now()
    leave.commentaire = request.data.get('commentaire', 'Approuvé')
    leave.save()
    
    serializer = LeaveRequestSerializer(leave)
    return Response(serializer.data)


@api_view(['POST'])
def leave_request_reject(request, pk):
    """Refuse une demande de congé"""
    leave = get_object_or_404(LeaveRequest, pk=pk)
    
    if leave.statut != 'pending':
        return Response({'error': 'Cette demande a déjà été traitée'}, status=status.HTTP_400_BAD_REQUEST)
    
    leave.statut = 'rejected'
    leave.valideur = request.data.get('valideur', 'Manager')
    leave.date_validation = timezone.now()
    leave.commentaire = request.data.get('commentaire', 'Refusé')
    leave.save()
    
    serializer = LeaveRequestSerializer(leave)
    return Response(serializer.data)


# ========== PERFORMANCE REVIEWS ==========

@api_view(['GET', 'POST'])
def performance_review_list(request):
    """Liste les évaluations ou crée une nouvelle"""
    if request.method == 'GET':
        reviews = PerformanceReview.objects.select_related('id_employe')
        
        # Filtres
        periode = request.query_params.get('periode', None)
        employee_id = request.query_params.get('employee', None)
        
        if periode:
            reviews = reviews.filter(periode=periode)
        if employee_id:
            reviews = reviews.filter(id_employe=employee_id)
        
        serializer = PerformanceReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PerformanceReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def performance_review_detail(request, pk):
    """Récupère ou modifie une évaluation"""
    review = get_object_or_404(PerformanceReview, pk=pk)
    
    if request.method == 'GET':
        serializer = PerformanceReviewSerializer(review)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PerformanceReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== DASHBOARD RH ==========

@api_view(['GET'])
def rh_dashboard(request):
    """Retourne les statistiques RH pour le dashboard"""
    total_employees = Employee.objects.filter(actif=True).count()
    active_employees = Employee.objects.filter(actif=True).count()
    
    # Employés en congé actuellement
    from datetime import date
    today = date.today()
    on_leave = LeaveRequest.objects.filter(
        statut='approved',
        date_debut__lte=today,
        date_fin__gte=today
    ).count()
    
    # Nouveaux ce mois
    from datetime import datetime
    current_month = datetime.now().month
    current_year = datetime.now().year
    new_this_month = Employee.objects.filter(
        date_embauche__month=current_month,
        date_embauche__year=current_year
    ).count()
    
    # Demandes de congés en attente
    pending_leaves = LeaveRequest.objects.filter(statut='pending').count()
    
    return Response({
        'total_employees': total_employees,
        'active_employees': active_employees,
        'on_leave': on_leave,
        'new_this_month': new_this_month,
        'pending_leaves': pending_leaves
    })
