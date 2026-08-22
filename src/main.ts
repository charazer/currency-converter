import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'

import App from './App.vue'
import { createAppQueryClient, persistQueryCache } from './lib/queryClient'
import './styles/tokens.css'
import './styles/base.css'

const queryClient = createAppQueryClient()
persistQueryCache(queryClient)

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#app')
