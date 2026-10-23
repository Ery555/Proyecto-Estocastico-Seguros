import React, { useState, useEffect } from "react";
import { fetchMonteCarlo } from "../api";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { ShieldCheck, AlertOctagon, Coins, Landmark } from "lucide-react";

export default function MonteCarloView() {
  const [initialReserve, setInitialReserve] = useState(650000);
  const [catProb, setCatProb] = useState(0.04);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMonteCarlo({ initialReserve, catastropheProb: catProb }).then(setData);
  }, [initialReserve, catProb]);

  if (!data) {
    return <div className="p-8 text-slate-400 animate-pulse">Simulando 10,000 trayectorias estocásticas con NumPy...</div>;
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
      {/* Controles Interactivos del Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
            Capital de Reserva Inicial (u):{" "}
            <span className="text-cyan-400 font-bold text-sm">Bs {initialReserve.toLocaleString()}</span>
          </label>
          <input
            type="range" min="150000" max="1500000" step="25000" value={initialReserve}
            onChange={(e) => setInitialReserve(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Bs 150k (Riesgo Alto)</span>
            <span>Óptimo 99%: Bs {summary.optimal_reserve_99_bs.toLocaleString()}</span>
            <span>Bs 1.5M (Capital Ocioso)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
            Probabilidad Mensual de Choque Catastrófico:{" "}
            <span className="text-amber-400 font-bold text-sm">{(catProb * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range" min="0" max="0.15" step="0.01" value={catProb}
            onChange={(e) => setCatProb(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Simula eventos cisne negro calibrados con las anomalías del Módulo 3 (10,000 iteraciones).
          </p>
        </div>
      </div>

      {/* KPIs Ejecutivos para la Defensa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isSafe ? "bg-emerald-950/30 border-emerald-700/50" : "bg-rose-950/40 border-rose-700/60"}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300">Probabilidad de Ruina ψ(u)</span>
            {isSafe ? <ShieldCheck className="text-emerald-400 w-5 h-5" /> : <AlertOctagon className="text-rose-400 w-5 h-5" />}
          </div>
          <p className={`text-2xl font-bold mt-1 ${isSafe ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.ruin_probability_pct}%
          </p>
          <p className="text-xs text-slate-400 mt-1">{summary.status}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Reserva Óptima (P(Ruina) ≤ 1%)</span>
            <Landmark className="text-cyan-400 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            Bs {summary.optimal_reserve_99_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Garantiza 99% de solvencia anual</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Value at Risk (VaR 99%)</span>
            <Coins className="text-amber-400 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            Bs {summary.var_99_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">TVaR 99%: Bs {summary.tvar_99_bs.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">
            {summary.releasable_capital_bs >= 0 ? "Capital Liberado para Inversión" : "Déficit de Reserva"}
          </span>
          <p className={`text-2xl font-bold mt-1 ${summary.releasable_capital_bs >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.releasable_capital_bs >= 0 ? "+" : ""}Bs {summary.releasable_capital_bs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Frente al requerimiento del 99%</p>
        </div>
      </div>

      {/* Gráficos: Spaghetti Plot de Trayectorias + Curva de Probabilidad de Ruina */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">
            Proceso de Cramér-Lundberg: U(t) = u + Σ(c<sub>k</sub> − S<sub>k</sub>)
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Muestra de trayectorias estocásticas sobre las 10,000 simulaciones. Cruzar la línea roja (U(t) ≤ 0) implica insolvencia técnica.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spaghettiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} label={{ value: "Umbral de Quiebra (Bs 0)", fill: "#ef4444", fontSize: 11 }} />
                {data.sample_trajectories.slice(0, 35).map((traj) => (
                  <Line
                    key={traj.path_id}
                    type="monotone"
                    dataKey={traj.path_id}
                    stroke={traj.is_ruined ? "#f43f5e" : "#06b6d4"}
                    strokeOpacity={traj.is_ruined ? 0.75 : 0.25}
                    strokeWidth={traj.is_ruined ? 1.8 : 1.1}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">
            Curva de Optimización de Solvencia: Capital Inicial (u) vs Probabilidad de Ruina
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Permite a la gerencia elegir exactamente cuánto capital inmovilizar según su apetito de riesgo.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.reserve_sensitivity_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="initial_reserve_bs" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                  formatter={(v) => `${v}%`}
                  labelFormatter={(l) => `Reserva Inicial: Bs ${Number(l).toLocaleString()}`}
                />
                <ReferenceLine x={initialReserve} stroke="#22d3ee" strokeWidth={2} label={{ value: "Reserva Actual", fill: "#22d3ee", fontSize: 11 }} />
                <ReferenceLine y={1.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Meta 1% Riesgo", fill: "#10b981", fontSize: 11 }} />
                <Area type="monotone" dataKey="ruin_probability_pct" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.25} name="Probabilidad de Ruina (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}