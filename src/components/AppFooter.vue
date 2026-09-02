<script setup lang="ts">
import UjapLogo from './UjapLogo.vue'
</script>

<template>
  <footer class="app-footer">
    <div class="footer-main">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <UjapLogo :size="32" />
            <span class="footer-brand-name">UJAP Split</span>
          </div>
          <p class="footer-desc">
            Herramienta para dividir gastos con companeros de universidad.
            Facil, rapido y transparente.
          </p>
        </div>

        <div class="footer-col">
          <h4>SplitUJAP</h4>
          <ul>
            <li><a href="#">Acerca de</a></li>
            <li><a href="#">Funcionalidades</a></li>
            <li><a href="#">Como funciona</a></li>
            <li><a href="#">Seguridad</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Cuenta</h4>
          <ul>
            <li><router-link to="/login">Iniciar sesion</router-link></li>
            <li><router-link to="/signup">Crear cuenta</router-link></li>
            <li><a href="#">Configuracion</a></li>
            <li><a href="#">Cerrar sesion</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Ayuda</h4>
          <ul>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Preguntas frecuentes</a></li>
            <li><a href="#">Terminos de uso</a></li>
            <li><a href="#">Politica de privacidad</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <p>&copy; {{ new Date().getFullYear() }} UJAP Split. Proyecto academico — Ingenieria de Software.</p>
        <p class="footer-made">Hecho con dedicacion en la UJAP.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--ujap-blue-dark);
  color: rgba(255, 255, 255, 0.7);
  margin-top: auto;
}

.footer-main {
  border-top: 3px solid var(--ujap-red);
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 2rem;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 2.5rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-brand-name {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ujap-gold);
  letter-spacing: 0.03em;
}

.footer-desc {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
  max-width: 260px;
}

.footer-col h4 {
  font-family: var(--font-family);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem;
}

.footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-col a {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color var(--transition);
}

.footer-col a:hover {
  color: var(--ujap-gold);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.footer-made {
  font-style: italic;
}

@media (max-width: 768px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem 1.5rem 1.5rem;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .footer-bottom-inner {
    flex-direction: column;
    gap: 0.35rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
}
</style>
