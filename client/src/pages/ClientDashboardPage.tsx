import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { LogOut, QrCode, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer le clientId du localStorage
  useEffect(() => {
    const storedClientId = localStorage.getItem("clientId");
    const token = localStorage.getItem("clientToken");

    if (!storedClientId || !token) {
      navigate("/client-login");
      return;
    }

    setClientId(Number(storedClientId));
  }, [navigate]);

  // Récupérer les stats du dashboard
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    clientId ? { clientId, month } : undefined,
    { enabled: !!clientId }
  );

  useEffect(() => {
    setIsLoading(statsLoading);
  }, [statsLoading]);

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientId");
    navigate("/client-login");
  };

  if (!clientId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord VISIGOLD</h1>
            <p className="text-sm text-gray-600 mt-1">Espace Client - Suivi de Performance</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner le mois
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Scans */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Scans Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalScans || 0}</p>
              </div>
              <QrCode className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avis Reçus</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalReviews || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Note Moyenne</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.avgRating || "0.0"}/5</p>
              </div>
              <BarChart3 className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          {/* Quiz Completion */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Taux Complétion Quiz</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completionRate || 0}%</p>
              </div>
              <PieChart className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scan Traffic Over Time */}
          {stats?.scanTraffic && stats.scanTraffic.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Scans</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.scanTraffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scans by Source */}
          {stats?.scansBySource && stats.scansBySource.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scans par Emplacement</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie data={stats.scansBySource} cx="50%" cy="50%" labelLine={false} label>
                  {stats.scansBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {stats.scansBySource.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-gray-700">{item.source}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Conseil :</strong> Les données affichées sont anonymes et conformes à la LPD. Aucune information personnelle n'est collectée.
          </p>
        </div>
      </main>
    </div>
  );
}
