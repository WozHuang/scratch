import * as Comlink from "comlink";
import { clientPort } from "./server.js";
import type { Service } from "./server.js";

async function main() {
  const api = Comlink.wrap<Service>(clientPort);

  console.log(await api.add(1, 2));

  const result = await api.download(
    "file.zip",
    Comlink.proxy((p: number) => {
      console.log("progress:", p);
    })
  );

  console.log(result);
}

await main();
