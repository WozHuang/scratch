// server.js
const express = require('express');
const { Server } = require('ws');
const pty = require('node-pty');

const app = express();
app.use(express.static('public'));
const server = app.listen(3000);
const wss = new Server({ server });

wss.on('connection', ws => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], { cols: 80, rows: 30 });

  ptyProcess.onData(data => ws.send(data));
  ws.on('message', msg => ptyProcess.write(msg));
});
