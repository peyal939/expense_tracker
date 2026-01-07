from rest_framework import serializers


class CategorizeRequestSerializer(serializers.Serializer):
    description = serializers.CharField()
    merchant = serializers.CharField(required=False, allow_blank=True)


class CategorizeResponseSerializer(serializers.Serializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)
    confidence = serializers.FloatField(required=False, allow_null=True)
    rationale = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class InsightsResponseSerializer(serializers.Serializer):
    month = serializers.DateField()
    insights = serializers.ListField(child=serializers.DictField())
