# backend/pulmoscan/management/commands/create_initial_users.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from pulmoscan.models import UserProfile # <-- IMPORTANT: Import your UserProfile model
import os

class Command(BaseCommand):
    help = 'Creates a default superuser for initial deployment setup.'

    def handle(self, *args, **options):
        User = get_user_model()

        # --- Admin User ---
        admin_username = os.environ.get('RENDER_ADMIN_USERNAME', 'adminuser')
        admin_password = os.environ.get('RENDER_ADMIN_PASSWORD', 'adminpass')
        admin_email = os.environ.get('RENDER_ADMIN_EMAIL', 'admin@example.com')

        if not User.objects.filter(username=admin_username).exists():
            admin_user = User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password
            )
            # Create UserProfile for Admin and set role
            UserProfile.objects.create(user=admin_user, role='admin') 
            self.stdout.write(self.style.SUCCESS(f'Successfully created Admin superuser: {admin_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user {admin_username} already exists.'))
            admin_user = User.objects.get(username=admin_username)
            # Ensure UserProfile exists and has correct role if user already present
            if not hasattr(admin_user, 'profile') or admin_user.profile.role != 'admin':
                UserProfile.objects.update_or_create(user=admin_user, defaults={'role': 'admin'})
                self.stdout.write(self.style.SUCCESS(f'Updated UserProfile for {admin_username} to admin role.'))

        self.stdout.write(self.style.WARNING('Remember to create Doctor and Pharmacist users via the Django Admin panel after logging in as Admin.'))