from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import Vitals

urlpatterns = [

    path('get-vitals/', Vitals.as_view(), name='get-vitals'),
]
