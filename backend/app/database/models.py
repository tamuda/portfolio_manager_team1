"""ORM models mapping to database tables."""

from sqlalchemy import Column, Date, Integer, Numeric, String

from app.database.connection import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(20), nullable=False, index=True)
    quantity_added = Column(Numeric(18, 6), nullable=False)
    purchase_price = Column(Numeric(18, 6), nullable=False)
    purchase_date = Column(Date, nullable=True)
