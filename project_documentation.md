# SafeScan - Project Codebase Documentation

This document provides a detailed overview and line-by-line explanation of all code files present in the SafeScan project, separated by their respective modules (Backend and Frontend).

## 1. Backend Module (FastAPI & SQLAlchemy)

The backend is built with Python 3, utilizing FastAPI for the REST API and SQLAlchemy for ORM database interactions. 

### 1.1 `backend/database.py`
**Purpose**: Handles the database connection and session management.
**Details**:
- Imports `create_engine`, `declarative_base`, and `sessionmaker` from SQLAlchemy.
- Loads environment variables using `dotenv` to retrieve `DATABASE_URL` (defaulting to a local PostgreSQL connection string).
- Sets up the `engine` which maintains the connection pool to the database.
- `SessionLocal` is a factory for generating new database sessions (`autocommit=False, autoflush=False`).
- `Base = declarative_base()` creates a base class for the SQLAlchemy models to inherit from.
- `get_db()` is a dependency utility used by FastAPI to provide a database session per request and ensure it closes (`db.close()`) after the request is finished.

### 1.2 `backend/models.py`
**Purpose**: Defines the database schema using SQLAlchemy ORM models.
**Details**:
- Inherits from `Base` defined in `database.py`.
- **`IngredientSafety` Class**: Maps to the `ingredient_safety` table. It stores ingredient safety criteria. Fields:
  - `id`: Primary key.
  - `ingredient_name`: Unique string representing the ingredient.
  - `risk_level`: String enum (Safe, Moderate Risk, Harmful).
  - `description`: String describing the ingredient.
  - `health_effects`: Optional string for extended detail.
- **`ScanHistory` Class**: Maps to the `scan_history` table. It keeps a record of all product scans. Fields:
  - `id`: Primary key.
  - `barcode`: The scanned barcode string.
  - `product_name`: The resolved name of the product.
  - `scan_date`: Timestamp of the scan (defaults to `datetime.utcnow`).
  - `safety_score`: A float representing the calculated safety score of the product.

### 1.3 `backend/schemas.py`
**Purpose**: Defines Pydantic models (data transfer objects) used for data validation, serialization, and API request/response structures.
**Details**:
- **`IngredientSafetyBase` & `IngredientSafetyCreate` & `IngredientSafety`**: Used for ingredient data handling. The last one includes the `id` and has `from_attributes = True` for compatibility with SQLAlchemy objects.
- **`ScanHistoryBase` & `ScanHistoryCreate` & `ScanHistory`**: Used for recording scan history.
- **`ProductReport`**: The most critical response schema. It aggregates the product's barcode, name, brand, authenticity string, a list of validated `IngredientSafety` objects, the parsed `expiry_status`, and the overall `safety_score`.

### 1.4 `backend/main.py`
**Purpose**: The core application logic, routing, and API integration.
**Details**:
- **App Initialization**: Sets up `app = FastAPI()` and configures CORS middleware (`CORSMiddleware`) to allow frontend requests (`allow_origins=["*"]`).
- **Database Initialization**: `models.Base.metadata.create_all(bind=engine)` creates the DB tables at runtime.
- **`GET /api/product/{barcode}`**: 
  - **Data Fetching**: It sequentially calls `https://world.openfoodfacts.org` and if that fails, `https://world.openbeautyfacts.org` to fetch product details formatted in JSON asynchronously using `httpx.AsyncClient`.
  - **Fallback Scraping**: If the open databases fail to return an ingredient list, the code falls back to scraping Yahoo Search (`https://search.yahoo.com/search?p=...`) with BeautifulSoup4 to try and extract textual ingredients. If parsing fails, it returns an "Unknown Product" schema.
  - **Ingredient Analysis**: The extracted ingredients string is parsed (split by commas/periods). It queries the local DB to check the risk level of each ingredient. The base score starts at 10.0 and decays relative to ingredient risks: `Harmful` (-1.0), `Moderate Risk` (-0.5), or `Unknown` (-0.2).
  - **Expiry Parsing**: It searches the barcode for a GS1-128 expiration date format using Regex (`17(\d{6})`) and converts it to a standard 'YYYY-MM-DD' formatted date text.
  - **History Saving**: Logs the search context into the DB's `ScanHistory` table.
  - Returns the compiled `schemas.ProductReport` object.
- **`GET /api/ingredients`**: Basic endpoint to list 100 documented ingredient safeties using pagination parameters.

### 1.5 `backend/seed.py`
**Purpose**: A stand-alone script to pre-populate the database with dummy data.
**Details**:
- Establishes a connection to the database.
- Drops/creates tables (`create_all`).
- Checks if the table already has records; if not, inserts seed mappings of common ingredients like 'Water' (Safe), 'Parabens' (Moderate Risk), and 'Sodium Lauryl Sulfate' (Harmful) along with their contextual descriptions.
- Commits the session. Required to run manually before first application use.

---

## 2. Frontend Module (React & Vite)

The frontend is built utilizing Vite as the bundler, React as the framework, and React Router for Client-Side Routing.

### 2.1 `frontend/package.json` & `frontend/vite.config.js`
**Purpose**: Dependency and project configuration.
**Details**:
- Defines typical scripts (`dev`, `build`, `preview`).
- Core dependencies include `react`, `react-dom`, `react-router-dom` for application routing, `axios` for fetching backend data, and `html5-qrcode` to interface with the device camera for barcode scanning.
- `vite.config.js` sets up the `@vitejs/plugin-react` integration.

### 2.2 Global Context & CSS (`src/main.jsx`, `src/index.css`, `src/App.css`)
**Purpose**: Bootstrapping the app and providing styling.
**Details**:
- `src/main.jsx`: Simply wraps the `App` component within `<StrictMode>` and mounts it to the DOM's `#root`.
- `src/index.css`: Defines the global design variables (glassmorphism UI patterns). It uses CSS custom properties (`--primary`, `--danger`, etc.) and sets the global animated background gradient. It contains styles for floating `glass-panel` components, `status-badge` logic (to uniquely color 'safe', 'harmful', 'moderate' labels), and general button styling with hover transformations.
- `src/App.css`: Defines basic alignments and default Vite animation classes.

### 2.3 `src/App.jsx`
**Purpose**: Primary Routing Switch component.
**Details**:
- Implements `react-router-dom`'s `<Router>` and `<Routes>`.
- Contains the static application `<header>` presenting the "SafeScan" title (navigating back to home on click) and subtitle.
- Renders the following routes:
  - `/` -> `<Home />`
  - `/scan` -> `<Scanner />`
  - `/report/:barcode` -> `<Report />`

### 2.4 `src/pages/Home.jsx`
**Purpose**: The main landing page.
**Details**:
- Contains visual aesthetic boxes (100% Transparency, Real-time Analysis).
- Implements two primary navigation flows:
  - **Scan Button**: Navigates the user to the `/scan` Route via `useNavigate()`.
  - **Manual Entry Form**: An input field bounded by `useState`. Upon submitting (`handleManualSubmit`), pushes the router explicitly to `/report/${barcode}`.

### 2.5 `src/pages/Scanner.jsx`
**Purpose**: Interacts with the user's camera to decode physical barcodes.
**Details**:
- In the `useEffect` hook, initializes the `Html5QrcodeScanner` passing element id `"reader"` and configs (e.g., fps, qrbox size).
- The `scanner.render` registers a success callback: on barcode decode, stops the stream (`scanner.clear()`) and triggers a redirect to `/report/${decodedText}`.
- Included cleanup code in the `useEffect` return to prevent camera locking or unmount errors.
- Presents a visually padded fallback Cancel button if the user refuses camera permission or changes their mind.

### 2.6 `src/pages/Report.jsx`
**Purpose**: The result dashboard displaying the calculated backend safety analytics.
**Details**:
- Extracts the `{ barcode }` param from the React Router `useParams()`.
- Implements an asynchronous fetch in `useEffect` hitting `http://localhost:8000/api/product/${barcode}` using `axios`.
- Utilizes state variables (`loading`, `error`, `data`) to render distinct UI states:
  - **Loading State**: Displays an animating placeholder text ("Analyzing Product...").
  - **Error State**: Displays the caught exception (or a generic instruction text) alongside a back button.
  - **Success State**: 
    - Employs conditional styling to color the Safety Score metric (Green for >= 7, Yellow for >=4, Red for < 4).
    - Checks and displays Expiry Status if populated.
    - Presents an "Ingredient Analysis" section via `.map()`, generating aesthetic cards for each checked ingredient dynamically assigning distinct `<span className={...}>` color badges matching the string parsed enum (Safe, Moderate, Harmful).
