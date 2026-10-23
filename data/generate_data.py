import os
import json
import numpy as np
import pandas as pd

# Semilla para reproducibilidad científica en la defensa
np.random.seed(42)

def generate_insurance_data(output_dir: str = "data"):
    os.makedirs(output_dir, exist_ok=True)

    # ==========================================
    # 1. DATOS PARA CADENA DE MARKOV (BONUS-MALUS)
    # ==========================================
    # Estados: 
    # E0: Óptimo (-15% prima) | E1: Estándar (Base) | E2: Recargo (+25% prima) | E3: Crítico (+60% prima)
    states = ["Óptimo (E0)", "Estándar (E1)", "Recargo (E2)", "Crítico (E3)"]
    
    # Matriz de transición teórica realista (filas suman 1)
    true_transition_matrix = np.array([
        [0.80, 0.15, 0.04, 0.01],  # Desde E0
        [0.25, 0.60, 0.12, 0.03],  # Desde E1
        [0.05, 0.30, 0.50, 0.15],  # Desde E2
        [0.01, 0.10, 0.34, 0.55]   # Desde E3
    ])

    # Simulamos transiciones empíricas de 5,000 clientes para guardar conteos reales
    n_clients = 5000
    initial_distribution = [0.35, 0.45, 0.15, 0.05] # Distribución inicial año 0
    
    # Guardamos metadatos y matriz empírica en JSON para consumo rápido o recalculo
    markov_metadata = {
        "states": states,
        "base_premium_bs": 350.0, # Prima mensual promedio en Bs
        "multipliers": [0.85, 1.0, 1.25, 1.60],
        "initial_clients": [int(n_clients * p) for p in initial_distribution],
        "transition_matrix": true_transition_matrix.tolist()
    }
    
    with open(os.path.join(output_dir, "markov_config.json"), "w", encoding="utf-8") as f:
        json.dump(markov_metadata, f, indent=4, ensure_ascii=False)

    # ==========================================
    # 2. SERIE DE TIEMPO MENSUAL (SARIMA + ANOMALÍAS)
    # ==========================================
    # 60 meses (5 años: 2021-01 a 2025-12)
    dates = pd.date_range(start="2021-01-01", periods=60, freq="MS")
    n_periods = len(dates)

    # A. Tendencia lineal suave (crecimiento de cartera e inflación)
    trend = np.linspace(850_000, 1_350_000, n_periods)

    # B. Componente Estacional (S=12): Picos en Dic, Ene, Feb (lluvias/fiestas en Bolivia)
    seasonal_pattern = np.array([
        180_000,  # Enero (Lluvias/Viajes)
        150_000,  # Febrero (Carnaval/Lluvias)
        -40_000,  # Marzo
        -80_000,  # Abril
        -90_000,  # Mayo
        -60_000,  # Junio
        10_000,   # Julio (Invierno/Vacaciones)
        -30_000,  # Agosto
        -70_000,  # Septiembre
        -50_000,  # Octubre
        30_000,   # Noviembre
        220_000   # Diciembre (Fiestas de fin de año)
    ])
    seasonality = np.tile(seasonal_pattern, n_periods // 12)

    # C. Proceso Estocástico ARMA(1,1) para los residuos normales
    ar_param = 0.55
    ma_param = 0.30
    sigma = 45_000 # Desviación estándar del ruido blanco gaussiano
    
    white_noise = np.random.normal(0, sigma, n_periods)
    arma_error = np.zeros(n_periods)
    
    for t in range(1, n_periods):
        arma_error[t] = (ar_param * arma_error[t-1]) + white_noise[t] + (ma_param * white_noise[t-1])

    # D. Serie base de siniestros (Severidad Total en Bs)
    claims_amount = trend + seasonality + arma_error

    # E. Inyección de Anomalías (> 3.5 sigmas) para el Módulo 3
    anomalies_idx = [13, 35, 50] # Feb 2022, Dic 2023, Mar 2025
    anomaly_shocks = [290_000, 340_000, -260_000] # Dos catástrofes y una caída anómala de sistema
    
    is_anomaly = np.zeros(n_periods, dtype=bool)
    for idx, shock in zip(anomalies_idx, anomaly_shocks):
        claims_amount[idx] += shock
        is_anomaly[idx] = True

    # F. Frecuencia de siniestros (cantidad de casos reportados al mes)
    claims_count = np.round(claims_amount / np.random.normal(4200, 180, n_periods)).astype(int)

    df_series = pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "claims_amount_bs": np.round(claims_amount, 2),
        "claims_count": claims_count,
        "trend_component": np.round(trend, 2),
        "seasonal_component": np.round(seasonality, 2),
        "true_anomaly": is_anomaly
    })

    csv_path = os.path.join(output_dir, "synthetic_claims.csv")
    df_series.to_csv(csv_path, index=False)
    print(f"[OK] Dataset de serie de tiempo generado en: {csv_path} ({len(df_series)} meses)")
    print(f"[OK] Configuración de Markov generada en: {output_dir}/markov_config.json")

if __name__ == "__main__":
    generate_insurance_data()