// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    DB_URL: process.env.DB_URL,
    WRDC_USER: process.env.WRDC_USER,
    WRDC_TOKEN: process.env.WRDC_TOKEN
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
