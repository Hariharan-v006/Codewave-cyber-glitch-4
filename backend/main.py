from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db
import httpx
from fastapi.middleware.cors import CORSMiddleware
import re
from bs4 import BeautifulSoup
from models import UnknownIngredient
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, date as date_type
from calendar import monthrange
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SafeScan API"}

# ── GS1 / Barcode Parsing ─────────────────────────────────────────────────────

# AI codes: value = fixed length, None = variable (terminated by next known AI or end)
AI_TABLE = {
    "00": 18,  # Serial Shipping Container Code
    "01": 14,  # GTIN
    "10": None, # Lot/Batch number (variable, max 20)
    "11": 6,   # Manufacturing Date YYMMDD
    "13": 6,   # Packaging Date
    "15": 6,   # Best Before Date
    "17": 6,   # Expiry Date YYMMDD
    "21": None, # Serial Number (variable)
    "30": None, # Count (variable)
}

def parse_gs1(data: str) -> dict:
    """Parse GS1 Application Identifiers from a barcode string.
    Handles both parenthesis format (01)GTIN(17)DATE and raw concatenated format.
    """
    result = {}
    # Format 1: parenthesis-delimited — (01)08901234567890(17)261231
    paren_matches = re.findall(r'\((\d{2,4})\)([^(]+)', data)
    if paren_matches:
        for ai, value in paren_matches:
            result[ai] = value.strip()
        return result
    # Format 2: raw concatenated — 010890123456789017261231
    i = 0
    while i < len(data):
        matched = False
        for ai_len in [2]:  # GS1 uses 2-digit AIs in most common cases
            if i + ai_len > len(data):
                break
            ai = data[i:i+ai_len]
            if ai in AI_TABLE:
                i += ai_len
                fixed_len = AI_TABLE[ai]
                if fixed_len is not None:
                    value = data[i:i+fixed_len]
                    i += fixed_len
                else:
                    # Variable-length: read until next known AI or max 20 chars
                    j = i
                    while j < len(data) and (j - i) < 20:
                        if data[j:j+2] in AI_TABLE and j > i:
                            break
                        j += 1
                    value = data[i:j]
                    i = j
                result[ai] = value
                matched = True
                break
        if not matched:
            i += 1
    return result

def yymmdd_to_iso(yymmdd: str) -> str:
    """Convert GS1 YYMMDD to YYYY-MM-DD. Always assumes 2000+. Day 00 = last day of month."""
    yy = int(yymmdd[0:2])
    mm = int(yymmdd[2:4])
    dd = int(yymmdd[4:6])
    year = 2000 + yy
    if dd == 0:  # GS1 spec: 00 = last day of month
        dd = monthrange(year, mm)[1]
    return f"{year}-{mm:02d}-{dd:02d}"

def parse_expiry_date(barcode: str, gs1_data: dict) -> str | None:
    """Try all formats to find expiry date. Returns YYYY-MM-DD or None."""
    # 1. GS1 AI 17
    for ai in ("17", "15"):  # 17=expiry, 15=best before
        if ai in gs1_data and len(gs1_data[ai]) == 6 and gs1_data[ai].isdigit():
            try:
                return yymmdd_to_iso(gs1_data[ai])
            except Exception:
                pass
    # 2. GS1 AI 17 raw regex in barcode string
    m = re.search(r'(?:17|15)(\d{6})', barcode)
    if m:
        try:
            return yymmdd_to_iso(m.group(1))
        except Exception:
            pass
    # 3. Multi-format text patterns (QR codes with plain text)
    patterns = [
        (r"(?:EXP|EXPIRY)[: ]?(\d{4}-\d{2}-\d{2})",       "%Y-%m-%d"),
        (r"(?:EXP|EXPIRY)[: ]?(\d{2}/\d{4})",              "%m/%Y"),
        (r"(?:EXP|EXPIRY)[: ]?(\d{2}-\d{4})",              "%m-%Y"),
        (r"(?:EXP|EXPIRY)[: ]?(\d{2}/\d{2}/\d{4})",        "%d/%m/%Y"),
        (r"(?:BEST BEFORE|USE BY|BB)[: ]?(\d{4}-\d{2}-\d{2})", "%Y-%m-%d"),
        (r"(?:BEST BEFORE|USE BY|BB)[: ]?(\d{2}/\d{2}/\d{4})", "%d/%m/%Y"),
        (r"(?:EXP|EXPIRY)[: ]?(\d{6})",                    "%y%m%d"),  # compact YYMMDD
    ]
    for pattern, fmt in patterns:
        m = re.search(pattern, barcode, re.IGNORECASE)
        if m:
            try:
                parsed = datetime.strptime(m.group(1), fmt)
                # Ambiguous century: if year < 2000, add 100 years
                if parsed.year < 2000:
                    parsed = parsed.replace(year=parsed.year + 100)
                return parsed.strftime("%Y-%m-%d")
            except Exception:
                pass
    return None

def get_expiry_info(date_str: str) -> dict:
    """Return status, days_remaining for an ISO date string."""
    try:
        expiry = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = date_type.today()
        days = (expiry - today).days
        if days < 0:
            status = "Expired"
        elif days == 0:
            status = "Expiring Today"
        elif days <= 30:
            status = "Near Expiry"
        else:
            status = "Valid"
        return {"status": status, "days_remaining": days}
    except Exception:
        return {"status": None, "days_remaining": None}

# Auth Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "my_super_secret_key_safescan"  # Use env variable in prod
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except jwt.PyJWTError:
        return None
    user = db.query(models.User).filter(models.User.email == email).first()
    return user

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/history", response_model=list[schemas.ScanHistory])
def get_user_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Return scan history sorted by date DESC
    history = db.query(models.ScanHistory).filter(models.ScanHistory.user_id == current_user.id).order_by(models.ScanHistory.scan_date.desc()).all()
    return history

@app.get("/api/product/{barcode}", response_model=schemas.ProductReport)
async def get_product(barcode: str, fmt: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Fetch from Open databases
    food_url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    beauty_url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
    
    product_data = {}
    found = False
    
    async with httpx.AsyncClient() as client:
        response = await client.get(food_url)
        data = response.json()
        if data.get("status") == 1:
            product_data = data.get("product", {})
            found = True
        else:
            response = await client.get(beauty_url)
            data = response.json()
            if data.get("status") == 1:
                product_data = data.get("product", {})
                found = True
                
    product_name = "Unknown Product"
    brand = "Unknown Brand"
    ingredients_text = ""
    allergens = None
    additives = []
    nutriments = None
    categories = None
    labels = None

    if found:
        product_name = product_data.get("product_name") or "Unknown Product"
        brand = product_data.get("brands") or "Unknown Brand"
        ingredients_text = product_data.get("ingredients_text") or ""
        allergens = product_data.get("allergens") or None
        
        raw_additives = product_data.get("additives_tags") or []
        additives = [tag.replace("en:", "").upper() for tag in raw_additives]
        
        nutriments = product_data.get("nutriments") or None
        categories = product_data.get("categories") or None
        labels = product_data.get("labels") or None
        
    if not ingredients_text:
        # Fallback: Real-time Web Search using Yahoo (less bot protection)
        try:
            search_query = f"ingredients {product_name}" if product_name != "Unknown Product" else f"ingredients {barcode}"
            search_url = f"https://search.yahoo.com/search?p={search_query.replace(' ', '+')}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with httpx.AsyncClient() as client:
                search_resp = await client.get(search_url, headers=headers)
                soup = BeautifulSoup(search_resp.text, 'lxml')
                
                scraped_text = ""
                # Attempt to find text snippets in Yahoo search results
                for tag in soup.find_all('div', class_='compText'):
                    text = tag.get_text()
                    match = re.search(r'(?i)(?:ingredients|contains)[\s:]+(.*)', text)
                    if match:
                        scraped_text += match.group(1) + " "
                    elif "ingredient" in text.lower():
                        scraped_text += text + " "
                
                # Clean up the scraped text
                scraped_text = re.sub(r'[^a-zA-Z0-9,\s]', '', scraped_text).strip()
                
                if len(scraped_text) > 10:
                    ingredients_text = scraped_text
                    if not found:
                        product_name = f"Scraped Product ({barcode})"
                        brand = "Online Search Result"
                else:
                    if not found:
                        return _return_unknown(barcode, db, current_user)
        except Exception as e:
            print(f"Scraping error: {e}")
            if not found:
                return _return_unknown(barcode, db, current_user)
    
    # Simple extraction (mocking complex NLP)
    raw_ingredients = re.split(r',(?![^(]*\))', ingredients_text) if ingredients_text else []
    ingredient_list = [i.strip() for i in raw_ingredients if i.strip() and len(i.strip()) > 2]
    
    def normalize_ingredient(name: str):
        name = name.lower()
        name = name.replace("(", " ").replace(")", " ")
        name = name.replace("%", "")
        return name.strip()

    def extract_e_numbers(text):
        matches = re.findall(r'\b\d{3}[a-z]?\b', text.lower())
        return [f"E{m.upper()}" for m in matches]
        
    # 2. Safety Analysis
    analyzed_ingredients = []
    score = 10.0 # Start with perfect score
    harmful_count = 0
    
    for raw_ing in ingredient_list:
        normalized_name = normalize_ingredient(raw_ing)
        
        # Check DB for exact match
        db_ing = db.query(models.IngredientSafety).filter(models.IngredientSafety.ingredient_name.ilike(f"%{normalized_name}%")).first()
        
        if not db_ing:
            e_nums = extract_e_numbers(raw_ing)
            for e in e_nums:
                db_ing = db.query(models.IngredientSafety).filter(models.IngredientSafety.ingredient_name.ilike(e)).first()
                if db_ing:
                    break
                    
        if db_ing:
            # Create a clone dict/instance for the response so we don't accidentally mutate the DB instance globally
            ing_data = schemas.IngredientSafety.from_orm(db_ing).dict()
            ing_data["original_name"] = raw_ing
            analyzed_ingredients.append(schemas.IngredientSafety(**ing_data))
            
            if db_ing.risk_level == "Harmful":
                score -= 1.5
                harmful_count += 1
            elif db_ing.risk_level == "Moderate Risk":
                score -= 0.7
        else:
            # Handle unknown
            unknown_entry = db.query(UnknownIngredient).filter(UnknownIngredient.ingredient_name == normalized_name).first()
            if unknown_entry:
                unknown_entry.times_seen += 1
            else:
                new_unknown = UnknownIngredient(ingredient_name=normalized_name)
                db.add(new_unknown)
            
            analyzed_ingredients.append(schemas.IngredientSafety(
                id=0, ingredient_name=normalized_name, original_name=raw_ing, risk_level="Unknown", description="Data not available in local DB"
            ))
            score -= 0.3
            
    if harmful_count > 3:
        score -= 1.0
        
    score = max(min(score, 10.0), 0.0) # Clamp score between 0 and 10
    
    
    # 3. Authenticity & GS1 parsing
    authenticity_status = "Verified" if product_name != "Unknown Product" and not product_name.startswith("Scraped Product") else "Suspicious"

    gs1_data = parse_gs1(barcode)

    # Expiry
    expiry_date = parse_expiry_date(barcode, gs1_data)
    expiry_status = None
    days_remaining = None
    if expiry_date:
        info = get_expiry_info(expiry_date)
        expiry_status = info["status"]
        days_remaining = info["days_remaining"]

    # Lot number (AI 10)
    lot_number = gs1_data.get("10") or None

    # Manufacturing date (AI 11)
    manufacture_date = None
    if "11" in gs1_data and len(gs1_data["11"]) == 6 and gs1_data["11"].isdigit():
        try:
            manufacture_date = yymmdd_to_iso(gs1_data["11"])
        except Exception:
            pass

    report = schemas.ProductReport(
        barcode=barcode,
        product_name=product_name,
        brand=brand,
        authenticity_status=authenticity_status,
        ingredients=analyzed_ingredients,
        expiry_date=expiry_date,
        expiry_status=expiry_status,
        days_remaining=days_remaining,
        lot_number=lot_number,
        manufacture_date=manufacture_date,
        barcode_format=fmt,
        safety_score=round(score, 1),
        allergens=allergens,
        additives=additives,
        nutriments=nutriments,
        categories=categories,
        labels=labels
    )
    
    # Log to History
    history_entry = models.ScanHistory(
        barcode=barcode,
        product_name=product_name,
        safety_score=score,
        user_id=current_user.id if current_user else None
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)
    
    return report

def _return_unknown(barcode, db, current_user=None):
    score = 8.0 # Starting score 10 - 2 for unknown product
    report = schemas.ProductReport(
        barcode=barcode,
        product_name="Unknown Product",
        brand="Not Available",
        authenticity_status="Unknown",
        ingredients=[],
        expiry_status=None,
        safety_score=round(score, 1),
        allergens=None,
        additives=[],
        nutriments=None,
        categories=None,
        labels=None
    )
    history_entry = models.ScanHistory(
        barcode=barcode,
        product_name="Unknown Product",
        safety_score=score,
        user_id=current_user.id if current_user else None
    )
    db.add(history_entry)
    db.commit()
    return report

@app.delete("/api/history/{history_id}", status_code=204)
def delete_history_entry(
    history_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    entry = db.query(models.ScanHistory).filter(
        models.ScanHistory.id == history_id,
        models.ScanHistory.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()

@app.delete("/api/history", status_code=204)
def clear_all_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    db.query(models.ScanHistory).filter(
        models.ScanHistory.user_id == current_user.id
    ).delete()
    db.commit()

@app.get("/api/ingredients", response_model=list[schemas.IngredientSafety])
def get_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingredients = db.query(models.IngredientSafety).offset(skip).limit(limit).all()
    return ingredients
