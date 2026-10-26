import React, { useState } from "react";
import StoryOverview from "./components/StoryOverview";
import MarkovView from "./components/MarkovView";
import SarimaView from "./components/SarimaView";
import AnomalyView from "./components/AnomalyView";
import MonteCarloView from "./components/MonteCarloView";
import {
  Mountain, Compass, Users, TrendingUp, ShieldAlert, Dice5,
  GraduationCap, Briefcase
} from "lucide-react";

const NAV_ITEMS = [
  {
    id: "overview",
    step: "Contexto",
    title: "Caso Seguros Illimani",
    subtitle: "El dilema del dinero muerto",
    cap: "Intro",
    icon: Compass,
  },
  {
    id: "markov",
    step: "Paso 1 • Ingresos",
    title: "Cartera de Clientes",
    subtitle: "Cadenas de Markov Bonus-Malus",
    cap: "Cap. 3.1",
    icon: Users,
  },
  {
    id: "sarima",
    step: "Paso 2 • Egresos",
    title: "Ciclo de Siniestros",
    subtitle: "Box-Jenkins & SARIMA",
    cap: "Cap. 5 y 6",
    icon: TrendingUp,
  },
  {
    id: "anomalies",
    step: "Paso 3 • Auditoría",
    title: "Filtro de Catástrofes",
    subtitle: "Procesos Normales & Z-Score",
    cap: "Cap. 2 y 7.5",
    icon: ShieldAlert,
  },
  {
    id: "montecarlo",
    step: "Paso 4 • Decisión",
    title: "Simulador de Solvencia",
    subtitle: "Monte Carlo Cramér-Lundberg",
    cap: "Cap. 7.6",
    icon: Dice5,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [mathMode, setMathMode] = useState(false);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F7F4] text-[#0F1E36]">
      {/* SIDEBAR IZQUIERDO — Azul Profundo Illimani */}
      <aside className="w-full md:w-72 bg-[#0F1E36] text-white flex flex-col justify-between shrink-0 border-r border-slate-800 md:sticky md:top-0 md:h-screen">
        <div>
          {/* Logo & Identidad */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                Seguros Illimani
              </h1>
              <p className="text-[11px] text-amber-400 font-medium">
                Motor Estocástico de Liquidez
              </p>
            </div>
          </div>

          {/* Navegación Vertical Paso a Paso */}
          <div className="p-4 space-y-1.5">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Ruta del Storytelling
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-slate-900" : "text-amber-400/90"}`}>
                        {item.step}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? "bg-slate-950/15 text-slate-950 font-bold" : "bg-white/10 text-slate-300"}`}>
                        {item.cap}
                      </span>
                    </div>
                    <p className={`text-sm font-bold truncate mt-0.5 ${isActive ? "text-slate-950" : "text-white"}`}>
                      {item.title}
                    </p>
                    <p className={`text-[11px] truncate ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">DAT 262 — Proyecto Final</p>
          <p className="text-[11px] text-slate-400">
            Procesos Estocásticos y Series de Tiempo • Ciencia de Datos e IA
          </p>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DERECHA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar con Título del Paso e Interruptor Storytelling / Matemático */}
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {activeItem?.step} ({activeItem?.cap})
            </span>
            <h2 className="text-xl font-bold text-[#0F1E36]">{activeItem?.title}</h2>
          </div>

          {/* Switch Modo Storytelling vs Modo Matemático */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setMathMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                !mathMode
                  ? "bg-[#0F1E36] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Storytelling (Negocio)</span>
            </button>
            <button
              onClick={() => setMathMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mathMode
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Modo Matemático (DAT-262)</span>
            </button>
          </div>
        </header>

        {/* Contenedor de Vistas */}
        <main className="p-6 max-w-6xl w-full mx-auto flex-1">
          {activeTab === "overview" && (
            <StoryOverview onNavigate={setActiveTab} mathMode={mathMode} />
          )}
          {activeTab === "markov" && (
            <MarkovView mathMode={mathMode} onNext={() => setActiveTab("sarima")} />
          )}
          {activeTab === "sarima" && (
            <SarimaView mathMode={mathMode} onNext={() => setActiveTab("anomalies")} />
          )}
          {activeTab === "anomalies" && (
            <AnomalyView mathMode={mathMode} onNext={() => setActiveTab("montecarlo")} />
          )}
          {activeTab === "montecarlo" && (
            <MonteCarloView mathMode={mathMode} />
          )}
        </main>
      </div>
    </div>
  );
}