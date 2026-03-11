import os
import sys

# Provide correct path logic so we can import backend packages
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import re

def normalize_ingredient(name: str):
    name = name.lower()
    name = name.replace("(", " ").replace(")", " ")
    name = name.replace("%", "")
    return name.strip()

def extract_e_numbers(text):
    matches = re.findall(r'\b\d{3}[a-z]?\b', text.lower())
    return [f"E{m.upper()}" for m in matches]

def analyze_ingredients(ingredients_string):
    db = SessionLocal()
    raw_ingredients = re.split(r',(?![^(]*\))', ingredients_string) if ingredients_string else []
    ingredient_list = [i.strip() for i in raw_ingredients if i.strip() and len(i.strip()) > 2]
    
    analyzed = []
    
    for raw_ing in ingredient_list:
        normalized_name = normalize_ingredient(raw_ing)
        db_ing = db.query(models.IngredientSafety).filter(models.IngredientSafety.ingredient_name.ilike(f"%{normalized_name}%")).first()
        
        if not db_ing:
            e_nums = extract_e_numbers(raw_ing)
            for e in e_nums:
                db_ing = db.query(models.IngredientSafety).filter(models.IngredientSafety.ingredient_name.ilike(e)).first()
                if db_ing:
                    break
        
        if db_ing:
            analyzed.append(f"Found: {db_ing.ingredient_name} ({db_ing.risk_level})")
        else:
            analyzed.append(f"Unknown: {raw_ing}")
            
    db.close()
    return analyzed

if __name__ == "__main__":
    t1 = "Sugar, Concentrated Mango Pulp (5%), Acidity Regulator (330), Stabilizers (466, 440)"
    t2 = "Sweetener (960a)"
    t3 = "maltodextrin, some other stuff"
    
    print("Test 1:", t1)
    for res in analyze_ingredients(t1):
        print(" ->", res)
        
    print("\nTest 2:", t2)
    for res in analyze_ingredients(t2):
        print(" ->", res)
        
    print("\nTest 3:", t3)
    for res in analyze_ingredients(t3):
        print(" ->", res)
