from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'related_donation_id', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'notification_type', 'related_donation_id', 'created_at']

