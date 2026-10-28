import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)


class BaseMessagingAdapter(ABC):
    @abstractmethod
    def send_sms(self, phone: str, message: str) -> bool:
        pass

    @abstractmethod
    def send_whatsapp(self, phone: str, template: str, params: dict) -> bool:
        pass

    @abstractmethod
    def send_email(self, recipient: str, subject: str, html_body: str) -> bool:
        pass


class MockAndLogMessagingAdapter(BaseMessagingAdapter):
    """
    Mock adapter for development that safely logs notifications and integrates with in-app notifications.
    Can be configured to forward to Twilio, Gupshup, Fast2SMS, or AWS SES in production.
    """
    def send_sms(self, phone: str, message: str) -> bool:
        logger.info(f"[SMS DISPATCH] To: {phone} | Content: {message}")
        return True

    def send_whatsapp(self, phone: str, template: str, params: dict) -> bool:
        logger.info(f"[WHATSAPP DISPATCH] To: {phone} | Template: {template} | Data: {params}")
        return True

    def send_email(self, recipient: str, subject: str, html_body: str) -> bool:
        logger.info(f"[EMAIL DISPATCH] To: {recipient} | Subject: {subject}")
        return True
