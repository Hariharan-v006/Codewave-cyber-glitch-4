SafeScan – Next Development Phase Documentation
1. Overview

SafeScan is a barcode-based product safety analysis system that evaluates consumer products by analyzing their ingredient composition and calculating a health safety score.

The current system successfully performs:

Barcode scanning

Product data retrieval

Ingredient extraction

Ingredient safety comparison

Safety score generation

Scan history storage

However, several improvements are required to make the system more accurate, scalable, and production-ready.

This document explains the next development steps required to improve SafeScan.

2. Current System Limitations

The current system has the following issues:

2.1 Ingredient Parsing Errors

Ingredients retrieved from APIs contain complex structures such as:

Stabilizers (466, 440)
Flavour (Natural and Nature Identical Flavouring Substances)
Acidity Regulator (330)

The current parser splits ingredients simply using commas:

ingredients_text.split(",")

This causes incorrect parsing such as:

STABILIZERS (466
440)

This results in many incorrect ingredient entries.

2.2 Limited Ingredient Database

The current ingredient safety database contains only a few records such as:

Water
Parabens
Sodium Lauryl Sulfate
Sugar

However, real products contain E-numbers and specialized additives such as:

E330
E440
E466
E202
E110

Since these are missing from the database, the system marks them as Unknown.

2.3 Weak Safety Score Calculation

The current scoring algorithm is very basic:

start_score = 10

Harmful ingredient → -1
Moderate ingredient → -0.5
Unknown ingredient → -0.2

This scoring method does not consider:

Ingredient quantity

Multiple harmful ingredients

Ingredient types (color, preservative, sweetener)

2.4 Weak Expiry Detection

Currently expiry detection relies only on GS1-128 barcode patterns:

17(\d{6})

Most products do not include expiry information in their barcode.

2.5 Limited Product Information

The system currently returns only:

product name

ingredients

safety score

However, it could also include:

nutrition information

allergens

additives

product category

3. Development Goals

The next development phase aims to improve SafeScan in the following areas:

Accurate ingredient parsing

Large ingredient safety database

Advanced safety scoring algorithm

E-number detection

Better API data extraction

Improved frontend report visualization

Enhanced scan history analytics

4. Step 1 – Improve Ingredient Parsing
Problem

Ingredients frequently contain parentheses, percentages, and nested lists.

Example ingredient string:

Sugar, Concentrated Mango Pulp (5%), Acidity Regulator (330), Stabilizers (466, 440)

A simple comma split breaks the structure.

Solution

Use regex splitting that ignores commas inside parentheses.

Implementation

Replace:

ingredients = ingredients_text.split(",")

with:

import re

ingredients = re.split(r',(?![^(]*\))', ingredients_text)
ingredients = [i.strip() for i in ingredients if i.strip()]
Explanation

The regex:

,(?![^(]*\))

means:

Split by commas only if they are outside parentheses.

This preserves structures like:

Stabilizers (466, 440)
5. Step 2 – E-Number Detection System

Many ingredients appear as E-numbers.

Example:

330 → Citric Acid
440 → Pectin
466 → Carboxymethyl Cellulose

These must be converted to standard format.

Implementation

Add E-number extraction:

import re

def extract_e_numbers(text):
    matches = re.findall(r'\b\d{3}[a-z]?\b', text)
    return [f"E{m.upper()}" for m in matches]

Example:

input: "Acidity Regulator (330)"
output: E330

This allows the system to match E-numbers in the database.

6. Step 3 – Expand Ingredient Safety Database

The system must contain a large ingredient knowledge base.

Create entries for common additives.

Example additions:

Ingredient	Risk	Description
E330	Safe	Citric acid acidity regulator
E440	Safe	Pectin stabilizer
E466	Safe	Thickening agent
E202	Moderate	Potassium sorbate preservative
E110	Harmful	Sunset Yellow artificial dye
E960a	Safe	Stevia sweetener
Implementation

Update seed.py:

IngredientSafety(
    ingredient_name="E330",
    risk_level="Safe",
    description="Citric acid acidity regulator"
)

IngredientSafety(
    ingredient_name="E110",
    risk_level="Harmful",
    description="Artificial color linked to hyperactivity"
)

Run the seed script again.

7. Step 4 – Advanced Safety Scoring Algorithm

The scoring system should consider ingredient categories.

Example categories:

Category	Risk Impact
Artificial Color	High
Preservative	Medium
Sweetener	Medium
Natural Ingredient	Low
Improved Algorithm

Base score:

score = 10

Rules:

Harmful ingredient → -1.5
Moderate ingredient → -0.7
Unknown ingredient → -0.3
Safe ingredient → 0

If more than 3 harmful ingredients exist:

additional penalty = -1

Minimum score:

score >= 0
8. Step 5 – Improve Product Data Retrieval

The current system uses:

OpenFoodFacts API
OpenBeautyFacts API

You should also extract additional fields.

Example fields:

product_name
brand
ingredients
nutrition
allergens
additives
Example Response Structure
ProductReport
{
    barcode
    product_name
    brand
    authenticity
    ingredients
    expiry_status
    safety_score
    allergens
    additives
}
9. Step 6 – Improve Frontend Report UI

The current report shows ingredients but can be improved.

Add Safety Score Gauge

Display score visually:

8 – 10 → Green
5 – 7 → Yellow
0 – 4 → Red
Ingredient Risk Badges

Color code ingredient cards:

Safe → Green
Moderate → Yellow
Harmful → Red
Unknown → Grey
Ingredient Explanation Popup

Clicking an ingredient should show:

Ingredient description
Health effects
Common usage
10. Step 7 – Scan History Dashboard

The system already stores scan history.

Add analytics features.

Example statistics:

Total scans
Most scanned products
Average safety score
Most harmful ingredients detected
11. Step 8 – Add Authentication (Optional)

Future versions can include:

User accounts

Scan history per user

Personal health warnings

12. Final System Architecture
User
 │
 │ Scan Barcode
 ▼
Frontend (React)
 │
 │ API Request
 ▼
Backend (FastAPI)
 │
 ├── OpenFoodFacts API
 │
 ├── Ingredient Parser
 │
 ├── Ingredient Safety DB
 │
 ├── Safety Score Algorithm
 │
 └── Scan History Storage
 │
 ▼
PostgreSQL Database
 │
 ▼
Response to Frontend
 │
 ▼
Product Safety Report
13. Development Priority Order

Implement improvements in this order:

Phase 1 (Critical)

Fix ingredient parser

Add E-number detection

Expand ingredient database

Phase 2 (Core Improvements)

Improve safety scoring

Extract more API data

Phase 3 (UI Enhancements)

Ingredient explanations

Score visualization

Scan history analytics

14. Expected Final Result

After implementing these improvements SafeScan will:

Parse ingredients accurately

Recognize E-numbers

Analyze hundreds of additives

Provide better safety scoring

Display professional product reports

Maintain useful scan analytics

The system will become a real intelligent product safety analysis tool rather than a simple barcode scanner.