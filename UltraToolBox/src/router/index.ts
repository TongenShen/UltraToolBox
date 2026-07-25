import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '首页', icon: 'home' }
    },
    {
      path: '/adb',
      name: 'Adb',
      component: () => import('@/views/AdbView.vue'),
      meta: { title: 'ADB 工具', icon: 'smartphone' }
    },
    {
      path: '/network',
      name: 'Network',
      component: () => import('@/views/NetworkView.vue'),
      meta: { title: '网络工具', icon: 'globe' }
    },
    {
      path: '/aria2',
      name: 'Aria2',
      component: () => import('@/views/Aria2View.vue'),
      meta: { title: 'Aria2 下载', icon: 'download' }
    },
    {
      path: '/terminal',
      name: 'Terminal',
      component: () => import('@/views/TerminalView.vue'),
      meta: { title: '终端', icon: 'terminal' }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置', icon: 'settings' }
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/About.vue'),
      meta: { title: '关于', icon: 'information' }
    }
  ]
})

export default router