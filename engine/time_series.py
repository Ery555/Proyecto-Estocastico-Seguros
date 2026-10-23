import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from statsmodels.tsa.stattools import adfuller, acf, pacf
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings

warnings.filterwarnings("ignore")

class TimeSeriesForecaster:
    """
    Motor de Series de Tiempo bajo la Metodología Box-Jenkins.
    Incluye escalado numérico interno para evitar explosiones de varianza
    en la inicialización difusa del Filtro de Kalman.
    """
    SCALE_FACTOR = 1000.0  # Escala en miles de Bs para estabilidad numérica de la Hessiana

    def __init__(self, df: pd.DataFrame, date_col: str = "date", value_col: str = "claims_amount_bs"):
        self.df = df.copy()
        self.df[date_col] = pd.to_datetime(self.df[date_col])
        self.df.sort_values(by=date_col, inplace=True)
        self.df.set_index(date_col, inplace=True)
        self.df.index.freq = "MS"
        
        self.series = self.df[value_col].astype(float)
        self.fitted_values = None
        self.residuals = None
        self.burn_in = 13

    def run_adf_test(self, series: pd.Series) -> Dict[str, Any]:
        """Ejecuta la prueba de raíz unitaria de Dickey-Fuller Aumentada (Cap. 6.1.1)."""
        clean_series = series.dropna()
        result = adfuller(clean_series, autolag="AIC")
        p_value = float(result[1])
        
        return {
            "adf_statistic": round(float(result[0]), 4),
            "p_value": round(p_value, 4),
            "used_lags": int(result[2]),
            "n_obs": int(result[3]),
            "critical_values": {k: round(float(v), 4) for k, v in result[4].items()},
            "is_stationary": bool(p_value < 0.05),
            "conclusion": "Estacionaria (Se rechaza H₀)" if p_value < 0.05 else "No Estacionaria (Raíz Unitaria presente)"
        }

    def get_stationarity_analysis(self, d: int = 1, D: int = 1, s: int = 12) -> Dict[str, Any]:
        """Compara la serie original vs la serie diferenciada aplicando el operador de rezago L."""
        diff_series = self.series.copy()
        if D > 0:
            diff_series = diff_series.diff(s * D)
        if d > 0:
            for _ in range(d):
                diff_series = diff_series.diff(1)

        diff_clean = diff_series.dropna()

        return {
            "original_adf": self.run_adf_test(self.series),
            "differenced_adf": self.run_adf_test(diff_clean),
            "original_series": [
                {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 2)}
                for idx, val in self.series.items()
            ],
            "differenced_series": [
                {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 2)}
                for idx, val in diff_clean.items()
            ]
        }

    def get_correlograms(self, nlags: int = 20, use_differenced: bool = True) -> Dict[str, Any]:
        """Calcula ACF y PACF para la identificación del orden (p, q) del proceso."""
        target = self.series.diff(12).diff(1).dropna() if use_differenced else self.series.dropna()
        max_lags = min(nlags, (len(target) // 2) - 1)

        acf_vals = acf(target, nlags=max_lags, fft=False)
        pacf_vals = pacf(target, nlags=max_lags, method="ywm")
        conf_bound = 1.96 / np.sqrt(len(target))

        return {
            "lags": list(range(max_lags + 1)),
            "acf": np.round(acf_vals, 4).tolist(),
            "pacf": np.round(pacf_vals, 4).tolist(),
            "confidence_bound": round(float(conf_bound), 4)
        }

    def get_classical_decomposition(self, period: int = 12) -> Dict[str, Any]:
        """Descomposición aditiva de la serie en Tendencia, Estacionalidad y Residuo."""
        decomp = seasonal_decompose(self.series, model="additive", period=period, extrapolate_trend="freq")
        
        records = []
        for idx in self.series.index:
            records.append({
                "date": idx.strftime("%Y-%m-%d"),
                "observed": round(float(decomp.observed.loc[idx]), 2),
                "trend": round(float(decomp.trend.loc[idx]), 2),
                "seasonal": round(float(decomp.seasonal.loc[idx]), 2),
                "resid": round(float(decomp.resid.loc[idx]), 2)
            })
        return {"decomposition": records}

    def fit_and_forecast(
        self,
        order: Tuple[int, int, int] = (1, 1, 1),
        seasonal_order: Tuple[int, int, int, int] = (0, 1, 1, 12),
        forecast_steps: int = 12
    ) -> Dict[str, Any]:
        """
        Ajusta el modelo SARIMA sobre la serie escalada, asegurando invertibilidad
        y estacionariedad para evitar explosiones numéricas en el Filtro de Kalman.
        """
        scaled_series = self.series / self.SCALE_FACTOR

        try:
            model = SARIMAX(
                scaled_series,
                order=order,
                seasonal_order=seasonal_order,
                enforce_stationarity=True,
                enforce_invertibility=True,
                concentrate_scale=True
            )
            res = model.fit(disp=False, maxiter=200)
        except Exception:
            # Fallback si las condiciones iniciales están fuera de la región estacionaria
            model = SARIMAX(
                scaled_series,
                order=order,
                seasonal_order=seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False,
                concentrate_scale=True
            )
            res = model.fit(disp=False, maxiter=200)

        # Periodo de calentamiento del Filtro de Kalman (raíces unitarias estacionales + regulares)
        self.burn_in = (seasonal_order[3] * seasonal_order[1]) + order[1] + 1

        # Re-escalamos los valores ajustados a Bolivianos (Bs)
        raw_fitted = res.fittedvalues * self.SCALE_FACTOR
        
        # Filtro de seguridad: reemplazamos el periodo de burn-in con NaN para no distorsionar gráficas
        clean_fitted = raw_fitted.copy()
        clean_fitted.iloc[:self.burn_in] = np.nan

        self.fitted_values = clean_fitted
        self.residuals = self.series - self.fitted_values

        # Pronóstico out-of-sample re-escalado a Bolivianos
        forecast_obj = res.get_forecast(steps=forecast_steps)
        pred_mean = forecast_obj.predicted_mean * self.SCALE_FACTOR
        conf_int_95 = forecast_obj.conf_int(alpha=0.05) * self.SCALE_FACTOR
        conf_int_80 = forecast_obj.conf_int(alpha=0.20) * self.SCALE_FACTOR
        pred_std = np.sqrt(forecast_obj.var_pred_mean) * self.SCALE_FACTOR

        valid_actual = self.series.iloc[self.burn_in:]
        valid_fitted = self.fitted_values.iloc[self.burn_in:]
        valid_resid = self.residuals.iloc[self.burn_in:]
        
        mape = float(np.mean(np.abs((valid_actual - valid_fitted) / valid_actual)) * 100)
        rmse = float(np.sqrt(np.mean((valid_actual - valid_fitted) ** 2)))

        historical_data = []
        for idx in self.series.index:
            fit_val = self.fitted_values.loc[idx]
            historical_data.append({
                "date": idx.strftime("%Y-%m-%d"),
                "actual_bs": round(float(self.series.loc[idx]), 2),
                "fitted_bs": round(float(fit_val), 2) if pd.notna(fit_val) else None
            })

        forecast_data = []
        for idx in pred_mean.index:
            forecast_data.append({
                "date": idx.strftime("%Y-%m-%d"),
                "forecast_bs": round(float(pred_mean.loc[idx]), 2),
                "std_error_bs": round(float(pred_std.loc[idx]), 2),
                "lower_80_bs": round(float(conf_int_80.loc[idx].iloc[0]), 2),
                "upper_80_bs": round(float(conf_int_80.loc[idx].iloc[1]), 2),
                "lower_95_bs": round(float(conf_int_95.loc[idx].iloc[0]), 2),
                "upper_95_bs": round(float(conf_int_95.loc[idx].iloc[1]), 2)
            })

        return {
            "model_specification": {
                "order": list(order),
                "seasonal_order": list(seasonal_order),
                "aic": round(float(res.aic), 2),
                "bic": round(float(res.bic), 2),
                "mape_percent": round(mape, 2),
                "rmse_bs": round(rmse, 2)
            },
            "historical": historical_data,
            "forecast": forecast_data,
            "monte_carlo_params": {
                "forecast_means": np.round(pred_mean.values, 2).tolist(),
                "forecast_stds": np.round(pred_std.values, 2).tolist(),
                "residual_std": round(float(np.std(valid_resid)), 2)
            }
        }