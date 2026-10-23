import React, { useState, useEffect } from "react";
import { fetchMarkov } from "../api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function MarkovView() {
  const [horizon, setHorizon] = useState(10);
  const [premium, setPremium] = useState(350);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMarkov(horizon, premium)
      .then(setData)
      .finally(() => setLoading(false));
  }, [horizon, premium]);

  if (loading || !data) {
    return <div className="p-8 text-slate-400 animate-pulse">Calculando autovectores y cadena de Markov...</div>;
  }

  const areaData = data.projections.map((item) => ({
    year: `Año ${item.step}`,
    "Óptimo (E0)": item.clients_per_state[0],
    "Estándar (E1)": item.clients_per_state[1],
    "Recargo (E2)": item.clients_per_state[2],
    "Crítico (E3)": item.clients_per_state[3],
    revenue: item.expected_monthly_revenue_bs,
  }));

  const stationaryComparison = data.states.map((st, i) => ({
    state: st,
    Inicial: +(data.projections[0].distribution[i] * 100).toFixed(1),
    Estacionario: +(data.stationary_distribution[i] * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Controles Interactivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
            Horizonte de Proyección (P<sup>n</sup>): <span className="text-cyan-400 font-bold">{horizon} años</span>
          </label>
          <input
            type="range" min="3" max="25" value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
            Prima Base Mensual: <span className="text-emerald-400 font-bold">Bs {premium}</span>
          </label>
          <input
            type="range" min="200" max="800" step="25" value={premium}
            onChange={(e) => setPremium(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between bg-slate-950/80 px-4 py-3 rounded-lg border border-slate-800">
          <div>
            <p className="text-xs text-slate-400">Ingreso Mensual Estacionario (π)</p>
            <p className="text-xl font-bold text-emerald-400">
              Bs {data.stationary_monthly_revenue_bs.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="text-emerald-500 w-8 h-8" />
        </div>
      </div>

      {/* Fila Principal: Matriz de Transición + Distribución Estacionaria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-1">
            Matriz de Probabilidad de Transición (P) — Esquema Bonus-Malus
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Probabilidad P<sub>ij</sub> de migrar del estado i (fila) al estado j (columna) en 1 año (Σ<sub>j</sub> P<sub>ij</sub> = 1).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs text-slate-400 border-b border-slate-800">Origen \ Destino</th>
                  {data.states.map((s) => (
                    <th key={s} className="p-2 text-xs text-slate-300 border-b border-slate-800">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.transition_matrix.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    <td className="p-2.5 text-left font-medium text-slate-300">{data.states[i]}</td>
                    {row.map((val, j) => {
                      const intensity = Math.round(val * 100);
                      return (
                        <td key={j} className="p-2">
                          <div
                            className="py-2 rounded font-mono text-xs font-semibold"
                            style={{
                              backgroundColor: `rgba(6, 182, 212, ${Math.max(val * 0.85, 0.08)})`,
                              color: intensity > 35 ? "#ffffff" : "#cbd5e1",
                            }}
                          >
                            {(val * 100).toFixed(1)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-1">
            Convergencia Ergódica: Distribución Inicial (π₀) vs Estacionaria (π)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
             Solución analítica de autovectores πP = π. Muestra dónde se estabiliza la cartera a largo plazo.
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationaryComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Legend />
                <Bar dataKey="Inicial" fill="#64748b" name="Año 0 (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Estacionario" fill="#06b6d4" name="Equilibrio Estacionario π (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evolución de la Cartera en el Tiempo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-1">
          Dinámica de Transición de los {data.total_clients.toLocaleString()} Asegurados a {horizon} Años
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Evolución de la masa de asegurados por categoría de riesgo (π<sub>n</sub> = π₀ · P<sup>n</sup>).
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
              />
              <Legend />
              <Area type="monotone" dataKey="Óptimo (E0)" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
              <Area type="monotone" dataKey="Estándar (E1)" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
              <Area type="monotone" dataKey="Recargo (E2)" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
              <Area type="monotone" dataKey="Crítico (E3)" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}