from rest_framework_simplejwt.views import  TokenRefreshView 
from django.urls import path
from pulmoscan.views import LogoutView  
from ..views import CustomTokenObtainPairView 


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
