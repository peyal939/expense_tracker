"""
Management command to seed the database with comprehensive dummy data.
Creates admin users, regular users, categories, expenses, budgets, incomes, and notifications.
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.db import transaction

from budgets.models import Budget, BudgetScope, Income, IncomeSource, MonthlyBudget
from categories.models import Category
from core.models import Notification, NotificationType
from expenses.models import Expense
from users.roles import ROLE_ADMIN, ROLE_USER

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with comprehensive dummy data for testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            self._clear_data()

        with transaction.atomic():
            self._create_groups()
            admin_user, regular_users = self._create_users()
            income_sources = self._create_income_sources(admin_user)
            categories = self._create_categories(admin_user)
            
            # Create data for all users
            all_users = [admin_user] + regular_users
            for user in all_users:
                self._create_incomes(user, income_sources)
                self._create_monthly_budgets(user)
                self._create_category_budgets(user, categories)
                self._create_expenses(user, categories)
                self._create_notifications(user)

        self.stdout.write(self.style.SUCCESS("\n✅ Database seeded successfully!"))
        self.stdout.write("\n📋 Created accounts:")
        self.stdout.write(self.style.WARNING("  Admin: admin@expense.com / admin123"))
        self.stdout.write(self.style.WARNING("  User:  john@expense.com / user123"))
        self.stdout.write(self.style.WARNING("  User:  jane@expense.com / user123"))
        self.stdout.write(self.style.WARNING("  User:  bob@expense.com / user123"))

    def _clear_data(self):
        """Clear all seeded data"""
        Notification.objects.all().delete()
        Expense.objects.all().delete()
        Budget.objects.all().delete()
        MonthlyBudget.objects.all().delete()
        Income.objects.all().delete()
        IncomeSource.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        User.objects.filter(email="admin@expense.com").delete()
        self.stdout.write(self.style.SUCCESS("  Data cleared."))

    def _create_groups(self):
        """Create role groups"""
        Group.objects.get_or_create(name=ROLE_ADMIN)
        Group.objects.get_or_create(name=ROLE_USER)
        self.stdout.write("  Created groups: Admin, User")

    def _create_users(self):
        """Create admin and regular users"""
        # Create Admin user
        admin_group = Group.objects.get(name=ROLE_ADMIN)
        user_group = Group.objects.get(name=ROLE_USER)

        admin_user, created = User.objects.get_or_create(
            email="admin@expense.com",
            defaults={
                "username": "admin",
                "first_name": "Admin",
                "last_name": "User",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
        admin_user.groups.add(admin_group)

        # Create regular users
        regular_users = []
        user_data = [
            {"email": "john@expense.com", "username": "john", "first_name": "John", "last_name": "Doe"},
            {"email": "jane@expense.com", "username": "jane", "first_name": "Jane", "last_name": "Smith"},
            {"email": "bob@expense.com", "username": "bob", "first_name": "Bob", "last_name": "Wilson"},
        ]

        for data in user_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults=data
            )
            if created:
                user.set_password("user123")
                user.save()
            user.groups.add(user_group)
            regular_users.append(user)

        self.stdout.write(f"  Created {1 + len(regular_users)} users (1 admin, {len(regular_users)} regular)")
        return admin_user, regular_users

    def _create_income_sources(self, admin_user):
        """Create system income sources"""
        sources_data = [
            "Salary",
            "Freelance",
            "Investments",
            "Rental Income",
            "Business",
            "Side Hustle",
            "Dividends",
            "Bonus",
        ]

        sources = []
        for name in sources_data:
            source, _ = IncomeSource.objects.get_or_create(
                name=name,
                is_system=True,
                defaults={"created_by": admin_user}
            )
            sources.append(source)

        self.stdout.write(f"  Created {len(sources)} income sources")
        return sources

    def _create_categories(self, admin_user):
        """Create system categories with icons and colors"""
        categories_data = [
            {"name": "Food & Dining", "icon": "🍔", "color_token": "red"},
            {"name": "Transportation", "icon": "🚗", "color_token": "blue"},
            {"name": "Shopping", "icon": "🛒", "color_token": "purple"},
            {"name": "Entertainment", "icon": "🎬", "color_token": "pink"},
            {"name": "Bills & Utilities", "icon": "💡", "color_token": "yellow"},
            {"name": "Healthcare", "icon": "🏥", "color_token": "green"},
            {"name": "Education", "icon": "📚", "color_token": "indigo"},
            {"name": "Travel", "icon": "✈️", "color_token": "cyan"},
            {"name": "Groceries", "icon": "🥬", "color_token": "lime"},
            {"name": "Personal Care", "icon": "💇", "color_token": "orange"},
            {"name": "Home & Garden", "icon": "🏠", "color_token": "teal"},
            {"name": "Gifts & Donations", "icon": "🎁", "color_token": "rose"},
            {"name": "Insurance", "icon": "🛡️", "color_token": "slate"},
            {"name": "Subscriptions", "icon": "📱", "color_token": "violet"},
            {"name": "Fitness", "icon": "🏋️", "color_token": "emerald"},
        ]

        categories = []
        for data in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=data["name"],
                is_system=True,
                defaults={
                    "created_by": admin_user,
                    "icon": data["icon"],
                    "color_token": data["color_token"],
                }
            )
            categories.append(cat)

        self.stdout.write(f"  Created {len(categories)} categories")
        return categories

    def _create_incomes(self, user, income_sources):
        """Create income entries for the past 12 months"""
        today = date.today()
        
        # Base salary varies by user
        base_salaries = {
            "admin": 150000,
            "john": 85000,
            "jane": 95000,
            "bob": 75000,
        }
        base_salary = base_salaries.get(user.username, 80000)

        for months_ago in range(12):
            month_date = date(today.year, today.month, 1) - timedelta(days=months_ago * 30)
            month_date = date(month_date.year, month_date.month, 1)

            # Primary salary
            salary_source = next((s for s in income_sources if s.name == "Salary"), income_sources[0])
            salary_variation = random.uniform(0.95, 1.05)
            Income.objects.get_or_create(
                created_by=user,
                month=month_date,
                source=salary_source,
                defaults={
                    "source_name": salary_source.name,
                    "amount": Decimal(str(round(base_salary * salary_variation, 2))),
                    "notes": f"Monthly salary for {month_date.strftime('%B %Y')}",
                }
            )

            # Random additional income (50% chance)
            if random.random() > 0.5:
                extra_source = random.choice([s for s in income_sources if s.name != "Salary"])
                extra_amount = random.randint(5000, 30000)
                Income.objects.get_or_create(
                    created_by=user,
                    month=month_date,
                    source=extra_source,
                    defaults={
                        "source_name": extra_source.name,
                        "amount": Decimal(str(extra_amount)),
                        "notes": f"Additional income from {extra_source.name}",
                    }
                )

        self.stdout.write(f"    Created incomes for {user.username}")

    def _create_monthly_budgets(self, user):
        """Create monthly budgets for the past 12 months"""
        today = date.today()
        
        base_budgets = {
            "admin": 120000,
            "john": 70000,
            "jane": 80000,
            "bob": 60000,
        }
        base_budget = base_budgets.get(user.username, 65000)

        for months_ago in range(12):
            month_date = date(today.year, today.month, 1) - timedelta(days=months_ago * 30)
            month_date = date(month_date.year, month_date.month, 1)

            budget_variation = random.uniform(0.9, 1.1)
            MonthlyBudget.objects.get_or_create(
                created_by=user,
                month=month_date,
                defaults={
                    "total_budget": Decimal(str(round(base_budget * budget_variation, 2))),
                    "notes": f"Budget for {month_date.strftime('%B %Y')}",
                }
            )

        self.stdout.write(f"    Created monthly budgets for {user.username}")

    def _create_category_budgets(self, user, categories):
        """Create category budgets for the past 12 months"""
        today = date.today()

        # Budget allocation percentages for categories
        allocations = {
            "Food & Dining": 15,
            "Transportation": 10,
            "Shopping": 12,
            "Entertainment": 8,
            "Bills & Utilities": 20,
            "Healthcare": 5,
            "Groceries": 15,
            "Personal Care": 3,
            "Subscriptions": 4,
            "Fitness": 3,
        }

        for months_ago in range(12):
            month_date = date(today.year, today.month, 1) - timedelta(days=months_ago * 30)
            month_date = date(month_date.year, month_date.month, 1)

            try:
                monthly_budget = MonthlyBudget.objects.get(created_by=user, month=month_date)
                total = float(monthly_budget.total_budget)
            except MonthlyBudget.DoesNotExist:
                total = 70000

            for category in categories:
                if category.name in allocations:
                    percentage = allocations[category.name]
                    amount = (total * percentage) / 100
                    
                    Budget.objects.get_or_create(
                        created_by=user,
                        month=month_date,
                        scope=BudgetScope.CATEGORY,
                        category=category,
                        defaults={
                            "amount": Decimal(str(round(amount, 2))),
                            "allocation_percentage": Decimal(str(percentage)),
                            "warn_threshold": Decimal("0.800"),
                        }
                    )

        self.stdout.write(f"    Created category budgets for {user.username}")

    def _create_expenses(self, user, categories):
        """Create realistic expenses for the past 12 months"""
        today = date.today()
        
        # Expense templates by category
        expense_templates = {
            "Food & Dining": [
                ("Lunch at restaurant", 350, 800, "Cash"),
                ("Dinner with friends", 1200, 3000, "Card"),
                ("Coffee shop", 150, 400, "Card"),
                ("Fast food", 200, 500, "Cash"),
                ("Fine dining", 2500, 5000, "Card"),
            ],
            "Transportation": [
                ("Uber ride", 150, 500, "Card"),
                ("Fuel", 1500, 3000, "Card"),
                ("Bus fare", 50, 150, "Cash"),
                ("Car maintenance", 2000, 8000, "Card"),
                ("Parking", 100, 300, "Cash"),
            ],
            "Shopping": [
                ("Clothes shopping", 1500, 5000, "Card"),
                ("Electronics", 3000, 15000, "Card"),
                ("Home decor", 500, 3000, "Card"),
                ("Books", 300, 1000, "Card"),
                ("Online shopping", 800, 4000, "Card"),
            ],
            "Entertainment": [
                ("Movie tickets", 400, 800, "Card"),
                ("Concert tickets", 2000, 5000, "Card"),
                ("Gaming", 500, 2000, "Card"),
                ("Streaming service", 200, 500, "Card"),
                ("Sports event", 1000, 3000, "Card"),
            ],
            "Bills & Utilities": [
                ("Electricity bill", 2000, 5000, "Bank Transfer"),
                ("Water bill", 500, 1000, "Bank Transfer"),
                ("Internet bill", 1000, 2000, "Bank Transfer"),
                ("Phone bill", 500, 1500, "Bank Transfer"),
                ("Gas bill", 800, 2000, "Bank Transfer"),
            ],
            "Healthcare": [
                ("Doctor visit", 500, 2000, "Card"),
                ("Medicines", 300, 1500, "Cash"),
                ("Lab tests", 1000, 5000, "Card"),
                ("Dental checkup", 1500, 4000, "Card"),
                ("Health supplements", 500, 2000, "Card"),
            ],
            "Groceries": [
                ("Weekly groceries", 2000, 5000, "Cash"),
                ("Supermarket shopping", 1500, 4000, "Card"),
                ("Fresh produce", 500, 1500, "Cash"),
                ("Household supplies", 800, 2000, "Card"),
            ],
            "Personal Care": [
                ("Haircut", 300, 800, "Cash"),
                ("Skincare products", 500, 2000, "Card"),
                ("Spa treatment", 1500, 4000, "Card"),
                ("Toiletries", 300, 800, "Cash"),
            ],
            "Subscriptions": [
                ("Netflix", 500, 800, "Card"),
                ("Spotify", 150, 300, "Card"),
                ("Gym membership", 1500, 3000, "Card"),
                ("Software subscription", 500, 2000, "Card"),
                ("Magazine subscription", 200, 500, "Card"),
            ],
            "Fitness": [
                ("Gym session", 200, 500, "Card"),
                ("Sports equipment", 1000, 5000, "Card"),
                ("Fitness class", 500, 1500, "Card"),
                ("Protein supplements", 1500, 3000, "Card"),
            ],
            "Travel": [
                ("Flight tickets", 5000, 25000, "Card"),
                ("Hotel booking", 3000, 15000, "Card"),
                ("Travel insurance", 500, 2000, "Card"),
                ("Local transport", 500, 2000, "Cash"),
            ],
            "Education": [
                ("Online course", 1000, 5000, "Card"),
                ("Books and materials", 500, 2000, "Card"),
                ("Workshop fee", 2000, 8000, "Card"),
                ("Certification exam", 3000, 10000, "Card"),
            ],
            "Gifts & Donations": [
                ("Birthday gift", 1000, 5000, "Card"),
                ("Charity donation", 500, 3000, "Bank Transfer"),
                ("Anniversary gift", 2000, 8000, "Card"),
                ("Holiday gifts", 3000, 10000, "Card"),
            ],
            "Home & Garden": [
                ("Furniture", 5000, 20000, "Card"),
                ("Home repair", 2000, 10000, "Cash"),
                ("Garden supplies", 500, 2000, "Card"),
                ("Cleaning supplies", 300, 800, "Cash"),
            ],
            "Insurance": [
                ("Health insurance", 3000, 8000, "Bank Transfer"),
                ("Car insurance", 2000, 5000, "Bank Transfer"),
                ("Life insurance", 1500, 4000, "Bank Transfer"),
            ],
        }

        merchants = [
            "Amazon", "Walmart", "Target", "Costco", "Best Buy", "Uber", "Lyft",
            "McDonald's", "Starbucks", "Subway", "Pizza Hut", "KFC",
            "Shell", "BP", "Chevron", "CVS", "Walgreens",
            "Netflix", "Spotify", "Apple", "Google", "Microsoft",
            "Local Restaurant", "Corner Store", "Mall", "Market",
        ]

        expenses_created = 0
        for months_ago in range(12):
            # Calculate the month
            ref_date = today - timedelta(days=months_ago * 30)
            year = ref_date.year
            month = ref_date.month
            
            # Number of expenses per month (varies)
            num_expenses = random.randint(25, 50)
            
            for _ in range(num_expenses):
                category = random.choice(categories)
                templates = expense_templates.get(category.name, [("General expense", 500, 2000, "Card")])
                template = random.choice(templates)
                
                description, min_amt, max_amt, payment_method = template
                amount = random.randint(min_amt, max_amt)
                
                # Random day in the month
                if month == today.month and year == today.year:
                    max_day = today.day
                else:
                    if month in [1, 3, 5, 7, 8, 10, 12]:
                        max_day = 31
                    elif month in [4, 6, 9, 11]:
                        max_day = 30
                    else:
                        max_day = 28
                
                day = random.randint(1, max_day)
                expense_date = date(year, month, day)

                Expense.objects.create(
                    created_by=user,
                    amount=Decimal(str(amount)),
                    currency="BDT",
                    date=expense_date,
                    description=description,
                    category=category,
                    payment_method=payment_method,
                    merchant=random.choice(merchants),
                    notes=f"Transaction on {expense_date.strftime('%d %b %Y')}",
                )
                expenses_created += 1

        self.stdout.write(f"    Created {expenses_created} expenses for {user.username}")

    def _create_notifications(self, user):
        """Create sample notifications"""
        today = date.today()
        
        notifications_data = [
            {
                "type": NotificationType.BUDGET_WARNING,
                "title": "Budget Warning",
                "message": "You've used 85% of your monthly budget. Consider reducing expenses.",
            },
            {
                "type": NotificationType.CATEGORY_EXCEEDED,
                "title": "Category Budget Exceeded",
                "message": "Your 'Food & Dining' budget has been exceeded by 15%.",
            },
            {
                "type": NotificationType.TREND_ALERT,
                "title": "Spending Trend Alert",
                "message": "Your spending on Entertainment has increased by 40% compared to last month.",
            },
            {
                "type": NotificationType.MONTH_END_SUMMARY,
                "title": "Monthly Summary",
                "message": "Your December spending summary is ready. Total spent: ৳45,000 out of ৳70,000 budget.",
            },
            {
                "type": NotificationType.CATEGORY_WARNING,
                "title": "Shopping Budget Warning",
                "message": "You've reached 80% of your Shopping budget for this month.",
            },
        ]

        for i, data in enumerate(notifications_data):
            Notification.objects.create(
                user=user,
                notification_type=data["type"],
                title=data["title"],
                message=data["message"],
                is_read=random.choice([True, False]),
                month=date(today.year, today.month, 1),
                data={"percentage": random.randint(75, 120)},
            )

        self.stdout.write(f"    Created {len(notifications_data)} notifications for {user.username}")
