from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

User = get_user_model()


class MeSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "roles", "is_superuser"]

    def get_roles(self, obj):
        return list(obj.groups.values_list("name", flat=True))


class UserListSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    groups_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_active", "is_superuser", "date_joined", "roles", "groups_display"]

    def get_roles(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def get_groups_display(self, obj):
        return [{"id": g.id, "name": g.name} for g in obj.groups.all()]


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    groups = serializers.PrimaryKeyRelatedField(many=True, queryset=Group.objects.all(), required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_active", "groups"]

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if groups is not None:
            instance.groups.set(groups)

        instance.save()
        return instance
