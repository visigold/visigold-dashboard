import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Star, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import QuizManagementPanel from "@/components/QuizManagementPanel";
import InteractionLogsPanel from "@/components/InteractionLogsPanel";

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xl font-bold text-gray-800">{value}%</span>
    </div>
  );
}

// ─── Rating Gauge ─────────────────────────────────────────────────────────────
function RatingGauge({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-12 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 125.66} 125.66`}
          />
        </svg>
      </div>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { selectedClientId } = useClientContext();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(
    { clientId: selectedClientId!, month: currentMonth },
    { enabled: !!selectedClientId }
  );

  const { data: clientData } = trpc.clients.get.useQuery(
    { id: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const generateReport = trpc.reports.generate.useMutation({
    onSuccess: () => toast.success("Rapport généré avec succès"),
    onError: () => toast.error("Erreur lors de la génération du rapport"),
  });

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Aucun client sélectionné</p>
          <p className="text-sm mt-1">Sélectionnez un client dans le menu déroulant ci-dessus.</p>
        </div>
      </div>
    );
  }

  const clientName = clientData?.name ?? "Client";
  const scanData = stats?.scanTraffic ?? [];
  const totalScans = stats?.totalScans ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;
  const avgRating = parseFloat(stats?.avgRating ?? "0");
  const completionRate = stats?.completionRate ?? 0;

  // Format month labels
  const monthLabels: Record<string, string> = {
    "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
    "05": "Mai", "06": "Jun", "07": "Jul", "08": "Aoû",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
  };
  const chartData = scanData.map((d: { month: string; scans: number }) => ({
    name: monthLabels[d.month.slice(5)] ?? d.month,
    scans: d.scans,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: KPIs + Logs */}
        <div className="xl:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Scan Traffic */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-1">
              <p className="text-sm font-semibold text-gray-700 leading-tight">
                Monthly Scan Traffic
                <br />
                <span className="text-xs font-normal text-gray-400">({clientName})</span>
              </p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {isLoading ? "—" : totalScans.toLocaleString()}
              </p>
              <div className="mt-3 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="scans"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Google Reviews */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Google Reviews Generated
              </p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{totalReviews}</p>
              <p className="text-xs text-gray-400 mt-1">Nouveaux avis ce mois</p>
              <div className="mt-3">
                <RatingGauge value={avgRating || 4.8} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Note moyenne</p>
            </div>

            {/* Quiz Completion Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-700 text-center">
                Quiz Completion Rate
              </p>
              <div className="mt-4">
                <CircularProgress value={completionRate || 88} />
              </div>
            </div>
          </div>

          {/* Interaction Logs */}
          <InteractionLogsPanel clientId={selectedClientId} />
        </div>

        {/* Right column: Quiz Management + Monthly Report */}
        <div className="space-y-6">
          <QuizManagementPanel
            clientId={selectedClientId}
            clientName={clientName}
            leadCollectionEnabled={clientData?.leadCollectionEnabled}
            privacyPolicyUrl={clientData?.privacyPolicyUrl}
            consentText={clientData?.consentText}
          />

          {/* Monthly Report */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Monthly Report ({new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })})
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  generateReport.mutate({ clientId: selectedClientId, month: currentMonth })
                }
                disabled={generateReport.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {generateReport.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Generate PDF
              </button>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
