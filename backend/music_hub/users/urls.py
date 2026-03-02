from adrf.routers import DefaultRouter
from .views import RegisterView, user_profile, logout_view, UserModelViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r"", UserModelViewSet, basename="user")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", user_profile, name="profile"),
    path("logout/", logout_view, name="logout"),
    path("", include(router.urls)),
]
