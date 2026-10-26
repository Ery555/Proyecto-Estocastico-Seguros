import React, { useState, useEffect } from "react";
import { fetchSarima } from "../api";
import {
  ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { CheckCircle2, AlertTriangle, Activity, ArrowRight, CloudRain } from "lucide-react";

export default function SarimaView({ mathMode, onNext }) {
  const [data, setData] = useState(null);
  const [showDifferenced, setShowDifferenced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSarima().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-slate-500 animate-pulse">Ajustando modelo estacional de siniestros de Seguros Illimani...</div>;
  }

  const activeAdf = showDifferenced
    ? data.stationarity.differenced_adf
    : data.stationarity.original_adf;

  const activeCorrelogram = showDifferenced
    ? data.correlograms.differenced
    : data.correlograms.original;

  const corrChartData = activeCorrelogram.lags.map((lag, idx) => ({
    lag: `L${lag}`,
    acf: activeCorrelogram.acf[idx],
    pacf: activeCorrelogram.pacf[idx],
  }));

  const combinedSeries = [
    ...data.model.historical.map((item) => ({
      date: item.date.slice(0, 7),
      actual: item.actual_bs,
      fitted: item.fitted_bs,
    })),
    ...data.model.forecast.map((item) => ({
      date: item.date.slice(0, 7),
      forecast: item.forecast_bs,
      ci95: [item.lower_95_bs, item.upper_95_bs],
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Storytelling */}
      <div className="bg-white border-l-4 border-l-cyan-600 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
            <CloudRain className="w-4 h-4" />
            <span>Paso 2 de la Historia: ¿Cuánto dinero sale por accidentes cada mes?</span>
          </div>
          <p className="text-sm text-slate-700">
            En La Paz, los siniestros siguen un patrón climático y social claro: se disparan entre{" "}
            <strong>diciembre y febrero</strong> (fiestas de fin de año, temporada de lluvias y Carnaval). Nuestro modelo captura esta memoria cíclica con un margen de error de apenas{" "}
            <strong className="text-emerald-700">{data.model.model_specification.mape_percent}%</strong>.
          </p>
        </div>
        <button
          onClick={onNext}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F1E36] text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
        >
          <span>Auditar picos anómalos en Paso 3</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Gráfico Principal: Pronóstico SARIMA + Bandas de Confianza */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F1E36]">
              {mathMode
                ? "Ajuste In-Sample y Pronóstico Out-of-Sample SARIMA(1,1,1)(0,1,1)[12]"
                : "Historia de Pagos por Siniestros (2021–2025) y Pronóstico para los Próximos 12 Meses"}
            </h3>
            <p className="text-xs text-slate-500">
              La franja sombreada muestra el rango de seguridad al 95% para anticipar los meses pico de lluvias.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 text-xs">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span>
              Precisión del modelo (MAPE): <strong className="text-emerald-700">{data.model.model_specification.mape_percent}%</strong>
            </span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#475569" fontSize={11} />
              <YAxis
                stroke="#475569"
                fontSize={11}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `Bs ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f1e36" }}
                formatter={(val) =>
                  Array.isArray(val)
                    ? `Bs ${val[0].toLocaleString()} a Bs ${val[1].toLocaleString()}`
                    : `Bs ${Number(val).toLocaleString()}`
                }
              />
              <Legend />
              <Area type="monotone" dataKey="ci95" fill="#0284c7" stroke="none" fillOpacity={0.18} name="Banda de Incertidumbre 95%" />
              <Line type="monotone" dataKey="actual" stroke="#0F1E36" strokeWidth={2} dot={{ r: 2 }} name="Reclamos Reales Pagados (Bs)" />
              <Line type="monotone" dataKey="fitted" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} name="Tendencia Capturada por el Modelo" />
              <Line type="monotone" dataKey="forecast" stroke="#d97706" strokeWidth={2.8} dot={{ r: 3.5 }} name="Pronóstico Próximos 12 Meses" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECCIÓN EXCLUSIVA DEL MODO MATEMÁTICO (Oculta en modo Storytelling para no saturar) */}
      {mathMode ? (
        <div className="space-y-6 pt-2">
          <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {activeAdf.is_stationary ? (
                  <CheckCircle2 className="text-emerald-400 w-5 h-5" />
                ) : (
                  <AlertTriangle className="text-amber-400 w-5 h-5" />
                )}
                <h4 className="font-semibold">
                  Prueba de Raíz Unitaria de Dickey-Fuller (Cap. 6.1.1):{" "}
                  <span className={activeAdf.is_stationary ? "text-emerald-400" : "text-amber-400"}>
                    {activeAdf.conclusion}
                  </span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Estadístico ADF: <span className="font-mono font-bold">{activeAdf.adf_statistic}</span> |{" "}
                Valor-p: <span className="text-amber-300 font-mono font-bold">{activeAdf.p_value}</span>{" "}
                | AIC: <span className="font-mono">{data.model.model_specification.aic}</span>
              </p>
            </div>
            <button
              onClick={() => setShowDifferenced(!showDifferenced)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shrink-0"
            >
              {showDifferenced ? "Ver Serie Original (No Estacionaria)" : "Aplicar Diferenciación (1−L)(1−L¹²)"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#0F1E36] mb-1">
                Función de Autocorrelación (ACF) — {showDifferenced ? "Serie Diferenciada" : "Serie Original"}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Bandas de Bartlett al 95%: ±{activeCorrelogram.confidence_bound}. Permite identificar el orden MA(q).
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={corrChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="lag" stroke="#475569" fontSize={11} />
                    <YAxis domain={[-1, 1]} stroke="#475569" fontSize={11} />
                    <Tooltip />
                    <ReferenceLine y={activeCorrelogram.confidence_bound} stroke="#e11d48" strokeDasharray="3 3" />
                    <ReferenceLine y={-activeCorrelogram.confidence_bound} stroke="#e11d48" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#475569" />
                    <Bar dataKey="acf" fill="#0284c7" name="ACF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#0F1E36] mb-1">
                Autocorrelación Parcial (PACF - Yule-Walker) — {showDifferenced ? "Serie Diferenciada" : "Serie Original"}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Aísla la correlación directa de cada rezago para identificar el orden Autorregresivo AR(p).
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={corrChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="lag" stroke="#475569" fontSize={11} />
                    <YAxis domain={[-1, 1]} stroke="#475569" fontSize={11} />
                    <Tooltip />
                    <ReferenceLine y={activeCorrelogram.confidence_bound} stroke="#e11d48" strokeDasharray="3 3" />
                    <ReferenceLine y={-activeCorrelogram.confidence_bound} stroke="#e11d48" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="#475569" />
                    <Bar dataKey="pacf" fill="#0F1E36" name="PACF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            💡 <strong>Nota para la defensa:</strong> Las pruebas de raíz unitaria de Dickey-Fuller y los correlogramas ACF/PACF están listos y ocultos para mantener la vista limpia.
          </span>
          <span className="font-semibold text-[#0F1E36]">Activa "Modo Matemático" arriba para mostrarlos</span>
        </div>
      )}
    </div>
  );
}