import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { mostrarToastGlobal } from './composables/useToast'

const app = createApp(App).use(router)

/** Manejador global de errores no controlados de Vue. */
app.config.errorHandler = (err: unknown, _instance: unknown, info: string) => {
  const mensaje = err instanceof Error ? err.message : String(err)
  mostrarToastGlobal(`Error inesperado (${info}): ${mensaje}`, 'error')
}

app.mount('#app')
