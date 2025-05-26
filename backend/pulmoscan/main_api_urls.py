from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicineViewSet, InventoryTransactionViewSet,
    ScanReportViewSet, UserProfileViewSet
)

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'inventory-transactions', InventoryTransactionViewSet, basename='inventorytransaction')
router.register(r'scan-reports', ScanReportViewSet, basename='scanreport')
router.register(r'user-profiles', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    path('', include(router.urls)),
]
