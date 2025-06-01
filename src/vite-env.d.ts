/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPEN_AI_KEY: string
  readonly VITE_VERCEL_TOKEN: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}