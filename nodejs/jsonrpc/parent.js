import { spawn } from 'child_process';
import path from 'path';

// Path to child.js
const childPath = path.join(process.cwd(), 'child.js');

// Spawn child process with stdio pipes
const child = spawn('node', [childPath], {
  stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
});

// Function to send JSON-RPC request
let requestId = 1;
function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  child.stdin.write(JSON.stringify(request) + '\n');
}

// Listen for responses from child via stdout
child.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('Received response:', JSON.stringify(response, null, 2));
    } catch (err) {
      console.error('Failed to parse response:', line);
    }
  });
});

// Handle errors
child.on('error', (err) => {
  console.error('Child process error:', err);
});

// Handle child exit
child.on('close', (code) => {
  console.log('Child process exited with code', code);
});

// Send some test requests
sendRequest('add', [1, 2]);
sendRequest('echo', ['Hello JSON-RPC!']);
sendRequest('add', [10, 20]);
sendRequest('unknown', []); // Should return method not found

// Close stdin after a short delay
setTimeout(() => {
  child.stdin.end();
}, 1000);