from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.market_data import (
    NewsResponse,
    PriceResponse,
    QuoteResponse,
    SymbolSearchResponse,
)
from app.services.market_data_service import (
    MarketDataError,
    get_latest_price,
    get_news,
    get_quote,
)
from app.services.symbol_search_service import search_symbols

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


@router.get("/search", response_model=SymbolSearchResponse)
def search_symbols_route(
    q: str = Query(default=""),
    limit: int = Query(default=8, ge=1, le=20),
) -> SymbolSearchResponse:
    results = search_symbols(q, limit=limit)
    return SymbolSearchResponse(query=q.strip().upper(), results=results)


@router.get("/quote/{ticker}", response_model=QuoteResponse)
def read_quote(ticker: str, range: str = "1D") -> QuoteResponse:
    try:
        data = get_quote(ticker, range)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except MarketDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not retrieve market data for {ticker}.",
        ) from exc

    return QuoteResponse(**data)


@router.get("/news/{ticker}", response_model=NewsResponse)
def read_news(
    ticker: str,
    limit: int = Query(default=5, ge=1, le=20),
) -> NewsResponse:
    try:
        items = get_news(ticker, limit=limit)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except MarketDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not retrieve news for {ticker}.",
        ) from exc

    return NewsResponse(ticker=ticker.strip().upper(), items=items)
