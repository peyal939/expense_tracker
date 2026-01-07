from django.db import models
from django.db.models import Q

from core.models import OwnedModel


class Category(OwnedModel):
	name = models.CharField(max_length=80)
	is_system = models.BooleanField(default=False)
	icon = models.CharField(max_length=64, blank=True)
	color_token = models.CharField(max_length=64, blank=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["name"],
				condition=Q(is_system=True),
				name="uniq_system_category_name",
			),
			models.UniqueConstraint(
				fields=["created_by", "name"],
				condition=Q(is_system=False),
				name="uniq_user_category_name_per_user",
			),
		]
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name
