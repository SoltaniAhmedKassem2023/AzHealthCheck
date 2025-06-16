import pika
import json
import random
import time
from datetime import datetime

# Connect to RabbitMQ
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='vitals')

def generate_vital_data(user_id):
    return {
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "heart_rate": random.randint(60, 100),
        "blood_pressure": f"{random.randint(110, 130)}/{random.randint(70, 90)}",
        "temperature": round(random.uniform(36.0, 38.5), 1),
        "oxygen_saturation": random.randint(95, 100)
    }

user_ids = list(range(1, 11))  # 10 users

print("Sending simulated vitals to RabbitMQ queue 'vitals'...")

try:
    while True:
        for user_id in user_ids:
            data = generate_vital_data(user_id)
            channel.basic_publish(
                exchange='',
                routing_key='vitals',
                body=json.dumps(data)
            )
            print(f"Sent: {data}")
        time.sleep(5)  # every 5 seconds for each batch
except KeyboardInterrupt:
    print("Stopped simulator.")
    connection.close()
