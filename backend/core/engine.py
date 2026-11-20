from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any

def reconcile_totals(calculated_total: float, expected_total: float) -> Dict[str, Any]:
    """
    Compares the calculated billing total against the expected invoice total
    using Decimal arithmetic to avoid floating-point rounding bugs.
    """
    calc = Decimal(str(calculated_total)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    exp = Decimal(str(expected_total)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    diff = abs(exp - calc)

    return {
        "calculated_total": float(calc),
        "expected_total": float(exp),
        "difference": float(diff),
        "is_reconciled": diff == Decimal("0.00"),
    }

def flag_anomalies(records: List[Dict[str, Any]], threshold: float = 7000.0) -> Dict[str, Any]:
    """
    Rule-based anomaly detector. Flags any billing line item exceeding the threshold.
    """
    flagged = [r for r in records if float(r.get("cost", 0)) > threshold]
    return {
        "anomalies_found": len(flagged),
        "rule_triggered": f"Single record cost exceeds ₹{threshold:.2f} threshold",
        "details": flagged,
    }
