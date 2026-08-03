import pytest

from app.services import symbol_search_service
from app.services.symbol_search_service import _SymbolEntry, search_symbols

FAKE_SYMBOLS = [
    _SymbolEntry("AAPL", "Apple Inc."),
    _SymbolEntry("AAP", "Advance Auto Parts Inc."),
    _SymbolEntry("BAAPL", "Bogus Apple Holdings"),
    _SymbolEntry("MSFT", "Microsoft Corporation"),
    _SymbolEntry("GOOG", "Alphabet Inc."),
    _SymbolEntry("TSLA", "Tesla Inc."),
    _SymbolEntry("ORCL", "Oracle Corporation"),
    _SymbolEntry("NFLX", "Netflix Inc."),
    _SymbolEntry("AMZN", "Amazon.com Inc."),
    _SymbolEntry("XOM", "Exxon Mobil Corporation"),
]


@pytest.fixture(autouse=True)
def fake_symbol_data(monkeypatch):
    """Replace the bundled symbols.json data with a small, controlled fixture
    so ranking assertions don't depend on the real dataset's contents."""
    monkeypatch.setattr(symbol_search_service, "_load_symbols", lambda: FAKE_SYMBOLS)


def test_search_symbols_empty_query_returns_empty_list():
    assert search_symbols("") == []
    assert search_symbols("   ") == []


def test_search_symbols_exact_ticker_match_ranks_first():
    results = search_symbols("AAP")
    symbols = [r["symbol"] for r in results]

    assert symbols[0] == "AAP"
    assert "AAPL" in symbols


def test_search_symbols_prefix_match_ranks_above_contains_match():
    results = search_symbols("AAPL")
    symbols = [r["symbol"] for r in results]

    assert symbols[0] == "AAPL"
    assert symbols.index("AAPL") < symbols.index("BAAPL")


def test_search_symbols_falls_back_to_company_name_match():
    results = search_symbols("MICROSOFT")
    symbols = [r["symbol"] for r in results]

    assert "MSFT" in symbols


def test_search_symbols_is_case_insensitive():
    assert search_symbols("aapl") == search_symbols("AAPL")


def test_search_symbols_limit_truncates_results():
    results = search_symbols("A", limit=2)
    assert len(results) == 2


def test_search_symbols_no_match_returns_empty_list():
    assert search_symbols("ZZZZZ") == []
