import { g, config } from '@grafbase/sdk'
import { address } from './config/customer'

g.model('User', {
  name: g.string(),
  address: g.ref(address).optional()
})

export default config({
  schema: g
})
