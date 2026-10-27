from django.db import models
from apps.accounts.models import CustomUser

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        CLAIM_REQUEST = 'CLAIM_REQUEST', 'New Claim Request'
        CLAIM_ACCEPTED = 'CLAIM_ACCEPTED', 'Claim Accepted'
        READY_PICKUP = 'READY_PICKUP', 'Ready for Pickup'
        COMPLETED = 'COMPLETED', 'Donation Completed'
        CANCELLED = 'CANCELLED', 'Donation Cancelled'
        SYSTEM = 'SYSTEM', 'System Alert'

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM
    )
    related_donation_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

