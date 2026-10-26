import React, { useState, useEffect } from "react";
import { fetchAnomalies } from "../api";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { ShieldAlert, Sparkles, ArrowRight } from "lucide-react";

export default function AnomalyView({ mathMode, onNext }) {
  const [zThreshold, setZThreshold] = useState(2.8);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnomalies(zThreshold).then(setData);
  }, [zThreshold]);

  if (!data) {
    return <div className="p-8 text-slate-500 animate-pulse">Auditando eventos extraordinarios de Seguros Illimani...</div>;
  }

  const chartData = data.residuals_timeline.map((item) => ({
    ...item,
    dateShort: item.date.slice(0, 7),
    anomalyPoint: item.is_anomaly ? item.residual_bs : null,
  }));

  const metrics = data.gaussian_process_metrics;

  return (
    <div className="space-y-6">
      {/* Banner de Storytelling */}
      <div className="bg-white border-l-4 border-l-rose-600 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
            <ShieldAlert className="w-4 h-4" />
            <span>Paso 3 de la Historia: ¿Cómo separamos el azar normal de una catástrofe?</span>
          </div>
          <p className="text-sm text-slate-700">
            Si ocurre un deslizamiento extraordinario o un fraude masivo, no podemos tratarlo como un mes normal. Este filtro detecta automáticamente <strong>{data.anomalies_table.length} choques anómalos</strong> en los últimos 4 años para inyectarlos como escenarios de estrés en la simulación final.
          </p>
        </div>
        <button
          onClick={onNext}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F1E36] text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
        >
          <span>Simular Solvencia en Paso 4</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Panel de Control Z-Score y Prueba de Normalidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {mathMode ? "Umbral Z-Score Robusto (MAD): " : "Rigor del Detector de Alertas: "}
            <span className="text-rose-600 font-bold">±{zThreshold}σ</span>
          </label>
          <input
            type="range" min="1.8" max="4.0" step="0.1" value={zThreshold}
            onChange={(e) => setZThreshold(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer"
          />
          <p className="text-xs text-slate-500 mt-1">
            Tolerancia normal: ±Bs {metrics.upper_control_band_bs.toLocaleString()}
          </p>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-900 font-medium">
              {mathMode ? "Test Shapiro-Wilk (Datos Crudos)" : "Datos Sin FiltrarCatástrofes"}
            </p>
            <p className="text-sm font-bold text-rose-700 mt-0.5">
              {mathMode
                ? `p = ${metrics.raw_normality_shapiro_p} (No Gaussiano)`
                : `${data.anomalies_table.length} eventos distorsionan el promedio`}
            </p>
          </div>
          <ShieldAlert className="text-rose-600 w-7 h-7 shrink-0" />
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-900 font-medium">
              {mathMode ? "Test Shapiro-Wilk (Proceso Limpio Cap. 2)" : "Comportamiento tras el Filtro"}
            </p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">
              {mathMode
                ? `p = ${metrics.clean_normality_shapiro_p} (Ruido Blanco Gaussiano)`
                : "Proceso Estable y 100% Auditable"}
            </p>
          </div>
          <Sparkles className="text-emerald-600 w-7 h-7 shrink-0" />
        </div>
      </div>

      {/* Gráfico de Bandas de Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-[#0F1E36] mb-1">
          {mathMode
            ? "Proceso de Innovaciones Estocásticas (e_t = Y_t − Ŷ_t) con Bandas ±Zσ"
            : "Radar de Desviaciones Mensuales: Meses Normales vs. Choques Extraordinarios"}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Los puntos rojos que rompen las líneas punteadas son siniestros atípicos que superan la variación natural del negocio.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dateShort" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={(v) => `Bs ${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f1e36" }}
                formatter={(v) => `Bs ${Number(v).toLocaleString()}`}
              />
              <Legend />
              <ReferenceLine y={metrics.upper_control_band_bs} stroke="#e11d48" strokeDasharray="4 4" label={{ value: `+${zThreshold}σ`, fill: "#e11d48", fontSize: 11 }} />
              <ReferenceLine y={metrics.lower_control_band_bs} stroke="#e11d48" strokeDasharray="4 4" label={{ value: `-${zThreshold}σ`, fill: "#e11d48", fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#64748b" />
              <Line type="monotone" dataKey="residual_bs" stroke="#475569" strokeWidth={1.8} dot={{ r: 2 }} name="Variación Mensual (Bs)" />
              <Scatter dataKey="anomalyPoint" fill="#e11d48" name="Evento Extraordinario Aislado" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bitácora de Eventos */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#0F1E36] mb-3">
          Bitácora de Auditoría: Eventos Extraordinarios Detectados ({data.anomalies_table.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Mes Detectado</th>
                <th className="py-2.5 px-3">Monto Reclamado</th>
                <th className="py-2.5 px-3">Esperado por Estacionalidad</th>
                <th className="py-2.5 px-3">Sobrecosto Atípico</th>
                {mathMode && <th className="py-2.5 px-3">Z-Score Robusto</th>}
                <th className="py-2.5 px-3">Diagnóstico Operativo</th>
              </tr>
            </thead>
            <tbody>
              {data.anomalies_table.map((row) => (
                <tr key={row.date} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#0F1E36]">{row.date}</td>
                  <td className="py-2.5 px-3">Bs {row.actual_bs.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Bs {row.expected_bs.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-bold text-rose-600">
                    {row.residual_bs > 0 ? "+" : ""}Bs {row.residual_bs.toLocaleString()}
                  </td>
                  {mathMode && (
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{row.z_score}σ</td>
                  )}
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
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