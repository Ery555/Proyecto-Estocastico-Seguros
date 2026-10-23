import numpy as np
from typing import List, Dict, Any

class CramerLundbergRuinSimulator:
    """
    Simulador Monte Carlo vectorizado para el Proceso de Ruina de Cramér-Lundberg.
    Conecta los ingresos estocásticos por primas (Markov) con los egresos 
    pronosticados por siniestros (SARIMA + Choques Extremos).
    """
    def __init__(
        self,
        monthly_premium_revenue: float,
        forecast_means: List[float],
        forecast_stds: List[float],
        operating_expense_ratio: float = 0.18
    ):
        # Ingreso neto disponible para cubrir siniestros (descontando gastos administrativos/comisiones)
        self.net_monthly_inflow = monthly_premium_revenue * (1.0 - operating_expense_ratio)
        self.forecast_means = np.array(forecast_means, dtype=float)
        self.forecast_stds = np.array(forecast_stds, dtype=float)
        self.horizon = len(self.forecast_means)

    def run_simulation(
        self,
        initial_reserve_u: float = 650_000.0,
        n_simulations: int = 10_000,
        catastrophe_prob: float = 0.04,
        catastrophe_mean_bs: float = 310_000.0,
        seed: int = 42
    ) -> Dict[str, Any]:
        """
        Ejecuta N trayectorias estocásticas del capital de reserva U(t) en 12 meses.
        """
        rng = np.random.default_rng(seed)

        # 1. Generación matricial de siniestros normales: Matriz (n_simulations x horizon)
        normal_claims = rng.normal(
            loc=self.forecast_means,
            scale=self.forecast_stds,
            size=(n_simulations, self.horizon)
        )
        normal_claims = np.maximum(normal_claims, 0.0) # Los reclamos no pueden ser negativos

        # 2. Inyección estocástica de eventos cisne negro / catástrofes (Proceso de salto compuesto)
        cat_events = rng.binomial(1, catastrophe_prob, size=(n_simulations, self.horizon))
        cat_severity = rng.exponential(scale=catastrophe_mean_bs, size=(n_simulations, self.horizon))
        total_claims_matrix = normal_claims + (cat_events * cat_severity)

        # 3. Flujo neto mensual: c_t - S_t
        net_cashflows = self.net_monthly_inflow - total_claims_matrix

        # 4. Trayectorias acumuladas del superávit U(t) = u + sum(c_k - S_k)
        cumulative_flows = np.cumsum(net_cashflows, axis=1)
        trajectories = np.hstack([
            np.full((n_simulations, 1), initial_reserve_u),
            initial_reserve_u + cumulative_flows
        ])

        # 5. Detección de Ruina: U(t) <= 0 en cualquier mes t del horizonte
        ruined_mask = np.any(trajectories[:, 1:] <= 0.0, axis=1)
        ruin_probability = float(np.mean(ruined_mask))

        # 6. Métricas de Riesgo Actuarial (VaR y TVaR al 99% de pérdida acumulada anual)
        annual_net_loss = -cumulative_flows[:, -1] # Positivo significa pérdida neta de reserva en el año
        var_95 = float(np.percentile(annual_net_loss, 95))
        var_99 = float(np.percentile(annual_net_loss, 99))
        tvar_99 = float(np.mean(annual_net_loss[annual_net_loss >= var_99]))

        # Capital óptimo requerido para que P(Ruina) <= 1% (Basado en el déficit máximo por trayectoria)
        max_drawdowns = np.max(-cumulative_flows, axis=1)
        optimal_reserve_99 = float(np.maximum(0.0, np.percentile(max_drawdowns, 99)))
        optimal_reserve_95 = float(np.maximum(0.0, np.percentile(max_drawdowns, 95)))

        # 7. Construcción de curva de sensibilidad: Capital Inicial (u) vs Probabilidad de Ruina
        u_grid = np.linspace(100_000, 1_500_000, 29)
        sensitivity_curve = []
        for u_val in u_grid:
            prob_at_u = float(np.mean(max_drawdowns >= u_val))
            sensitivity_curve.append({
                "initial_reserve_bs": round(float(u_val), 0),
                "ruin_probability_pct": round(prob_at_u * 100, 2),
                "solvency_pct": round((1.0 - prob_at_u) * 100, 2)
            })

        # 8. Bandas de cuantiles y muestra de 60 trayectorias para el "Spaghetti Plot" en React
        p05 = np.percentile(trajectories, 5, axis=0)
        p25 = np.percentile(trajectories, 25, axis=0)
        p50 = np.percentile(trajectories, 50, axis=0)
        p75 = np.percentile(trajectories, 75, axis=0)
        p95 = np.percentile(trajectories, 95, axis=0)

        fan_chart_data = []
        for t in range(self.horizon + 1):
            fan_chart_data.append({
                "month": t,
                "p05_bs": round(float(p05[t]), 2),
                "p25_bs": round(float(p25[t]), 2),
                "median_bs": round(float(p50[t]), 2),
                "p75_bs": round(float(p75[t]), 2),
                "p95_bs": round(float(p95[t]), 2)
            })

        # Seleccionamos 60 trayectorias representativas (incluyendo algunas en ruina) para no saturar el DOM
        sample_indices = rng.choice(n_simulations, size=min(60, n_simulations), replace=False)
        sample_paths = []
        for idx_num, sim_idx in enumerate(sample_indices):
            path_vals = trajectories[sim_idx]
            sample_paths.append({
                "path_id": f"sim_{idx_num}",
                "is_ruined": bool(ruined_mask[sim_idx]),
                "values": np.round(path_vals, 2).tolist()
            })

        # Diferencia de capital (Capital liberado o déficit frente a la reserva actual)
        capital_diff = initial_reserve_u - optimal_reserve_99

        return {
            "simulation_summary": {
                "n_simulations": n_simulations,
                "initial_reserve_bs": round(initial_reserve_u, 2),
                "net_monthly_premium_inflow_bs": round(self.net_monthly_inflow, 2),
                "ruin_probability_pct": round(ruin_probability * 100, 2),
                "solvency_probability_pct": round((1.0 - ruin_probability) * 100, 2),
                "var_95_bs": round(max(0.0, var_95), 2),
                "var_99_bs": round(max(0.0, var_99), 2),
                "tvar_99_bs": round(max(0.0, tvar_99), 2),
                "optimal_reserve_99_bs": round(optimal_reserve_99, 2),
                "optimal_reserve_95_bs": round(optimal_reserve_95, 2),
                "releasable_capital_bs": round(capital_diff, 2),
                "status": "SOLVENTE (Óptimo)" if ruin_probability <= 0.01 else ("RIESGO MODERADO" if ruin_probability <= 0.05 else "ALERTA DE QUIEBRA")
            },
            "fan_chart": fan_chart_data,
            "sample_trajectories": sample_paths,
            "reserve_sensitivity_curve": sensitivity_curve
        }