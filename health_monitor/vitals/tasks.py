import json
from celery import shared_task
from .models import VitalSign
from django.contrib.auth.models import User
from django.utils.dateparse import parse_datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def check_vital_abnormalities(user, vital_data):
    """
    Check if vital signs are abnormal and return alerts
    """
    alerts = []
    
    # Normal ranges (you can adjust these based on medical standards)
    NORMAL_RANGES = {
        'heart_rate': {'min': 60, 'max': 100, 'unit': 'BPM'},
        'temperature': {'min': 36.1, 'max': 37.2, 'unit': '°C'},
        'oxygen_saturation': {'min': 95, 'max': 100, 'unit': '%'},
    }
    
    # Check heart rate
    heart_rate = vital_data['heart_rate']
    if heart_rate < NORMAL_RANGES['heart_rate']['min']:
        alerts.append({
            'type': 'BRADYCARDIA',
            'severity': 'HIGH' if heart_rate < 50 else 'MEDIUM',
            'message': f"Low heart rate: {heart_rate} BPM (Normal: {NORMAL_RANGES['heart_rate']['min']}-{NORMAL_RANGES['heart_rate']['max']})",
            'vital_type': 'heart_rate',
            'value': heart_rate,
            'normal_range': f"{NORMAL_RANGES['heart_rate']['min']}-{NORMAL_RANGES['heart_rate']['max']} {NORMAL_RANGES['heart_rate']['unit']}"
        })
    elif heart_rate > NORMAL_RANGES['heart_rate']['max']:
        alerts.append({
            'type': 'TACHYCARDIA',
            'severity': 'HIGH' if heart_rate > 120 else 'MEDIUM',
            'message': f"High heart rate: {heart_rate} BPM (Normal: {NORMAL_RANGES['heart_rate']['min']}-{NORMAL_RANGES['heart_rate']['max']})",
            'vital_type': 'heart_rate',
            'value': heart_rate,
            'normal_range': f"{NORMAL_RANGES['heart_rate']['min']}-{NORMAL_RANGES['heart_rate']['max']} {NORMAL_RANGES['heart_rate']['unit']}"
        })
    
    # Check temperature
    temperature = vital_data['temperature']
    if temperature < NORMAL_RANGES['temperature']['min']:
        alerts.append({
            'type': 'HYPOTHERMIA',
            'severity': 'HIGH' if temperature < 35.0 else 'MEDIUM',
            'message': f"Low temperature: {temperature}°C (Normal: {NORMAL_RANGES['temperature']['min']}-{NORMAL_RANGES['temperature']['max']})",
            'vital_type': 'temperature',
            'value': temperature,
            'normal_range': f"{NORMAL_RANGES['temperature']['min']}-{NORMAL_RANGES['temperature']['max']} {NORMAL_RANGES['temperature']['unit']}"
        })
    elif temperature > NORMAL_RANGES['temperature']['max']:
        alerts.append({
            'type': 'HYPERTHERMIA',
            'severity': 'HIGH' if temperature > 38.5 else 'MEDIUM',
            'message': f"High temperature: {temperature}°C (Normal: {NORMAL_RANGES['temperature']['min']}-{NORMAL_RANGES['temperature']['max']})",
            'vital_type': 'temperature',
            'value': temperature,
            'normal_range': f"{NORMAL_RANGES['temperature']['min']}-{NORMAL_RANGES['temperature']['max']} {NORMAL_RANGES['temperature']['unit']}"
        })
    
    # Check oxygen saturation
    oxygen_sat = vital_data['oxygen_saturation']
    if oxygen_sat < NORMAL_RANGES['oxygen_saturation']['min']:
        alerts.append({
            'type': 'HYPOXEMIA',
            'severity': 'CRITICAL' if oxygen_sat < 90 else 'HIGH',
            'message': f"Low oxygen saturation: {oxygen_sat}% (Normal: {NORMAL_RANGES['oxygen_saturation']['min']}-{NORMAL_RANGES['oxygen_saturation']['max']})",
            'vital_type': 'oxygen_saturation',
            'value': oxygen_sat,
            'normal_range': f"{NORMAL_RANGES['oxygen_saturation']['min']}-{NORMAL_RANGES['oxygen_saturation']['max']} {NORMAL_RANGES['oxygen_saturation']['unit']}"
        })
    
    # Check blood pressure (basic parsing - you might want to improve this)
    try:
        bp_parts = vital_data['blood_pressure'].split('/')
        if len(bp_parts) == 2:
            systolic = int(bp_parts[0])
            diastolic = int(bp_parts[1])
            
            # Normal BP: 90-120 systolic, 60-80 diastolic
            if systolic < 90 or diastolic < 60:
                alerts.append({
                    'type': 'HYPOTENSION',
                    'severity': 'HIGH' if systolic < 80 or diastolic < 50 else 'MEDIUM',
                    'message': f"Low blood pressure: {vital_data['blood_pressure']} (Normal: 90-120/60-80)",
                    'vital_type': 'blood_pressure',
                    'value': vital_data['blood_pressure'],
                    'normal_range': '90-120/60-80 mmHg'
                })
            elif systolic > 140 or diastolic > 90:
                alerts.append({
                    'type': 'HYPERTENSION',
                    'severity': 'CRITICAL' if systolic > 180 or diastolic > 120 else 'HIGH',
                    'message': f"High blood pressure: {vital_data['blood_pressure']} (Normal: 90-120/60-80)",
                    'vital_type': 'blood_pressure',
                    'value': vital_data['blood_pressure'],
                    'normal_range': '90-120/60-80 mmHg'
                })
    except (ValueError, IndexError):
        pass  # Invalid blood pressure format
    
    return alerts

@shared_task
def process_vital_data(message):
    data = json.loads(message)
    try:
        user = User.objects.get(id=data['user_id'])
        
        # Create vital sign record
        vital_sign = VitalSign.objects.create(
            user=user,
            timestamp=parse_datetime(data['timestamp']),
            heart_rate=data['heart_rate'],
            blood_pressure=data['blood_pressure'],
            temperature=data['temperature'],
            oxygen_saturation=data['oxygen_saturation']
        )
        
        print(f"✅ Saved vitals for user {user.username}")
        
        # Check for abnormalities
        alerts = check_vital_abnormalities(user, data)
        
        if alerts:
            # Send notifications via Django Channels
            channel_layer = get_channel_layer()
            
            for alert in alerts:
                notification_data = {
                    'type': 'vital_alert',
                    'user_id': user.id,
                    'username': user.username,
                    'vital_sign_id': vital_sign.id,
                    'timestamp': data['timestamp'],
                    'alert': alert
                }
                
                print(f"🚨 ALERT for {user.username}: {alert['message']}")
                
                # Send to user's personal group
                async_to_sync(channel_layer.group_send)(
                    f"user_{user.id}",
                    {
                        'type': 'send_notification',
                        'data': notification_data
                    }
                )
                
                # Send to staff group (all staff members)
                async_to_sync(channel_layer.group_send)(
                    "staff_notifications",
                    {
                        'type': 'send_notification',
                        'data': notification_data
                    }
                )
        
    except User.DoesNotExist:
        print(f"❌ User with id {data['user_id']} not found.")
    except Exception as e:
        print(f"❌ Error processing vital data: {str(e)}")
