from django.shortcuts import render
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from .models import VitalSign
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class Vitals(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
       
        user_id = request.query_params.get('user_id')
        
        try:
            if user_id:
                user_id = int(user_id)
                result = self._get_user_vitals(user_id)
            else:
                result = self._get_all_users_vitals()
                
            return Response(result, status=status.HTTP_200_OK)
            
        except PermissionDenied as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except ValueError:
            return Response({
                'error': 'Invalid user_id parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'An error occurred'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_all_users_vitals(self):

        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff members can access all users' vitals")
        
        user_ids_with_vitals = VitalSign.objects.values_list('user_id', flat=True).distinct()
        users_with_vitals = User.objects.filter(id__in=user_ids_with_vitals)
        
        result = {
            'type': 'all_users',
            'data': [],
            'count': 0
        }
        
        for user in users_with_vitals:
            user_vitals = VitalSign.objects.filter(user=user).order_by('-timestamp')
            result['data'].append({
                'user_id': user.id,
                'username': user.username,
                'vitals': [
                    {
                        'id': vital.id,
                        'timestamp': vital.timestamp,
                        'heart_rate': vital.heart_rate,
                        'blood_pressure': vital.blood_pressure,
                        'temperature': vital.temperature,
                        'oxygen_saturation': vital.oxygen_saturation
                    }
                    for vital in user_vitals
                ]
            })
            result['count'] += 1
        
        return result
    
    def _get_user_vitals(self, user_id):

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return {
                'type': 'single_user',
                'error': 'User not found',
                'data': None
            }

        if not self.request.user.is_staff and self.request.user.id != user_id:
            raise PermissionDenied("You can only access your own vitals")

        user_vitals = VitalSign.objects.filter(user=target_user).order_by('-timestamp')
        
        if not user_vitals.exists():
            return {
                'type': 'single_user',
                'user_id': user_id,
                'username': target_user.username,
                'data': None,
                'message': 'No vitals found for this user'
            }
        
        return {
            'type': 'single_user',
            'user_id': user_id,
            'username': target_user.username,
            'data': [
                {
                    'id': vital.id,
                    'timestamp': vital.timestamp,
                    'heart_rate': vital.heart_rate,
                    'blood_pressure': vital.blood_pressure,
                    'temperature': vital.temperature,
                    'oxygen_saturation': vital.oxygen_saturation
                }
                for vital in user_vitals
            ],
            'count': user_vitals.count()
        }