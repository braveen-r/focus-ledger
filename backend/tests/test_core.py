from core.engine import reconcile_totals, flag_anomalies

# Golden dataset representing a known valid cloud bill (Total = 25000.0)
GOLDEN_RECORDS = [
    {"record_id": "REC-001", "service_name": "AmazonEC2", "cost": 8000.0},
    {"record_id": "REC-002", "service_name": "AmazonS3", "cost": 2000.0},
    {"record_id": "REC-003", "service_name": "AmazonRDS", "cost": 10000.0},
    {"record_id": "REC-004", "service_name": "CloudFront", "cost": 5000.0},
]

def test_reconciliation_exact_match():
    """Golden test: Exact match must reconcile with 0.0 difference."""
    total = sum(r["cost"] for r in GOLDEN_RECORDS)
    result = reconcile_totals(calculated_total=total, expected_total=25000.0)
    assert result["is_reconciled"] is True
    assert result["difference"] == 0.0

def test_reconciliation_mismatch():
    """Tampered or mismatched bill must fail reconciliation and report exact variance."""
    result = reconcile_totals(calculated_total=24000.0, expected_total=25000.0)
    assert result["is_reconciled"] is False
    assert result["difference"] == 1000.0

def test_anomaly_detection_default_threshold():
    """Default threshold (7000) should flag EC2 (8000) and RDS (10000)."""
    result = flag_anomalies(GOLDEN_RECORDS, threshold=7000.0)
    assert result["anomalies_found"] == 2
    flagged_ids = [r["record_id"] for r in result["details"]]
    assert "REC-001" in flagged_ids
    assert "REC-003" in flagged_ids

def test_anomaly_detection_dynamic_threshold():
    """Raising threshold to 9000 should only flag RDS (10000)."""
    result = flag_anomalies(GOLDEN_RECORDS, threshold=9000.0)
    assert result["anomalies_found"] == 1
    assert result["details"][0]["record_id"] == "REC-003"
