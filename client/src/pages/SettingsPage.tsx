import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Shield, User, Database, Globe, Mail, Bell, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/logo_visigold_final_dc187c8e.webp";

export default function SettingsPage() {
  const { data: user } = trpc.auth.me.useQuery();
  const [emailConfig, setEmailConfig] = useState({
    reportEmail: "",
    alertEmail: "",
    alertOnNegative: true,
    monthlyReport: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSaveEmail = () => {
    // Sauvegarde locale (localStorage) pour l'instant
    localStorage.setItem("visigold_email_config", JSON.stringify(emailConfig));
    setSaved(true);
    toast.success("Configuration email sauvegardée");
    setTimeout(() => setSaved(false), 3000);
  };

  // Charger la config sauvegardée
  useState(() => {
    const saved = localStorage.getItem("visigold_email_config");
    if (saved) {
      try { setEmailConfig(JSON.parse(saved)); } catch {}
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compte */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-[#1a3a6b]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Compte Visigold</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <img src={LOGO_URL} alt="Visigold" className="h-10 object-contain" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Nom</p>
              <p className="text-sm font-medium text-gray-900">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rôle</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-[#1a3a6b] px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#f26522]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Notifications email</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Email pour les rapports mensuels
              </label>
              <input
                type="email"
                value={emailConfig.reportEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, reportEmail: e.target.value })}
                placeholder="contact@visigold.ch"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Email pour les alertes avis négatifs
              </label>
              <input
                type="email"
                value={emailConfig.alertEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, alertEmail: e.target.value })}
                placeholder="alerte@visigold.ch"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEmailConfig({ ...emailConfig, alertOnNegative: !emailConfig.alertOnNegative })}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                    emailConfig.alertOnNegative ? "bg-[#1a3a6b]" : "bg-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    emailConfig.alertOnNegative ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-red-500" />
                    Alerte si avis négatif (1-2 étoiles)
                  </p>
                  <p className="text-xs text-gray-400">Recevoir un email immédiat si un client laisse une mauvaise note</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEmailConfig({ ...emailConfig, monthlyReport: !emailConfig.monthlyReport })}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                    emailConfig.monthlyReport ? "bg-[#1a3a6b]" : "bg-gray-200"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    emailConfig.monthlyReport ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Rapport mensuel automatique
                  </p>
                  <p className="text-xs text-gray-400">Recevoir le rapport PDF le 1er de chaque mois</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleSaveEmail}
              className="w-full flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Sauvegardé !" : "Sauvegarder"}
            </button>
          </div>
        </div>

        {/* Plateforme */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Plateforme</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Produit</p>
              <p className="text-sm font-medium text-gray-900">Visigold Dashboard SaaS v1.0</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Hébergement cible</p>
              <p className="text-sm font-medium text-gray-900">Infomaniak Node.js — CHF 10.91/mois</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Format URL QR code</p>
              <code className="text-xs bg-gray-100 text-[#1a3a6b] px-2 py-1 rounded block mt-1 break-all">
                /scan/[slug-client]?source=[emplacement]
              </code>
            </div>
          </div>
        </div>

        {/* Base de données */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Base de données</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Moteur</p>
              <p className="text-sm font-medium text-gray-900">MySQL 8.0 (Drizzle ORM)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tables</p>
              <p className="text-sm font-medium text-gray-900">11 tables — multi-clients isolées</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sécurité</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["Login mot de passe", "Session sécurisée", "Logs anonymisés", "Données isolées par client"].map((tag) => (
                  <span key={tag} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
