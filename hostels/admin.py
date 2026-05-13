from django.contrib import admin
from .models import Hostel, HostelImage

class HostelImageInline(admin.TabularInline):
    model = HostelImage
    extra = 1
    fields = ['image', 'image_type', 'is_official']

@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'status', 'category', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['name', 'owner__username', 'address']
    readonly_fields = ['created_at', 'updated_at', 'trust_score']
    inlines = [HostelImageInline]
    fieldsets = (
        ('Hostel Info', {
            'fields': ('name', 'owner', 'category', 'status')
        }),
        ('Location', {
            'fields': ('address', 'latitude', 'longitude')
        }),
        ('Details', {
            'fields': ('description',)
        }),
        ('Status', {
            'fields': ('trust_score', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['activate_hostel', 'set_pending']

    def activate_hostel(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='active')
        self.message_user(request, f'{updated} hostel(s) activated.')
    activate_hostel.short_description = 'Activate Hostel'

    def set_pending(self, request, queryset):
        updated = queryset.filter(status='draft').update(status='pending')
        self.message_user(request, f'{updated} hostel(s) set to pending.')
    set_pending.short_description = 'Set to Pending Verification'

@admin.register(HostelImage)
class HostelImageAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'image_type', 'is_official', 'created_at']
    list_filter = ['image_type', 'is_official', 'created_at']
    search_fields = ['hostel__name']
    readonly_fields = ['created_at']
