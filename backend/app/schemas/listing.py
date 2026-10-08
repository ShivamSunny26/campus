import uuid
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    description: str = Field(min_length=5, max_length=5000)
    category: str = Field(min_length=2, max_length=40)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    price_unit: str | None = Field(default=None, max_length=30)
    pickup_location: str = Field(min_length=2, max_length=180)
    quantity: int = Field(default=1, ge=1, le=100000)

class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    seller_id: uuid.UUID
    title: str
    description: str
    category: str
    price: Decimal
    price_unit: str | None
    pickup_location: str
    status: str
    quantity: int
