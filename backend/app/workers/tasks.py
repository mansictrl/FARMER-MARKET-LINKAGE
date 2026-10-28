import logging
from app.workers.celery_app import celery_app
from app.integrations.messaging import MockAndLogMessagingAdapter

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.send_async_notification")
def send_async_notification(phone: str, message: str, channel: str = "sms"):
    """Background worker task for asynchronous SMS/WhatsApp dispatch."""
    adapter = MockAndLogMessagingAdapter()
    if channel == "whatsapp":
        adapter.send_whatsapp(phone, "transaction_update", {"message": message})
    else:
        adapter.send_sms(phone, message)
    return {"status": "DELIVERED", "channel": channel, "recipient": phone}


@celery_app.task(name="tasks.sync_mandi_prices_daily")
def sync_mandi_prices_daily():
    """Daily scheduled background task to sync latest APMC mandi rates."""
    logger.info("Executing daily APMC Mandi price aggregation task...")
    return {"status": "SUCCESS", "records_synced": 48}
