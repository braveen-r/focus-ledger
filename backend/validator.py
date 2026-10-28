import pandera as pa
from pandera.typing import DataFrame, Series
import pandas as pd

# Define the strict FinOps CSV schema requirements
billing_schema = pa.DataFrameSchema(
    {
        "record_id": pa.Column(str, required=True, unique=True),
        "billing_period": pa.Column(str, checks=pa.Check.str_matches(r"^\d{4}-\d{2}$"), required=True),
        "usage_date": pa.Column(pa.DateTime, required=True),
        "service_name": pa.Column(str, checks=pa.Check.str_length(min_value=1), required=True),
        "account_team": pa.Column(str, nullable=True),
        "cost": pa.Column(float, required=True),
        "currency": pa.Column(str, checks=pa.Check.isin(["USD", "INR", "EUR"]), required=True),
        "tags": pa.Column(str, nullable=True),
    },
    strict="filter", 
    coerce=True      
)

def validate_billing_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Validates the dataframe. Returns (valid_records, quarantined_records).
    """
    try:
        valid_df = billing_schema.validate(df, lazy=True)
        return valid_df, pd.DataFrame(columns=df.columns)
    except pa.errors.SchemaErrors as err:
        error_indices = err.failure_cases['index'].dropna().unique()
        quarantined_df = df.loc[error_indices]
        valid_df_raw = df.drop(index=error_indices)
        
        # FIX: Re-run validation on the good rows to guarantee Pandas converts strings back to floats/dates
        valid_df = billing_schema.validate(valid_df_raw) if not valid_df_raw.empty else valid_df_raw
        return valid_df, quarantined_df