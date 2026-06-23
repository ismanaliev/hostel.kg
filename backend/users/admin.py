from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'application_status', 'is_verified']
    list_filter = ['role', 'application_status', 'is_verified']
    search_fields = ['username', 'email', 'phone_number']
    readonly_fields = ['telegram_id']
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password', 'email')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'phone_number')
        }),
        ('Telegram', {
            'fields': ('telegram_id',)
        }),
        ('Role & Status', {
            'fields': ('role', 'application_status', 'is_verified')
        }),
        ('Permissions', {
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ['last_login'],
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_owner_application', 'reject_owner_application']

    def approve_owner_application(self, request, queryset):
        updated = 0
        for user in queryset.filter(application_status='pending'):
            user.role = 'owner'
            user.application_status = 'approved'
            user.save()
            updated += 1
        
        self.message_user(request, f'{updated} user(s) approved as owner.')
    approve_owner_application.short_description = 'Approve as Owner'

    def reject_owner_application(self, request, queryset):
        updated = queryset.filter(application_status='pending').update(
            application_status='rejected'
        )
        self.message_user(request, f'{updated} application(s) rejected.')
    reject_owner_application.short_description = 'Reject Application'
