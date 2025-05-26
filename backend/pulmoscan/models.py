from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class CustomUser(AbstractUser):
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='pulmoscan_customuser_groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_query_name='pulmoscan_customuser_group',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='pulmoscan_customuser_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='pulmoscan_customuser_permission',
    )

    def __str__(self):
        return self.username

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('pharmacist', 'Pharmacist'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='doctor')

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.role})"

class Medicine(models.Model):
    name = models.CharField(max_length=100)
    batch_number = models.CharField(max_length=50)
    expiry_date = models.DateField()
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} (Batch: {self.batch_number})"

class InventoryTransaction(models.Model):
    TRANSACTION_TYPE = (('purchase', 'Purchase'), ('sale', 'Sale'))
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE)
    quantity = models.PositiveIntegerField()
    date = models.DateTimeField(auto_now_add=True)
    # --- ADD THIS LINE ---
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_transactions')

    def __str__(self):
        return f"{self.transaction_type} - {self.medicine.name} x{self.quantity}"

class ScanReport(models.Model):
    patient_name = models.CharField(max_length=100)
    scan_image = models.ImageField(upload_to='scans/')
    diagnosis = models.TextField(default="Pending Analysis")
    confidence = models.FloatField(null=True, blank=True)
    date_uploaded = models.DateTimeField(auto_now_add=True)
    # --- ADD THIS LINE ---
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='scan_reports')

    def __str__(self):
        return f"Scan: {self.patient_name} - {self.diagnosis}"
    














































