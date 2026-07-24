from pydantic import BaseModel, ConfigDict, Field


class WatchlistItemCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)


class WatchlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticker: str
    position: int


class WatchlistReorderRequest(BaseModel):
    ordered_ids: list[int]
