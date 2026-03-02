# 🧍 Upright — Real-Time 3D Posture Monitoring System

**DeltaHacks 12 Project**

> *Your digital twin for perfect posture. Real-time monitoring, AI-powered insights, instant feedback.*

[![Arduino](https://img.shields.io/badge/Arduino-00979D?style=flat&logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Swift](https://img.shields.io/badge/Swift-FA7343?style=flat&logo=swift&logoColor=white)](https://swift.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

## 🔗 Links
- 🌐 Live Demo: https://upright.erichuangreal.dev
- 🏆 Devpost: https://devpost.com/software/upright-rdfkve?ref_content=my-projects-tab&ref_feature=my_projects%20https://upright.erichuangreal.dev/

---

## 📋 Table of Contents

- [About](#about)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [File Structure](#file-structure)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Hardware Setup](#hardware-setup)
- [Developer Guide](#developer-guide)
- [Contributing](#contributing)

## 🌐 Live Demo

**Try it without hardware!** We've created a web-based demo that simulates sensor data:

👉 **[Live Demo](http://your-domain.com)** (Deploy to see it in action!)

The demo includes:
- 🤖 Mock sensors generating realistic posture data
- 🎨 Web-based 3D visualization (Three.js)
- 🤖 Real AI insights from Google Gemini
- 📊 Real-time WebSocket updates

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

---

## 🎯 About

### The Problem
People around the world are affected by back pain at any one time. For many, poor posture is the silent culprit; hours spent hunched over laptops, craning necks at screens, and slouching in chairs compound into chronic pain that impacts quality of life. Despite its prevalence, real-time posture monitoring remains a severely under-researched problem, with few accessible solutions for everyday prevention.

### Our Solution
**Upright** is a real-time posture monitoring system that helps prevent back pain before it starts. Using **dual Arduino sensors** with accelerometers placed on the upper back (neck) and lower back, our system detects misalignment between your spine segments—the telltale sign of slouching or poor posture.

### Key Features
- 🔴/🟢 **Instant Visual Feedback**: 3D digital twin with color-coded back glow (green = good, red = bad)
- 📊 **15° Threshold Detection**: Compares upper vs lower back angle difference in real-time
- 🤖 **AI-Powered Insights**: Google Gemini analyzes your posture patterns every 15 seconds
- 💡 **Personalized Recommendations**: Actionable tips tailored to your specific posture issues
- 📈 **Historical Tracking**: View your posture trends over time

### Target Users
Software engineers, designers, and tech professionals who spend 8+ hours a day sitting at desks, making them particularly vulnerable to posture-related injuries. Upright is designed for the people who need it most: those of us who code, design, and build while our backs silently suffer.

### Why It Matters
**Prevention is better than cure.** By catching poor posture in the moment through digital twin technology and AI-powered insights, Upright helps users develop lasting awareness and healthier habits, potentially saving millions from chronic back pain and its associated costs.

*Your spine will thank you.* 🙌

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UPRIGHT SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐
    │  Arduino #1  │         │  Arduino #2  │
    │  (Upper Back)│         │ (Lower Back) │
    │              │         │              │
    │  MMA7660     │         │  MMA7660     │
    │  Accel.      │         │  Accel.      │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           │ Serial (115200 baud)   │ Serial (115200 baud)
           │ JSON @ ~20Hz           │ JSON @ ~20Hz
           │                        │
           ▼                        ▼
    ┌──────────────────────────────────────┐
    │      Serial Bridge (Node.js)         │
    │  ┌─────────┐       ┌─────────┐       │
    │  │Bridge #1│       │Bridge #2│       │
    │  └────┬────┘       └────┬────┘       │
    └───────┼─────────────────┼─────────────┘
            │                 │
            │ HTTP POST       │ HTTP POST
            │ /imu            │ /imu2
            ▼                 ▼
    ┌──────────────────────────────────────────────┐
    │          Backend Server (Express)            │
    │                                              │
    │  ┌────────────────┐  ┌──────────────────┐   │
    │  │ HTTP Endpoints │  │ WebSocket Server │   │
    │  │  /imu, /imu2   │  │  (port 8003)     │   │
    │  │  /latest1/2    │  │                  │   │
    │  │  /history1/2   │  │  Real-time       │   │
    │  │  /insights/*   │  │  Broadcast       │   │
    │  └────────┬───────┘  └────────┬─────────┘   │
    │           │                   │              │
    │  ┌────────▼───────────────────▼─────────┐   │
    │  │      Window Manager (15s windows)    │   │
    │  │   - Groups samples into windows      │   │
    │  │   - Computes statistical features    │   │
    │  └────────┬─────────────────────────────┘   │
    │           │                                  │
    │  ┌────────▼─────────────────────────────┐   │
    │  │      Feature Extraction              │   │
    │  │   - Mean/min/max pitch               │   │
    │  │   - Slouch percentage                │   │
    │  │   - Alignment score                  │   │
    │  └────────┬─────────────────────────────┘   │
    │           │                                  │
    │  ┌────────▼─────────────────────────────┐   │
    │  │       NDJSON Logger                  │   │
    │  │   telemetry.ndjson (sensor 1)        │   │
    │  │   telemetry2.ndjson (sensor 2)       │   │
    │  └──────────────────────────────────────┘   │
    └───────────┬──────────────────────────────────┘
                │
                │ HTTP Request
                │ (window features)
                ▼
    ┌──────────────────────────────────────────────┐
    │         Google Gemini API                    │
    │        (Gemini 1.5 Flash)                    │
    │                                              │
    │  Analyzes posture data → Generates insights  │
    │  - Rating (good/fair/not_so_good/poor)       │
    │  - Issues, Suggestions, Tips                 │
    │  - Confidence score                          │
    └───────────┬──────────────────────────────────┘
                │
                │ JSON Response
                ▼
    ┌──────────────────────────────────────────────┐
    │          Backend Server                      │
    │   Broadcasts insight via WebSocket           │
    └───────────┬──────────────────────────────────┘
                │
                │ WebSocket (ws://localhost:8003)
                ▼
    ┌──────────────────────────────────────────────┐
    │      Swift Frontend (SwiftUI + SceneKit)     │
    │                                              │
    │  ┌────────────────────────────────────────┐  │
    │  │      PostureViewModel                  │  │
    │  │  - WebSocket connection                │  │
    │  │  - Real-time data updates              │  │
    │  │  - Insight management                  │  │
    │  └────────┬───────────────────────────────┘  │
    │           │                                   │
    │  ┌────────▼───────────────────────────────┐  │
    │  │         ContentView (UI)               │  │
    │  │  - Posture detection (15° threshold)   │  │
    │  │  - Status display (GOOD ✓ / BAD ✗)     │  │
    │  │  - Insight cards                       │  │
    │  └────────┬───────────────────────────────┘  │
    │           │                                   │
    │  ┌────────▼───────────────────────────────┐  │
    │  │      TorsoSceneView (3D)               │  │
    │  │  - 3D human torso model                │  │
    │  │  - Glowing back indicator              │  │
    │  │  - Green = good, Red = bad             │  │
    │  │  - Interactive rotation/zoom           │  │
    │  └────────────────────────────────────────┘  │
    └──────────────────────────────────────────────┘
                     │
                     ▼
              👤 USER FEEDBACK
           Visual + AI Insights
```

---

## 💻 Technology Stack

### Hardware Layer
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Microcontroller** | Arduino Uno | Sensor data collection |
| **Accelerometer** | Grove MMA7660 (I2C) | 3-axis acceleration measurement |
| **Button** | Grove Button (D2) | Calibration trigger |
| **Communication** | USB Serial (115200 baud) | Data transmission to computer |

### Backend Layer
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 18+ | Server execution environment |
| **Framework** | Express | 5.2.1 | HTTP server & routing |
| **WebSocket** | ws | 8.19.0 | Real-time bidirectional communication |
| **AI Engine** | Google Gemini API | 1.5 Flash | Posture analysis & insights |
| **SDK** | @google/generative-ai | 0.24.1 | Gemini API client |
| **Serial Comm** | serialport | 13.0.0 | Arduino serial bridge |
| **Config** | dotenv | 17.2.3 | Environment variables |
| **Dev Tools** | nodemon | 3.1.11 | Auto-restart on changes |

### Frontend Layer

#### Native App (Swift)
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Language** | Swift | iOS/macOS app development |
| **UI Framework** | SwiftUI | Declarative UI |
| **3D Graphics** | SceneKit | 3D model rendering & animation |
| **Reactive** | Combine | Reactive data streams |
| **Networking** | URLSession + WebSocket | Real-time data connection |

#### Web App (Browser)
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Language** | JavaScript (ES6+) | Browser-based client |
| **3D Graphics** | Three.js | WebGL 3D rendering |
| **UI** | HTML5 + CSS3 | Responsive web interface |
| **Networking** | WebSocket API | Real-time data connection |

### Data & Communication
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Data Format** | JSON | Structured data exchange |
| **Logging** | NDJSON | Append-only telemetry logs |
| **Protocol** | WebSocket (RFC 6455) | Real-time streaming |
| **API** | RESTful HTTP | Command & query endpoints |

### Languages
- **C/C++** — Arduino firmware
- **JavaScript (Node.js)** — Backend server & serial bridge
- **Swift** — Frontend iOS/macOS application

---

## 🔄 Data Flow

### Real-Time Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: SENSOR SAMPLING (Hardware)                             │
└─────────────────────────────────────────────────────────────────┘

Arduino (MMA7660) @ 20Hz
    ↓
Read 3-axis acceleration (ax, ay, az)
    ↓
Calculate pitch, roll, magnitude
    ↓
Apply EMA smoothing (pitch_smooth)
    ↓
Compute pitch rate of change (dpitch)
    ↓
Format as JSON
    {"ax": -0.1234, "ay": 0.5678, "az": 0.9876,
     "pitch": 12.45, "pitch_smooth": 12.30,
     "roll": -3.21, "a_mag": 1.02, "dpitch": 0.15,
     "ts": 1234567890}
    ↓
Serial.println() → USB Serial Port


┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: SERIAL BRIDGE (Computer)                               │
└─────────────────────────────────────────────────────────────────┘

Node.js Serial Bridge
    ↓
Read line from serial port
    ↓
Parse & validate JSON
    ↓
HTTP POST → Backend Server
    POST /imu (sensor 1)
    POST /imu2 (sensor 2)


┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: BACKEND PROCESSING (Server)                            │
└─────────────────────────────────────────────────────────────────┘

Express Server
    ↓
Validate sample (pitch required)
    ↓
┌─────────────────────────────────┐
│ PARALLEL OPERATIONS:            │
│                                 │
│ 1. Append to NDJSON log file    │
│ 2. Update in-memory buffer      │
│ 3. Broadcast via WebSocket      │
│ 4. Ingest into Window Manager   │
└─────────────────────────────────┘
    ↓
Window Manager checks if 15s window closed
    ↓
    ├─ No → Continue collecting
    ↓
    └─ Yes → Process closed window
        ↓
    Feature Extraction
        - sensor1: mean/min/max pitch, slouch%
        - sensor2: mean/min/max pitch, slouch%
        - alignment: pitch difference, score
        - quality: data quality assessment
        ↓
    Google Gemini API Call
        ↓
    Generate Insight
        {
          "type": "insight_update",
          "rating": "good" | "fair" | "not_so_good" | "poor",
          "summary": "...",
          "issues": [...],
          "suggestions": [...],
          "tip": "...",
          "confidence": "low" | "medium" | "high"
        }
        ↓
    Broadcast insight via WebSocket


┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4: FRONTEND VISUALIZATION (Swift App)                     │
└─────────────────────────────────────────────────────────────────┘

SwiftUI App (WebSocket Client)
    ↓
Receive message via WebSocket
    ↓
┌──────────────────────────────┐
│ Message Type?                │
├──────────────────────────────┤
│ kind="sample", source=1      │ → Update upperPitch, upperRoll
│ kind="sample", source=2      │ → Update lowerPitch
│ type="insight_update"        │ → Update latestInsight
│ kind="event"                 │ → Handle event
└──────────────────────────────┘
    ↓
Posture Detection
    angleDifference = abs(upperPitch - lowerPitch)
    isGoodPosture = angleDifference <= 15.0
    ↓
┌──────────────────────────────────────┐
│ UI UPDATE (60 FPS):                  │
│                                      │
│ 1. Status Text: "GOOD ✓" or "BAD ✗" │
│ 2. 3D Model: Update rotation         │
│ 3. Back Glow: Green or Red           │
│ 4. Insight Card: Display feedback    │
└──────────────────────────────────────┘
    ↓
USER SEES REAL-TIME FEEDBACK
```

### Timing Characteristics

| Operation | Frequency/Latency | Notes |
|-----------|-------------------|-------|
| Sensor sampling | 20 Hz (50ms) | Arduino loop |
| Serial transmission | <5ms | USB serial |
| HTTP POST | <10ms | Local network |
| WebSocket broadcast | <5ms | Same machine |
| Frontend UI update | 60 FPS (16ms) | SwiftUI rendering |
| **Total latency** | **~80ms** | Sensor → Visual feedback |
| Window processing | Every 15s | Gemini insight generation |
| Gemini API call | 1-3s | Network + AI processing |

---

## 📁 File Structure

```
uprighthacks/
│
├── 📄 README.md                          # This file
├── 📄 .gitignore                         # Git ignore rules
├── 📄 package.json                       # Root dependencies (Gemini SDK)
├── 📄 package-lock.json                  # Lock file
├── 📄 GLOWING_BACK_IMPLEMENTATION.md     # Feature documentation
│
├── 🔧 Arduino/                           # Hardware firmware
│   └── Posture Calibration/
│       ├── posture_calibration.ino       # Main Arduino sketch (C++)
│       └── README.md                     # Arduino setup guide
│
├── 🖥️  backend/                          # Node.js backend server
│   ├── 📄 package.json                   # Backend dependencies
│   ├── 📄 package-lock.json              # Lock file
│   ├── 📄 .gitignore                     # Backend-specific ignores
│   ├── 📄 Gemini-Integration-Key.env     # 🔐 API keys (NOT in git)
│   │
│   ├── 🟢 server.js                      # Main Express server
│   │   ├─ HTTP endpoints (/imu, /imu2, /latest*, /history*, /insights/*)
│   │   ├─ WebSocket server (port 8003)
│   │   ├─ Window management (15s intervals)
│   │   ├─ Feature extraction pipeline
│   │   └─ Insight generation & broadcasting
│   │
│   ├── 🔗 serial-bridge.js               # Serial → HTTP bridge
│   │   ├─ Reads JSON from Arduino serial
│   │   ├─ Validates & posts to server
│   │   └─ Usage: node serial-bridge.js <PORT> [BAUD] [HOST] [PORT] [PATH]
│   │
│   ├── 🤖 gemini.js                      # Gemini API integration
│   │   ├─ makeGeminiClient()
│   │   ├─ buildFeatureSummary()
│   │   ├─ generateInsight()
│   │   └─ Fallback insight logic
│   │
│   ├── 🪟 windowManager.js               # Time-window data grouping
│   │   ├─ Manages 15-second windows
│   │   ├─ Groups samples by source
│   │   └─ Triggers window closure events
│   │
│   ├── 📊 featureExtraction.js           # Statistical feature computation
│   │   ├─ computeWindowFeatures()
│   │   ├─ Calculate mean/min/max pitch
│   │   ├─ Compute slouch percentage
│   │   └─ Alignment scoring
│   │
│   ├── 🤖 mock-sensor.js                 # ✨ NEW: Simulates Arduino sensors
│   │   ├─ Generates realistic posture data
│   │   ├─ Multiple scenarios (good, bad, realistic, etc.)
│   │   ├─ Configurable sample rate
│   │   └─ Perfect for demos without hardware
│   │
│   ├── 🧪 test-websocket.js              # WebSocket client test
│   ├── 🧪 test-insights.js               # Insight generation test
│   ├── 📄 TESTING.md                     # Testing documentation
│   │
│   ├── 📜 telemetry.ndjson               # Sensor 1 data log (generated)
│   └── 📜 telemetry2.ndjson              # Sensor 2 data log (generated)
│
└── 📱 frontend/                          # Frontend applications
    │
    ├── web/                              # ✨ NEW: Web-based demo (no hardware needed)
    │   ├── 📄 index.html                 # Main web page
    │   │   ├─ Responsive design
    │   │   ├─ Real-time status display
    │   │   ├─ Metrics dashboard
    │   │   └─ Insight cards
    │   │
    │   └── 📄 app.js                     # Frontend JavaScript
    │       ├─ WebSocket client
    │       ├─ Three.js 3D visualization
    │       ├─ Real-time posture detection
    │       └─ UI updates
    │
    └── UpperTorso3D.swiftpm/             # Native Swift app (for real hardware)
        ├── 📄 Package.swift              # Swift package manifest
        │
        ├── 🎨 MyApp.swift                # App entry point
        ├── 🖼️  ContentView.swift         # Main UI view
        │   ├─ Posture detection (15° threshold)
        │   ├─ Status display (GOOD/BAD)
        │   ├─ 3D scene container
        │   ├─ Interactive controls (zoom, rotate)
        │   ├─ InsightCard component
        │   └─ TorsoSceneView (3D rendering)
        │
        ├── 🧠 PostureViewModel.swift     # ViewModel (data layer)
        │   ├─ WebSocket management
        │   ├─ Real-time data updates
        │   ├─ upperPitch, lowerPitch tracking
        │   └─ Insight history management
        │
        ├── 🔌 TelemetryWebSocket.swift   # WebSocket client
        │   ├─ Connects to ws://localhost:8003
        │   ├─ Auto-reconnection
        │   └─ Message parsing
        │
        ├── 📦 TelemetryMessage.swift     # Data models
        │   └─ Decodable structs for JSON
        │
        ├── 💡 Insight.swift              # Insight data model
        │   ├─ Rating enum (good/fair/not_so_good/poor)
        │   ├─ Confidence enum (low/medium/high)
        │   └─ from(message:) parser
        │
        └── .swiftpm/                     # Swift Package Manager files
            └── xcode/                    # Xcode project files
                └── xcuserdata/           # User-specific settings (gitignored)

Generated Files (not in git):
├── node_modules/                         # Node.js dependencies
├── telemetry*.ndjson                     # Telemetry logs
├── .env files                            # Environment variables
└── .DS_Store, *.log, etc.                # OS/temp files
```

### Key File Responsibilities

#### Backend
- **server.js** (567 lines) — Core server logic, endpoints, WebSocket, window processing
- **gemini.js** (278 lines) — AI integration, insight generation, fallback logic
- **windowManager.js** — Time-based data windowing (15s intervals)
- **featureExtraction.js** — Statistical analysis of sensor data
- **serial-bridge.js** — Arduino serial → HTTP bridge

#### Frontend
- **ContentView.swift** (782 lines) — Main UI, 3D scene, posture detection, insight display
- **PostureViewModel.swift** (93 lines) — Data management, WebSocket handling
- **TelemetryWebSocket.swift** — Network layer, reconnection logic
- **Insight.swift** — Data models for AI insights

#### Hardware
- **posture_calibration.ino** (267 lines) — Arduino firmware, sensor reading, JSON output

---

## 🚀 Setup & Installation

### Two Ways to Run Upright

#### Option A: 🌐 **Web Demo** (No Hardware Required) ⭐ RECOMMENDED FOR DEMOS
Perfect for trying out the system or showing it to others without physical sensors.

#### Option B: 🔧 **Full Hardware Setup**
For actual posture monitoring with real Arduino sensors.

---

### Prerequisites

#### For Web Demo:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Google Gemini API Key** ([Get one](https://ai.google.dev/))
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

#### For Hardware Setup (additional):
- **Xcode** (for Swift frontend, macOS only)
- **Arduino IDE** ([Download](https://www.arduino.cc/en/software))
- **Grove MMA7660 Accelerometer** (×2)
- **Arduino Uno** (×2)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/uprighthacks.git
cd uprighthacks
```

### 2️⃣ Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
Create `backend/Gemini-Integration-Key.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=8003
```

#### Start the Server
```bash
# Production mode
npm run start

# Development mode (auto-restart on changes)
npm run dev
```

Server will start on `http://localhost:8003`

WebSocket available at `ws://localhost:8003`

### 3️⃣ Arduino Setup

#### Hardware Connections
**For each Arduino:**
- Connect Grove MMA7660 to I2C port
- Connect Grove Button to D2 (optional, for calibration)
- Connect Arduino to computer via USB

#### Upload Firmware
1. Open `Arduino/Posture Calibration/posture_calibration.ino` in Arduino IDE
2. Select board: **Arduino Uno**
3. Select port (e.g., `/dev/tty.usbmodem1101` on macOS, `COM3` on Windows)
4. Click **Upload**
5. Repeat for second Arduino

#### Identify Serial Ports
```bash
# macOS/Linux
ls /dev/tty.*

# Windows
# Check Device Manager → Ports (COM & LPT)
```

### 4️⃣ Start Data Source

#### Option A: Mock Sensors (Web Demo - No Hardware) 🌐

Open two terminal windows for simulated sensors:

**Terminal 1 (Upper Back Sensor Simulator):**
```bash
cd backend
node mock-sensor.js --sensor 1 --scenario realistic
```

**Terminal 2 (Lower Back Sensor Simulator):**
```bash
cd backend
node mock-sensor.js --sensor 2 --scenario realistic
```

**Available scenarios:**
- `good` - Perfect posture
- `bad` - Continuous slouching
- `mixed` - Alternates between good/bad
- `realistic` - Natural variation (default)
- `gradual` - Slowly deteriorates

You should see:
```
🤖 Mock Sensor Simulator v1.0
📡 Starting sensor simulation: Natural posture with occasional slouching
⏱️  Sending samples every 50ms...
[12:34:56] 🟢 GOOD | Pitch: 8.2° | Samples: 100
```

#### Option B: Real Arduino Sensors (Hardware Setup) 🔧

Open two terminal windows for real hardware:

**Terminal 1 (Upper Back Sensor):**
```bash
cd backend
node serial-bridge.js /dev/tty.usbmodem1101 115200 localhost 8003 /imu
```

**Terminal 2 (Lower Back Sensor):**
```bash
cd backend
node serial-bridge.js /dev/tty.usbmodem101 115200 localhost 8003 /imu2
```

You should see:
```
[Serial Bridge] Connected to /dev/tty.usbmodem1101 @ 115200
[Serial Bridge] Forwarding to http://localhost:8003/imu
[Serial Bridge] ✓ Posted sample (pitch=12.45)
```

### 5️⃣ Frontend Setup

#### Option A: Web Frontend (Browser - Works with Mock Sensors) 🌐

Simply open in your browser:
```bash
# Open the HTML file directly
open frontend/web/index.html

# Or use a local server (better for WebSocket)
cd frontend/web
python3 -m http.server 5373
# Then visit: http://localhost:5373
```

**What you should see:**
- Connection status: "🟢 Connected"
- Real-time pitch values updating
- 3D torso model rotating
- Back glow changing color (green/red)
- Status: "GOOD ✓" or "BAD ✗"
- AI insights every 15 seconds

**Web Demo Features:**
- ✅ Works on any device (desktop, tablet, phone)
- ✅ No installation required
- ✅ Three.js 3D visualization
- ✅ Real-time WebSocket updates
- ✅ Responsive design
- ✅ Perfect for presentations!

#### Option B: Swift App (macOS - For Real Hardware) 🔧

##### Open in Xcode
```bash
cd frontend/UpperTorso3D.swiftpm
open UpperTorso3D.swiftpm
```

Or double-click `UpperTorso3D.swiftpm` in Finder.

##### Run the App
1. Select target: **My Mac**
2. Press **⌘R** or click ▶️ Run
3. App will open and connect to WebSocket automatically

### 6️⃣ Verify Everything Works

#### Check Backend Logs
```bash
# In terminal running server.js
[Window] Processed window_1234567890: rating=good, confidence=high, samples=345
```

#### Check Serial Bridge Logs
```bash
[Serial Bridge] ✓ Posted sample (pitch=12.45)
```

#### Check Web App
- Open `http://localhost:5373` in browser
- Connection status should show "🟢 Connected"
- Pitch values should update in real-time
- 3D torso should rotate smoothly
- Posture status should change (GOOD/BAD)
- Insights should appear every 15 seconds

#### Check Swift App (if using hardware)
- Should show real-time pitch/roll values
- 3D torso should rotate with sensor movement
- Back glow should change color (green/red)
- Status should show "GOOD ✓" or "BAD ✗"
- Insight cards should appear every 15 seconds

---

## 🔌 Hardware Setup

### Sensor Placement

```
        👤 USER (seated)
        
    🔴 Arduino #1 (Upper)
    📍 Placement: Upper back / neck area
       (between shoulder blades, near C7 vertebra)
    
    ━━━━━━━━━━━━━━━━━━━━━━
    
    🔵 Arduino #2 (Lower)  
    📍 Placement: Lower back
       (lumbar region, near L3-L5 vertebra)
```

### Connection Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   Arduino Uno #1    │       │   Arduino Uno #2    │
│                     │       │                     │
│  ┌───────────────┐  │       │  ┌───────────────┐  │
│  │   I2C Port    │  │       │  │   I2C Port    │  │
│  └───────┬───────┘  │       │  └───────┬───────┘  │
│          │          │       │          │          │
│  ┌───────▼───────┐  │       │  ┌───────▼───────┐  │
│  │  MMA7660      │  │       │  │  MMA7660      │  │
│  │  Accel Sensor │  │       │  │  Accel Sensor │  │
│  └───────────────┘  │       │  └───────────────┘  │
│                     │       │                     │
│  ┌───────────────┐  │       │  ┌───────────────┐  │
│  │ Button (D2)   │  │       │  │ Button (D2)   │  │
│  │ (Optional)    │  │       │  │ (Optional)    │  │
│  └───────────────┘  │       │  └───────────────┘  │
│                     │       │                     │
│  USB ──────────────┼───┐    │  USB ──────────────┼───┐
└─────────────────────┘   │    └─────────────────────┘   │
                          │                              │
                          ▼                              ▼
                    ┌──────────────────────────────────────┐
                    │         Computer                     │
                    │  Running Backend + Serial Bridges    │
                    └──────────────────────────────────────┘
```

### Calibration

Press the button on each Arduino to calibrate:
1. Sit in your **ideal posture**
2. Press button → LED blinks
3. Hold posture for **5 seconds**
4. Calibration complete → baseline established

The system will now measure posture relative to your calibrated baseline.

---

## 📡 API Reference

### HTTP Endpoints

#### POST /imu
Ingest data from sensor 1 (upper back).

**Sample Request:**
```bash
curl -X POST http://localhost:8003/imu \
  -H "Content-Type: application/json" \
  -d '{
    "pitch": 12.45,
    "pitch_smooth": 12.30,
    "roll": -3.21,
    "ax": -0.1234,
    "ay": 0.5678,
    "az": 0.9876,
    "a_mag": 1.02,
    "dpitch": 0.15,
    "ts": 1234567890
  }'
```

**Event Request:**
```bash
curl -X POST http://localhost:8003/imu \
  -H "Content-Type: application/json" \
  -d '{"event": "calibration", "baseline_pitch": 10.5, "ts": 1234567890}'
```

#### POST /imu2
Ingest data from sensor 2 (lower back). Same format as `/imu`.

#### GET /latest1
Returns the most recent sample from sensor 1.

**Response:**
```json
{
  "kind": "sample",
  "pitch": 12.45,
  "pitch_smooth": 12.30,
  "roll": -3.21,
  "source": 1,
  "ts": 1234567890
}
```

#### GET /latest2
Returns the most recent sample from sensor 2.

#### GET /history1
Returns buffered history array for sensor 1 (up to 2000 samples).

**Response:**
```json
[
  {"kind": "sample", "pitch": 10.1, "source": 1, "ts": 1234567800},
  {"kind": "sample", "pitch": 10.5, "source": 1, "ts": 1234567850},
  ...
]
```

#### GET /history2
Returns buffered history array for sensor 2.

#### GET /insights/latest
Returns the most recent AI-generated insight.

**Response:**
```json
{
  "type": "insight_update",
  "windowStart": 1234567800000,
  "windowEnd": 1234567815000,
  "rating": "good",
  "summary": "Your posture looks excellent!",
  "issues": [],
  "suggestions": ["Keep maintaining good posture!"],
  "tip": "Great job! Keep it up.",
  "confidence": "high",
  "features": {
    "sensor1": {...},
    "sensor2": {...},
    "alignment": {...}
  }
}
```

#### GET /insights/history
Returns historical insights (last 240 windows = 60 minutes).

#### POST /gemini/analyze
Manually trigger Gemini analysis on recent data.

**Request:**
```bash
curl -X POST http://localhost:8003/gemini/analyze \
  -H "Content-Type: application/json" \
  -d '{"window": 300, "source": "both"}'
```

**Parameters:**
- `window` (optional): Number of recent samples to analyze (default: 300, max: 1000)
- `source` (optional): `"1"`, `"2"`, or `"both"` (default: `"both"`)

#### GET /gemini/health
Check Gemini API configuration.

**Response:**
```json
{
  "ok": true,
  "hasKey": true,
  "model": "gemini-1.5-flash"
}
```

### WebSocket Events

Connect to: `ws://localhost:8003`

#### Client → Server
No client messages required. Server broadcasts automatically.

#### Server → Client

**Sample Message:**
```json
{
  "kind": "sample",
  "pitch": 12.45,
  "pitch_smooth": 12.30,
  "roll": -3.21,
  "ax": -0.1234,
  "ay": 0.5678,
  "az": 0.9876,
  "source": 1,
  "ts": 1234567890
}
```

**Event Message:**
```json
{
  "kind": "event",
  "event": "calibration",
  "baseline_pitch": 10.5,
  "source": 1,
  "ts": 1234567890
}
```

**Insight Update:**
```json
{
  "type": "insight_update",
  "rating": "good",
  "summary": "Your posture looks excellent!",
  "issues": [],
  "suggestions": ["Keep maintaining good posture!"],
  "tip": "Great job!",
  "confidence": "high"
}
```

### Data Formats

#### Sample Fields
| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `ax` | float | g | X-axis acceleration |
| `ay` | float | g | Y-axis acceleration |
| `az` | float | g | Z-axis acceleration |
| `pitch` | float | degrees | Forward/backward tilt (raw) |
| `pitch_smooth` | float | degrees | EMA-filtered pitch |
| `roll` | float | degrees | Side-to-side tilt |
| `a_mag` | float | g | Acceleration magnitude |
| `dpitch` | float | deg/s | Rate of pitch change |
| `baseline_pitch` | float | degrees | Calibrated baseline (optional) |
| `ts` | integer | ms | Timestamp (Unix epoch milliseconds) |
| `source` | integer | - | Sensor ID (1 or 2) |

#### Insight Ratings
- `"good"` — Excellent posture, minimal slouching
- `"fair"` — Moderate posture, some slouching
- `"not_so_good"` — Noticeable slouching, needs attention
- `"poor"` — Frequent slouching, immediate correction needed

#### Confidence Levels
- `"high"` — Good data quality, reliable analysis
- `"medium"` — Partial data or some noise
- `"low"` — Limited data or poor quality

---

## 🧪 Developer Guide

### Running Tests

#### Test WebSocket Connection
```bash
cd backend
node test-websocket.js
```

#### Test Insight Generation
```bash
cd backend
node test-insights.js
```

#### Manual API Testing
```bash
# Post a sample
curl -X POST http://localhost:8003/imu \
  -H "Content-Type: application/json" \
  -d '{"pitch":15.5,"ts":1234567890}'

# Get latest
curl http://localhost:8003/latest1

# Get history
curl http://localhost:8003/history1

# Check Gemini health
curl http://localhost:8003/gemini/health
```

### Viewing Telemetry Logs

```bash
# Follow sensor 1 log in real-time
tail -f backend/telemetry.ndjson

# View last 100 lines
tail -n 100 backend/telemetry.ndjson

# Count samples
wc -l backend/telemetry.ndjson

# Parse JSON (requires jq)
cat backend/telemetry.ndjson | jq '.pitch'
```

### Debugging Tips

#### Backend Not Receiving Data?
```bash
# Check if Arduino is connected
ls /dev/tty.*

# Test serial output directly
screen /dev/tty.usbmodem1101 115200
# Press Ctrl+A, K to quit

# Check serial bridge logs
node serial-bridge.js /dev/tty.usbmodem1101 115200 localhost 8080 /imu
```

#### WebSocket Not Connecting?
```bash
# Check if server is running
curl http://localhost:8080

# Test WebSocket with wscat (install: npm i -g wscat)
wscat -c ws://localhost:8080
```

#### Gemini API Issues?
```bash
# Verify API key is set
curl http://localhost:8080/gemini/health

# Check .env file
cat backend/Gemini-Integration-Key.env
```

#### Frontend Not Updating?
- Check Xcode console for errors
- Verify WebSocket URL in `TelemetryWebSocket.swift`
- Ensure backend is running on port 8003
- Check firewall settings

### Code Style

#### Backend (JavaScript)
- Use `const` for immutable variables
- Use `let` for mutable variables
- Async/await for asynchronous code
- Error handling with try/catch
- ESLint configuration in `package.json`

#### Frontend (Swift)
- SwiftUI declarative syntax
- Combine for reactive streams
- `@Published` for observable properties
- Descriptive variable names
- Comments for complex logic

### Performance Optimization

#### Backend
- NDJSON logs grow indefinitely → implement log rotation
- In-memory buffers limited to 2000 samples
- Window manager auto-cleans old windows (keeps last 240)
- Processed window IDs tracked in Set (auto-trims to 500)

#### Frontend
- 3D rendering at 60 FPS
- WebSocket message throttling (if needed)
- Insight history limited to 48 entries (24 hours)
- SceneKit anti-aliasing: 4X multisampling

---

## 🤝 Contributing

We welcome contributions! Here are some areas where you can help:

### Features to Add
- [ ] Mobile app (iOS/Android native)
- [ ] Web dashboard for posture analytics
- [ ] Export posture data to CSV/JSON
- [ ] Posture score calculation (0-100)
- [ ] Push notifications for poor posture
- [ ] Multiple user profiles
- [ ] Haptic feedback (vibration alerts)
- [ ] Integration with smartwatches
- [ ] Machine learning for personalized thresholds

### Improvements
- [ ] Log rotation for NDJSON files
- [ ] Database backend (PostgreSQL/MongoDB)
- [ ] Authentication & user accounts
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Unit tests & integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Localization (i18n)

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **DeltaHacks 12** for the opportunity to build this project
- **Google Gemini** for AI-powered insights
- **Arduino Community** for extensive sensor libraries
- **Grove** for reliable accelerometer hardware
- **Apple** for SwiftUI & SceneKit frameworks

---

## 🎥 Demo

[Add your demo video/screenshots here]

---

<div align="center">

**Your spine will thank you.** 🙌

Made with ☕ and countless hours of coding

</div>
