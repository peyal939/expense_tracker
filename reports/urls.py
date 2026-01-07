from django.urls import path

from reports.views import SummaryReportView, TrendsReportView, TimeSeriesReportView

urlpatterns = [
    path("summary/", SummaryReportView.as_view(), name="report-summary"),
    path("trends/", TrendsReportView.as_view(), name="report-trends"),
    path("timeseries/", TimeSeriesReportView.as_view(), name="report-timeseries"),
]
