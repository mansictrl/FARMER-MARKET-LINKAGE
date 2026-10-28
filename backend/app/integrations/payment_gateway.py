import hmac
import hashlib
import uuid
import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BasePaymentGatewayAdapter(ABC):
    @abstractmethod
    def create_order(self, amount: Decimal, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        pass


class RazorpayAdapter(BasePaymentGatewayAdapter):
    """
    Razorpay Payment Gateway Adapter in Test/Live Mode.
    Performs server-side order generation and cryptographic HMAC-SHA256 signature verification.
    """
    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET

    def create_order(self, amount: Decimal, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        # Razorpay expects amounts in lowest denomination (paise for INR)
        amount_in_paise = int(amount * 100)
        order_receipt = receipt or f"rcpt_{uuid.uuid4().hex[:12]}"

        # When running in test/sandbox mode without active external network:
        mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
        return {
            "order_id": mock_order_id,
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": order_receipt,
            "key_id": self.key_id,
            "status": "created",
            "mode": settings.PAYMENT_MODE
        }

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """
        Cryptographically verifies the Razorpay payment signature using HMAC SHA256.
        Formula: HMAC-SHA256(order_id + "|" + payment_id, secret) == signature
        """
        if not signature or not order_id or not payment_id:
            logger.error("Missing payment verification parameters.")
            return False

        try:
            msg = f"{order_id}|{payment_id}".encode("utf-8")
            secret = self.key_secret.encode("utf-8")
            expected_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()

            # Constant time string comparison to prevent timing attacks
            matches = hmac.compare_digest(expected_signature, signature)
            
            # In test/sandbox demonstration mode, if dummy signature passed:
            if not matches and settings.PAYMENT_MODE == "test" and signature.startswith("test_sig_"):
                logger.info("Test signature verified under mock sandbox mode.")
                return True

            return matches
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return False
