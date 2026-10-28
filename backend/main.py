from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import duckdb
import pandas as pd
import contextlib
import io
from validator import validate_billing_dataframe
from fastapi.middleware.cors import CORSMiddleware

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # CHANGED: Now saves to a physical file in the backend folder
    app.state.db = duckdb.connect(database='focusledger.duckdb', read_only=False)
    app.state.db.execute("""
        CREATE TABLE IF NOT EXISTS billing_records (
            record_id VARCHAR PRIMARY KEY,
            billing_period VARCHAR,
            usage_date DATE,
            service_name VARCHAR,
            account_team VARCHAR,
            cost DOUBLE,
            currency VARCHAR,
            tags VARCHAR
        );
    """)
    yield
    app.state.db.close()

app = FastAPI(title="FocusLedger API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your React app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "duckdb_connected"}

@app.post("/api/v1/upload")
async def upload_billing_file(
    file: UploadFile = File(...),
    expected_total: float = Form(...)
):
    """Parses the CSV, quarantines bad rows, and reconciles the bill."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        # 1. Read CSV into Pandas
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # 2. Validate and Quarantine
        valid_df, quarantined_df = validate_billing_dataframe(df)
        
        # 3. Calculate Independent Totals
        calculated_total = valid_df['cost'].sum() if not valid_df.empty else 0.0
        
        # FIX: Safely coerce quarantined costs to numbers (ignoring strings like 'abc')
        quarantined_total = pd.to_numeric(quarantined_df['cost'], errors='coerce').sum() if not quarantined_df.empty else 0.0
        
        # 4. Reconciliation Math (Tolerance of 0.05)
        difference = abs(expected_total - calculated_total)
        is_reconciled = difference <= 0.05

        # 5. Store valid records in DuckDB
        if not valid_df.empty:
            app.state.db.execute("DELETE FROM billing_records") # <-- ADD THIS LINE to wipe old data
            app.state.db.execute("INSERT OR IGNORE INTO billing_records SELECT * FROM valid_df")

        return {
            "status": "success",
            "reconciliation": {
                "expected_total": expected_total,
                "calculated_total": round(calculated_total, 2),
                "difference": round(difference, 2),
                "is_reconciled": bool(is_reconciled)
            },
            "records_processed": len(df),
            "valid_records": len(valid_df),
            "quarantined_records": len(quarantined_df),
            "quarantined_missing_cost": round(quarantined_total, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
@app.get("/api/v1/analytics/service-costs")
async def get_service_costs():
    """Aggregates total cost by cloud service for the frontend charts."""
    try:
        query = """
            SELECT service_name, SUM(cost) as total_cost 
            FROM billing_records 
            GROUP BY service_name 
            ORDER BY total_cost DESC
        """
        results = app.state.db.execute(query).df()
        return results.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/analytics/anomalies")
async def detect_anomalies():
    """Detects suspicious spending (basic rule-based detection for MVP)."""
    try:
        query = """
            SELECT record_id, service_name, cost, usage_date 
            FROM billing_records 
            WHERE cost > 7000
            ORDER BY cost DESC
        """
        results = app.state.db.execute(query).df()
        return {
            "anomalies_found": len(results),
            "details": results.to_dict(orient="records"),
            "rule_triggered": "Single record cost exceeds ₹7000 threshold"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
