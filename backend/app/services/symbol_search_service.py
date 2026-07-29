import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "symbols.json"


class _SymbolEntry:
    __slots__ = ("symbol", "name", "name_lower")

    def __init__(self, symbol: str, name: str):
        self.symbol = symbol
        self.name = name
        self.name_lower = name.lower()


@lru_cache(maxsize=1)
def _load_symbols() -> list[_SymbolEntry]:
    with DATA_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    return [_SymbolEntry(item["symbol"], item["name"]) for item in raw]


def search_symbols(query: str, limit: int = 8) -> list[dict[str, str]]:
    """Rank bundled NASDAQ/NYSE symbols against a prefix, ticker first."""
    query = query.strip().upper()
    if not query:
        return []

    query_lower = query.lower()

    # Buckets, best match first: exact/prefix on ticker, ticker contains
    # query, company name starts with query, company name contains query.
    starts_with_symbol: list[_SymbolEntry] = []
    contains_symbol: list[_SymbolEntry] = []
    starts_with_name: list[_SymbolEntry] = []
    contains_name: list[_SymbolEntry] = []

    for entry in _load_symbols():
        if entry.symbol.startswith(query):
            starts_with_symbol.append(entry)
        elif query in entry.symbol:
            contains_symbol.append(entry)
        elif entry.name_lower.startswith(query_lower):
            starts_with_name.append(entry)
        elif query_lower in entry.name_lower:
            contains_name.append(entry)

    # Exact ticker match ranks above other prefix matches of the same length.
    starts_with_symbol.sort(key=lambda e: (e.symbol != query, len(e.symbol)))

    ranked = starts_with_symbol + contains_symbol + starts_with_name + contains_name
    return [{"symbol": e.symbol, "name": e.name} for e in ranked[:limit]]
