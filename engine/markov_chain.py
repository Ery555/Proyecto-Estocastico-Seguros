import numpy as np
from typing import List, Dict, Any

class MarkovBonusMalusEngine:
    """
    Motor de Cadenas de Markov en Tiempo Discreto (DTMC) para modelar
    la migración de riesgo de asegurados bajo un esquema Bonus-Malus.
    """
    def __init__(
        self, 
        states: List[str], 
        transition_matrix: List[List[float]], 
        initial_clients: List[int],
        base_premium: float,
        multipliers: List[float]
    ):
        self.states = states
        self.P = np.array(transition_matrix, dtype=float)
        self.initial_clients = np.array(initial_clients, dtype=float)
        self.total_clients = float(np.sum(self.initial_clients))
        self.pi_0 = self.initial_clients / self.total_clients
        self.base_premium = base_premium
        self.multipliers = np.array(multipliers, dtype=float)
        
        self._validate_matrix()

    def _validate_matrix(self):
        if self.P.shape[0] != self.P.shape[1]:
            raise ValueError("La matriz de transición debe ser cuadrada.")
        if not np.allclose(self.P.sum(axis=1), 1.0, atol=1e-4):
            raise ValueError("Cada fila de la matriz de transición debe sumar 1.0.")

    def get_n_step_matrix(self, steps: int) -> np.ndarray:
        """Calcula la matriz de probabilidad de transición en n pasos: P^n."""
        return np.linalg.matrix_power(self.P, steps)

    def compute_stationary_distribution(self) -> np.ndarray:
        """
        Calcula la distribución estacionaria (pi * P = pi) mediante 
        descomposición de autovalores y autovectores de P^T.
        """
        eigenvalues, eigenvectors = np.linalg.eig(self.P.T)
        # Buscamos el autovector asociado al autovalor unitario (lambda = 1)
        idx = np.argmin(np.abs(eigenvalues - 1.0))
        stationary = np.real(eigenvectors[:, idx])
        # Normalizamos para que la suma de probabilidades sea 1
        stationary = stationary / np.sum(stationary)
        return stationary

    def simulate_horizon(self, horizon_years: int = 10) -> Dict[str, Any]:
        """
        Proyecta la evolución de la cartera año por año y calcula 
        el ingreso esperado por primas para alimentar el flujo de caja.
        """
        stationary_pi = self.compute_stationary_distribution()
        timeline = []

        for step in range(horizon_years + 1):
            P_n = self.get_n_step_matrix(step)
            current_dist = self.pi_0 @ P_n
            current_clients = current_dist * self.total_clients
            
            # Ingreso mensual esperado = sum(clientes_en_estado_i * prima_base * multiplicador_i)
            monthly_revenue = float(np.sum(current_clients * self.base_premium * self.multipliers))
            
            timeline.append({
                "step": step,
                "distribution": np.round(current_dist, 4).tolist(),
                "clients_per_state": np.round(current_clients, 0).astype(int).tolist(),
                "expected_monthly_revenue_bs": round(monthly_revenue, 2)
            })

        # Ingreso mensual en el estado estacionario (largo plazo)
        stationary_clients = stationary_pi * self.total_clients
        stationary_monthly_revenue = float(
            np.sum(stationary_clients * self.base_premium * self.multipliers)
        )

        # Formateo de aristas del grafo para renderizar nodos en React
        graph_edges = []
        n = len(self.states)
        for i in range(n):
            for j in range(n):
                if self.P[i, j] > 0.0:
                    graph_edges.append({
                        "source": self.states[i],
                        "target": self.states[j],
                        "probability": round(float(self.P[i, j]), 4)
                    })

        return {
            "states": self.states,
            "total_clients": int(self.total_clients),
            "base_premium_bs": self.base_premium,
            "multipliers": self.multipliers.tolist(),
            "transition_matrix": np.round(self.P, 4).tolist(),
            "stationary_distribution": np.round(stationary_pi, 4).tolist(),
            "stationary_clients": np.round(stationary_clients, 0).astype(int).tolist(),
            "stationary_monthly_revenue_bs": round(stationary_monthly_revenue, 2),
            "projections": timeline,
            "graph_edges": graph_edges
        }