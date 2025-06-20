import { config } from 'dotenv';
import { expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Load environment variables
config();

// Set test timeout
jest.setTimeout(10000);

// Mock Vite environment variables
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
      MODE: 'test',
      DEV: true,
      PROD: false,
      SSR: false
    }
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// @ts-ignore - ResizeObserver is not fully typed
global.ResizeObserver = MockResizeObserver; 