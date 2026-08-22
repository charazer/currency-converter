import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'

import App from './App.vue'
import { createAppQueryClient, persistQueryCache } from './lib/queryClient'
import './styles/tokens.css'
import './styles/base.css'

const queryClient = createAppQueryClient()

// Mount only once the persisted cache is back, otherwise the first fetch races the restore and an
// offline load ends up showing an error instead of the last known rates.
void persistQueryCache(queryClient).then(() => {
  createApp(App).use(VueQueryPlugin, { queryClient }).mount('#app')
})
