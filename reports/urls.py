from django.urls import path

from reports.views import (
    MonthEndSummaryView,
    SpendingTrendsView,
    SummaryReportView,
    TimeSeriesReportView,
    TrendsReportView,
)

urlpatterns = [
    path("summary/", SummaryReportView.as_view(), name="report-summary"),
    path("trends/", TrendsReportView.as_view(), name="report-trends"),
    path("timeseries/", TimeSeriesReportView.as_view(), name="report-timeseries"),
    path("spending-trends/", SpendingTrendsView.as_view(), name="spending-trends"),
    path("month-end/", MonthEndSummaryView.as_view(), name="month-end-summary"),
]
