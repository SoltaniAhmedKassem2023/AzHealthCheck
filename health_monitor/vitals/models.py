from django.db import models
from django.contrib.auth.models import User

class VitalSign(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField()
    heart_rate = models.IntegerField()
    blood_pressure = models.CharField(max_length=10)
    temperature = models.FloatField()
    oxygen_saturation = models.IntegerField()

    def __str__(self):
        return f'Vitals for {self.user.username} at {self.timestamp}'
