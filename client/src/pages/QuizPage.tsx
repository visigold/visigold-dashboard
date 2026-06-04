import { useClientContext } from "@/contexts/ClientContext";
import QuizManagementPanel from "@/components/QuizManagementPanel";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#1a3a6b", "#f26522", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4"];

export default function QuizPage() {
  const { selectedClientId } = useClientContext();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: clientData } = trpc.clients.get.useQuery(
    { id: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  const { data: results } = trpc.quizAnswers.results.useQuery(
    { clientId: selectedClientId!, month: currentMonth },
    { enabled: !!selectedClientId }
  );

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Sélectionnez un client pour gérer son quiz.</p>
      </div>
    );
  }

  const totalAnswers = results?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Éditeur quiz */}
        <QuizManagementPanel
          clientId={selectedClientId}
          clientName={clientData?.name ?? "Client"}
        />

        {/* Résultats des réponses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Résultats des réponses
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {totalAnswers} réponse{totalAnswers !== 1 ? "s" : ""} ce mois-ci
          </p>

          {!results || results.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Aucune réponse enregistrée ce mois.
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={results} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value} réponses`, "Total"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {results.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Détail en pourcentage */}
              <div className="mt-4 space-y-2">
                {results.map((r: { label: string; count: number }, i: number) => {
                  const pct = totalAnswers > 0 ? Math.round((r.count / totalAnswers) * 100) : 0;
                  return (
                    <div key={r.label} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 flex-1">{r.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{r.count}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
