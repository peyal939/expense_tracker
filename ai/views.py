from datetime import date

from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.response import Response

from ai.selectors import get_ai_service
from ai.serializers import CategorizeRequestSerializer
from core.permissions import IsUserOrAdminRole


class CategorizeView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def post(self, request, *args, **kwargs):
		serializer = CategorizeRequestSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		svc = get_ai_service()
		suggestion = svc.suggest_category(
			owner=request.user,
			description=serializer.validated_data["description"],
			merchant=serializer.validated_data.get("merchant") or None,
		)

		return Response(
			{
				"category_id": suggestion.category_id,
				"confidence": suggestion.confidence,
				"rationale": suggestion.rationale,
				"enabled": False,
			}
		)


class InsightsView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		month_param = request.query_params.get("month")
		month = parse_date(month_param) if month_param else None
		if not month:
			return Response({"detail": "month query param required (YYYY-MM-01)"}, status=400)

		svc = get_ai_service()
		insights = svc.monthly_insights(owner=request.user, month=date(month.year, month.month, 1))

		return Response(
			{
				"month": date(month.year, month.month, 1),
				"enabled": False,
				"insights": [
					{"title": i.title, "detail": i.detail, "severity": i.severity} for i in insights
				],
			}
		)
