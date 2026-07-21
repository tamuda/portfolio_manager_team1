

from fastapi import APIRouter, status, HTTPException
from app.schemas.holding import (
    HoldingCreate,
    HoldingResponse,
    HoldingUpdate,
)

router = APIRouter(
    prefix="/holdings",
    tags=["holdings"],
)

holdings: list[HoldingResponse] = []
next_id = 1

@router.get("", response_model = list[HoldingResponse])
def get_holdings() -> list[HoldingResponse]:
    return holdings

@router.post("", response_model = HoldingResponse)
def create_holding(request: HoldingCreate) -> HoldingResponse:
    global next_id
    print('Came here')
    holding = HoldingResponse(
        id=next_id,
        ticker=request.ticker,
        quantity=request.quantity,
        purchase_price= request.purchase_price,
        purchase_date=request.purchase_date
    )
    holdings.append(holding)
    next_id += 1
    return holding

@router.get("/{holding_id}", response_model = HoldingResponse)
def get_holding(holding_id: int) -> HoldingResponse:
    for holding in holdings:
        if holding.id == holding_id:
            return holding

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Holding {holding_id} was not found",
    )

@router.delete("/{holding_id}")
def delete_holding(holding_id: int) -> None:
    for index, holding in enumerate(holdings):
        if holding.id == holding_id:
            holdings.pop(index)
            return
    print("DELETE operation did not work")




