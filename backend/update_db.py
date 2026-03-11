import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from models import Base
from sqlalchemy import text

def reset_and_update():
    # Only drop tables we are editing heavily to avoid losing ingredient data
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE scan_history ADD COLUMN user_id INTEGER REFERENCES users(id);"))
            conn.commit()
            print("Added user_id to scan_history.")
        except Exception as e:
            conn.rollback()
            print("Could not alter scan_history directly, possibly users table doesn't exist yet. Error:", e)

    # Let create_all handle creating the users table and any missing tables
    Base.metadata.create_all(bind=engine)
    
    # Try altering again if it failed before due to missing users table
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);"))
            conn.commit()
            print("Ensured user_id on scan_history.")
        except Exception as e:
            conn.rollback()
            print("Error adding user_id:", e)

if __name__ == "__main__":
    reset_and_update()
