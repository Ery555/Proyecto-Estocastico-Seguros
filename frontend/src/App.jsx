import React, { useState } from "react";
import MarkovView from "./components/MarkovView";
import SarimaView from "./components/SarimaView";
import AnomalyView from "./components/AnomalyView";
import MonteCarloView from "./components/MonteCarloView";
import { Network, TrendingUp, ShieldAlert, Dice5, Shield } from "lucide-react";

const TABS = [
  { id: "markov", label: "1. Cartera (Cadenas de Markov)", icon: Network, cap: "Cap. 3.1" },
  { id: "sarima", label: "2. Pronóstico (Box-Jenkins SARIMA)", icon: TrendingUp, cap: "Cap. 5 y 6" },
  { id: "anomalies", label: "3. Filtro Gaussiano & Anomalías", icon: ShieldAlert, cap: "Cap. 2 y 7.5" },
  { id: "montecarlo", label: "4. Capital & Ruina (Monte Carlo)", icon: Dice5, cap: "Cap. 7.6" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("markov");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Ejecutivo */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                InsurTech Stochastic Risk Engine
              </h1>
              <p className="text-xs text-slate-400">
                DAT 262 — Procesos Estocásticos y Series de Tiempo | Optimización Actuarial de Liquidez
              </p>
            </div>
          </div>

          {/* Pestañas del Pipeline */}
          <nav className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-900 text-slate-400"}`}>
                    {tab.cap}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Contenido Dinámico del Módulo Activo */}
      <main className="max-w-7xl w-full mx-auto px-6 py-6 flex-1">
        {activeTab === "markov" && <MarkovView />}
        {activeTab === "sarima" && <SarimaView />}
        {activeTab === "anomalies" && <AnomalyView />}
        {activeTab === "montecarlo" && <MonteCarloView />}
      </main>
    </div>
  );
}