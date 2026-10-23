import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Any, Tuple

class GaussianAnomalyDetector:
    """
    Motor de diagnóstico de Procesos Normales (Cap. 2) y Detección de Anomalías (Cap. 7.5).
    Evalúa la normalidad de las innovaciones estocásticas y detecta choques
    extremos (fraudes o siniestros catastróficos) mediante Z-Score robusto.
    """
    def __init__(self, dates: pd.Index, actual_values: pd.Series, fitted_values: pd.Series, burn_in: int = 13):
        # Descartamos el periodo inicial de convergencia del filtro de estado
        self.dates = dates[burn_in:]
        self.actual = actual_values.iloc[burn_in:].values
        self.fitted = fitted_values.iloc[burn_in:].values
        self.residuals = self.actual - self.fitted

    def _compute_robust_gaussian_params(self) -> Tuple[float, float]:
        """
        Estima media y desviación estándar robustas ante contaminaciones extremas
        usando la mediana y el factor de consistencia normal (1.4826 * MAD).
        """
        median = float(np.median(self.residuals))
        mad = float(np.median(np.abs(self.residuals - median)))
        robust_sigma = 1.4826 * mad if mad > 0 else float(np.std(self.residuals))
        return median, robust_sigma

    def analyze_residuals(self, z_threshold: float = 2.8) -> Dict[str, Any]:
        """
        Ejecuta el filtro de anomalías y verifica si el proceso subyacente 
        cumple las propiedades de un Proceso Normal Estacionario (Cap. 2.1 y 2.3).
        """
        mu_rob, sigma_rob = self._compute_robust_gaussian_params()
        z_scores = (self.residuals - mu_rob) / sigma_rob

        # Identificación de anomalías según el umbral interactivo
        is_anomaly = np.abs(z_scores) > z_threshold

        # Pruebas de Normalidad de Scipy sobre el proceso completo vs proceso limpio (sin anomalías)
        clean_residuals = self.residuals[~is_anomaly]
        
        shapiro_raw_stat, shapiro_raw_p = stats.shapiro(self.residuals)
        shapiro_clean_stat, shapiro_clean_p = stats.shapiro(clean_residuals)
        jb_stat, jb_p = stats.jarque_bera(clean_residuals)

        # Construcción de la serie de residuos para el gráfico de bandas de control en React
        upper_band = mu_rob + (z_threshold * sigma_rob)
        lower_band = mu_rob - (z_threshold * sigma_rob)

        timeline = []
        detected_anomalies = []

        for i, dt in enumerate(self.dates):
            date_str = dt.strftime("%Y-%m-%d")
            res_val = float(self.residuals[i])
            z_val = float(z_scores[i])
            anom_flag = bool(is_anomaly[i])

            severity_type = "Normal"
            if anom_flag:
                severity_type = "Catástrofe / Sobrecosto Atípico" if res_val > 0 else "Caída Operativa / Subregistro"

            record = {
                "date": date_str,
                "actual_bs": round(float(self.actual[i]), 2),
                "expected_bs": round(float(self.fitted[i]), 2),
                "residual_bs": round(res_val, 2),
                "z_score": round(z_val, 2),
                "is_anomaly": anom_flag,
                "anomaly_type": severity_type,
                "upper_limit_bs": round(float(upper_band), 2),
                "lower_limit_bs": round(float(lower_band), 2)
            }
            timeline.append(record)
            if anom_flag:
                detected_anomalies.append(record)

        # Generación de la curva de densidad Gaussiana teórica vs empírica para el histograma
        x_grid = np.linspace(mu_rob - 4 * sigma_rob, mu_rob + 4 * sigma_rob, 60)
        pdf_values = stats.norm.pdf(x_grid, loc=mu_rob, scale=sigma_rob)

        return {
            "gaussian_process_metrics": {
                "robust_mean_bs": round(mu_rob, 2),
                "robust_std_bs": round(sigma_rob, 2),
                "z_threshold": z_threshold,
                "upper_control_band_bs": round(float(upper_band), 2),
                "lower_control_band_bs": round(float(lower_band), 2),
                "raw_normality_shapiro_p": round(float(shapiro_raw_p), 4),
                "clean_normality_shapiro_p": round(float(shapiro_clean_p), 4),
                "clean_jarque_bera_p": round(float(jb_p), 4),
                "is_gaussian_white_noise": bool(shapiro_clean_p > 0.05)
            },
            "summary": {
                "total_evaluated_months": len(self.dates),
                "anomalies_count": len(detected_anomalies),
                "total_anomalous_excess_bs": round(
                    float(np.sum([a["residual_bs"] for a in detected_anomalies if a["residual_bs"] > 0])), 2
                )
            },
            "anomalies_table": detected_anomalies,
            "residuals_timeline": timeline,
            "gaussian_bell_curve": [
                {"residual_x": round(float(x), 2), "density": float(y)}
                for x, y in zip(x_grid, pdf_values)
            ]
        }