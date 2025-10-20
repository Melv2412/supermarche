from rest_framework import serializers
from .models import Employee, Schedule, LeaveRequest, PerformanceReview


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer pour les employés"""
    nom_complet = serializers.CharField(read_only=True)
    poste_display = serializers.CharField(source='get_poste_display', read_only=True)
    
    class Meta:
        model = Employee
        fields = '__all__'


class EmployeeListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des employés"""
    nom_complet = serializers.CharField(read_only=True)
    poste_display = serializers.CharField(source='get_poste_display', read_only=True)
    
    class Meta:
        model = Employee
        fields = ['id_employe', 'nom', 'prenom', 'nom_complet', 'email', 'telephone', 'poste', 'poste_display', 'actif']


class ScheduleSerializer(serializers.ModelSerializer):
    """Serializer pour les plannings"""
    employe_nom = serializers.CharField(source='id_employe.nom_complet', read_only=True)
    jour_display = serializers.CharField(source='get_jour_display', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    
    class Meta:
        model = Schedule
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes de congés"""
    employe_nom = serializers.CharField(source='id_employe.nom_complet', read_only=True)
    poste = serializers.CharField(source='id_employe.poste', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['date_demande', 'date_validation']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    """Serializer pour les évaluations de performance"""
    employe_nom = serializers.CharField(source='id_employe.nom_complet', read_only=True)
    poste = serializers.CharField(source='id_employe.poste', read_only=True)
    
    # Créer un champ pour les compétences
    competences = serializers.SerializerMethodField()
    
    class Meta:
        model = PerformanceReview
        fields = '__all__'
    
    def get_competences(self, obj):
        """Retourne les scores de compétences sous forme de dictionnaire"""
        return {
            'ponctualite': obj.score_ponctualite,
            'qualite_travail': obj.score_qualite_travail,
            'relationnel': obj.score_relationnel,
            'autonomie': obj.score_autonomie,
        }
