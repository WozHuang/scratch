import { configure, makeAutoObservable } from "mobx"

configure({
  useProxies: "never"
})
export class Error {
  rootStore;
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  errorLogs = [];
  get count() {
    return this.errorLogs.length;
  }

  addError(error, info) {
    this.errorLogs.push({ error, info, url: location.href, time: new Date().toString() });
  }
}
