from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Medicine)
admin.site.register(InventoryTransaction)
admin.site.register(ScanReport)



