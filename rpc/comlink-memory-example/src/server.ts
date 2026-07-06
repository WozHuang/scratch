import * as Comlink from "comlink";
import { createChannel } from "./memory-endpoint.js";

export interface Service {
  add(a: number, b: number): Promise<number>;
  download(url: string, progress: (p: number) => void): Promise<string>;
}

const service: Service = {
  async add(a, b) {
    return a + b;
  },

  async download(url, progress) {
    for (let i = 0; i <= 100; i += 20) {
      progress(i);
      await new Promise(r => setTimeout(r, 100));
    }
    return `downloaded ${url}`;
  },
};

const { a: clientPort, b: serverPort } = createChannel();

Comlink.expose(service, serverPort);

export { clientPort };
