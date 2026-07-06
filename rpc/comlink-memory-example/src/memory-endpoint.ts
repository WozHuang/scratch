type MessageListener = (data: any) => void;

export interface Endpoint {
  postMessage(message: any, transfer?: any[]): void;
  addEventListener(type: string, listener: MessageListener): void;
  removeEventListener(type: string, listener: MessageListener): void;
  start?(): void;
  close?(): void;
}

export class MemoryEndpoint implements Endpoint {
  private peer?: MemoryEndpoint;
  private listeners = new Set<MessageListener>();

  connect(peer: MemoryEndpoint) {
    this.peer = peer;
  }

  postMessage(data: any, _transfer?: any[]) {
    this.peer?.listeners.forEach(listener => listener({ data }));
  }

  addEventListener(type: string, listener: MessageListener) {
    this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: MessageListener) {
    this.listeners.delete(listener);
  }

  start() {}
  close() {
    this.listeners.clear();
  }
}

export function createChannel() {
  const a = new MemoryEndpoint();
  const b = new MemoryEndpoint();
  a.connect(b);
  b.connect(a);
  return { a, b };
}
