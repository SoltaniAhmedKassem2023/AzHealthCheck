import json
from celery import shared_task
from .models import VitalSign
from django.contrib.auth.models import User
from django.utils.dateparse import parse_datetime

@shared_task
def process_vital_data(message):
    data = json.loads(message)

    try:
        user = User.objects.get(id=data['user_id'])
        VitalSign.objects.create(
            user=user,
            timestamp=parse_datetime(data['timestamp']),
            heart_rate=data['heart_rate'],
            blood_pressure=data['blood_pressure'],
            temperature=data['temperature'],
            oxygen_saturation=data['oxygen_saturation']
        )
        print(f"✅ Saved vitals for user {user.username}")
    except User.DoesNotExist:
        print(f"❌ User with id {data['user_id']} not found.")
