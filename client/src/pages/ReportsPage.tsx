import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { FileText, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReportsPage() {
  const { selectedClientId } = useClientContext();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: reports, refetch } = trpc.reports.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Rapport généré — ${data.totalScans} scans, ${data.totalReviews} avis`);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la génération"),
  });

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Sélectionnez un client pour voir les rapports.</p>
      </div>
    );
  }

  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reports</h2>

      {/* Generate section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Générer un rapport mensuel</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {format(new Date(m + "-01"), "MMMM yyyy", { locale: fr })}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generateMutation.mutate({ clientId: selectedClientId, month: selectedMonth })}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-5"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Generate PDF
          </button>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Historique des rapports</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Mois</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Scans</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Avis</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Note moy.</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Quiz %</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Généré le</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!reports || reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Aucun rapport généré. Cliquez sur "Generate PDF" pour créer le premier.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {format(new Date(report.month + "-01"), "MMMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.totalScans}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.totalReviews}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {report.avgRating ? `${report.avgRating} ★` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {report.quizCompletionRate ? `${report.quizCompletionRate}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    {report.pdfUrl ? (
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Données uniquement</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
