import fs from 'fs';
import os from 'os';

export class ConfigHandler {
    private configFilePath: string;
    private store: { apiKey: string };
  
    constructor() {
      this.configFilePath = `${os.homedir()}/.hirobot`;
      if (fs.existsSync(this.configFilePath)) {
        this.store = JSON.parse(fs.readFileSync(this.configFilePath).toString());
      } else {
        console.log(`api key need to init in ${this.configFilePath}`)
        this.store = { apiKey: '' };
        fs.writeFileSync(this.configFilePath, JSON.stringify(this.store));
      }
    }
  
    // setApiKey(apiKey: string): void {
    //   this.store.apiKey = apiKey;
    //   fs.writeFileSync(this.configFilePath, JSON.stringify(this.store));
    // }
  
    // getApiKey(): string {
    //   return this.store.apiKey;
    // }

    updateConfig(key: string, value: string): void {
        this.store[key] = value;
        fs.writeFileSync(this.configFilePath, JSON.stringify(this.store));
    }

    getConfig(key: string): string {
        return this.store[key];
    }

    save(): void {
        fs.writeFileSync(this.configFilePath, JSON.stringify(this.store));
    }
  }