# Stdio IPC Example

This example demonstrates inter-process communication (IPC) using Node.js stdio (standard input/output) streams.

## Files

- `parent.js`: Spawns a child process and communicates via stdio pipes.
- `child.js`: Reads from stdin, processes JSON messages, and responds via stdout.

## Usage

Run the example:

```bash
node parent.js
```

The parent sends a JSON message to the child, which echoes it back.

## How it works

- Parent spawns child with `child_process.spawn`, setting `stdio: ['pipe', 'pipe', 'inherit']`.
- Parent writes JSON to child's stdin.
- Child reads stdin, parses JSON, processes the command, and writes response to stdout.
- Parent reads response from child's stdout.

This is a simple example of bidirectional communication using stdio pipes.