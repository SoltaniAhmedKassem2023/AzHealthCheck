import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_monitor.settings')
django.setup()

# Now it's safe to import anything Django-related
import vitals.routing
from health_monitor.jwt_authmiddleware import JWTAuthMiddleware
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
      "websocket": JWTAuthMiddleware(
        URLRouter(vitals.routing.websocket_urlpatterns)
    ),
})

