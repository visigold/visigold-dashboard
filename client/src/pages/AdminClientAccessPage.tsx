import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { User, Lock, Check, X, AlertCircle, Loader } from "lucide-react";

export function AdminClientAccessPage() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer la liste des clients
  const { data: clients = [] } = trpc.clients.list.useQuery();

  // Mutations
  const setCredentialsMutation = trpc.clients.setCredentials.useMutation();
  const disableAccessMutation = trpc.clients.disableAccess.useMutation();

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedClientId) {
      setError("Veuillez sélectionner un client");
      return;
    }

    if (!username || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      await setCredentialsMutation.mutateAsync({
        clientId: selectedClientId,
        username,
        password,
      });

      setSuccess(`Accès client activé pour ${username}`);
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setSelectedClientId(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableAccess = async (clientId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver l'accès client ?")) {
      return;
    }

    try {
      await disableAccessMutation.mutateAsync({ clientId });
      setSuccess("Accès client désactivé");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la désactivation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Accès Clients</h1>
          <p className="text-gray-600 mt-2">Configurez les identifiants d'accès pour chaque client</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Configurer un Accès</h2>

              <form onSubmit={handleSetCredentials} className="space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un Client
                  </label>
                  <select
                    value={selectedClientId || ""}
                    onChange={(e) => setSelectedClientId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Choisir un client --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Min. 3 caractères"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Configuration en cours...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Activer l'Accès
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Clients List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Liste des Clients</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Industrie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Accès Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {client.industry || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {client.clientAccessEnabled ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Activé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              <X className="w-3 h-3" />
                              Désactivé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {client.clientAccessEnabled && (
                            <button
                              onClick={() => handleDisableAccess(client.id)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Désactiver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {clients.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-600">
                  <p>Aucun client trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note :</strong> Les mots de passe sont hachés et stockés de manière sécurisée. Chaque client reçoit un accès unique à son tableau de bord.
          </p>
        </div>
      </div>
    </div>
  );
}
