# medpharma/urls/dashboard_urls.py
from django.urls import path
from pulmoscan.views import stock_summary, doctor_dashboard_summary

urlpatterns = [
    path("stock-summary/", stock_summary, name="dashboard-stock-summary"),
    path("doctor-summary/", doctor_dashboard_summary, name="dashboard-doctor-summary"),
]
