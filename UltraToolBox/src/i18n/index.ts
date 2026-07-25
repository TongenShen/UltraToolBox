import { createI18n } from 'vue-i18n'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'
import jaJP from '@/locales/ja-JP'
import koKR from '@/locales/ko-KR'

const savedLocale = typeof localStorage !== 'undefined'
  ? localStorage.getItem('ultratoolbox-locale')
  : null

const i18n = createI18n({
  legacy: false,
  locale: savedLocale || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
    'ko-KR': koKR
  }
})

export default i18n