"use client";
import { useEffect, useState } from "react";
import api from "./utils/api";

// helper to render colored status badges
const StatusBadge = ({ status }) => {
  const colors = {
    completed: "bg-green-100 text-green-700 border-green-400",
    running: "bg-yellow-100 text-yellow-700 border-yellow-400 animate-pulse",
    failed: "bg-red-100 text-red-700 border-red-400",
  };

  return (
    <span
      className={`border rounded-full px-3 py-1 text-xs font-medium capitalize ${
        colors[status] || "bg-gray-100 text-gray-600 border-gray-300"
      }`}
    >
      {status}
    </span>
  );
};

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // auto-refresh every 60 seconds
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get("/import-history"); // your API route
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return <p className="p-4 text-gray-500 text-center">Loading import history...</p>;

  // compute summary stats
  const summary = logs.reduce(
    (acc, l) => {
      acc.totalFetched += l.totalFetched || 0;
      acc.newJobs += l.newJobs || 0;
      acc.failedJobs += l.failedJobs || 0;
      return acc;
    },
    { totalFetched: 0, newJobs: 0, failedJobs: 0 }
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Import Dashboard</h1>

        {/* summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-700 font-semibold">Total Fetched</p>
            <p className="text-2xl font-bold text-blue-900">{summary.totalFetched}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <p className="text-sm text-green-700 font-semibold">New Jobs</p>
            <p className="text-2xl font-bold text-green-900">{summary.newJobs}</p>
          </div>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
            <p className="text-sm text-red-700 font-semibold">Failed Jobs</p>
            <p className="text-2xl font-bold text-red-900">{summary.failedJobs}</p>
          </div>
        </div>

        {/* history table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Feed URL</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Total</th>
                <th className="p-2 text-center text-green-600">New</th>
                <th className="p-2 text-center text-blue-600">Updated</th>
                <th className="p-2 text-center text-red-600">Failed</th>
                <th className="p-2 text-center">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-blue-700 max-w-[320px] truncate">{log.feedUrl}</td>
                  <td className="p-2 text-center">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="p-2 text-center">{log.totalFetched}</td>
                  <td className="p-2 text-center">{log.newJobs}</td>
                  <td className="p-2 text-center">{log.updatedJobs}</td>
                  <td className="p-2 text-center">{log.failedJobs}</td>
                  <td className="p-2 text-center">
                    {new Date(log.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Auto-refreshing every 60 seconds • Last updated {new Date().toLocaleTimeString()}
        </p>
      </div>
    </main>
  );
}
