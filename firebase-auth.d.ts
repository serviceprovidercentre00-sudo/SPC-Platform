// firebase-auth.d.ts (Root folder mein)
declare module 'firebase/auth' {
  export * from '@firebase/auth';
  export function initializeAuth(app: any, deps: any): any;
  export function getReactNativePersistence(storage: any): any;
}