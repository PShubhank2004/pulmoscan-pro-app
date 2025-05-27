# backend/pulmoscan/management/commands/create_initial_users.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from pulmoscan.models import UserProfile # <-- IMPORTANT: Import your UserProfile model
import os

class Command(BaseCommand):
    help = 'Creates default superuser, doctor, and pharmacist users with assigned roles, or updates them if they exist.'

    def handle(self, *args, **options):
        User = get_user_model()

        # --- Admin User ---
        admin_username = os.environ.get('RENDER_ADMIN_USERNAME', 'adminuser')
        admin_password = os.environ.get('RENDER_ADMIN_PASSWORD', 'adminpass')
        admin_email = os.environ.get('RENDER_ADMIN_EMAIL', 'admin@example.com')

        # Get or create the Admin User
        admin_user, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                'email': admin_email,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password(admin_password) # Set password if new user
            admin_user.save() # Save changes
            self.stdout.write(self.style.SUCCESS(f'Successfully created Admin superuser: {admin_username}'))
        else:
            # If user exists, ensure they are superuser and staff
            if not admin_user.is_superuser or not admin_user.is_staff:
                admin_user.is_superuser = True
                admin_user.is_staff = True
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f'Updated existing Admin user: {admin_username} to superuser status.'))
            else:
                self.stdout.write(self.style.WARNING(f'Admin user {admin_username} already exists and is a superuser.'))

        # Ensure UserProfile exists and has the correct role for Admin
        # Use update_or_create for OneToOne fields to avoid IntegrityError
        profile, profile_created = UserProfile.objects.update_or_create(
            user=admin_user,
            defaults={'role': 'admin'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created UserProfile for {admin_username} with admin role.'))
        else:
            self.stdout.write(self.style.WARNING(f'UserProfile for {admin_username} already exists. Ensuring admin role.'))


        # --- Doctor User ---
        doctor_username = os.environ.get('RENDER_DOCTOR_USERNAME', 'doctoruser')
        doctor_password = os.environ.get('RENDER_DOCTOR_PASSWORD', 'doctorpass')
        doctor_email = os.environ.get('RENDER_DOCTOR_EMAIL', 'doctor@example.com')

        doctor_user, created = User.objects.get_or_create(
            username=doctor_username,
            defaults={'email': doctor_email}
        )
        if created:
            doctor_user.set_password(doctor_password)
            doctor_user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully created Doctor user: {doctor_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Doctor user {doctor_username} already exists.'))

        profile, profile_created = UserProfile.objects.update_or_create(
            user=doctor_user,
            defaults={'role': 'doctor'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created UserProfile for {doctor_username} with doctor role.'))
        else:
            self.stdout.write(self.style.WARNING(f'UserProfile for {doctor_username} already exists. Ensuring doctor role.'))


        # --- Pharmacist User ---
        pharmacist_username = os.environ.get('RENDER_PHARMACIST_USERNAME', 'pharmacistuser')
        pharmacist_password = os.environ.get('RENDER_PHARMACIST_PASSWORD', 'pharmacistpass')
        pharmacist_email = os.environ.get('RENDER_PHARMACIST_EMAIL', 'pharmacist@example.com')

        pharmacist_user, created = User.objects.get_or_create(
            username=pharmacist_username,
            defaults={'email': pharmacist_email}
        )
        if created:
            pharmacist_user.set_password(pharmacist_password)
            pharmacist_user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully created Pharmacist user: {pharmacist_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Pharmacist user {pharmacist_username} already exists.'))

        profile, profile_created = UserProfile.objects.update_or_create(
            user=pharmacist_user,
            defaults={'role': 'pharmacist'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created UserProfile for {pharmacist_username} with pharmacist role.'))
        else:
            self.stdout.write(self.style.WARNING(f'UserProfile for {pharmacist_username} already exists. Ensuring pharmacist role.'))