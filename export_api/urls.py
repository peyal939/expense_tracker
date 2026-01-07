from django.urls import path

from export_api.views import BackupJsonExportView, ExpensesCsvExportView

urlpatterns = [
    path("expenses.csv", ExpensesCsvExportView.as_view(), name="export-expenses-csv"),
    path("backup.json", BackupJsonExportView.as_view(), name="export-backup-json"),
]
