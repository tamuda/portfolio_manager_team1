from fastapi import APIRouter, HTTPException, status

from app.schemas.market_data import PriceResponse
from app.services.market_data_service import MarketDataError, get_latest_price

router = APIRouter(
    prefix="/market-data",
    tags=["market-data"],
)


@router.get("/price/{ticker}", response_model=PriceResponse)
def get_price(ticker: str) -> PriceResponse:
    try:
        price = get_latest_price(ticker)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except MarketDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not retrieve the current price for {ticker}.",
        ) from exc

    return PriceResponse(ticker=ticker.strip().upper(), price=price)
