import { createInterface } from 'readline';

// Create readline interface for stdin
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Simple method implementations
const methods = {
  add: (params) => {
    if (!Array.isArray(params) || params.length !== 2) {
      throw new Error('Invalid params for add: expected [number, number]');
    }
    const [a, b] = params;
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Params must be numbers');
    }
    return a + b;
  },
  echo: (params) => {
    if (!Array.isArray(params) || params.length !== 1) {
      throw new Error('Invalid params for echo: expected [string]');
    }
    return params[0];
  }
};

// Handle each line from stdin
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line.trim());
    if (request.jsonrpc !== '2.0') {
      throw new Error('Invalid JSON-RPC version');
    }
    if (!request.method) {
      throw new Error('Missing method');
    }
    if (!methods[request.method]) {
      const response = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: { code: -32601, message: 'Method not found' }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }
    try {
      const result = methods[request.method](request.params);
      const response = {
        jsonrpc: '2.0',
        id: request.id || null,
        result
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      const response = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: { code: -32602, message: err.message }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    const response = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
});

// Handle process exit
process.on('exit', () => {
  rl.close();
});