import pytest
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from apps.posts.models import BlogPost
from apps.posts.tasks import publish_scheduled_posts

@pytest.mark.django_db
@patch("apps.newsletter.email.send_newsletter")
def test_publish_scheduled_posts_task(mock_send):
    # 1. Create a post scheduled in the past
    past_time = timezone.now() - timedelta(hours=1)
    post_past = BlogPost.objects.create(
        title="Past Post",
        summary="Summary",
        status=BlogPost.Status.DRAFT,
        publish_at=past_time
    )

    # 2. Create a post scheduled in the future
    future_time = timezone.now() + timedelta(hours=1)
    post_future = BlogPost.objects.create(
        title="Future Post",
        summary="Summary",
        status=BlogPost.Status.DRAFT,
        publish_at=future_time
    )

    # 3. Create a post without publish_at
    post_none = BlogPost.objects.create(
        title="None Post",
        summary="Summary",
        status=BlogPost.Status.DRAFT
    )

    # Run the task
    res = publish_scheduled_posts()

    assert res["published"] == 1

    post_past.refresh_from_db()
    post_future.refresh_from_db()
    post_none.refresh_from_db()

    assert post_past.status == BlogPost.Status.PUBLISHED
    assert post_future.status == BlogPost.Status.DRAFT
    assert post_none.status == BlogPost.Status.DRAFT

    # Verify email was triggered
    assert mock_send.called
