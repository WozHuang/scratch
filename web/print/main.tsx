import { createRoot } from 'react-dom/client';
import React, { useRef } from 'react';

let App = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const printMain = () => window.print();
  const printIframe = () => {
    iframeRef.current?.contentWindow?.print();
  };
  const addContent = () => {
    const el = document.createElement('p');
    el.innerText = 'from parent';
    iframeRef.current?.contentWindow?.document.body.append(el);
  };
  return (
    <div>
      <p>main</p>
      <p>
        <button onClick={addContent}>addContent</button>
      </p>
      <p>
        <button onClick={printMain}>print main</button>
        <button onClick={printIframe}>print iframe</button>
      </p>
      <iframe src='http://localhost:12345' ref={iframeRef} width={500} height={500} />
    </div>
  );
};

const root = document.getElementById('root') as HTMLElement;
createRoot(root).render(<App />);
