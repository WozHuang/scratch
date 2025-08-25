import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import ICAL from 'ical.js';

document.title = `使用 iCal.js 解析js文件`;

const App = () => {
  const [content, setContent] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const onFileChange = () => {
    console.log('onFileChange');
    const file = fileRef.current?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setContent(result);
        const parsedResult = ICAL.parse(result);
        console.log(parsedResult);
      };
      reader.readAsText(file);
    }
  };
  return (
    <div>
      <h1>{document.title}</h1>
      <table border={1}>
        <tbody>
          <tr>
            <td>上传文件</td>
            <td>
              <input ref={fileRef} type='file' onChange={onFileChange} />
            </td>
          </tr>
          <tr>
            <td>内容</td>
            <td>{content}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const root = document.getElementById('root') as HTMLElement;
createRoot(root).render(<App />);
