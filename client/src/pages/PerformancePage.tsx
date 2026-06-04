import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Star, CheckSquare, Activity } from "lucide-react";

export default function PerformancePage() {
  const { selectedClientId } = useClientContext();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: stats } = trpc.dashboard.stats.useQuery(
    { clientId: selectedClientId!, month: currentMonth },
    { enabled: !!selectedClientId }
  );

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Sélectionnez un client pour voir les performances.</p>
      </div>
    );
  }

  const monthLabels: Record<string, string> = {
    "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
    "05": "Mai", "06": "Jun", "07": "Jul", "08": "Aoû",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
  };

  const chartData = (stats?.scanTraffic ?? []).map((d: { month: string; scans: number }) => ({
    name: monthLabels[d.month.slice(5)] ?? d.month,
    scans: d.scans,
  }));

  const kpis = [
    { label: "Total scans", value: stats?.totalScans ?? 0, icon: Activity, color: "text-[#1a3a6b]", bg: "bg-blue-50" },
    { label: "Avis générés", value: stats?.totalReviews ?? 0, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Note moyenne", value: stats?.avgRating ?? "0.0", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Taux complétion quiz", value: `${stats?.completionRate ?? 0}%`, icon: CheckSquare, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Performance</h2>

      {/* Résumé KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Évolution des scans mensuels</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="scans" stroke="#1a3a6b" strokeWidth={2} dot={{ r: 4 }} name="Scans" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Scans par mois (barres)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="scans" fill="#1a3a6b" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
