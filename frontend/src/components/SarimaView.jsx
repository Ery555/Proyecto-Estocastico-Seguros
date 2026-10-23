import React, { useState, useEffect } from "react";
import { fetchSarima } from "../api";
import {
  ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { CheckCircle2, AlertTriangle, Activity } from "lucide-react";

export default function SarimaView() {
  const [data, setData] = useState(null);
  const [showDifferenced, setShowDifferenced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSarima().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-slate-400 animate-pulse">Ejecutando Metodología Box-Jenkins y filtro de Kalman...</div>;
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
      {/* Barra Superior: Diagnóstico Dickey-Fuller e Hiperparámetros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {activeAdf.is_stationary ? (
                <CheckCircle2 className="text-emerald-400 w-5 h-5" />
              ) : (
                <AlertTriangle className="text-amber-400 w-5 h-5" />
              )}
              <h3 className="font-semibold text-white">
                Prueba de Raíz Unitaria de Dickey-Fuller (ADF):{" "}
                <span className={activeAdf.is_stationary ? "text-emerald-400" : "text-amber-400"}>
                  {activeAdf.conclusion}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Estadístico ADF: <span className="text-slate-200 font-mono">{activeAdf.adf_statistic}</span> |{" "}
              Valor-p: <span className="text-cyan-400 font-mono font-bold">{activeAdf.p_value}</span>{" "}
              (Nivel de significancia α = 0.05)
            </p>
          </div>
          <button
            onClick={() => setShowDifferenced(!showDifferenced)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition cursor-pointer shrink-0"
          >
            {showDifferenced ? "Ver Serie Original (Con Tendencia)" : "Aplicar Diferenciación (d=1, D=1)"}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Modelo Identificado: SARIMA(1,1,1)(0,1,1)[12]</p>
            <p className="text-lg font-bold text-white mt-0.5">
              MAPE: <span className="text-emerald-400">{data.model.model_specification.mape_percent}%</span> | AIC:{" "}
              <span className="text-cyan-400">{data.model.model_specification.aic}</span>
            </p>
          </div>
          <Activity className="text-cyan-400 w-8 h-8" />
        </div>
      </div>

      {/* Gráfico Principal: Pronóstico SARIMA + Bandas de Confianza */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-1">
          Serie Histórica de Siniestros, Ajuste In-Sample y Pronóstico Estocástico a 12 Meses (Bs)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Captura los ciclos estacionales de época de lluvias y fin de año (s = 12) proyectando bandas de incertidumbre al 95%.
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                formatter={(val) =>
                  Array.isArray(val)
                    ? `Bs ${val[0].toLocaleString()} - ${val[1].toLocaleString()}`
                    : `Bs ${Number(val).toLocaleString()}`
                }
              />
              <Legend />
              <Area type="monotone" dataKey="ci95" fill="#06b6d4" stroke="none" fillOpacity={0.2} name="Intervalo Confianza 95%" />
              <Line type="monotone" dataKey="actual" stroke="#f8fafc" strokeWidth={2} dot={{ r: 2 }} name="Siniestralidad Real (Bs)" />
              <Line type="monotone" dataKey="fitted" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} name="Ajuste SARIMA" />
              <Line type="monotone" dataKey="forecast" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="Pronóstico 12 Meses" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlogramas ACF y PACF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">
            Función de Autocorrelación (ACF) — {showDifferenced ? "Serie Diferenciada" : "Serie Original"}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Identifica el orden de Medias Móviles MA(q) y ciclos estacionales. Bandas de Bartlett al 95%: ±{activeCorrelogram.confidence_bound}.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corrChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="lag" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[-1, 1]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                <ReferenceLine y={activeCorrelogram.confidence_bound} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={-activeCorrelogram.confidence_bound} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="acf" fill="#06b6d4" name="ACF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">
            Autocorrelación Parcial (PACF - Yule-Walker) — {showDifferenced ? "Serie Diferenciada" : "Serie Original"}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Aísla el efecto directo de cada rezago para identificar el orden Autorregresivo AR(p).
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corrChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="lag" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[-1, 1]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                <ReferenceLine y={activeCorrelogram.confidence_bound} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={-activeCorrelogram.confidence_bound} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="pacf" fill="#8b5cf6" name="PACF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}