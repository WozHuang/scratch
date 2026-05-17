import { spawn } from 'child_process';
import path from 'path';

// Path to child.js
const childPath = path.join(process.cwd(), 'child.js');

// Spawn child process with stdio pipes
const child = spawn('node', [childPath], {
  stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
});

// Send data to child via stdin
const message = { command: 'echo', data: 'Hello from parent!' };
child.stdin.write(JSON.stringify(message) + '\n');

// Listen for response from child via stdout
child.stdout.on('data', (data) => {
  console.log('Received from child:', data.toString().trim());
});

// Handle errors
child.on('error', (err) => {
  console.error('Child process error:', err);
});

// Handle child exit
child.on('close', (code) => {
  console.log('Child process exited with code', code);
});

// Close stdin after sending
child.stdin.end();