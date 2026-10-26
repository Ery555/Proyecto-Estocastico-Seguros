import React, { useState, useEffect } from "react";
import { fetchMarkov } from "../api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from "recharts";
import { TrendingUp, ArrowRight, Lightbulb } from "lucide-react";

export default function MarkovView({ mathMode, onNext }) {
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
    return <div className="p-8 text-slate-500 animate-pulse">Calculando dinámica de cartera de Seguros Illimani...</div>;
  }

  const areaData = data.projections.map((item) => ({
    year: `Año ${item.step}`,
    "Óptimo (E0)": item.clients_per_state[0],
    "Estándar (E1)": item.clients_per_state[1],
    "Recargo (E2)": item.clients_per_state[2],
    "Crítico (E3)": item.clients_per_state[3],
  }));

  const stationaryComparison = data.states.map((st, i) => ({
    state: st,
    Inicial: +(data.projections[0].distribution[i] * 100).toFixed(1),
    Estacionario: +(data.stationary_distribution[i] * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Banner de Storytelling */}
      <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Lightbulb className="w-4 h-4" />
            <span>Paso 1 de la Historia: ¿Cuánto dinero entra a la aseguradora?</span>
          </div>
          <p className="text-sm text-slate-700">
            Nuestros <strong>5,000 asegurados</strong> cambian de nivel de riesgo cada año según si tuvieron accidentes o no (Sistema <em>Bonus-Malus</em>). Este módulo descubre que, sin importar cómo empiece la cartera hoy, a largo plazo se estabiliza generando{" "}
            <strong className="text-emerald-700">Bs {data.stationary_monthly_revenue_bs.toLocaleString()} al mes</strong> en primas.
          </p>
        </div>
        <button
          onClick={onNext}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F1E36] text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
        >
          <span>Llevar este ingreso al Paso 2</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Controles Interactivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {mathMode ? (
              <>Horizonte de Proyección (P<sup>n</sup>): </>
            ) : (
              <>Años a Proyectar hacia el Futuro: </>
            )}
            <span className="text-[#0F1E36] font-bold">{horizon} años</span>
          </label>
          <input
            type="range" min="3" max="25" value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full accent-[#0F1E36] cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Prima Base Mensual por Póliza:{" "}
            <span className="text-emerald-700 font-bold">Bs {premium}</span>
          </label>
          <input
            type="range" min="200" max="800" step="25" value={premium}
            onChange={(e) => setPremium(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between bg-emerald-50/70 px-4 py-3 rounded-lg border border-emerald-200">
          <div>
            <p className="text-xs text-emerald-900 font-medium">
              {mathMode ? "Ingreso Mensual en Equilibrio (π)" : "Ingreso Mensual Estable (Largo Plazo)"}
            </p>
            <p className="text-xl font-bold text-emerald-700">
              Bs {data.stationary_monthly_revenue_bs.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="text-emerald-600 w-7 h-7" />
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de la Cartera */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-[#0F1E36] mb-1">
            {mathMode
              ? `Evolución Temporal de Estados (π_n = π_0 · P^n)`
              : `¿Cómo se mueven nuestros 5,000 clientes durante ${horizon} años?`}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Observa cómo después del 4.º año las franjas se vuelven horizontales: la cartera alcanza su equilibrio natural.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f1e36" }} />
                <Legend />
                <Area type="monotone" dataKey="Óptimo (E0)" stackId="1" stroke="#059669" fill="#10b981" fillOpacity={0.65} />
                <Area type="monotone" dataKey="Estándar (E1)" stackId="1" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.65} />
                <Area type="monotone" dataKey="Recargo (E2)" stackId="1" stroke="#d97706" fill="#fbbf24" fillOpacity={0.7} />
                <Area type="monotone" dataKey="Crítico (E3)" stackId="1" stroke="#e11d48" fill="#f43f5e" fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparación Hoy vs Equilibrio */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-[#0F1E36] mb-1">
            {mathMode
              ? "Convergencia Ergódica: Distribución Inicial (π₀) vs Estacionaria (π)"
              : "Foto de la Cartera Hoy vs. Equilibrio a Futuro"}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {mathMode
              ? "Solución analítica del sistema de autovectores πP = π sujeto a Σπ_i = 1."
              : "A largo plazo, el 43.3% de los clientes se mantiene en nivel Óptimo y solo el 7.4% cae en Riesgo Crítico."}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationaryComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="state" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f1e36" }} />
                <Legend />
                <Bar dataKey="Inicial" fill="#94a3b8" name="Cartera Hoy (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Estacionario" fill="#0F1E36" name="Equilibrio Futuro π (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Matriz Estocástica (Siempre visible en Modo Matemático, o con explicación amigable en Modo Negocio) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F1E36]">
              {mathMode
                ? "Matriz de Probabilidad de Transición en Un Paso (P)"
                : "Reglas de Migración Anual de Conductores (Matriz Bonus-Malus)"}
            </h3>
            <p className="text-xs text-slate-500">
              {mathMode
                ? "Cada celda representa P_ij = P(X_{t+1} = j | X_t = i), cumpliendo Σ_j P_ij = 1."
                : "Lee de izquierda (situación este año) hacia las columnas (probabilidad de pasar a esa categoría el próximo año)."}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2.5 text-left text-xs font-bold text-slate-600 border-b border-slate-200">
                  Categoría Actual \ Próximo Año
                </th>
                {data.states.map((s, idx) => (
                  <th key={s} className="p-2.5 text-xs font-bold text-slate-700 border-b border-slate-200">
                    {s} <span className="text-[11px] font-normal text-slate-500">({data.multipliers[idx]}x prima)</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.transition_matrix.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2.5 text-left font-semibold text-[#0F1E36]">{data.states[i]}</td>
                  {row.map((val, j) => {
                    const pct = (val * 100).toFixed(1);
                    return (
                      <td key={j} className="p-2">
                        <div
                          className="py-2 rounded-lg font-mono text-xs font-bold"
                          style={{
                            backgroundColor: `rgba(15, 30, 54, ${Math.max(val * 0.85, 0.05)})`,
                            color: val > 0.35 ? "#ffffff" : "#0f1e36",
                          }}
                        >
                          {pct}%
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
    </div>
  );
}