const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tipificaciones.json');

app.use(bodyParser.json({ limit: '5mb' }));
// Servir archivos estáticos desde la carpeta del proyecto para evitar problemas con file:// origin
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`[server] ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

function readFile(){
  try{
    if(!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){ return []; }
}

function writeFile(data){
  try{
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  }catch(e){ console.error(e); return false; }
}

app.get('/tipificaciones', (req, res) => {
  const data = readFile();
  console.log('[server] GET /tipificaciones ->', (Array.isArray(data) ? data.length : 0), 'items');
  res.json({ ok: true, data });
});

// Reemplaza completamente la lista de tipificaciones
app.post('/tipificaciones', (req, res) => {
  const payload = req.body;
  if(!Array.isArray(payload)) return res.status(400).json({ ok:false, error: 'se espera un array' });
  const ok = writeFile(payload);
  console.log('[server] POST /tipificaciones <-', (Array.isArray(payload) ? payload.length : 0), 'items, writeOk=', ok);
  if(!ok) return res.status(500).json({ ok:false, error: 'no se pudo escribir archivo' });
  res.json({ ok:true });
});

// Endpoint opcional para limpiar
app.delete('/tipificaciones', (req, res) => {
  const ok = writeFile([]);
  console.log('[server] DELETE /tipificaciones -> clear, ok=', ok);
  if(!ok) return res.status(500).json({ ok:false, error: 'no se pudo escribir archivo' });
  res.json({ ok:true });
});

app.listen(PORT, ()=>{
  console.log(`Storage server listening on http://localhost:${PORT} — file: ${DATA_FILE}`);
});
