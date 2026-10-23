import os
import json
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data.generate_data import generate_insurance_data
from engine.markov_chain import MarkovBonusMalusEngine
from engine.time_series import TimeSeriesForecaster
from engine.anomaly_detector import GaussianAnomalyDetector
from engine.ruin_simulator import CramerLundbergRuinSimulator

app = FastAPI(
    title="InsurTech Stochastic Engine API",
    description="Pipeline Estocástico de Riesgo Actuarial: Markov, Box-Jenkins SARIMA, Procesos Gaussianos y Monte Carlo.",
    version="1.0.0"
)

# Configuración CORS para desarrollo con React (Vite / Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "synthetic_claims.csv")
MARKOV_PATH = os.path.join(DATA_DIR, "markov_config.json")

# Estado global en memoria para velocidad en la presentación en vivo
STATE = {}

@app.on_event("startup")
def initialize_engine():
    """Verifica que los datos existan y pre-calcula el modelo base al levantar el servidor."""
    if not os.path.exists(CSV_PATH) or not os.path.exists(MARKOV_PATH):
        generate_insurance_data(DATA_DIR)

    with open(MARKOV_PATH, "r", encoding="utf-8") as f:
        markov_cfg = json.load(f)

    df_claims = pd.read_csv(CSV_PATH)

    # 1. Inicializar Motor Markov
    markov_engine = MarkovBonusMalusEngine(
        states=markov_cfg["states"],
        transition_matrix=markov_cfg["transition_matrix"],
        initial_clients=markov_cfg["initial_clients"],
        base_premium=markov_cfg["base_premium_bs"],
        multipliers=markov_cfg["multipliers"]
    )
    markov_results = markov_engine.simulate_horizon(horizon_years=10)

    # 2. Inicializar Motor Series de Tiempo (SARIMA)
    ts_engine = TimeSeriesForecaster(df_claims)
    sarima_results = ts_engine.fit_and_forecast(
        order=(1, 1, 1),
        seasonal_order=(0, 1, 1, 12),
        forecast_steps=12
    )

    STATE["markov_cfg"] = markov_cfg
    STATE["df_claims"] = df_claims
    STATE["markov_engine"] = markov_engine
    STATE["markov_results"] = markov_results
    STATE["ts_engine"] = ts_engine
    STATE["sarima_results"] = sarima_results


@app.get("/api/health")
def health_check():
    return {"status": "online", "project": "DAT-262 Stochastic Actuarial Engine"}


# =========================================================================
# ENDPOINT MÓDULO 1: CADENAS DE MARKOV (BONUS-MALUS)
# =========================================================================
@app.get("/api/markov")
def get_markov_analysis(
    horizon_years: int = Query(10, ge=1, le=30, description="Años a proyectar en la cadena de Markov"),
    base_premium_bs: float = Query(350.0, ge=100.0, le=2000.0, description="Prima base mensual en Bs")
):
    cfg = STATE["markov_cfg"]
    engine = MarkovBonusMalusEngine(
        states=cfg["states"],
        transition_matrix=cfg["transition_matrix"],
        initial_clients=cfg["initial_clients"],
        base_premium=base_premium_bs,
        multipliers=cfg["multipliers"]
    )
    return engine.simulate_horizon(horizon_years=horizon_years)


# =========================================================================
# ENDPOINT MÓDULO 2: BOX-JENKINS & SARIMA
# =========================================================================
@app.get("/api/sarima")
def get_sarima_analysis(
    p: int = Query(1, ge=0, le=3),
    d: int = Query(1, ge=0, le=2),
    q: int = Query(1, ge=0, le=3),
    P: int = Query(0, ge=0, le=2),
    D: int = Query(1, ge=0, le=1),
    Q: int = Query(1, ge=0, le=2),
    forecast_steps: int = Query(12, ge=6, le=24)
):
    try:
        ts_engine: TimeSeriesForecaster = STATE["ts_engine"]
        stationarity = ts_engine.get_stationarity_analysis(d=d, D=D, s=12)
        correlograms_raw = ts_engine.get_correlograms(nlags=20, use_differenced=False)
        correlograms_diff = ts_engine.get_correlograms(nlags=20, use_differenced=True)
        decomposition = ts_engine.get_classical_decomposition(period=12)
        
        forecast_res = ts_engine.fit_and_forecast(
            order=(p, d, q),
            seasonal_order=(P, D, Q, 12),
            forecast_steps=forecast_steps
        )
        # Actualizamos caché si usa los parámetros por defecto
        if (p, d, q) == (1, 1, 1) and (P, D, Q) == (0, 1, 1) and forecast_steps == 12:
            STATE["sarima_results"] = forecast_res

        return {
            "stationarity": stationarity,
            "correlograms": {
                "original": correlograms_raw,
                "differenced": correlograms_diff
            },
            "decomposition": decomposition["decomposition"],
            "model": forecast_res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al converger SARIMA con esos parámetros: {str(e)}")


# =========================================================================
# ENDPOINT MÓDULO 3: PROCESOS GAUSSIANOS Y ANOMALÍAS
# =========================================================================
@app.get("/api/anomalies")
def get_anomalies_analysis(
    z_threshold: float = Query(2.8, ge=1.5, le=4.5, description="Umbral Z-Score robusto para clasificar anomalías")
):
    ts_engine: TimeSeriesForecaster = STATE["ts_engine"]
    if ts_engine.fitted_values is None:
        ts_engine.fit_and_forecast()

    detector = GaussianAnomalyDetector(
        dates=ts_engine.series.index,
        actual_values=ts_engine.series,
        fitted_values=ts_engine.fitted_values,
        burn_in=ts_engine.burn_in
    )
    return detector.analyze_residuals(z_threshold=z_threshold)
# =========================================================================
# ENDPOINT MÓDULO 4: SIMULACIÓN MONTE CARLO DE RUINA
# =========================================================================
@app.get("/api/monte-carlo")
def get_monte_carlo_ruin(
    initial_reserve_bs: float = Query(650_000.0, ge=50_000.0, le=2_500_000.0),
    n_simulations: int = Query(10_000, ge=1_000, le=50_000),
    catastrophe_prob: float = Query(0.04, ge=0.0, le=0.25),
    operating_expense_ratio: float = Query(0.18, ge=0.05, le=0.40)
):
    markov_res = STATE["markov_results"]
    sarima_res = STATE["sarima_results"]

    # Conectamos la prima del estado estacionario de Markov con los pronósticos de SARIMA
    stationary_revenue = markov_res["stationary_monthly_revenue_bs"]
    mc_params = sarima_res["monte_carlo_params"]

    simulator = CramerLundbergRuinSimulator(
        monthly_premium_revenue=stationary_revenue,
        forecast_means=mc_params["forecast_means"],
        forecast_stds=mc_params["forecast_stds"],
        operating_expense_ratio=operating_expense_ratio
    )

    return simulator.run_simulation(
        initial_reserve_u=initial_reserve_bs,
        n_simulations=n_simulations,
        catastrophe_prob=catastrophe_prob
    )