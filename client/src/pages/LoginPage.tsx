import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

const LOGO_URL = "/manus-storage/logo_visigold_final_dc187c8e.webp";
const SESSION_KEY = "visigold_auth";

export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) === "true";
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

interface Props {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Compare with env variable (available at build time via Vite)
    const expected = import.meta.env.VITE_DASHBOARD_PASSWORD;

    setTimeout(() => {
      if (password === expected) {
        localStorage.setItem(SESSION_KEY, "true");
        onSuccess();
      } else {
        setError("Mot de passe incorrect. Veuillez réessayer.");
        setPassword("");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3a6b] to-[#0f2347] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="Visigold" className="h-16 object-contain mb-4" />
          <h1 className="text-lg font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-xs text-gray-400 mt-1">Accès réservé à l'équipe Visigold</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#1a3a6b] hover:bg-[#0f2347] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Vérification..." : "Accéder au dashboard"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">
          © {new Date().getFullYear()} Visigold — Accès confidentiel
        </p>
      </div>
    </div>
  );
}
