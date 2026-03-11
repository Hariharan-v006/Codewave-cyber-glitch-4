Project Development Document
SafeScan – Product Authenticity & Ingredient Safety Checker (Web Application)
1. Project Overview

SafeScan is a web-based consumer safety platform that allows users to scan or enter a product barcode to verify:

Product authenticity

Ingredient safety

Expiry status

The system retrieves product information directly from online open product databases and performs real-time analysis of ingredients and expiry to provide a safety report to consumers.

This solution improves consumer awareness, transparency, and safer purchasing decisions.

2. Problem Statement

Consumers frequently purchase packaged foods and cosmetics without knowing:

Whether the product is genuine

Whether the ingredients are harmful

Whether the product is expired

Manual checking of labels is difficult and many consumers lack knowledge of chemical ingredients.

SafeScan addresses this by providing instant safety analysis through a simple web interface.

3. Solution

The system will:

Allow users to scan or enter a product barcode.

Retrieve product information from online open product databases.

Extract the ingredient list and product details.

Analyze ingredients using an ingredient safety database.

Detect expiry status if available.

Generate a product safety report with warnings and safety score.

4. Target Users

Primary users:

Consumers buying packaged food

Cosmetic product users

Secondary users:

Retail stores

Consumer safety organizations

5. Platform

Application type:

Web Application

Accessible via:

Desktop browser

Mobile browser

Main features available through:

Product barcode scanning (camera)

Manual barcode entry

6. External Data Sources

Instead of storing product data locally, the system will use open product APIs.

Food products database

Open Food Facts

API example: https://world.openfoodfacts.org/api/v0/product/{barcode}.json

Provides:

Product name

Brand

Ingredients

Nutrition data

Manufacturing information

Cosmetic products database

Open Beauty Facts

Provides:

Cosmetic ingredients

Product details

Safety information

7. System Architecture:
User (Browser)
      │
      │ Scan / Enter Barcode
      ▼
Frontend Web Application
      │
      ▼
Backend API Server
      │
      ├ Query Online Product Database
      │
      ├ Extract Ingredients
      │
      ├ Run Ingredient Safety Analysis
      │
      └ Generate Safety Score
      │
      ▼
Product Safety Report


8. Core Functional Modules
Module 1 – Barcode Scanner

Users can scan the barcode using their device camera.

Functionality:

Access device camera

Detect barcode

Extract barcode number

Alternative option:

Manual barcode entry

Example barcode:8901030895113

Module 2 – Product Data Retrieval

The backend sends a request to the product database API.

Example request:

GET https://world.openfoodfacts.org/api/v0/product/8901030895113.json

Response contains:

product name

brand

ingredient list

product categories

Module 3 – Ingredient Extraction

The system extracts ingredient names from the API response.

Example:

Ingredients:
Water
Sodium Lauryl Sulfate
Parabens
Aloe Extract

These ingredients are passed to the ingredient safety analysis module.

Module 4 – Ingredient Safety Analysis

The system checks each ingredient against a local ingredient safety database.

Example safety classification:

Ingredient	Risk Level
Water	Safe
Parabens	Moderate Risk
Sodium Lauryl Sulfate	Harmful
Aloe Extract	Safe
Module 5 – Expiry Detection

If expiry information is available from the product data:

The system calculates:

Expiry date

Remaining validity

Example output:

Expiry Date: 12 August 2026
Status: Valid

If expiry information is unavailable:

Expiry Status: Not available
Module 6 – Product Authenticity Check

Authenticity is verified by:

Matching barcode with official database records

Confirming brand and product existence

Output:

Status	Meaning
Verified	Product exists in official database
Unknown	Product not found
Suspicious	Conflicting data
Module 7 – Safety Score Calculation

The system calculates a score based on:

ingredient risk levels

expiry status

product authenticity

Example scoring logic:

Safe ingredients → +1
Moderate ingredients → 0
Harmful ingredients → -1
Expired product → -3
Unknown product → -2

Example output:

Product Safety Score: 7 / 10
9. Website User Interface
Homepage

Components:

App introduction

Scan barcode button

Manual barcode entry

Example products

Scanner Page

Features:

Camera view

Barcode detection

Capture button

Product Report Page

Displays:

Product Name
Brand
Authenticity Status
Ingredient Safety Analysis
Expiry Status
Safety Score
Ingredient Details Page

Shows detailed information:

Ingredient	Risk Level	Description
Parabens	Moderate Risk	Preservative used in cosmetics
Sodium Lauryl Sulfate	Harmful	Can irritate skin
10. Website Workflow

Step 1
User opens SafeScan website.

Step 2
User clicks Scan Product.

Step 3
Camera scans barcode.

Step 4
Barcode number is extracted.

Step 5
Backend sends request to product API.

Step 6
Product details and ingredients are retrieved.

Step 7
System analyzes ingredient safety.

Step 8
Expiry information is checked.

Step 9
Safety score is generated.

Step 10
Full product safety report is displayed to the user.

11. Database Requirements

Since product data comes from APIs, only minimal local database storage is required.

Tables required:

Ingredient Safety Database

Fields:

IngredientName
RiskLevel
Description
HealthEffects
Scan History Table

Fields:

ScanID
Barcode
ProductName
ScanDate
SafetyScore
12. Technology Stack

Frontend:

HTML

CSS

JavaScript

React (optional)

Backend:

Python (FastAPI / Flask)

APIs:

OpenFoodFacts API

OpenBeautyFacts API

Barcode scanning:

JavaScript barcode scanning libraries

Database:

PostgreSQL

Hosting:

Cloud hosting (AWS / Vercel / Render)

13. Performance Requirements

System response time:

Product lookup < 2 seconds

Barcode detection accuracy:

95%

System availability:

24/7 web access

14. Security Requirements

Secure API calls

Input validation

Protection against malicious requests

15. Future Enhancements

Potential improvements include:

AI-based fake packaging detection

Product comparison tool

Community reporting of fake products

Nutrition health scoring

Browser extension for e-commerce verification