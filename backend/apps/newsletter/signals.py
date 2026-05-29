"""
BlogPost PUBLISHED olduğunda newsletter gönderir.

`newsletter_sent=False` olan post'lar için tetiklenir; böylece
aynı post için iki kez gönderim olmaz.
"""
import logging

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

# pre_save: eski status değerini saklıyoruz
@receiver(pre_save, sender="posts.BlogPost")
def _cache_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = sender.objects.only("status").get(pk=instance.pk).status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender="posts.BlogPost")
def _send_newsletter_on_publish(sender, instance, created, **kwargs):
    """
    DRAFT/ARCHIVED → PUBLISHED geçişinde ve henüz newsletter gönderilmemişse
    abonelere e-posta at.
    """
    if instance.status != "PUBLISHED":
        return

    if instance.newsletter_sent:
        return

    old = getattr(instance, "_old_status", None)
    if old == "PUBLISHED":
        # Zaten yayındaydı, içerik güncellendi — gönderme
        return

    # Newsletter gönder, sonra flag'i işaretle
    from .email import send_newsletter  # local (döngüsel önlem)

    try:
        count = send_newsletter(instance)
        # update_fields ile çağırıyoruz ki post_save döngüye girmesin
        sender.objects.filter(pk=instance.pk).update(newsletter_sent=True)
        instance.newsletter_sent = True
        logger.info(
            "Newsletter signal: %d abone'ye gönderildi. (post=%s)",
            count,
            instance.slug,
        )
    except Exception as exc:
        logger.error(
            "Newsletter signal hatası: %s (post=%s)",
            exc,
            instance.slug,
            exc_info=True,
        )
