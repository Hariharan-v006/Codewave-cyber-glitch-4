from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IngredientSafetyBase(BaseModel):
    ingredient_name: str
    risk_level: str
    description: str
    health_effects: Optional[str] = None

class IngredientSafetyCreate(IngredientSafetyBase):
    pass

class IngredientSafety(IngredientSafetyBase):
    id: int
    original_name: Optional[str] = None

    class Config:
        from_attributes = True

class ScanHistoryBase(BaseModel):
    barcode: str
    product_name: str
    safety_score: float

class ScanHistoryCreate(ScanHistoryBase):
    pass

class ScanHistory(ScanHistoryBase):
    id: int
    scan_date: datetime

    class Config:
        from_attributes = True

class ProductReport(BaseModel):
    barcode: str
    product_name: str
    brand: Optional[str] = None
    authenticity_status: str
    ingredients: List[IngredientSafety]
    # ── Expiry ──────────────────────────────────────────────────────────────
    expiry_date: Optional[str] = None          # ISO date: YYYY-MM-DD
    expiry_status: Optional[str] = None        # Valid / Near Expiry / Expiring Today / Expired
    days_remaining: Optional[int] = None       # positive = future, negative = past
    # ── GS1 Metadata ────────────────────────────────────────────────────────
    lot_number: Optional[str] = None           # AI 10
    manufacture_date: Optional[str] = None     # AI 11 (YYYY-MM-DD)
    barcode_format: Optional[str] = None       # QR_CODE / DATA_MATRIX / EAN_13 etc.
    # ── Existing ────────────────────────────────────────────────────────────
    safety_score: float
    allergens: Optional[str] = None
    additives: Optional[List[str]] = []
    nutriments: Optional[dict] = None
    categories: Optional[str] = None
    labels: Optional[str] = None

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
