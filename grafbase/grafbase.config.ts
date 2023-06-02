import { g, config } from '@grafbase/sdk'

g.model('User', {
  name: g.string()
})

export default config({
  schema: g
})
