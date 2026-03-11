from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class IngredientSafety(Base):
    __tablename__ = "ingredient_safety"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String, unique=True, index=True)
    risk_level = Column(String)  # Safe, Moderate Risk, Harmful
    description = Column(String)
    health_effects = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    scans = relationship("ScanHistory", back_populates="user")

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, index=True)
    product_name = Column(String)
    scan_date = Column(DateTime, default=datetime.datetime.utcnow)
    safety_score = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", back_populates="scans")

class UnknownIngredient(Base):
    __tablename__ = "unknown_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String, unique=True, index=True)
    times_seen = Column(Integer, default=1)
