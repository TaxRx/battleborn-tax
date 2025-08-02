/**
 * TypeScript definitions for Galileo Report Builder
 */

// Cloudflare Worker environment bindings
export interface Env {
  // Browser rendering binding
  BROWSER: {
    launch(): Promise<{
      newPage(): Promise<{
        setViewport(options: { width: number; height: number }): Promise<void>;
        setContent(html: string, options?: { waitUntil: string[]; timeout: number }): Promise<void>;
        evaluateHandle(fn: () => any): Promise<any>;
        pdf(options: PDFOptions): Promise<ArrayBuffer>;
        close(): Promise<void>;
      }>;
      close(): Promise<void>;
    }>;
  };
  
  // Optional bindings (add when needed)
  // ANALYTICS?: AnalyticsEngineDataset;
  // CACHE?: KVNamespace;
  // REPORTS?: R2Bucket;
  
  // Environment variables
  ENVIRONMENT: string;
  NODE_ENV: string;
  SERVICE_NAME: string;
  VERSION: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// PDF generation request body
export interface PDFGenerationRequest {
  html: string;
  filename?: string;
  options?: PDFOptions;
}

// PDF generation options (matching Puppeteer API)
export interface PDFOptions {
  format?: 'Letter' | 'A4' | 'A3' | 'Legal' | 'Tabloid';
  width?: string | number;
  height?: string | number;
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
}

// API Response types
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  capabilities: {
    browserRendering: boolean;
    pdfGeneration: boolean;
    cloudflareWorker: boolean;
  };
}

export interface ServiceInfoResponse {
  service: string;
  version: string;
  description: string;
  endpoints: {
    health: string;
    generatePdf: string;
  };
  documentation: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
  timestamp: string;
  availableEndpoints?: Record<string, string>;
}

// Logging levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log data structure
export interface LogData {
  [key: string]: any;
}

declare global {
  var ENVIRONMENT: string;
  var VERSION: string;
  var LOG_LEVEL: LogLevel;
}