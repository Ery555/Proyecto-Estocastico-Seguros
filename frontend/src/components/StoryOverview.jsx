import React from "react";
import {
  Mountain, ArrowRight, ShieldAlert, TrendingUp, Users, Dice5,
  Landmark, CheckCircle2, HelpCircle
} from "lucide-react";

export default function StoryOverview({ onNavigate, mathMode }) {
  return (
    <div className="space-y-6">
      {/* Hero Banner - Contexto Seguros Illimani */}
      <div className="bg-gradient-to-br from-[#0F1E36] via-[#162A4A] to-[#1E3A5F] text-white rounded-2xl p-8 shadow-lg border border-amber-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Mountain className="w-3.5 h-3.5" />
              <span>Caso de Estudio Realista — La Paz, Bolivia</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Seguros Illimani: El Dilema del "Dinero Muerto" vs. Solvencia
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Toda aseguradora automotriz y patrimonial enfrenta una tensión financiera crítica: si retiene{" "}
              <strong className="text-white">demasiado efectivo</strong> en bóveda por temor a los reclamos, pierde rentabilidad por inflación y costo de oportunidad. Si retiene{" "}
              <strong className="text-white">muy poco</strong>, una temporada severa de lluvias en La Paz puede llevarla a la insolvencia técnica.
            </p>
          </div>

          {/* Tarjeta del Problema Actual */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-5 shrink-0 lg:w-80">
            <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
              Situación Actual (Sin Ciencia de Datos)
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Cartera Activa:</span>
                <span className="font-bold">5,000 Pólizas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Reserva Empírica Actual:</span>
                <span className="font-bold text-amber-400">Bs 1,200,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Criterio de Gerencia:</span>
                <span className="italic text-slate-300">"Intuición histórica"</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 text-xs text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Meta del Proyecto: Liberar capital ocioso garantizando 99% de solvencia.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explicación Visual: La Analogía del Tanque de Liquidez */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F1E36]">
              ¿Qué analiza nuestro Motor Estocástico? (El Pipeline en 4 Etapas)
            </h3>
            <p className="text-xs text-slate-500">
              {mathMode
                ? "Integración acoplada de Procesos Markovianos (Cap. 3), SARIMA Box-Jenkins (Cap. 6), Procesos Normales (Cap. 2) y Cramér-Lundberg (Cap. 7.6)."
                : "Imagina la bóveda de Seguros Illimani como un tanque de agua financiera donde cada mes entra dinero por primas y sale dinero por accidentes."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Paso 1 */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-[#F8F7F4] border border-slate-200 hover:border-amber-500/50 transition">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#0F1E36] text-amber-400 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Módulo 1 • {mathMode ? "Cap. 3.1 DTMC" : "El Dinero que Entra"}
              </span>
              <h4 className="font-bold text-[#0F1E36] mt-1">Migración de Clientes</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {mathMode
                  ? "Modela la matriz estocástica P del sistema Bonus-Malus y halla el vector estacionario πP = π para estimar la prima agregada."
                  : "Los buenos conductores reciben descuento y quienes chocan pagan recargo. Calculamos cuánto dinero fijo entrará mes a mes cuando la cartera se estabilice."}
              </p>
            </div>
            <button
              onClick={() => onNavigate("markov")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1E36] hover:text-amber-700 cursor-pointer"
            >
              <span>Explorar Módulo 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Paso 2 */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-[#F8F7F4] border border-slate-200 hover:border-amber-500/50 transition">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#0F1E36] text-cyan-400 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Módulo 2 • {mathMode ? "Cap. 5 y 6 SARIMA" : "El Dinero que Sale"}
              </span>
              <h4 className="font-bold text-[#0F1E36] mt-1">Ciclos y Lluvias (Siniestros)</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {mathMode
                  ? "Aplica diferenciación regular/estacional (d=1, D=1), test ADF y ajuste SARIMA(1,1,1)(0,1,1)[12] para proyectar reclamos."
                  : "En diciembre, enero y febrero (lluvias y carnaval en Bolivia) los accidentes se disparan. Pronosticamos cuánto costarán los reclamos en los próximos 12 meses."}
              </p>
            </div>
            <button
              onClick={() => onNavigate("sarima")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1E36] hover:text-amber-700 cursor-pointer"
            >
              <span>Explorar Módulo 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Paso 3 */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-[#F8F7F4] border border-slate-200 hover:border-amber-500/50 transition">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#0F1E36] text-rose-400 flex items-center justify-center mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Módulo 3 • {mathMode ? "Cap. 2 y 7.5 Gaussiano" : "Eventos Cisne Negro"}
              </span>
              <h4 className="font-bold text-[#0F1E36] mt-1">Detector de Catástrofes</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {mathMode
                  ? "Verifica normalidad de Shapiro-Wilk sobre innovaciones e_t y aísla choques > ±2.8σ mediante estimación robusta MAD."
                  : "Separa la mala suerte normal de eventos extraordinarios (deslizamientos, granizadas o fraudes) para que no distorsionen nuestras reservas."}
              </p>
            </div>
            <button
              onClick={() => onNavigate("anomalies")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1E36] hover:text-amber-700 cursor-pointer"
            >
              <span>Explorar Módulo 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Paso 4 */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-[#0F1E36] text-white border border-[#0F1E36] shadow-md">
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center mb-3">
                <Dice5 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Módulo 4 • {mathMode ? "Cap. 7.6 Monte Carlo" : "La Decisión Gerencial"}
              </span>
              <h4 className="font-bold text-white mt-1">Simulador de Solvencia</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {mathMode
                  ? "Simula 10,000 trayectorias del proceso de superávit U(t) = u + Σ(c_t - S_t) hallando u* tal que ψ(u*) ≤ 0.01."
                  : "Simula 10,000 futuros posibles en milisegundos y revela cuánto capital podemos liberar hoy mismo sin arriesgar la estabilidad de la empresa."}
              </p>
            </div>
            <button
              onClick={() => onNavigate("montecarlo")}
              className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
            >
              <span>Ir al Simulador Final</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Guía de Uso para la Exposición */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <HelpCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <p className="font-bold text-sm">Consejo de navegación durante tu presentación:</p>
          <p>
            Usa el interruptor superior derecho <strong>"Modo Storytelling"</strong> mientras vendes la idea de negocio para mantener las pantallas limpias y ejecutivas. Cuando el docente pregunte por las pruebas formales del temario (Dickey-Fuller, ACF/PACF, Shapiro-Wilk), activa en vivo el <strong>"Modo Matemático (DAT-262)"</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}