from decimal import Decimal

import yfinance as yf


class MarketDataError(Exception):
    """Raised when a stock price cannot be retrieved."""


def get_latest_price(ticker: str) -> Decimal:
    # Clean the ticker entered by the user
    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker cannot be empty.")

    # Create a yfinance object for the stock
    stock = yf.Ticker(ticker)

    try:
        # Retrieve recent daily market data
        history = stock.history(
            period="5d",
            interval="1d",
            auto_adjust=False,
        )
    except Exception as exc:
        raise MarketDataError(
            f"Could not retrieve market data for {ticker}."
        ) from exc

    # Check that data was returned
    if history.empty:
        raise MarketDataError(
            f"No market data was found for {ticker}."
        )

    # Get valid closing prices
    closing_prices = history["Close"].dropna()

    if closing_prices.empty:
        raise MarketDataError(
            f"No closing price was found for {ticker}."
        )

    # Get the most recent closing price
    latest_price = closing_prices.iloc[-1]

    return Decimal(str(latest_price))