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
        redirect: '/app/materiales',
      },
      {
        path: 'app/dashboard',
        name: 'dashboard',
        component: () => import('../views/VistaDashboard.vue'),
        meta: { requiereAdmin: true },
      },
      {
        path: 'app/gastos',
        name: 'gastos',
        component: () => import('../views/VistaGastos.vue'),
        meta: { requiereAdmin: true },
      },
      {
        path: 'app/gastos/:id',
        name: 'gasto-detalle',
        component: () => import('../views/VistaDetalleGasto.vue'),
        props: true,
        meta: { requiereAdmin: true },
      },
      {
        path: 'app/materiales',
        name: 'materiales',
        component: () => import('../views/VistaMateriales.vue'),
      },
      {
        path: 'app/balance',
        name: 'balance',
        component: () => import('../views/VistaBalance.vue'),
      },
    ],
  },
  {
    path: '/:rutaNoEncontrada(.*)*',
    redirect: '/app/materiales',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { autenticado, esAdmin } = useAuth()
  const requiereAuth = to.matched.some((r) => r.meta.requiereAuth === true)
  const requiereAdmin = to.matched.some((r) => r.meta.requiereAdmin === true)
  const destinoInicio = esAdmin.value ? 'dashboard' : 'materiales'

  if (requiereAuth && !autenticado.value) {
    return { name: 'login' }
  }

  if (requiereAdmin && !esAdmin.value) {
    return { name: 'materiales' }
  }

  if ((to.name === 'login' || to.name === 'signup') && autenticado.value) {
    return { name: destinoInicio }
  }
})

export default router
