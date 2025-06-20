from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('monitoring.urls')),
    path('vitals/', include('vitals.urls')),
]
