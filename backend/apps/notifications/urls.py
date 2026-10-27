from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, UnreadNotificationCountView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('mark-all-read/', NotificationMarkReadView.as_view(), name='notification_mark_all_read'),
    path('<int:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notification_unread_count'),
]

