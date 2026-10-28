from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.kyc import router as kyc_router
from app.api.v1.commodities import router as commodities_router
from app.api.v1.markets import router as markets_router
from app.api.v1.lots import router as lots_router
from app.api.v1.listings import router as listings_router
from app.api.v1.offers import router as offers_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.market_prices import router as market_prices_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.fpos import router as fpos_router
from app.api.v1.storage_logistics import router as storage_logistics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin import router as admin_router
from app.api.v1.weather import router as weather_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(kyc_router)
api_router.include_router(commodities_router)
api_router.include_router(markets_router)
api_router.include_router(lots_router)
api_router.include_router(listings_router)
api_router.include_router(offers_router)
api_router.include_router(transactions_router)
api_router.include_router(market_prices_router)
api_router.include_router(recommendations_router)
api_router.include_router(fpos_router)
api_router.include_router(storage_logistics_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(weather_router)
