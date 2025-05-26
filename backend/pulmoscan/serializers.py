from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Medicine, InventoryTransaction, ScanReport, UserProfile

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'

class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = '__all__'

class ScanReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanReport
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('user', 'role')

    
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from pulmoscan.models import CustomUser, UserProfile # Ensure UserProfile is correctly imported

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email # Add email as well for consistency if needed

        try:
            # THIS IS THE CRITICAL LINE, NOW REFERENCING UserProfile correctly
            token['role'] = user.profile.role
        except UserProfile.DoesNotExist: # Use UserProfile.DoesNotExist for the exception type
            token['role'] = 'N/A' # Or some default/fallback role like 'guest'

        # Also, check if is_staff is needed in the token for admin role logic
        token['is_staff'] = user.is_staff

        return token









