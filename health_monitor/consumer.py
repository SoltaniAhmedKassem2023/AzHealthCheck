
import pika
import json
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_monitor.settings')
django.setup()

from vitals.tasks import process_vital_data

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='vitals')

def callback(ch, method, properties, body):
    print("📥 Received vital data")
    process_vital_data.delay(body.decode())

channel.basic_consume(queue='vitals', on_message_callback=callback, auto_ack=True)

print('🔁 Waiting for vitals... Ctrl+C to stop')
channel.start_consuming()
