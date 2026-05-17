# JSON-RPC 2.0 IPC Demo

This demo demonstrates inter-process communication (IPC) using JSON-RPC 2.0 protocol over Node.js stdio streams.

## Files

- `parent.js`: Acts as a JSON-RPC client, spawns the child process, and sends RPC requests.
- `child.js`: Acts as a JSON-RPC server, reads requests from stdin, processes them, and responds via stdout.

## Supported Methods

- `add`: Takes two numbers and returns their sum. Params: `[number, number]`
- `echo`: Takes a string and returns it. Params: `[string]`

## Usage

Run the demo:

```bash
node parent.js
```

The parent sends several JSON-RPC requests to the child and prints the responses.

## JSON-RPC 2.0 Protocol

- Requests: `{"jsonrpc": "2.0", "id": number, "method": string, "params": array}`
- Responses: `{"jsonrpc": "2.0", "id": number, "result": any}` or `{"jsonrpc": "2.0", "id": number, "error": {"code": number, "message": string}}`

This example uses stdio pipes for bidirectional communication, with each message on a new line.