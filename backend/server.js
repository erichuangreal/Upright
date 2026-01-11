// server.js
// Node backend that accepts IMU samples from TWO Arduino boards:
//  - Arduino #1 posts to POST /imu  -> logs to telemetry.ndjson
//  - Arduino #2 posts to POST /imu2 -> logs to telemetry2.ndjson
// It also broadcasts every sample over WebSocket (ws://localhost:8080)
// and tags each sample with source: 1 or source: 2.
//
// Start (PowerShell):
//   & "C:\Program Files\nodejs\node.exe" server.js
//
// Bridges:
//   & "C:\Program Files\nodejs\node.exe" serial-bridge.js COM5 115200 localhost 8080 /imu
//   & "C:\Program Files\nodejs\node.exe" serial-bridge.js COM6 115200 localhost 8080 /imu2

const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

// ---- Telemetry files ----
const TELEMETRY1_PATH = process.env.TELEMETRY1_PATH || path.join(__dirname, "telemetry.ndjson");
const TELEMETRY2_PATH = process.env.TELEMETRY2_PATH || path.join(__dirname, "telemetry2.ndjson");

// Optional: keep a little history in memory (for debugging)
const MAX_BUFFER = Number(process.env.MAX_BUFFER || 2000);
let history1 = [];
let history2 = [];

// Latest samples (for new WS clients + /latest endpoints)
let latest1 = { pitch: 0, ts: Date.now(), source: 1 };
let latest2 = { pitch: 0, ts: Date.now(), source: 2 };

// ---- Helpers ----
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

function appendNdjson(filePath, obj) {
  fs.appendFile(filePath, JSON.stringify(obj) + "\n", () => { });
}

// ---- WebSocket server ----
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  // Send latest from both sensors immediately so client has state
  ws.send(JSON.stringify(latest1));
  ws.send(JSON.stringify(latest2));
});

// ---- HTTP endpoints ----

// Arduino #1 -> /imu -> telemetry.ndjson
app.post("/imu", (req, res) => {
  const norm = normalizeSample(req.body);
  if (!norm.ok) return res.status(400).json(norm);

  const sample = { ...norm.sample, source: 1 };
  latest1 = sample;

  history1.push(sample);
  if (history1.length > MAX_BUFFER) history1.shift();

  appendNdjson(TELEMETRY1_PATH, sample);
  broadcast(sample);

  res.json({ ok: true });
});

// Arduino #2 -> /imu2 -> telemetry2.ndjson
app.post("/imu2", (req, res) => {
  const norm = normalizeSample(req.body);
  if (!norm.ok) return res.status(400).json(norm);

  const sample = { ...norm.sample, source: 2 };
  latest2 = sample;

  history2.push(sample);
  if (history2.length > MAX_BUFFER) history2.shift();

  appendNdjson(TELEMETRY2_PATH, sample);
  broadcast(sample);

  res.json({ ok: true });
});

// Debug helpers
app.get("/latest1", (req, res) => res.json(latest1));
app.get("/latest2", (req, res) => res.json(latest2));
app.get("/history1", (req, res) => res.json(history1));
app.get("/history2", (req, res) => res.json(history2));

// Basic health check
app.get("/", (req, res) => {
  res.send(
    `OK\nPOST /imu (source 1) -> ${path.basename(TELEMETRY1_PATH)}\nPOST /imu2 (source 2) -> ${path.basename(
      TELEMETRY2_PATH
    )}\nWS: ws://localhost:${PORT}\n`
  );
});

// ---- Start server ----
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}`);
  console.log(`Logging #1 to ${TELEMETRY1_PATH}`);
  console.log(`Logging #2 to ${TELEMETRY2_PATH}`);
});
