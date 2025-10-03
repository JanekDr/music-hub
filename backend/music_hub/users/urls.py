from .views import RegisterView, user_profile, logout_view
from django.urls import path

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', user_profile, name='profile'),
    path('logout/', logout_view, name='logout'),
]