// PNG Fighter — lokaler Server (nur Node.js-Bordmittel, keine npm-Pakete nötig)
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 4180;
const PUBLIC_DIR = path.join(__dirname, "public");

function getLanIps(){
  const ifaces = os.networkInterfaces();
  const ips = [];
  Object.values(ifaces).forEach(list => {
    (list || []).forEach(iface => {
      if (iface.family === "IPv4" && !iface.internal) ips.push(iface.address);
    });
  });
  return ips;
}

// kleine Helfer fuer den YouTube-Abruf (serverseitig, kein CORS-Problem)
function httpsGetJson(urlStr){
  return new Promise((resolve, reject) => {
    https.get(urlStr, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch(e){ reject(e); }
      });
    }).on("error", reject);
  });
}

function httpsGetBuffer(urlStr){
  return new Promise((resolve, reject) => {
    https.get(urlStr, res => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers["content-type"] || "image/jpeg" }));
    }).on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

let viewers = []; // offene SSE-Verbindungen der viewer.html-Seiten

function broadcast(event){
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  viewers.forEach(res => res.write(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // SSE-Stream, den viewer.html abonniert
  if (url.pathname === "/api/events" && req.method === "GET"){
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("\n");
    viewers.push(res);
    req.on("close", () => { viewers = viewers.filter(v => v !== res); });
    return;
  }

  // Befehle vom Kontrollpanel entgegennehmen und an alle Viewer weiterleiten
  if (url.pathname === "/api/action" && req.method === "POST"){
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const action = JSON.parse(body || "{}");
        broadcast(action);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, viewers: viewers.length }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "invalid json" }));
      }
    });
    return;
  }

  // YouTube-Profil abrufen: Name + Profilbild anhand Channel-ID oder @Handle
  if (url.pathname === "/api/youtube" && req.method === "GET"){
    const key = url.searchParams.get("key");
    const query = (url.searchParams.get("query") || "").trim();
    if (!key || !query){
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok:false, error:"API-Key und ID/Handle erforderlich" }));
      return;
    }
    (async () => {
      try {
        const base = `https://www.googleapis.com/youtube/v3/channels?part=snippet&key=${encodeURIComponent(key)}`;
        let json = await httpsGetJson(`${base}&id=${encodeURIComponent(query)}`);
        if (!json.items || !json.items.length){
          const handle = query.startsWith("@") ? query : "@"+query;
          json = await httpsGetJson(`${base}&forHandle=${encodeURIComponent(handle)}`);
        }
        if (json.error){
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok:false, error: json.error.message || "YouTube API Fehler" }));
          return;
        }
        if (!json.items || !json.items.length){
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok:false, error:"Kein Kanal mit dieser ID/diesem Handle gefunden" }));
          return;
        }
        const snippet = json.items[0].snippet;
        const name = snippet.title;
        const thumbUrl = (snippet.thumbnails && (snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default) || {}).url;
        const { buffer, contentType } = await httpsGetBuffer(thumbUrl);
        const image = `data:${contentType};base64,${buffer.toString("base64")}`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok:true, name, image }));
      } catch (e) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok:false, error: "Abruf fehlgeschlagen: " + e.message }));
      }
    })();
    return;
  }

  // statische Dateien ausliefern (viewer.html, control.html, ...)
  let filePath = url.pathname === "/" ? "/viewer.html" : url.pathname;
  filePath = path.join(PUBLIC_DIR, filePath);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("Forbidden"); return; }

  fs.readFile(filePath, (err, data) => {
    if (err){ res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  if (!fs.existsSync(PUBLIC_DIR)){
    console.error(`WARNUNG: Ordner "public" wurde nicht gefunden unter ${PUBLIC_DIR}`);
    console.error(`         viewer.html und control.html muessen in einem Unterordner "public" neben server.js liegen.`);
  }
  console.log("PNG Fighter Server laeuft:");
  console.log(`  Auf diesem Rechner:`);
  console.log(`    Viewer:        http://localhost:${PORT}/viewer.html`);
  console.log(`    Kontrollpanel: http://localhost:${PORT}/control.html`);
  const lanIps = getLanIps();
  if (lanIps.length){
    console.log(`  Im lokalen Netzwerk (von anderen Geraeten im selben WLAN):`);
    lanIps.forEach(ip => {
      console.log(`    Viewer:        http://${ip}:${PORT}/viewer.html`);
      console.log(`    Kontrollpanel: http://${ip}:${PORT}/control.html`);
    });
  }
});
