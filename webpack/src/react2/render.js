import React from 'react';
import { createRoot } from 'react-dom/client';

const root = document.createElement('div');
document.body.appendChild(root);

function App() {
  return <div>2222</div>
}

createRoot(root).render(<App />)
