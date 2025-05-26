from django.apps import AppConfig


class MedpharmaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pulmoscan'
# medpharma/apps.py
    def ready(self):
        import pulmoscan.signals
