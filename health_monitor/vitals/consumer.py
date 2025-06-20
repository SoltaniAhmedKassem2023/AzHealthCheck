import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User

class VitalNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from scope (requires authentication middleware)
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Join user's personal notification group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # If user is staff, also join staff notifications group
        if self.user.is_staff:
            self.staff_group_name = "staff_notifications"
            await self.channel_layer.group_add(
                self.staff_group_name,
                self.channel_name
            )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to vital notifications for {self.user.username}',
            'user_id': self.user.id,
            'is_staff': self.user.is_staff
        }))

    async def disconnect(self, close_code):
        # Leave user group
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        # Leave staff group if applicable
        if hasattr(self, 'staff_group_name'):
            await self.channel_layer.group_discard(
                self.staff_group_name,
                self.channel_name
            )

    # Receive message from WebSocket (from frontend)
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'mark_notification_read':
                # Handle marking notifications as read
                notification_id = text_data_json.get('notification_id')
                # You can add logic here to mark notifications as read in database
                await self.send(text_data=json.dumps({
                    'type': 'notification_marked_read',
                    'notification_id': notification_id
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # Receive message from room group
    async def send_notification(self, event):
        data = event['data']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'vital_notification',
            'data': data
        }))
