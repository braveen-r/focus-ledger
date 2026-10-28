import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function App() {
  const [file, setFile] = useState(null);
  const [expectedTotal, setExpectedTotal] = useState("25000");
  const [results, setResults] = useState(null);
  const [serviceCosts, setServiceCosts] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#B21318', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expected_total", expectedTotal);

    try {
      const response = await axios.post("http://localhost:8001/api/v1/upload", formData);
      setResults(response.data);

      if (response.data.valid_records > 0) {
        // Fetch Service Costs
        const analyticsRes = await axios.get("http://localhost:8001/api/v1/analytics/service-costs");
        setServiceCosts(analyticsRes.data);
        
        // Fetch Anomalies
        const anomaliesRes = await axios.get("http://localhost:8001/api/v1/analytics/anomalies");
        setAnomalies(anomaliesRes.data);
      }
    } catch (error) {
      alert("Upload failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <header className="flex justify-between items-center border-b border-surface pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">FocusLedger</h1>
          <p className="text-sm text-gray-400">FinOps Cloud Cost Reconciliation</p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="col-span-1 md:col-span-2 bg-surface p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Verification Center</h2>
          
          <form onSubmit={handleUpload} className="mb-6 flex gap-4 items-end bg-background p-4 rounded-md border border-gray-800">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Upload Bill (CSV)</label>
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Total (₹)</label>
              <input type="number" value={expectedTotal} onChange={(e) => setExpectedTotal(e.target.value)} className="bg-surface border border-gray-700 rounded px-3 py-1 text-white" />
            </div>
            <button type="submit" disabled={loading} className="bg-primary hover:bg-primaryHover text-white px-4 py-1.5 rounded-md font-semibold transition-colors disabled:opacity-50">
              {loading ? "Processing..." : "Reconcile"}
            </button>
          </form>

          {results ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-md border ${results.reconciliation.is_reconciled ? 'bg-success/10 border-success text-success' : 'bg-primary/10 border-primary text-primary'}`}>
                <h3 className="text-lg font-bold">
                  {results.reconciliation.is_reconciled ? "✅ Reconciled (Verified)" : "❌ Reconciliation Failed"}
                </h3>
                <p className="text-sm mt-1">Difference: ₹{results.reconciliation.difference}</p>
              </div>
              <p className="text-gray-300">Valid Records: {results.valid_records} | Quarantined: {results.quarantined_records}</p>
            </div>
          ) : (
            <div className="h-32 border-2 border-dashed border-gray-700 rounded-md flex items-center justify-center text-gray-500">
              Upload a bill to see reconciliation status
            </div>
          )}
        </section>

        <section className="bg-surface p-6 rounded-lg border border-gray-800 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Cost Overview</h2>
          <div className="p-4 bg-background rounded-md">
            <p className="text-sm text-gray-400">Total Calculated Spend</p>
            <p className="text-2xl font-bold text-success">
              ₹{results ? results.reconciliation.calculated_total : "0.00"}
            </p>
          </div>
          <div className="p-4 bg-background rounded-md">
            <p className="text-sm text-gray-400">Quarantined Cost</p>
            <p className="text-2xl font-bold text-primary">
              ₹{results ? results.quarantined_missing_cost : "0.00"}
            </p>
          </div>
        </section>

        {serviceCosts.length > 0 && (
          <section className="col-span-1 md:col-span-1 bg-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-6">Cost by Service</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceCosts} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total_cost" nameKey="service_name">
                    {serviceCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#111111', borderColor: '#333' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {anomalies && anomalies.anomalies_found > 0 && (
          <section className="col-span-1 md:col-span-2 bg-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-warning flex items-center gap-2">
              ⚠️ Suspicious Spending Detected ({anomalies.anomalies_found})
            </h2>
            <div className="bg-background rounded-md border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface border-b border-gray-800">
                  <tr>
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Service</th>
                    <th className="p-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.details.map((anomaly, idx) => (
                    <tr key={idx} className="border-b border-gray-800 last:border-0">
                      <td className="p-3 font-mono text-gray-400">{anomaly.record_id}</td>
                      <td className="p-3">{anomaly.service_name}</td>
                      <td className="p-3 text-right text-warning font-bold">₹{anomaly.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">Trigger: {anomalies.rule_triggered}</p>
          </section>
        )}
      </main>
    </div>
  );
}