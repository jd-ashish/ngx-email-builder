import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmailBuilderApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class EmailBuilderStorageService {
  private http = inject(HttpClient);
  private apiUrl = 'https://mail.api.nowmail.in/api';
  private config: EmailBuilderApiConfig | null = null;

  setConfig(config: EmailBuilderApiConfig) {
    this.config = config;
  }

  private generateUniqueId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getSystemSessionId(): string {
    // sessionStorage is safer than localStorage as it clears when the tab is closed,
    // but unlike a private property, it survives page reloads (HMR/F5).
    const OBSCURE_KEY = '_0x1a2b3c';
    let sessionId = sessionStorage.getItem(OBSCURE_KEY);
    if (!sessionId || sessionId.length !== 32) {
      sessionId = this.generateUniqueId(32);
      sessionStorage.setItem(OBSCURE_KEY, sessionId);
    }
    return sessionId;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'x-system-session-id': this.getSystemSessionId()
    });

    if (this.config?.headers) {
      Object.entries(this.config.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  saveTemplate(data: any): Observable<any> {
    const baseUrl = this.config?.baseUrl || this.apiUrl;
    return this.http.post(`${baseUrl}/email-template-builder/save`, data, {
      headers: this.getHeaders()
    });
  }

  listTemplates(): Observable<any> {
    const baseUrl = this.config?.baseUrl || this.apiUrl;
    return this.http.get(`${baseUrl}/email-template-builder/list`, {
      headers: this.getHeaders()
    });
  }

  getTemplate(id: string): Observable<any> {
    const baseUrl = this.config?.baseUrl || this.apiUrl;
    return this.http.get(`${baseUrl}/email-template-builder/${id}`, {
      headers: this.getHeaders()
    });
  }

  deleteTemplate(id: string): Observable<any> {
    const baseUrl = this.config?.baseUrl || this.apiUrl;
    return this.http.delete(`${baseUrl}/email-template-builder/${id}`, {
      headers: this.getHeaders()
    });
  }
}
