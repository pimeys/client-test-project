import { g, config } from '@grafbase/sdk'
import { address } from './config/customer'

const user = g.model('User', {
  name: g.string(),
  address: g.ref(address).optional(),
  addresses: g.ref(address).list(),
  blogs: g.relation(() => blog).list().optional()
})

const blog = g.model('Blog', {
  name: g.string(),
  owner: g.relation(user)
})

export default config({
  schema: g
})
