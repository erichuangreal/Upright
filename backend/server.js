// server.js
const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

const app = express();
app.use(cors());
app.use(express.json());

// ---- Telemetry logging ----
const TELEMETRY_PATH = process.env.TELEMETRY_PATH || path.join(__dirname, "telemetry.ndjson");
const MAX_BUFFER = Number(process.env.MAX_BUFFER || 5000);

// Store latest message so new clients can instantly get something
let latest = { pitch: 0, ts: Date.now() };
let history = [];

// Helpers
function toNum(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function normalizeSample(body) {
  const pitch = toNum(body?.pitch);
  if (pitch === undefined) return { ok: false, error: "pitch must be a number" };

  const ts = toNum(body?.ts) ?? Date.now();

  const sample = {
    ax: toNum(body?.ax),
    ay: toNum(body?.ay),
    az: toNum(body?.az),
    pitch,
    pitch_smooth: toNum(body?.pitch_smooth),
    roll: toNum(body?.roll),
    a_mag: toNum(body?.a_mag),
    dpitch: toNum(body?.dpitch),
    ts,
  };

  return { ok: true, sample };
}

function persistAndBroadcast(sample) {
  latest = sample;

  history.push(sample);
  if (history.length > MAX_BUFFER) history.shift();

  // Append to NDJSON log (one JSON per line)
  fs.appendFile(TELEMETRY_PATH, JSON.stringify(sample) + "\n", () => { });

  broadcast(sample);
}

// --- WebSocket server ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on("connection", (ws) => {
  // Send latest immediately
  ws.send(JSON.stringify(latest));
});

// --- HTTP endpoints ---

// Backward compatible endpoint name
app.post("/pitch", (req, res) => {
  const norm = normalizeSample(req.body);
  if (!norm.ok) return res.status(400).json(norm);

  persistAndBroadcast(norm.sample);

  const s = norm.sample;
  console.log(
    `[HTTP /pitch] pitch=${s.pitch.toFixed(2)} ax=${s.ax ?? "?"} ay=${s.ay ?? "?"} az=${s.az ?? "?"} ts=${s.ts}`
  );

  res.json({ ok: true });
});

// Preferred endpoint
app.post("/imu", (req, res) => {
  const norm = normalizeSample(req.body);
  if (!norm.ok) return res.status(400).json(norm);

  persistAndBroadcast(norm.sample);
  res.json({ ok: true });
});

// Quick debug endpoints
app.get("/latest", (req, res) => res.json(latest));
app.get("/history", (req, res) => res.json(history));

// --- Demo mode (keep your existing demo logic if you want) ---
let demoTimer = null;

app.post("/demo/start", (req, res) => {
  if (demoTimer) return res.json({ ok: true, alreadyRunning: true });

  let t = 0;
  demoTimer = setInterval(() => {
    t += 0.05;
    const pitch = 15 * Math.sin(t);
    const sample = { pitch, ts: Date.now() };
    latest = sample;
    broadcast(sample);
  }, 50);

  res.json({ ok: true });
});

app.post("/demo/stop", (req, res) => {
  if (demoTimer) clearInterval(demoTimer);
  demoTimer = null;
  res.json({ ok: true });
});

// Start
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}`);
  console.log(`Logging to ${TELEMETRY_PATH}`);
});
