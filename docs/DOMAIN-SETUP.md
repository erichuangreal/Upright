# Domain Setup: Why the Mock Sensor Works via IP but Not Domain

## The Problem

- **159.89.112.149:5373** → Mock sensor data appears (real-time posture updates work)
- **upright.erichuangreal.dev** → Mock sensor doesn't work (no data, "Disconnected")

The mock sensor itself runs on the server and always POSTs to the backend. The issue is the **frontend** in the browser cannot receive the data when accessed via the domain.

---

## Root Cause

The frontend uses a **WebSocket** to receive real-time sensor data from the backend. In `app.js`, the WebSocket URL was hardcoded:

```javascript
const WS_URL = 'ws://159.89.112.149:8003';  // OLD - hardcoded
```

### Why IP works

- Page: `http://159.89.112.149:5373`
- WebSocket: `ws://159.89.112.149:8003`
- Same host, both insecure (HTTP/ws) → works

### Why domain fails

1. **HTTPS + ws (mixed content)**  
   If the domain uses HTTPS, the browser blocks `ws://` connections from a secure page (mixed content policy).

2. **Wrong host/port**  
   With a domain, traffic usually goes through nginx on port 80/443. The backend on port 8003 is not directly exposed, so `ws://159.89.112.149:8003` may not be reachable or is blocked.

3. **CORS / WebSocket origin**  
   The domain and the IP are different origins, which can cause WebSocket or security issues.

---

## The Fix (Implemented)

`app.js` now derives WebSocket and API URLs from the current page:

| Access mode | Example | WebSocket URL | API base |
|-------------|---------|---------------|----------|
| Direct IP | `http://159.89.112.149:5373` | `ws://host:8003` | `http://host:8003` |
| Domain (nginx) | `https://upright.erichuangreal.dev` | `wss://host/ws` | `https://host/api` |

- **Direct access (port 5373)** → backend on same host, port 8003.
- **Domain (port 80/443)** → backend proxied by nginx at `/ws` and `/api`.

---

## Required Nginx Configuration

For the domain to work, nginx must proxy both the API and WebSocket to the backend. Add to your nginx config (e.g. `/etc/nginx/sites-available/upright`):

```nginx
server {
    listen 80;
    server_name upright.erichuangreal.dev;

    # Frontend static files
    location / {
        root /opt/upright/frontend/web;  # or wherever your frontend lives
        index index.html;
        try_files $uri $uri/ =404;
    }

    # REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8003/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (required for real-time sensor data)
    location /ws {
        proxy_pass http://127.0.0.1:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

With SSL (Certbot):

```bash
sudo certbot --nginx -d upright.erichuangreal.dev
```

Certbot will add HTTPS; `wss://` will work once the site is served over HTTPS.

---

## Verify Setup

1. **Backend running:**
   ```bash
   curl http://localhost:8003/latest1
   ```

2. **Mock sensor running:**
   ```bash
   pm2 status mock-sensor-1
   pm2 logs mock-sensor-1
   ```

3. **Nginx proxy:**
   ```bash
   curl https://upright.erichuangreal.dev/api/latest1
   ```

4. **Browser console (F12):**
   - Open `https://upright.erichuangreal.dev`
   - Check for `Connecting to WebSocket: wss://upright.erichuangreal.dev/ws`
   - Should see `WebSocket connected`

---

## Architecture Summary

```
Direct IP (159.89.112.149:5373):
  Browser → Frontend :5373
  Browser → WebSocket ws://IP:8003  ← direct to backend

Domain (upright.erichuangreal.dev):
  Browser → nginx :443 → Frontend (static)
  Browser → nginx :443/ws → Backend :8003 (WebSocket)
  Browser → nginx :443/api → Backend :8003 (REST)

Mock sensor (always):
  mock-sensor.js → POST http://localhost:8003/imu  ← server-side, unchanged
```
