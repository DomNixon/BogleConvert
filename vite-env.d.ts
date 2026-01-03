/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_STRIPE_URL?: string
    readonly VITE_BTC_EMAIL?: string
    readonly VITE_GITHUB_REPO?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
