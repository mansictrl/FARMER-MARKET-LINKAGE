import csv
import io
import logging
from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MarketDataRecord:
    def __init__(
        self,
        commodity: str,
        market: str,
        state: str,
        district: str,
        min_price: Decimal,
        max_price: Decimal,
        modal_price: Decimal,
        price_date: date,
        arrival_volume: float = 0.0,
        unit: str = "Rs/Quintal",
        source: str = "Agmarknet Verified"
    ):
        self.commodity = commodity
        self.market = market
        self.state = state
        self.district = district
        self.min_price = min_price
        self.max_price = max_price
        self.modal_price = modal_price
        self.price_date = price_date
        self.arrival_volume = arrival_volume
        self.unit = unit
        self.source = source


class BaseMarketDataProvider(ABC):
    @abstractmethod
    def fetch_current_prices(self, commodity_name: Optional[str] = None, state: Optional[str] = None) -> List[MarketDataRecord]:
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass


class AgmarknetLiveAdapter(BaseMarketDataProvider):
    """
    Official API Adapter for Government of India Data.gov.in / Agmarknet Mandi Prices.
    API: Open Government Data (OGD) Platform India - Current Daily Price of Various Commodities.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.AGMARKNET_API_KEY
        self.base_url = base_url or settings.AGMARKNET_BASE_URL

    def get_provider_name(self) -> str:
        return "Agmarknet Live API (data.gov.in)"

    def fetch_current_prices(self, commodity_name: Optional[str] = None, state: Optional[str] = None) -> List[MarketDataRecord]:
        if not self.api_key:
            logger.info("Agmarknet API key not configured. Using fallback verified demo adapter.")
            return []

        try:
            params = {
                "api-key": self.api_key,
                "format": "json",
                "limit": 100
            }
            if commodity_name:
                params["filters[commodity]"] = commodity_name
            if state:
                params["filters[state]"] = state

            response = httpx.get(self.base_url, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                records = []
                for item in data.get("records", []):
                    try:
                        record_date = datetime.strptime(item.get("arrival_date", str(date.today())), "%d/%m/%Y").date()
                    except Exception:
                        record_date = date.today()

                    records.append(MarketDataRecord(
                        commodity=item.get("commodity", "General"),
                        market=item.get("market", "APMC Mandi"),
                        state=item.get("state", "India"),
                        district=item.get("district", "General"),
                        min_price=Decimal(str(item.get("min_price", 0))),
                        max_price=Decimal(str(item.get("max_price", 0))),
                        modal_price=Decimal(str(item.get("modal_price", 0))),
                        price_date=record_date,
                        arrival_volume=float(item.get("arrival_volume", 0.0)),
                        source="Agmarknet Live (data.gov.in)"
                    ))
                return records
            else:
                logger.warning(f"Agmarknet Live API responded with status {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching live Agmarknet prices: {str(e)}")
            return []


class CSVMarketDataImporter:
    """Imports Mandi Price records from CSV files with column mapping."""
    @staticmethod
    def parse_csv(csv_content: str) -> List[MarketDataRecord]:
        records = []
        reader = csv.DictReader(io.StringIO(csv_content))
        for row in reader:
            try:
                date_str = row.get("PriceDate") or row.get("Date") or str(date.today())
                try:
                    p_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
                except ValueError:
                    p_date = date.today()

                records.append(MarketDataRecord(
                    commodity=row.get("Commodity", "").strip(),
                    market=row.get("Market", "").strip(),
                    state=row.get("State", "").strip(),
                    district=row.get("District", "").strip(),
                    min_price=Decimal(str(row.get("MinPrice", 0)).strip()),
                    max_price=Decimal(str(row.get("MaxPrice", 0)).strip()),
                    modal_price=Decimal(str(row.get("ModalPrice", 0)).strip()),
                    price_date=p_date,
                    arrival_volume=float(row.get("ArrivalVolume", 0) or 0),
                    unit=row.get("Unit", "Rs/Quintal").strip(),
                    source="CSV File Import"
                ))
            except Exception as e:
                logger.warning(f"Skipping malformed CSV row {row}: {str(e)}")
        return records
