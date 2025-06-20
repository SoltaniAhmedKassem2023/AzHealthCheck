#!/bin/bash

PROJECT_DIR="/home/co2/Desktop/AzHealthCheck/health_monitor"
VENV_DIR="$PROJECT_DIR/../venv"

echo "📦 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

echo "🚀 Starting Django server..."
gnome-terminal -- bash -c "cd $PROJECT_DIR && source $VENV_DIR/bin/activate && uvicorn health_monitor.asgi:application --host 0.0.0.0 --port 8000; exec bash"

echo "⚙️  Starting Celery worker..."
gnome-terminal -- bash -c "cd $PROJECT_DIR && source $VENV_DIR/bin/activate && celery -A health_monitor worker --loglevel=info; exec bash"

echo "📡 Starting RabbitMQ consumer..."
gnome-terminal -- bash -c "cd $PROJECT_DIR && source $VENV_DIR/bin/activate && python consumer.py; exec bash"

echo "📲 Starting IoT simulator..."
gnome-terminal -- bash -c "cd $PROJECT_DIR && cd ../iot_simulator && source $VENV_DIR/bin/activate && python main.py; exec bash"

echo "✅ All services launched. Check opened terminals!"
