

# C:\Users\91789\OneDrive\Desktop\MEDIPHARM360\medpharma360\medpharma\views.py

from datetime import date, timedelta
from rest_framework import viewsets, status, generics, serializers # Added 'serializers' for ValidationError
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated # Removed AllowAny as it's not generally used in class-based permission_classes directly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from pulmoscan.utils import run_ai_on_scan

# Import all models from your app
from .models import Medicine, InventoryTransaction, ScanReport, UserProfile, CustomUser
# Import all serializers from your app
from .serializers import (
    MedicineSerializer,
    InventoryTransactionSerializer,
    ScanReportSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer
)
# Import your custom permissions
from .permissions import IsDoctor, IsPharmacist, IsAdminUserCustom


# --- JWT Token View ---
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view to obtain access and refresh tokens,
    including custom claims like 'role' and 'is_staff'.
    """
    serializer_class = CustomTokenObtainPairSerializer


# --- Logout View ---
class LogoutView(APIView):
    """
    API view for user logout (blacklisting refresh token).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Missing refresh token"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            print(f"Error blacklisting token: {e}")
            return Response({"detail": "Invalid token or server error."}, status=status.HTTP_400_BAD_REQUEST)


# --- Medicine API ---
class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsPharmacist | IsAdminUserCustom] # Only pharmacists and admins can manage medicines

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated]) # Any authenticated user can view alerts
    def alerts(self, request):
        low_stock = Medicine.objects.filter(quantity__lt=10)
        expired = Medicine.objects.filter(expiry_date__lt=date.today())
        return Response({
            'low_stock': MedicineSerializer(low_stock, many=True).data,
            'expired': MedicineSerializer(expired, many=True).data
        })


# --- Inventory Transaction API ---
class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated, IsPharmacist | IsAdminUserCustom] # Only pharmacists and admins can manage transactions

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user) # Save with the current user. Remove the second instance.save() below.
        medicine = instance.medicine
        if instance.transaction_type == 'purchase':
            medicine.quantity += instance.quantity
        else:  # sale
            if medicine.quantity < instance.quantity:
                raise serializers.ValidationError("Not enough stock for this sale.")
            medicine.quantity -= instance.quantity
        medicine.save()


# --- Scan Report API ---
class ScanReportViewSet(viewsets.ModelViewSet):
    queryset = ScanReport.objects.all()
    serializer_class = ScanReportSerializer
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated, IsDoctor | IsAdminUserCustom] # Only doctors and admins can manage scan reports

    
    def perform_create(self, serializer):
        # Step 1: Save the initial instance. This ensures the image is saved
        # and the 'instance' object has an ID and a path to the image.
        instance = serializer.save(user=self.request.user)

        try:
            # Step 2: Run AI analysis using the path of the saved image
            prediction = run_ai_on_scan(instance.scan_image.path)

            # Step 3: Update the instance's diagnosis and confidence attributes
            instance.diagnosis = prediction["diagnosis"]
            instance.confidence = prediction["confidence"]

        except Exception as e:
            # Step 4 (Error Handling): If AI fails, set default/error values
            instance.diagnosis = "Analysis Failed (Error: AI model unavailable/failed)"
            instance.confidence = 0.0 # Set a default numerical value, not None
            print(f"Error running AI on scan for {instance.patient_name}: {e}")

        # Step 5: IMPORTANT! Save the instance AGAIN to persist the updated
        # diagnosis and confidence values to the database.
        instance.save()
    def get_queryset(self):
        queryset = super().get_queryset()
        patient_name = self.request.query_params.get('patient_name', None) # patient_name will be an empty string ''

        if patient_name: # This condition `if ''` evaluates to False
            queryset = queryset.filter(patient_name__icontains=patient_name)
        return queryset # Returns the original, unfiltered queryset

# --- User Profile API (Read-only) ---
class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated] # Basic authentication needed to view profiles

    def get_queryset(self):
        # Admins can see all profiles, non-admins can only see their own
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Ensure user can only view their own profile unless they are an admin
        if request.user == instance.user or request.user.is_staff:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({"detail": "You do not have permission to access this profile."},
                        status=status.HTTP_403_FORBIDDEN)


# --- Dashboard Summary APIs ---
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPharmacist | IsAdminUserCustom]) # Only Pharmacists and Admins
def stock_summary(request):
    today = date.today()
    near_expiry_date = today + timedelta(days=30)

    total_medicines = Medicine.objects.count()
    low_stock_medicines = Medicine.objects.filter(quantity__lte=10)
    expired_medicines = Medicine.objects.filter(expiry_date__lt=today)
    expiring_soon_medicines = Medicine.objects.filter(expiry_date__gte=today, expiry_date__lte=near_expiry_date)

    return Response({
        "total_medicines": total_medicines,
        "low_stock_count": low_stock_medicines.count(),
        "expired_count": expired_medicines.count(),
        "expiring_soon_count": expiring_soon_medicines.count(),
        "low_stock_medicines": MedicineSerializer(low_stock_medicines, many=True).data,
        "expiring_soon_medicines": MedicineSerializer(expiring_soon_medicines, many=True).data,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor | IsAdminUserCustom]) # Only Doctors and Admins
def doctor_dashboard_summary(request):
    # If you want to filter scans by the doctor who uploaded them, use:
    # total_scans = ScanReport.objects.filter(user=request.user).count()
    # pneumonia_count = ScanReport.objects.filter(user=request.user, diagnosis='Pneumonia').count()
    # normal_count = ScanReport.objects.filter(user=request.user, diagnosis='Normal').count()
    # recent_scans = ScanReport.objects.filter(user=request.user).order_by('-date_uploaded')[:5]

    total_scans = ScanReport.objects.count()
    pneumonia_count = ScanReport.objects.filter(diagnosis='Pneumonia').count()
    normal_count = ScanReport.objects.filter(diagnosis='Normal').count()

    recent_scans = ScanReport.objects.order_by('-date_uploaded')[:5]

    return Response({
        "total_scans": total_scans,
        "pneumonia_cases": pneumonia_count,
        "normal_cases": normal_count,
        "recent_scans": ScanReportSerializer(recent_scans, many=True).data,
    })