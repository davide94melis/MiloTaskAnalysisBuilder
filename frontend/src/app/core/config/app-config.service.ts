import { Injectable } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  miloApiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = {
    apiUrl: 'http://localhost:8080/api',
    miloApiUrl: 'http://localhost:8081/api'
  };

  load(): Promise<AppConfig> {
    return fetch('/config.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('config.json not found'))))
      .then((config) => {
        this.config = {
          apiUrl: config.apiUrl || this.config.apiUrl,
          miloApiUrl: config.miloApiUrl || this.config.miloApiUrl
        };
        return this.config;
      })
      .catch(() => this.config);
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get miloApiBaseUrl(): string {
    return this.config.miloApiUrl || this.config.apiUrl;
  }
}
