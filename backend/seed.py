from database import SessionLocal, engine
import models

def seed_db():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if already seeded but we still want to add missing entries
    if db.query(models.IngredientSafety).first():
        print("Database already seeded. Checking for missing entries...")

    ingredients = [
        {"ingredient_name": "Water", "risk_level": "Safe", "description": "Solvent, safe for consumption and skin."},
        {"ingredient_name": "Parabens", "risk_level": "Moderate Risk", "description": "Preservative. Can cause minor skin irritation in some people."},
        {"ingredient_name": "Sodium Lauryl Sulfate", "risk_level": "Harmful", "description": "Surfactant. Known skin irritant if not formulated correctly."},
        {"ingredient_name": "Aloe Extract", "risk_level": "Safe", "description": "Natural soothing agent."},
        {"ingredient_name": "Sugar", "risk_level": "Moderate Risk", "description": "Safe in moderation, but excessive amounts are linked to health issues."},
        {"ingredient_name": "Salt", "risk_level": "Safe", "description": "Essential mineral."},
        {"ingredient_name": "High Fructose Corn Syrup", "risk_level": "Harmful", "description": "Highly processed sweetener linked to metabolic issues."},
        # New Additions
        {"ingredient_name": "E102", "risk_level": "Harmful", "description": "Tartrazine: Synthetic yellow azo dye linked to hyperactivity in children and allergic reactions."},
        {"ingredient_name": "E110", "risk_level": "Harmful", "description": "Sunset Yellow FCF: Synthetic yellow azo dye widely used, can cause allergic reactions."},
        {"ingredient_name": "E124", "risk_level": "Harmful", "description": "Ponceau 4R: Synthetic red azo dye, may cause allergic reactions and hyperactivity."},
        {"ingredient_name": "E202", "risk_level": "Moderate Risk", "description": "Potassium Sorbate: Preservative, generally regarded as safe but can cause mild irritation."},
        {"ingredient_name": "E211", "risk_level": "Moderate Risk", "description": "Sodium Benzoate: Preservative, can form benzene (a carcinogen) when combined with Vitamin C."},
        {"ingredient_name": "E322", "risk_level": "Safe", "description": "Lecithin: Emulsifier, commonly derived from soy or sunflowers."},
        {"ingredient_name": "E330", "risk_level": "Safe", "description": "Citric Acid: Naturally occurring acidity regulator and flavor enhancer."},
        {"ingredient_name": "E440", "risk_level": "Safe", "description": "Pectin: Natural polysaccharide used universally as a gelling agent."},
        {"ingredient_name": "E471", "risk_level": "Safe", "description": "Mono- and diglycerides of fatty acids: Emulsifier generally sourced from oils."},
        {"ingredient_name": "E466", "risk_level": "Safe", "description": "Carboxymethyl cellulose (CMC): Stabilizer and thickener derived from cellulose."},
        {"ingredient_name": "E960a", "risk_level": "Safe", "description": "Stevia: Natural plant-based non-caloric sweetener."}
    ]

    for item in ingredients:
        existing = db.query(models.IngredientSafety).filter(models.IngredientSafety.ingredient_name == item["ingredient_name"]).first()
        if not existing:
            db_ing = models.IngredientSafety(**item)
            db.add(db_ing)
    
    db.commit()
    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_db()
