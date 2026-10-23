const API_BASE = "http://localhost:8000/api";

export async function fetchMarkov(horizonYears = 10, basePremium = 350) {
  const res = await fetch(
    `${API_BASE}/markov?horizon_years=${horizonYears}&base_premium_bs=${basePremium}`
  );
  if (!res.ok) throw new Error("Error al obtener datos de Markov");
  return res.json();
}

export async function fetchSarima(params = {}) {
  const { p = 1, d = 1, q = 1, P = 0, D = 1, Q = 1, steps = 12 } = params;
  const res = await fetch(
    `${API_BASE}/sarima?p=${p}&d=${d}&q=${q}&P=${P}&D=${D}&Q=${Q}&forecast_steps=${steps}`
  );
  if (!res.ok) throw new Error("Error al ajustar el modelo SARIMA");
  return res.json();
}

export async function fetchAnomalies(zThreshold = 2.8) {
  const res = await fetch(`${API_BASE}/anomalies?z_threshold=${zThreshold}`);
  if (!res.ok) throw new Error("Error al analizar anomalías");
  return res.json();
}

export async function fetchMonteCarlo(params = {}) {
  const {
    initialReserve = 650000,
    nSimulations = 10000,
    catastropheProb = 0.04,
    expenseRatio = 0.18,
  } = params;
  const res = await fetch(
    `${API_BASE}/monte-carlo?initial_reserve_bs=${initialReserve}&n_simulations=${nSimulations}&catastrophe_prob=${catastropheProb}&operating_expense_ratio=${expenseRatio}`
  );
  if (!res.ok) throw new Error("Error en la simulación Monte Carlo");
  return res.json();
}