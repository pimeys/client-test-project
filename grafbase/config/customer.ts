import { g } from '@grafbase/sdk'

export const address = g.type('Address', {
  street: g.string()
})
