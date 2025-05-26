from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ViewSet APIs (medicines, inventory, etc.)
    path('api/', include('pulmoscan.main_api_urls')),

    # Authentication (token, refresh, logout)
    path('api/auth/', include('pulmoscan.urls.auth_urls')),

    # Dashboards (stock summary, doctor dashboard)
    path('api/dashboard/', include('pulmoscan.urls.dashboard_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
