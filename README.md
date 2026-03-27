🌌 Q-Noise
Quantum Signal Noise Visualizer

Making the invisible chaos of quantum noise visible.

🚀 Overview

Q-Noise is an interactive platform that simulates how noise affects quantum control signals in real time. It allows you to generate a clean signal, inject noise, observe its impact, apply mitigation techniques, and measure system performance — all in a single visual interface.

⚡ The Problem

Quantum systems are extremely sensitive.
Even small disturbances like thermal noise or electromagnetic interference can:

distort signals
reduce fidelity
collapse coherence

These effects are difficult to observe directly.

💡 The Solution

Q-Noise transforms this into a visual, interactive experience:

Clean Signal → Noise Injection → Visualization → Mitigation → Metrics

🎛️ Features

**Real-Time Simulation**
Clean sine wave generation
Adjustable Gaussian noise
Instant visual updates

**Visualization**
Oscilloscope (clean vs noisy vs corrected signal)
Bloch sphere (qubit state stability)
Frequency spectrum (noise distribution)

**Noise Mitigation**
RLC filtering for high-frequency noise reduction
Predictive smoothing based on signal trends

**Metrics**
SNR (Signal-to-Noise Ratio)
Fidelity
T₂ relaxation time
THD (Total Harmonic Distortion)
Error rate
Noise power
Coherence

**Export**
Download simulation data as JSON

🧠 How It Works

A clean control signal is generated
Noise is injected using a controllable model
Mitigation techniques are applied
Metrics update in real time

Everything happens instantly in the browser

🛠️ Tech Stack

React + Vite
JavaScript (signal simulation)
Canvas-based rendering
Custom dark UI

🖥️ Running the Project

git clone https://github.com/adityarulmanalan/q-noise.git

cd q-noise
npm install
npm run dev

📂 Project Structure

src
├── App.jsx
├── App.css
├── main.jsx
├── index.css

public
├── hero.png
├── icons.svg

⚠️ Disclaimer

**This is a simulation tool.**

It does not connect to real quantum hardware.
It is intended for visualization, learning, and experimentation.

🚧 Future Scope

Real hardware integration
Advanced ML-based noise correction
Multi-qubit simulation
Custom noise models
Cloud experiment storage

🧑‍💻 Team QBitX

Aditya Arul Manalan
Naman Kaushik
Tulsi 
Avni Sharma

⭐ Support

If you like this project, star the repo and share it.
