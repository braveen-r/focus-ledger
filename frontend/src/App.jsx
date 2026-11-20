import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  Wallet,
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [expectedTotal, setExpectedTotal] = useState("25000");
  const [threshold, setThreshold] = useState("7000");
  const [results, setResults] = useState(null);
  const [serviceCosts, setServiceCosts] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#B21318', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const fetchAnomalies = async (customThreshold) => {
    try {
      const res = await axios.get(`http://localhost:8001/api/v1/analytics/anomalies?threshold=${customThreshold}`);
      setAnomalies(res.data);
    } catch (error) {
      console.error("Failed to fetch anomalies:", error);
    }
  };

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
        const analyticsRes = await axios.get("http://localhost:8001/api/v1/analytics/service-costs");
        setServiceCosts(analyticsRes.data);
        await fetchAnomalies(threshold);
      }
    } catch (error) {
      alert("Upload failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdUpdate = async (e) => {
    const newVal = e.target.value;
    setThreshold(newVal);
    if (results && newVal !== "") {
      await fetchAnomalies(newVal);
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await axios.get("http://localhost:8001/api/v1/reports/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `focusledger-audit-report-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-primary/30">
      <header className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Wallet className="text-primary" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FocusLedger</h1>
            <p className="text-sm text-gray-400">FinOps Cloud Cost Reconciliation</p>
          </div>
        </div>

        <button
          onClick={handleExportReport}
          disabled={!results}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#242424] border border-gray-700 hover:border-primary/50 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={16} className="text-primary" />
          Export Audit Report (JSON)
        </button>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="col-span-1 md:col-span-2 bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            Verification Center
          </h2>

          <form onSubmit={handleUpload} className="mb-8 flex flex-wrap gap-4 items-end bg-[#0A0A0A] p-5 rounded-lg border border-gray-800">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Upload Bill (CSV)</label>
              <label className="flex items-center gap-3 px-4 py-2.5 bg-[#1A1A1A] border border-gray-700 hover:border-primary/50 cursor-pointer rounded-lg transition-all group">
                <UploadCloud size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-sm text-gray-300 truncate font-mono">
                  {file ? file.name : "Select billing file..."}
                </span>
                <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
              </label>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium text-gray-400 mb-2">Expected Total</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={expectedTotal}
                  onChange={(e) => setExpectedTotal(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg py-2.5 pl-8 pr-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-[#911014] text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Reconcile"}
            </button>
          </form>

          {results ? (
            <div className="space-y-4">
              <div className={`p-5 rounded-lg border flex items-start gap-4 ${results.reconciliation.is_reconciled ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-primary/10 border-primary/30'}`}>
                {results.reconciliation.is_reconciled ? (
                  <CheckCircle className="text-emerald-500 mt-0.5" size={24} />
                ) : (
                  <XCircle className="text-primary mt-0.5" size={24} />
                )}
                <div>
                  <h3 className={`text-lg font-bold ${results.reconciliation.is_reconciled ? 'text-emerald-400' : 'text-primary'}`}>
                    {results.reconciliation.is_reconciled ? "Reconciled (Verified)" : "Reconciliation Failed"}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Variance detected: <span className="font-mono">₹{results.reconciliation.difference}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-sm px-2">
                <p className="text-gray-400">Valid Records: <span className="text-white font-medium">{results.valid_records}</span></p>
                <p className="text-gray-400">Quarantined: <span className="text-amber-400 font-medium">{results.quarantined_records}</span></p>
              </div>
            </div>
          ) : (
            <div className="h-40 border-2 border-dashed border-gray-800 bg-[#0A0A0A] rounded-xl flex flex-col items-center justify-center text-gray-500 gap-3">
              <UploadCloud size={32} className="text-gray-700" />
              <p className="text-sm">Upload a billing CSV to initialize engine</p>
            </div>
          )}
        </section>

        <section className="bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Cost Overview</h2>

          <div className="p-5 bg-[#0A0A0A] border border-gray-800 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-lg"></div>
            <p className="text-sm text-gray-400 font-medium mb-1">Total Calculated Spend</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              ₹{results ? results.reconciliation.calculated_total : "0.00"}
            </p>
          </div>

          <div className="p-5 bg-[#0A0A0A] border border-gray-800 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-lg"></div>
            <p className="text-sm text-gray-400 font-medium mb-1">Quarantined Cost</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              ₹{results ? results.quarantined_missing_cost : "0.00"}
            </p>
          </div>
        </section>

        {serviceCosts.length > 0 && (
          <section className="col-span-1 md:col-span-1 bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Cost by Service</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceCosts} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="total_cost" nameKey="service_name" stroke="none">
                    {serviceCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#262626', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {results && anomalies && (
          <section className="col-span-1 md:col-span-2 bg-[#121212] p-6 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-amber-500 flex items-center gap-2">
                <AlertTriangle size={20} />
                Suspicious Spending Detected ({anomalies.anomalies_found})
              </h2>

              <div className="flex items-center gap-2 bg-[#0A0A0A] border border-gray-800 px-3 py-1.5 rounded-lg">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Threshold (₹):</span>
                <input
                  type="number"
                  value={threshold}
                  onChange={handleThresholdUpdate}
                  className="w-24 bg-[#1A1A1A] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {anomalies.anomalies_found > 0 ? (
              <div className="bg-[#0A0A0A] rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1A1A1A] border-b border-gray-800 text-gray-400">
                    <tr>
                      <th className="p-4 font-medium">Record ID</th>
                      <th className="p-4 font-medium">Service</th>
                      <th className="p-4 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {anomalies.details.map((anomaly, idx) => (
                      <tr key={idx} className="hover:bg-[#1A1A1A]/50 transition-colors">
                        <td className="p-4 font-mono text-gray-500 text-xs">{anomaly.record_id}</td>
                        <td className="p-4 text-gray-300">{anomaly.service_name}</td>
                        <td className="p-4 text-right text-amber-500 font-bold font-mono">₹{anomaly.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 bg-[#0A0A0A] p-4 rounded-lg border border-gray-800">
                No records exceed the ₹{threshold} threshold.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
