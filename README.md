# 🌌 QBitX — Q-Noise Quantum Analysis Platform

### Visualizing, Simulating, and Mitigating Quantum Noise in Real-Time

QBitX is an advanced signal visualization and noise simulation platform built to tackle one of quantum computing’s biggest challenges — **decoherence**.

Designed for developers, researchers, and students, Q-Noise provides a **real-time sandbox** to simulate how environmental noise affects quantum signals and explore mitigation strategies interactively.

---

## 🌐 Live Demo
[QBITX-QNOISE](https://q-noise-q-bit-x.vercel.app/)

---

## 🚀 Overview

Quantum systems are extremely sensitive to disturbances like:

- 🌡️ Thermal noise  
- 📡 Electromagnetic interference (EMI)  
- 🔄 Phase distortions  

These lead to:
- Incorrect qubit rotations  
- Signal degradation  
- Loss of quantum state fidelity  

QBitX bridges theory and practice by letting users **see, tweak, and fix noise in real time**.

---

## 🧠 Key Features

- 📈 Real-Time Signal Visualization  
  Simulates quantum control signals (e.g., microwave pulses)

- 🎛️ Interactive Noise Injection  
  - Gaussian Noise  
  - Phase Noise  
  - Amplitude Noise  

- 🧪 Live Noise Simulation Engine  
  Observe how signals degrade dynamically

- 🧩 Mitigation Controls  
  Apply filtering and correction techniques to restore signal integrity

- 🎯 Educational + Debugging Tool  
  Understand quantum noise without needing actual hardware

---

## 🧠 Solution (Expanded)

QBitX provides a layered simulation and mitigation pipeline that models how quantum control signals degrade and how different techniques can restore them.

Instead of treating noise as an abstract concept, QBitX represents it as a real-time signal transformation problem, allowing users to:
	-	Inject controlled noise into a clean signal
	-	Observe how it affects signal integrity and system metrics
	-	Apply multiple mitigation strategies and compare their effectiveness

The system is built around a continuous signal loop:

Clean Signal → Noise Injection → Distortion Analysis → Mitigation → Evaluation

This loop runs in real time, giving immediate feedback on how each parameter affects the system.

---

## 🌐 Live Experience (Interactive Website)

The project includes a cinematic interactive website that explains quantum noise concepts visually:

qnoise-website/
  index.html

### ✨ Features of the Website
Immersive scroll-based storytelling (Signal → Chaos → Shield → Hardware)
Real-time waveform simulation
Interactive noise control (drag knob)
Before vs After mitigation comparison
Hardware-in-the-loop visualization (ESP32 concept)

---

## 🏗️ Architecture

[Signal Generator] → [Noise Engine] → [Visualization Layer]
↓ ↑
[Mitigation Controls] ← [User Input UI]

---

## 📁 File Structure

q-noise-react_final/
- public/
  - icons.svg
  - favicon.svg
- src/
  - App.jsx
  - App.css
  - main.jsx
  - index.css
- index.html
- package.json
- package-lock.json
- README.md

---

## ⚙️ Tech Stack

| Layer           | Technology                     |
|-----------------|-------------------------------|
| Frontend        | React + CSS                   |
| Visualization   | Chart.js                      |
| Simulation Core | JavaScript DSP Logic          |

---

## 🧪 Noise Models Explained

### 🌫️ Gaussian Noise
Random fluctuations affecting signal values  
Simulates thermal/environmental disturbances  

### 🔄 Phase Noise
Alters the timing/phase of the signal  
Causes rotation errors in qubits  

### 📉 Amplitude Noise
Changes signal strength  
Leads to incorrect energy levels  

---

## 🛠️ How It Works

1. Generate a clean signal  
2. Apply selected noise types  
3. Visualize distorted output  
4. Adjust mitigation controls  
5. Compare before vs after  

---

## 🧩 Mitigation Controls (Detailed)

QBitX includes multiple mitigation strategies that represent both classical signal processing and adaptive AI-based correction techniques.

--

## ⚙️ 1. RLC Filter (Classical Mitigation)

A simulated low-pass RLC filter is applied to reduce high-frequency noise components.

What it does:
	•	Smooths out rapid fluctuations in the signal
	•	Reduces thermal and electromagnetic noise
	•	Stabilizes signal amplitude

Trade-offs:
	•	Introduces phase lag
	•	Cannot adapt to changing noise patterns
	•	May distort the original signal over time

👉 In your system, this is implemented using a low-pass filter approximation
(where signal values are smoothed over time).  ￼

--

## 🧠 2. Neural Predictor (AI-Based Mitigation)

The Neural Predictor is an adaptive noise cancellation system that learns from recent signal behavior.

How it works:
	•	Tracks noise history from previous signal frames
	•	Calculates statistical properties like mean, variance, and deviation
	•	Predicts the noise component in the incoming signal
	•	Subtracts or reduces that noise dynamically

👉 This is based on your actual logic:
	•	moving average of noise
	•	adaptive cancellation factor
	•	real-time correction loop  ￼

---

## 🖥️ How to Run

### 1. Clone the repository

git clone https://github.com/adityaarulmanalan/QNoise_QBitX.git
cd QNoise_QBitX

### 2. Install dependencies
npm install

### 3. Start development server
npm run dev

### 4. Open in browser
http://localhost:5173/

⚠️ Troubleshooting
### Check Node.js version
node -v 
Make sure it is 18 or higher.

### Fix dependency issues
rm -rf node_modules package-lock.json
npm install
npm run dev

---

**🎯 Use Cases**
- 🧑‍🔬 Quantum research simulation
- 🎓 Educational demonstrations
- 🛠️ Signal debugging sandbox
- 💡 Hackathon prototyping

---

**💡 Future Improvements**
- ⚡ Real hardware integration
- 🧠 AI-based noise correction
- 🔬 Quantum circuit simulation layer
- 🌐 Cloud-based collaborative testing

---

**👥 Team QBitX**
- Aditya Arul Manalan
- Naman Kaushik
- Tulsi
- Avni Sharma

---

🏆 Hackathon

Built for QtHack04 @ SRM Institute of Science and Technology

---

📜 License

This project is open-source and available under the MIT License.
