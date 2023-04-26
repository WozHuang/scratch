import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

const root = document.getElementById('root') as HTMLElement;
const term = new Terminal();
term.open(root);
term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');
