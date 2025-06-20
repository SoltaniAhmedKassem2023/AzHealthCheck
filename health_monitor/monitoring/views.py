from rest_framework import generics, permissions,views
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from rest_framework.response import  Response
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

import requests
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework.decorators import api_view


class UsersListView(views.APIView):
    
    permission_classes = [permissions.IsAuthenticated] 
    def get(self, request):
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)



@api_view(['GET'])
def system_stats(request):
    from monitoring.models import VitalMessage 
    User = get_user_model()
    user_count = User.objects.count()
    
    message_count= VitalMessage.objects.count()
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    last_hour_messages = VitalMessage.objects.filter(timestamp__gte=one_hour_ago).count()

    return JsonResponse({
        'users': user_count,
        'queue_messages': message_count,
        'messages_last_hour': last_hour_messages,
    })
