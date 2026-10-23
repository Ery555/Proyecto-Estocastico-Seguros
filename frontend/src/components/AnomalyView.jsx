import React, { useState, useEffect } from "react";
import { fetchAnomalies } from "../api";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { ShieldAlert, Sparkles } from "lucide-react";

export default function AnomalyView() {
  const [zThreshold, setZThreshold] = useState(2.8);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnomalies(zThreshold).then(setData);
  }, [zThreshold]);

  if (!data) {
    return <div className="p-8 text-slate-400 animate-pulse">Evaluando estacionariedad gaussiana de residuos...</div>;
  }

  const chartData = data.residuals_timeline.map((item) => ({
    ...item,
    dateShort: item.date.slice(0, 7),
    anomalyPoint: item.is_anomaly ? item.residual_bs : null,
  }));

  const metrics = data.gaussian_process_metrics;

  return (
    <div className="space-y-6">
      {/* Panel de Control Z-Score y Prueba de Normalidad Shapiro-Wilk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
            Sensibilidad del Filtro (Z-Score Robusto): <span className="text-rose-400 font-bold">±{zThreshold}σ</span>
          </label>
          <input
            type="range" min="1.8" max="4.0" step="0.1" value={zThreshold}
            onChange={(e) => setZThreshold(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <p className="text-xs text-slate-500 mt-1">
            Banda de control: ±Bs {metrics.upper_control_band_bs.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Normalidad Shapiro-Wilk (Sin Filtrar)</p>
            <p className="text-base font-bold text-rose-400">
              p = {metrics.raw_normality_shapiro_p} (Rechaza Normalidad)
            </p>
          </div>
          <ShieldAlert className="text-rose-500 w-7 h-7" />
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Normalidad Proceso Limpio (Cap. 2)</p>
            <p className="text-base font-bold text-emerald-400">
              p = {metrics.clean_normality_shapiro_p} (Ruido Blanco Gaussiano)
            </p>
          </div>
          <Sparkles className="text-emerald-400 w-7 h-7" />
        </div>
      </div>

      {/* Gráfico de Bandas de Control sobre Residuos Estocásticos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-1">
          Diagnóstico de Innovaciones Estocásticas (e<sub>t</sub> = Y<sub>t</sub> − Ŷ<sub>t</sub>) y Detección de Choques Extremos
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Las observaciones que perforan el umbral ±{zThreshold}σ (estimado con MAD robusto) se aíslan como eventos catastróficos o anomalías operativas.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dateShort" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                formatter={(v) => `Bs ${Number(v).toLocaleString()}`}
              />
              <Legend />
              <ReferenceLine y={metrics.upper_control_band_bs} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: `+${zThreshold}σ`, fill: "#f43f5e", fontSize: 11 }} />
              <ReferenceLine y={metrics.lower_control_band_bs} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: `-${zThreshold}σ`, fill: "#f43f5e", fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Line type="monotone" dataKey="residual_bs" stroke="#94a3b8" strokeWidth={1.8} dot={{ r: 2 }} name="Residuo Estocástico (Bs)" />
              <Scatter dataKey="anomalyPoint" fill="#f43f5e" name="Anomalía Detectada" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Eventos Anómalos Detectados */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">
          Bitácora de Eventos Anómalos Aislados ({data.anomalies_table.length} eventos detectados)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="py-2 px-3">Periodo</th>
                <th className="py-2 px-3">Reclamo Real</th>
                <th className="py-2 px-3">Esperado (SARIMA)</th>
                <th className="py-2 px-3">Desviación (e<sub>t</sub>)</th>
                <th className="py-2 px-3">Z-Score Robusto</th>
                <th className="py-2 px-3">Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {data.anomalies_table.map((row) => (
                <tr key={row.date} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-white">{row.date}</td>
                  <td className="py-2.5 px-3">Bs {row.actual_bs.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-400">Bs {row.expected_bs.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-semibold text-rose-400">
                    {row.residual_bs > 0 ? "+" : ""}Bs {row.residual_bs.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{row.z_score}σ</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {row.anomaly_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}