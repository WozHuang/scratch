// Read from stdin
process.stdin.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString().trim());
    if (message.command === 'echo') {
      const response = { result: message.data };
      process.stdout.write(JSON.stringify(response) + '\n');
    } else {
      process.stdout.write(JSON.stringify({ error: 'Unknown command' }) + '\n');
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: 'Invalid JSON' }) + '\n');
  }
});

// Handle stdin end
process.stdin.on('end', () => {
  process.exit(0);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});