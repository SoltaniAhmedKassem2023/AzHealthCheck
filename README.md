# AzHealthCheck

A real-time dashboard application that monitors patients' vital signs from IoT devices, including temperature, heart rate, oxygen saturation, and blood pressure. The system sends alerts to doctors if any vital signs deviate from safe thresholds, enabling timely medical intervention.

## Features

- **Real-time monitoring:** Continuously receive and display patient vital signs.
- **Multiple vital signs tracked:** Temperature, heart rate, oxygen saturation (SpO2), and blood pressure.
- **Alerts & Notifications:** Automatic alerts sent to doctors when any vital sign exceeds predefined safe limits.
- **User-friendly interface:** Clear visualization of current and historical patient data.
- **Patient management:** Support for monitoring multiple patients simultaneously.

## Technologies Used

- Frontend: [React / Next.js] 
- Backend: [Django / Celery] 
- Database: [SQLite / ] 
- Real-time Alerting: Django Channels  / REST APIs
- IoT integration: Data ingestion from IoT devices via RabbitMQ

