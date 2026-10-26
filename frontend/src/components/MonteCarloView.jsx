import React, { useState, useEffect } from "react";
import { fetchMonteCarlo } from "../api";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { ShieldCheck, AlertOctagon, Coins, Landmark, Sparkles } from "lucide-react";

export default function MonteCarloView({ mathMode }) {
  const [initialReserve, setInitialReserve] = useState(1200000); // Arranca en los Bs 1.2M empíricos de la gerencia
  const [catProb, setCatProb] = useState(0.04);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMonteCarlo({ initialReserve, catastropheProb: catProb }).then(setData);
  }, [initialReserve, catProb]);

  if (!data) {
    return <div className="p-8 text-slate-500 animate-pulse">Simulando 10,000 escenarios futuros para Seguros Illimani...</div>;
  }

  const summary = data.simulation_summary;

  const months = Array.from({ length: 13 }, (_, i) => `Mes ${i}`);
  const spaghettiData = months.map((m, tIdx) => {
    const point = { month: m };
    data.sample_trajectories.slice(0, 35).forEach((traj) => {
      point[traj.path_id] = traj.values[tIdx];
    });
    return point;
  });

  const isSafe = summary.ruin_probability_pct <= 1.0;

  return (
    <div className="space-y-6">
      {/* Banner Clímax de la Historia */}
      <div className="bg-gradient-to-r from-[#0F1E36] to-[#1E3A5F] text-white rounded-xl p-5 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Paso 4 (El Veredicto): Simulación de 10,000 Años Futuros con Monte Carlo</span>
          </div>
          <p className="text-sm text-slate-200">
            La gerencia guardaba <strong>Bs 1,200,000</strong> por miedo. Nuestro motor demuestra que con{" "}
            <strong className="text-amber-300">Bs {summary.optimal_reserve_99_bs.toLocaleString()}</strong> cubrimos el 99% de los escenarios posibles (incluyendo catástrofes).
          </p>
        </div>

        {/* Botones Rápidos para la Defensa en Vivo */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setInitialReserve(1200000)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
              initialReserve === 1200000
                ? "bg-amber-500 text-slate-950 border-amber-400"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            Reserva Empírica (Bs 1.2M)
          </button>
          <button
            onClick={() => setInitialReserve(Math.round(summary.optimal_reserve_99_bs / 1000) * 1000)}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
          >
            Ir al Óptimo Exacto (Bs {(summary.optimal_reserve_99_bs / 1000).toFixed(0)}k)
          </button>
          <button
            onClick={() => setInitialReserve(250000)}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-400/40 hover:bg-rose-500/30 transition cursor-pointer"
          >
            Simular Estrés (Bs 250k)
          </button>
        </div>
      </div>

      {/* Controles Interactivos del Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Capital de Reserva Inicial en Bóveda (u):{" "}
            <span className="text-[#0F1E36] font-bold text-sm">Bs {initialReserve.toLocaleString()}</span>
          </label>
          <input
            type="range" min="150000" max="1500000" step="25000" value={initialReserve}
            onChange={(e) => setInitialReserve(Number(e.target.value))}
            className="w-full accent-[#0F1E36] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Bs 150k (Insolvencia)</span>
            <span className="font-semibold text-emerald-700">Óptimo 99%: Bs {summary.optimal_reserve_99_bs.toLocaleString()}</span>
            <span>Bs 1.5M (Dinero Muerto)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Probabilidad Mensual de Evento Catastrófico:{" "}
            <span className="text-amber-700 font-bold text-sm">{(catProb * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range" min="0" max="0.15" step="0.01" value={catProb}
            onChange={(e) => setCatProb(Number(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Frecuencia de choques severos calibrada con las anomalías detectadas en el Módulo 3.
          </p>
        </div>
      </div>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isSafe ? "bg-emerald-50/90 border-emerald-300" : "bg-rose-50 border-rose-300"}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700">
              {mathMode ? "Probabilidad de Ruina ψ(u)" : "Riesgo de Quiebra Anual"}
            </span>
            {isSafe ? <ShieldCheck className="text-emerald-600 w-5 h-5" /> : <AlertOctagon className="text-rose-600 w-5 h-5" />}
          </div>
          <p className={`text-2xl font-bold mt-1 ${isSafe ? "text-emerald-700" : "text-rose-700"}`}>
            {summary.ruin_probability_pct}%
          </p>
          <p className="text-xs text-slate-600 mt-1 font-medium">{summary.status}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">
              {mathMode ? "Reserva Óptima (ψ(u*) ≤ 1%)" : "Reserva Científica Recomendada"}
            </span>
            <Landmark className="text-[#0F1E36] w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-[#0F1E36] mt-1">
            Bs {summary.optimal_reserve_99_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Garantiza 99% de solvencia</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">
            {summary.releasable_capital_bs >= 0 ? "Dinero Liberado para Inversión" : "Capital Faltante (Déficit)"}
          </span>
          <p className={`text-2xl font-bold mt-1 ${summary.releasable_capital_bs >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {summary.releasable_capital_bs >= 0 ? "+" : ""}Bs {summary.releasable_capital_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Capital que deja de estar ocioso</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">
              {mathMode ? "Value at Risk (VaR 99%)" : "Pérdida Máxima Esperada (99%)"}
            </span>
            <Coins className="text-amber-600 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            Bs {summary.var_99_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">TVaR 99%: Bs {summary.tvar_99_bs.toLocaleString()}</p>
        </div>
      </div>

      {/* Gráficos: Spaghetti Plot + Curva de Optimización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#0F1E36] mb-1">
            {mathMode
              ? "Proceso de Superávit de Cramér-Lundberg: U(t) = u + Σ(c_k − S_k)"
              : "Simulación de 10,000 Futuros Posibles para la Caja de Seguros Illimani"}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Cada línea azul es un año posible; las líneas rojas son futuros donde el fondo cae por debajo de Bs 0 (Quiebra).
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spaghettiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} tickFormatter={(v) => `Bs ${(v / 1000).toFixed(0)}k`} />
                <ReferenceLine y={0} stroke="#e11d48" strokeWidth={2} label={{ value: "Línea de Quiebra (Bs 0)", fill: "#e11d48", fontSize: 11 }} />
                {data.sample_trajectories.slice(0, 35).map((traj) => (
                  <Line
                    key={traj.path_id}
                    type="monotone"
                    dataKey={traj.path_id}
                    stroke={traj.is_ruined ? "#e11d48" : "#0284c7"}
                    strokeOpacity={traj.is_ruined ? 0.85 : 0.25}
                    strokeWidth={traj.is_ruined ? 2 : 1.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#0F1E36] mb-1">
            Curva de Decisión Directiva: Capital Guardado vs. Probabilidad de Quiebra
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Muestra por qué guardar más allá del punto óptimo ya no reduce significativamente el riesgo.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.reserve_sensitivity_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="initial_reserve_bs" stroke="#475569" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis stroke="#475569" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f1e36" }}
                  formatter={(v) => `${v}%`}
                  labelFormatter={(l) => `Reserva Inicial: Bs ${Number(l).toLocaleString()}`}
                />
                <ReferenceLine x={initialReserve} stroke="#0F1E36" strokeWidth={2} label={{ value: "Tu Selección", fill: "#0F1E36", fontSize: 11 }} />
                <ReferenceLine y={1.0} stroke="#059669" strokeDasharray="4 4" label={{ value: "Meta 1% Riesgo", fill: "#059669", fontSize: 11 }} />
                <Area type="monotone" dataKey="ruin_probability_pct" stroke="#e11d48" fill="#f43f5e" fillOpacity={0.2} name="Probabilidad de Ruina (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}