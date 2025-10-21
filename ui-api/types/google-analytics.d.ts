// Google Analytics TypeScript declarations
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'get',
      action: string,
      parameters?: {
        [key: string]: any;
      }
    ) => void;
  }
}

export {};
