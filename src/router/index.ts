import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

import VistaLogin from '../views/VistaLogin.vue'
import VistaSignup from '../views/VistaSignup.vue'
import LayoutPrincipal from '../views/LayoutPrincipal.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: VistaLogin,
    meta: { requiereAuth: false },
  },
  {
    path: '/signup',
    name: 'signup',
    component: VistaSignup,
    meta: { requiereAuth: false },
  },
  {
    path: '/',
    component: LayoutPrincipal,
    meta: { requiereAuth: true },
    children: [
      {
        path: '',
        redirect: '/app/gastos',
      },
      {
        path: 'app/gastos',
        name: 'gastos',
        component: () => import('../views/VistaGastos.vue'),
      },
      {
        path: 'app/companeros',
        name: 'companeros',
        component: () => import('../views/VistaCompaneros.vue'),
      },
      {
        path: 'app/materiales',
        name: 'materiales',
        component: () => import('../views/VistaMateriales.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { autenticado } = useAuth()
  const requiereAuth = to.matched.some((r) => r.meta.requiereAuth === true)

  if (requiereAuth && !autenticado.value) {
    return { name: 'login' }
  }

  if ((to.name === 'login' || to.name === 'signup') && autenticado.value) {
    return { name: 'gastos' }
  }
})

export default router
