"""Watchlist-specific behavior: reordering and position numbering."""


def test_reorder_ignores_unknown_and_foreign_ids(client, auth_headers, other_auth_headers):
    aapl = client.post(
        "/api/v1/watchlist", json={"ticker": "AAPL"}, headers=auth_headers
    ).json()
    msft = client.post(
        "/api/v1/watchlist", json={"ticker": "MSFT"}, headers=auth_headers
    ).json()
    other_item = client.post(
        "/api/v1/watchlist", json={"ticker": "GOOG"}, headers=other_auth_headers
    ).json()

    response = client.put(
        "/api/v1/watchlist/reorder",
        json={"ordered_ids": [msft["id"], 999999, other_item["id"], aapl["id"]]},
        headers=auth_headers,
    )
    assert response.status_code == 200

    tickers_in_order = [item["ticker"] for item in response.json()]
    assert tickers_in_order == ["MSFT", "AAPL"]

    # The other user's item was neither moved into this list nor repositioned.
    other_watchlist = client.get("/api/v1/watchlist", headers=other_auth_headers).json()
    assert len(other_watchlist) == 1
    assert other_watchlist[0]["ticker"] == "GOOG"
    assert other_watchlist[0]["position"] == 0


def test_position_numbering_after_delete(client, auth_headers):
    aapl = client.post(
        "/api/v1/watchlist", json={"ticker": "AAPL"}, headers=auth_headers
    ).json()
    msft = client.post(
        "/api/v1/watchlist", json={"ticker": "MSFT"}, headers=auth_headers
    ).json()
    client.post("/api/v1/watchlist", json={"ticker": "GOOG"}, headers=auth_headers)

    # Delete the middle item, leaving a gap in position numbering.
    delete_response = client.delete(
        f"/api/v1/watchlist/{msft['id']}", headers=auth_headers
    )
    assert delete_response.status_code == 200

    client.post("/api/v1/watchlist", json={"ticker": "TSLA"}, headers=auth_headers)

    watchlist = client.get("/api/v1/watchlist", headers=auth_headers).json()
    tickers_in_order = [item["ticker"] for item in watchlist]
    positions = [item["position"] for item in watchlist]

    assert tickers_in_order == ["AAPL", "GOOG", "TSLA"]
    assert len(positions) == len(set(positions))  # no collisions
    assert positions == sorted(positions)  # still strictly ordered
    assert aapl["position"] == 0
