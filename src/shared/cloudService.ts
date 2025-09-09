import axios from 'axios';

// Cloud API base URL - MongoDB Atlas ile iletişim için
const CLOUD_API_BASE_URL = process.env.REACT_APP_CLOUD_API_URL || 'http://localhost:5000/api';

export interface CloudConfig {
  restaurantId: string;
  licenseKey: string;
  apiEndpoint: string;
}

export interface LicenseInfo {
  restaurantId: string;
  restaurantName: string;
  licenseKey: string;
  expiryDate: string;
  isActive: boolean;
  features: string[];
}

export interface SyncData {
  orders: any[];
  menuItems: any[];
  dailyReport: any;
  timestamp: string;
}

class CloudService {
  private config: CloudConfig | null = null;
  private apiClient = axios.create({
    baseURL: CLOUD_API_BASE_URL,
    timeout: 10000,
  });

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    this.apiClient.interceptors.request.use((config) => {
      if (this.config?.licenseKey) {
        config.headers.Authorization = `Bearer ${this.config.licenseKey}`;
      }
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // License expired or invalid
          this.handleLicenseError();
        }
        return Promise.reject(error);
      }
    );
  }

  async initializeConnection(restaurantId: string, licenseKey: string): Promise<boolean> {
    try {
      this.config = {
        restaurantId,
        licenseKey,
        apiEndpoint: CLOUD_API_BASE_URL,
      };

      const response = await this.apiClient.post('/auth/validate', {
        restaurantId,
        licenseKey,
      });

      return response.data.valid;
    } catch (error) {
      console.error('Failed to initialize cloud connection:', error);
      return false;
    }
  }

  async getLicenseInfo(): Promise<LicenseInfo | null> {
    try {
      if (!this.config) throw new Error('Cloud service not initialized');

      const response = await this.apiClient.get(`/license/${this.config.restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get license info:', error);
      return null;
    }
  }

  async syncToCloud(data: SyncData): Promise<boolean> {
    try {
      if (!this.config) throw new Error('Cloud service not initialized');

      await this.apiClient.post('/sync/upload', {
        restaurantId: this.config.restaurantId,
        data,
      });

      return true;
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      return false;
    }
  }

  async syncFromCloud(): Promise<any> {
    try {
      if (!this.config) throw new Error('Cloud service not initialized');

      const response = await this.apiClient.get(`/sync/download/${this.config.restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
      return null;
    }
  }

  async uploadDailyReport(report: any): Promise<boolean> {
    try {
      if (!this.config) throw new Error('Cloud service not initialized');

      await this.apiClient.post('/reports/daily', {
        restaurantId: this.config.restaurantId,
        report,
        date: new Date().toISOString().split('T')[0],
      });

      return true;
    } catch (error) {
      console.error('Failed to upload daily report:', error);
      return false;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private handleLicenseError() {
    // Handle license expiry or invalid license
    window.electronAPI?.showLicenseExpiredDialog?.();
  }

  isConnected(): boolean {
    return this.config !== null;
  }

  getConfig(): CloudConfig | null {
    return this.config;
  }
}

export const cloudService = new CloudService();
