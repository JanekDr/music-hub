from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import CustomUser
from .models import Queue


@receiver(post_save, sender=CustomUser)
def create_user_queue(sender, instance, created, **kwargs):
    if created:
        Queue.objects.create(user=instance)
