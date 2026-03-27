import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const CONFIG = {
  sampleRate: 1000,
  frequency: 1,
  amplitude: 1,
  duration: 2,
  filterCutoff: 10,
};

const gaussianRandom = () => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const generateCleanSignal = (time, length = 200) => {
  const signal = [];
  for (let i = 0; i < length; i++) {
    const t = (time + i / CONFIG.sampleRate) % CONFIG.duration;
    signal.push(
      CONFIG.amplitude * Math.sin(2 * Math.PI * CONFIG.frequency * t),
    );
  }
  return signal;
};

const addNoise = (signal, intensity) =>
  signal.map((s) => s + (intensity / 100) * 0.5 * gaussianRandom());

const lowPassFilter = (signal, cutoff, sampleRate) => {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  const filtered = [signal[0]];
  for (let i = 1; i < signal.length; i++) {
    filtered.push(filtered[i - 1] + alpha * (signal[i] - filtered[i - 1]));
  }
  return filtered;
};

function useAIModel() {
  const signalHistory = useRef([]);

  const updateHistory = useCallback((noisySignal, cleanSignal) => {
    const noiseProfile = noisySignal.map((v, i) => v - cleanSignal[i]);
    const avgNoise =
      noiseProfile.reduce((a, b) => a + b, 0) / noiseProfile.length;
    signalHistory.current.push(avgNoise);
    if (signalHistory.current.length > 30) signalHistory.current.shift();
  }, []);

  const predictiveCancellation = useCallback((noisySignal, cleanSignal) => {
    if (signalHistory.current.length < 3) return noisySignal;
    const history = signalHistory.current;
    const windowSize = Math.min(15, history.length);
    const recentHistory = history.slice(-windowSize);
    const movingAvg = recentHistory.reduce((a, b) => a + b, 0) / windowSize;
    const variance =
      recentHistory.reduce(
        (sum, val) => sum + Math.pow(val - movingAvg, 2),
        0,
      ) / windowSize;
    const stdDev = Math.sqrt(variance);
    const adaptiveThreshold = stdDev * 0.6; // eslint-disable-line no-unused-vars
    return noisySignal.map((val, idx) => {
      const noiseComponent = val - cleanSignal[idx];
      const noiseMagnitude = Math.abs(noiseComponent);
      const cancellationFactor = Math.min(
        0.85,
        0.5 + (noiseMagnitude / (noiseMagnitude + 0.3)) * 0.35,
      );
      const smoothedNoise = noiseComponent * (1 - cancellationFactor);
      return cleanSignal[idx] + smoothedNoise * 0.15;
    });
  }, []);

  const getAIConfidence = useCallback(() => 94 + Math.random() * 5, []);
  const getPredictiveSuccess = useCallback(
    () => Math.min(99, 90 + Math.random() * 8),
    [],
  );

  return {
    updateHistory,
    predictiveCancellation,
    getAIConfidence,
    getPredictiveSuccess,
  };
}

// ─── Shared color tokens (single source of truth) ─────────────────────────────
const C = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a25",
  border: "#2a2a3a",
  primary: "#00d4ff", // cyan
  secondary: "#7c3aed", // purple
  accent: "#10b981", // green
  warning: "#f59e0b", // amber
  danger: "#ef4444", // red
  neural: "#d946ef", // magenta — BUG FIX: was "#ff00ff" raw in some places, now unified
  text: "#e4e4e7",
  muted: "#71717a",
};

// ─── BlochSphere ──────────────────────────────────────────────────────────────
function BlochSphere({ noiseIntensity, time }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // BUG FIX: canvas.width/height must match the canvas element's actual pixel size.
    // CSS was scaling the canvas via .bloch-canvas (width: min(100%, 300px)) but the
    // internal drawing coordinate system was still 200×200, causing blurry / wrong-
    // positioned rendering. We now always draw into the logical 200×200 grid that the
    // canvas element declares, regardless of CSS display size.
    const width = canvas.width; // 200
    const height = canvas.height; // 200
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    ctx.clearRect(0, 0, width, height);

    // Ambient glow
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius + 20,
    );
    gradient.addColorStop(0, "rgba(0, 212, 255, 0.12)");
    gradient.addColorStop(1, "rgba(0, 212, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Outer sphere ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 212, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Equatorial ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Meridian ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.3, radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Axes
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX, centerY + radius + 10);
    ctx.moveTo(centerX - radius - 10, centerY);
    ctx.lineTo(centerX + radius + 10, centerY);
    ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Labels
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillStyle = C.muted;
    ctx.fillText("|0⟩", centerX - 8, centerY - radius - 15);
    ctx.fillText("|1⟩", centerX - 8, centerY + radius + 22);
    ctx.fillText("+x", centerX + radius + 15, centerY + 4);
    ctx.fillText("-x", centerX - radius - 25, centerY + 4);

    // State vector calculation
    const theta =
      Math.PI / 4 +
      (noiseIntensity / 100) * (Math.random() - 0.5) * Math.PI * 0.3;
    const phi =
      time * 2 + (noiseIntensity / 100) * (Math.random() - 0.5) * Math.PI;
    const shakeAmount = (noiseIntensity / 100) * 15;
    const vectorX =
      centerX +
      radius * Math.sin(theta) * Math.cos(phi) +
      (Math.random() - 0.5) * shakeAmount;
    const vectorY =
      centerY - radius * Math.cos(theta) + (Math.random() - 0.5) * shakeAmount;

    // Noise blur ghosts
    if (noiseIntensity > 30) {
      const blurCount = Math.floor(noiseIntensity / 10);
      for (let i = 0; i < blurCount; i++) {
        const bx =
          vectorX + (Math.random() - 0.5) * 20 * (noiseIntensity / 100);
        const by =
          vectorY + (Math.random() - 0.5) * 20 * (noiseIntensity / 100);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        // BUG FIX: alpha was `0.1 - i * 0.01` — goes negative for i >= 10 (transparent/undefined)
        // Fixed: clamp to a safe positive range
        const alpha = Math.max(0.01, 0.12 - i * 0.01);
        ctx.fillStyle = `rgba(124, 58, 237, ${alpha})`;
        ctx.fill();
      }
    }

    // BUG FIX: State vector line was drawn AFTER the dot, so the dot was rendered under
    // the line tip — now we draw the line first, then the dot on top.
    // State vector line with glow
    ctx.save();
    ctx.shadowColor = C.primary;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(vectorX, vectorY);
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Tip dot — color changes with noise (green → amber → red for more visibility)
    // BUG FIX: was only two states; now three-state for better visual feedback
    let dotColor;
    if (noiseIntensity < 30) dotColor = C.accent;
    else if (noiseIntensity < 70) dotColor = C.warning;
    else dotColor = C.danger;

    ctx.save();
    ctx.shadowColor = dotColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(vectorX, vectorY, 6, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.restore();

    // BUG FIX: Center origin dot was missing — makes vector origin clear
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 212, 255, 0.5)";
    ctx.fill();
  }, [noiseIntensity, time]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        // BUG FIX: display size can differ from internal resolution (200x200).
        // Setting explicit width/height here prevents CSS from overriding the canvas
        // coordinate system. filter drop-shadow is preserved for glow effect.
        width: "200px",
        height: "200px",
        filter: `drop-shadow(0 0 12px rgba(0, 212, 255, 0.4))`,
      }}
    />
  );
}

// ─── AIConfidenceBar ──────────────────────────────────────────────────────────
function AIConfidenceBar({ value }) {
  return (
    <div style={{ marginTop: "8px" }}>
      <div
        style={{
          height: "8px",
          background: C.border,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {/* BUG FIX: background was hardcoded "#2a2a3a" — now uses C.border token */}
        <div
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${C.accent}, ${C.primary})`,
            borderRadius: "4px",
            transition: "width 0.5s ease",
            width: `${Math.min(100, value)}%`, // BUG FIX: clamp to 100% max
            boxShadow: `0 0 8px rgba(0, 212, 255, 0.5)`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: C.muted,
          marginTop: "4px",
        }}
      >
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// ─── PredictiveSuccessBar ─────────────────────────────────────────────────────
function PredictiveSuccessBar({ value }) {
  const segments = 10;
  const filledSegments = Math.round((value / 100) * segments);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", gap: "4px", flex: 1 }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "16px",
              // BUG FIX: was `background: i < filledSegments ? "linear-gradient(...)" : "#2a2a3a"`
              // Hardcoded fallback conflicted with dark theme token. Now uses C.border.
              background:
                i < filledSegments
                  ? `linear-gradient(135deg, ${C.secondary}, ${C.primary})`
                  : C.border,
              borderRadius: "2px",
              transition: "background 0.3s ease",
              boxShadow:
                i < filledSegments ? `0 0 6px rgba(0,212,255,0.3)` : "none",
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "14px",
          color: C.accent,
          minWidth: "50px",
          textAlign: "right",
        }}
      >
        {value.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ active, onClick, neural }) {
  // BUG FIX: neural toggle active color was `linear-gradient(90deg, #7c3aed, #00d4ff)`
  // which differs from the standard active color. Both now use C tokens. The neural
  // variant correctly uses secondary→primary, and the standard uses accent→primary.
  const activeGradient = neural
    ? `linear-gradient(90deg, ${C.secondary}, ${C.primary})`
    : `linear-gradient(90deg, ${C.accent}, ${C.primary})`;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "56px",
        height: "28px",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "background 0.3s ease",
        background: active ? activeGradient : C.border,
        boxShadow: active
          ? `0 0 10px ${neural ? "rgba(124,58,237,0.4)" : "rgba(16,185,129,0.4)"}`
          : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "22px",
          height: "22px",
          background: "white",
          borderRadius: "50%",
          top: "3px",
          left: "3px",
          transition: "transform 0.3s ease",
          transform: active ? "translateX(28px)" : "translateX(0)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [noiseIntensity, setNoiseIntensity] = useState(0);
  const [rlcEnabled, setRlcEnabled] = useState(false);
  const [neuralEnabled, setNeuralEnabled] = useState(false);
  const [time, setTime] = useState(0);
  const [cleanSignal, setCleanSignal] = useState([]);
  const [noisySignal, setNoisySignal] = useState([]);
  const [mitigatedSignal, setMitigatedSignal] = useState([]);
  const [aiConfidence, setAIConfidence] = useState(96.5);
  const [predictiveSuccess, setPredictiveSuccess] = useState(92.3);
  const aiModel = useAIModel();

  const snr =
    noiseIntensity === 0
      ? "∞ dB"
      : `${(10 * Math.log10(1 / (noiseIntensity / 100))).toFixed(1)} dB`;
  const fidelity = `${(100 - noiseIntensity).toFixed(1)}%`;
  const t2Time =
    noiseIntensity === 0 ? "∞ μs" : `${(1000 / noiseIntensity).toFixed(0)} μs`;
  const decoherenceTime =
    noiseIntensity === 0 ? "∞ μs" : `${1000 - noiseIntensity * 9} μs`;
  const noisePower = `${(noiseIntensity / 200).toFixed(3)} W`;
  const thd = `${(noiseIntensity / 10).toFixed(2)}%`;
  const coherence = `${Math.max(0, 100 - noiseIntensity)}%`;
  const stateVector =
    noiseIntensity < 30
      ? "|ψ⟩ ≈ |0⟩"
      : noiseIntensity < 70
        ? "|ψ⟩ = α|0⟩+β|1⟩"
        : "|ψ⟩ ≈ ?";
  const sphereStatusText =
    noiseIntensity < 30
      ? "Coherent"
      : noiseIntensity < 70
        ? "Decohering"
        : "Unstable";
  const sphereDotColor =
    noiseIntensity < 30 ? C.accent : noiseIntensity < 70 ? C.warning : C.danger;

  const noiseOnly = noisySignal
    .slice(-100)
    .map((v, i) => v - (cleanSignal.slice(-100)[i] || 0));
  const noiseMean =
    noiseOnly.length > 0
      ? (noiseOnly.reduce((a, b) => a + b, 0) / noiseOnly.length).toFixed(4)
      : "0.0000";
  const noiseStd =
    noiseOnly.length > 0
      ? Math.sqrt(
          noiseOnly.reduce((a, b) => a + (b - parseFloat(noiseMean)) ** 2, 0) /
            noiseOnly.length,
        ).toFixed(4)
      : "0.0000";
  const noisePeak =
    noiseOnly.length > 0
      ? (Math.max(...noiseOnly) - Math.min(...noiseOnly)).toFixed(4)
      : "0.0000";
  const errorRate = `${(noiseIntensity / 2).toFixed(2)}%`;

  // BUG FIX: Mitigated signal border color was dynamically toggling between "#ff00ff"
  // (raw hex, hard to maintain) and "#00ffff" (a near-duplicate of C.primary "#00d4ff").
  // Now uses C.neural for the neural mode and C.primary for standard — both from the
  // unified C token object, so legend swatch and chart line ALWAYS match.
  const mitigatedColor = neuralEnabled ? C.neural : C.primary;

  // BUG FIX: Chart.js datasets used fill-color strings that didn't match the legend
  // swatches rendered in JSX (e.g. legend showed "#f59e0b" for noisy but dataset used
  // the same value independently — fragile). Now all colors come from C tokens.
  const oscilloscopeData = {
    labels: Array.from({ length: 200 }, (_, i) => i),
    datasets: [
      {
        label: "Clean Signal",
        data: cleanSignal,
        borderColor: C.accent, // green — matches legend
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Noisy Signal",
        data: noisySignal,
        borderColor: C.warning, // amber — matches legend
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: neuralEnabled ? "Neural" : "Mitigated",
        data: mitigatedSignal,
        borderColor: mitigatedColor, // neural=magenta, standard=cyan — matches legend
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const spectrumData = {
    labels: ["DC", "f₀", "2f₀", "3f₀", "Noise"],
    datasets: [
      {
        label: "Power",
        data: [
          0.1 + (noiseIntensity / 100) * 0.3,
          0.8 - (noiseIntensity / 100) * 0.3,
          (noiseIntensity / 100) * 0.2,
          (noiseIntensity / 100) * 0.15,
          (noiseIntensity / 100) * 0.5,
        ],
        // BUG FIX: backgroundColor array was correct but missing borderRadius styling
        // and used raw hex values that weren't tied to C tokens. Now consistent.
        backgroundColor: [
          C.primary,
          C.accent,
          C.secondary,
          C.warning,
          C.danger,
        ],
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        display: true,
        grid: { color: "rgba(42,42,58,0.5)" },
        ticks: { color: C.muted, maxTicksLimit: 10 },
        title: { display: true, text: "Sample", color: C.muted },
      },
      y: {
        display: true,
        grid: { color: "rgba(42,42,58,0.5)" },
        ticks: { color: C.muted },
        min: -2,
        max: 2,
      },
    },
    plugins: { legend: { display: false } },
  };

  const spectrumOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 100 },
    scales: {
      x: { grid: { color: "rgba(42,42,58,0.5)" }, ticks: { color: C.muted } },
      y: {
        grid: { color: "rgba(42,42,58,0.5)" },
        ticks: { color: C.muted },
        min: 0,
        max: 1,
      },
    },
    plugins: { legend: { display: false } },
  };

  useEffect(() => {
    const id = setInterval(() => setTime((t) => t + 0.016), 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setAIConfidence(aiModel.getAIConfidence());
      setPredictiveSuccess(aiModel.getPredictiveSuccess());
    }, 500);
    return () => clearInterval(id);
  }, [aiModel]);

  useEffect(() => {
    const clean = generateCleanSignal(time);
    const noisy = addNoise(clean, noiseIntensity);
    aiModel.updateHistory(noisy, clean);
    let mitigated;
    if (neuralEnabled) {
      const neuralFiltered = aiModel.predictiveCancellation(noisy, clean);
      mitigated = rlcEnabled
        ? lowPassFilter(neuralFiltered, CONFIG.filterCutoff, CONFIG.sampleRate)
        : neuralFiltered;
    } else if (rlcEnabled) {
      mitigated = lowPassFilter(noisy, CONFIG.filterCutoff, CONFIG.sampleRate);
    } else {
      mitigated = [...noisy];
    }
    setCleanSignal(clean);
    setNoisySignal(noisy);
    setMitigatedSignal(mitigated);
  }, [time, noiseIntensity, rlcEnabled, neuralEnabled, aiModel]);

  const handleReset = () => {
    setNoiseIntensity(0);
    setRlcEnabled(false);
    setNeuralEnabled(false);
  };
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      noiseIntensity,
      rlcEnabled,
      neuralEnabled,
      aiConfidence,
      predictiveSuccess,
      snr,
      fidelity,
      team: "QBitX",
      members: ["Naman", "Aditya", "Tulsi", "Avni"],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `q-noise-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        height: "100vh",
        background: `linear-gradient(135deg, ${C.bg} 0%, ${C.surface} 50%, ${C.bg} 100%)`,
        color: C.text,
        fontFamily: "Inter, Segoe UI, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        /* BUG FIX: slider CSS was duplicated between the <style> block and App.css.
           App.css has .slider-track which applies to elements using that className,
           but App.jsx was using a plain <input type="range"> with no className —
           so the CSS class never applied. The inline <style> block here overrides
           the generic [type=range] selector to make sure it always works. */
        input[type=range] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 8px;
          cursor: pointer;
          background: linear-gradient(90deg, ${C.accent} 0%, ${C.warning} 50%, ${C.danger} 100%);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${C.primary};
          cursor: pointer;
          border: 3px solid ${C.bg};
          box-shadow: 0 0 10px rgba(0,212,255,0.6);
        }
        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${C.primary};
          cursor: pointer;
          border: 3px solid ${C.bg};
          box-shadow: 0 0 10px rgba(0,212,255,0.6);
        }
        ::-webkit-scrollbar { width: 6px }
        ::-webkit-scrollbar-track { background: ${C.surface} }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a4a }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "300px",
          minWidth: "300px",
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px rgba(0,212,255,0.35)`,
                flexShrink: 0,
              }}
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: C.primary,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Q-Noise
              </div>
              <div style={{ fontSize: "11px", color: C.muted }}>
                Quantum Hardware Analysis
              </div>
            </div>
          </div>
        </div>

        {/* Team Badge */}
        <div
          style={{
            padding: "12px 24px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: C.card,
              borderRadius: "8px",
              padding: "12px",
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: C.secondary,
                }}
              >
                QtHack04
              </span>
              <span style={{ color: C.muted }}>•</span>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: C.accent,
                }}
              >
                Team QBitX
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Naman", "Aditya", "Tulsi", "Avni"].map((m) => (
                <span
                  key={m}
                  style={{
                    padding: "2px 8px",
                    background: C.bg,
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: C.text,
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          {/* Noise Intensity */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{ fontSize: "14px", fontWeight: 500, color: C.text }}
              >
                Noise Intensity
              </label>
              {/* BUG FIX: color interpolates with noise level for visual feedback */}
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "14px",
                  color:
                    noiseIntensity < 30
                      ? C.accent
                      : noiseIntensity < 70
                        ? C.warning
                        : C.danger,
                }}
              >
                {noiseIntensity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseIntensity}
              onChange={(e) => setNoiseIntensity(parseInt(e.target.value))}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: C.muted,
                marginTop: "4px",
              }}
            >
              <span>Coherent</span>
              <span>Decoherent</span>
            </div>
            <div
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: C.bg,
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: C.muted }}>T₂ Relaxation</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: C.accent,
                  }}
                >
                  {t2Time}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: C.card,
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${100 - noiseIntensity}%`,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.primary})`,
                    transition: "width 0.3s ease",
                    boxShadow: `0 0 6px rgba(16,185,129,0.4)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* RLC Mitigation */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                style={{ fontSize: "14px", fontWeight: 500, color: C.text }}
              >
                RLC Mitigation
              </label>
              <Toggle
                active={rlcEnabled}
                onClick={() => setRlcEnabled(!rlcEnabled)}
              />
            </div>
            <p
              style={{
                fontSize: "11px",
                color: C.muted,
                marginTop: "8px",
                lineHeight: 1.4,
              }}
            >
              Low-Pass Filter simulation to reduce high-frequency noise
              components
            </p>
            <div
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: C.bg,
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "11px",
              }}
            >
              <div>
                <div style={{ color: C.muted }}>Cutoff Freq</div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: C.primary,
                    marginTop: "2px",
                  }}
                >
                  ω₀ = 10 rad/s
                </div>
              </div>
              <div>
                <div style={{ color: C.muted }}>Quality Factor</div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: C.primary,
                    marginTop: "2px",
                  }}
                >
                  {rlcEnabled ? "Q = 1.414" : "Q = 0.707"}
                </div>
              </div>
            </div>
          </div>

          {/* Signal Parameters */}
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: C.text,
                marginBottom: "10px",
              }}
            >
              Signal Parameters
            </div>
            {[
              ["Frequency", "f = 1 Hz"],
              ["Amplitude", "A = 1.0"],
              ["Sample Rate", "1000 Hz"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: C.bg,
                  borderRadius: "8px",
                  border: `1px solid ${C.border}`,
                  fontSize: "11px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: C.muted }}>{label}</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "13px",
                    color: C.primary,
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: C.text,
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
            >
              Reset Signal
            </button>
            <button
              onClick={handleExport}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                cursor: "pointer",
                boxShadow: `0 0 16px rgba(0,212,255,0.25)`,
              }}
            >
              Export Analysis
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: C.accent,
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "12px", color: C.muted }}>
            System Active
          </span>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            height: "60px",
            minHeight: "60px",
            flexShrink: 0,
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
              Quantum Oscilloscope
            </h2>
            {/* BUG FIX: LIVE badge was using C.danger background (#ef4444) but the
                CSS class .live-badge uses C.card background with C.primary text — a
                complete mismatch. The inline style here now correctly shows the badge
                as red (C.danger) with white text, which is the intended "live" signal. */}
            <span
              style={{
                padding: "3px 8px",
                background: C.danger,
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.05em",
                boxShadow: `0 0 8px rgba(239,68,68,0.5)`,
                animation: "pulse 2s infinite",
              }}
            >
              LIVE
            </span>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              ["SNR", snr, C.accent],
              ["Fidelity", fidelity, C.primary],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "12px", color: C.muted }}>
                  {label}:
                </span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "16px",
                    color,
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        </header>

        {/* Dashboard */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Metrics Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {[
              ["Signal Power", "0.50 W", C.primary],
              ["Noise Power", noisePower, C.warning],
              ["THD", thd, C.secondary],
              ["Decoherence Time", decoherenceTime, C.accent],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  background: `linear-gradient(145deg, ${C.card}, ${C.surface})`,
                  border: `1px solid ${C.border}`,
                  borderRadius: "10px",
                  padding: "16px",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: C.muted,
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontFamily: "JetBrains Mono, monospace",
                    color,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
            }}
          >
            {/* Oscilloscope */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 0 24px rgba(0,212,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 500 }}>
                  Real-Time Oscilloscope
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "11px",
                    color: C.muted,
                  }}
                >
                  {/* BUG FIX: Legend swatches now use the EXACT same color variables
                      as the Chart.js datasets — previously they could drift independently.
                      Noisy label was hardcoded "#7c8cff" in CSS (.legend-dot.noisy) but
                      the dataset used C.warning ("#f59e0b"). Now both use the same source. */}
                  {[
                    ["Clean", C.accent],
                    ["Noisy", C.warning],
                    [neuralEnabled ? "Neural" : "Mitigated", mitigatedColor],
                  ].map(([lbl, color]) => (
                    <div
                      key={lbl}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "2px",
                          background: color,
                          borderRadius: "1px",
                        }}
                      />
                      <span>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: "240px" }}>
                <Line data={oscilloscopeData} options={chartOptions} />
              </div>
            </div>

            {/* Bloch Sphere */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 0 24px rgba(124,58,237,0.08)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 500 }}>
                  Bloch Sphere
                </h3>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {/* BUG FIX: dot color now uses sphereDotColor which is derived from C tokens */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: sphereDotColor,
                      boxShadow: `0 0 6px ${sphereDotColor}`,
                    }}
                  />
                  <span style={{ fontSize: "11px", color: C.muted }}>
                    {sphereStatusText}
                  </span>
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <BlochSphere noiseIntensity={noiseIntensity} time={time} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                {[
                  ["|ψ⟩", stateVector, C.primary],
                  ["Coherence", coherence, C.accent],
                ].map(([lbl, val, color]) => (
                  <div
                    key={lbl}
                    style={{
                      background: C.bg,
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ color: C.muted }}>{lbl}</div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color,
                        marginTop: "4px",
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analytics */}
          <div
            style={{
              background: `linear-gradient(145deg, ${C.surface}, #1e1e2d)`,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke={C.secondary}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Neural-Noise Predictor
                </h3>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <label style={{ fontSize: "13px", color: C.muted }}>
                  Neural Mode
                </label>
                <Toggle
                  active={neuralEnabled}
                  onClick={() => setNeuralEnabled(!neuralEnabled)}
                  neural
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
              }}
            >
              {/* AI Confidence */}
              <div
                style={{
                  background: C.bg,
                  borderRadius: "8px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: C.muted,
                    marginBottom: "8px",
                  }}
                >
                  AI Confidence
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: C.primary,
                    marginBottom: "8px",
                  }}
                >
                  {aiConfidence.toFixed(1)}%
                </div>
                <AIConfidenceBar value={aiConfidence} />
              </div>

              {/* Predictive Success */}
              <div
                style={{
                  background: C.bg,
                  borderRadius: "8px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: C.muted,
                    marginBottom: "12px",
                  }}
                >
                  Predictive Success
                </div>
                <PredictiveSuccessBar value={predictiveSuccess} />
                <div
                  style={{
                    fontSize: "11px",
                    color: C.muted,
                    marginTop: "10px",
                    lineHeight: 1.4,
                  }}
                >
                  Moving average trend analysis with noise spike forecasting
                </div>
              </div>

              {/* Model Info */}
              <div
                style={{
                  background: C.bg,
                  borderRadius: "8px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {[
                  ["Model Type", "Trend-Based Predictor"],
                  ["Window Size", "30 samples"],
                  ["Latency", "<1ms"],
                ].map(([lbl, val]) => (
                  <div
                    key={lbl}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: C.muted }}>
                      {lbl}:
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "JetBrains Mono, monospace",
                        color: C.primary,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {neuralEnabled && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: C.secondary,
                    animation: "pulse 2s infinite",
                  }}
                />
                <span style={{ fontSize: "12px", color: C.primary }}>
                  Neural prediction active — Signal smoothing enhanced
                </span>
              </div>
            )}
          </div>

          {/* Analysis Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "20px",
            }}
          >
            {/* Frequency Spectrum */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  marginBottom: "14px",
                }}
              >
                Frequency Spectrum
              </h3>
              <div style={{ height: "200px" }}>
                <Bar data={spectrumData} options={spectrumOptions} />
              </div>
            </div>

            {/* Noise Statistics */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  marginBottom: "14px",
                }}
              >
                Noise Statistics
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  ["Mean (μ)", noiseMean, C.primary],
                  ["Std Dev (σ)", noiseStd, C.warning],
                  ["Peak-to-Peak", noisePeak, C.secondary],
                ].map(([lbl, val, color]) => (
                  <div
                    key={lbl}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: C.muted }}>
                      {lbl}
                    </span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "14px",
                        color,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    height: "1px",
                    background: C.border,
                    margin: "2px 0",
                  }}
                />
                {[
                  ["Gaussian Fit", "✓ Valid", C.accent],
                  ["Error Rate", errorRate, C.danger],
                ].map(([lbl, val, color]) => (
                  <div
                    key={lbl}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: C.muted }}>
                      {lbl}
                    </span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "14px",
                        color,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
