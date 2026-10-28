import os
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseStorageAdapter(ABC):
    @abstractmethod
    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """Returns the public or accessible URL of the uploaded file."""
        pass


class LocalStorageAdapter(BaseStorageAdapter):
    def __init__(self, upload_dir: Optional[str] = None):
        self.upload_dir = upload_dir or settings.LOCAL_STORAGE_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        ext = os.path.splitext(filename)[1] or ".bin"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(self.upload_dir, unique_name)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        
        # Return URL path accessible via API or static mount
        return f"/api/v1/storage/files/{unique_name}"


def get_storage_adapter() -> BaseStorageAdapter:
    """Factory returning configured storage adapter (Local / MinIO)."""
    return LocalStorageAdapter()
