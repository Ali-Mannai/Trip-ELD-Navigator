from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('calculate-route/', views.calculate_route, name='calculate_route'),
    path('route/', views.route, name='route'),
    path('logs/', views.logs, name='logs'),
]
