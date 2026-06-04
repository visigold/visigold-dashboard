import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { FileText, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { generateMonthlyPDF } from "@/lib/generatePdf";

export default function ReportsPage() {
  const { selectedClientId } = useClientContext();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [comment, setComment] = useState("");

  const { data: reports, refetch } = trpc.reports.list.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: clientData } = trpc.clients.get.useQuery(
    { id: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: stats } = trpc.dashboard.stats.useQuery(
    { clientId: selectedClientId!, month: selectedMonth },
    { enabled: !!selectedClientId }
  );

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Statistiques calculées — ${data.totalScans} scans, ${data.totalReviews} avis`);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la génération"),
  });

  const handleGeneratePDF = async () => {
    if (!selectedClientId || !clientData) return;
    setGeneratingPdf(true);
    try {
      // First save stats to DB
      const result = await generateMutation.mutateAsync({ clientId: selectedClientId, month: selectedMonth });
      // Then generate PDF
      generateMonthlyPDF({
        clientName: clientData.name,
        month: selectedMonth,
        totalScans: result.totalScans,
        totalReviews: result.totalReviews,
        avgRating: result.avgRating.toFixed(1),
        completionRate: Math.round(result.completionRate),
        scanTraffic: stats?.scanTraffic ?? [],
        comment: comment.trim() || undefined,
      });
      toast.success("PDF téléchargé avec succès !");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadExisting = (report: typeof reports extends (infer T)[] | undefined ? T : never) => {
    if (!clientData) return;
    generateMonthlyPDF({
      clientName: clientData.name,
      month: report.month,
      totalScans: report.totalScans,
      totalReviews: report.totalReviews,
      avgRating: report.avgRating ?? "0.0",
      completionRate: Math.round(Number(report.quizCompletionRate ?? 0)),
      scanTraffic: [],
    });
  };

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Sélectionnez un client pour voir les rapports.</p>
      </div>
    );
  }

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
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Générer un rapport mensuel PDF</h3>

        {/* Champ commentaire personnalisé */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
            💬 Message personnalisé pour le client
            <span className="text-gray-400 font-normal ml-1">(optionnel — apparaitra dans le PDF)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: Bravo pour votre note de 4.8 ce mois-ci ! Vos clients apprécient particulièrement votre accueil. Continuez ainsi !"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26522] resize-none"
          />
          {comment.trim() && (
            <p className="text-xs text-[#f26522] mt-1 font-medium">
              ✓ Ce message apparaîtra dans une zone encadrée orange dans le PDF.
            </p>
          )}
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {format(new Date(m + "-01"), "MMMM yyyy", { locale: fr })}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPdf || generateMutation.isPending}
            className="flex items-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {generatingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Générer et télécharger le PDF
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Le rapport PDF sera téléchargé directement sur votre ordinateur avec le logo Visigold, les KPIs et le graphique de scans.
        </p>
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
                  Aucun rapport généré. Cliquez sur "Générer et télécharger le PDF" pour créer le premier.
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
                    <button
                      onClick={() => handleDownloadExisting(report)}
                      className="flex items-center gap-1 text-[#1a3a6b] hover:text-[#f26522] text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Télécharger PDF
                    </button>
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
