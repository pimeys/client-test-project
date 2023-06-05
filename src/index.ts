import { GraphQLClient, gql } from 'graphql-request'

type UserNode = {
  id: string
  name: string | null
  address: AddressType | null
  createdAt: Date
  updatedAt: Date
}

type AddressSelect = {
  street?: boolean | null
}

type UserSelect = {
  id?: boolean | null
  name?: boolean | null
  address?: AddressSelect | null
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

type AddressType = {
  street: string
}

interface UserOrderByInput {
  createdAt: OrderByDirection
}

export type SelectSubset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
}

interface CollectionInput<T, U> {
  args: CollectionArgs<T>
  fields: CollectionSelect<U>
}

type UserCollectionInput<T> = {
  args: CollectionArgs<UserOrderByInput>
  fields: { edges: { node: SelectSubset<T, UserSelect> } }
}

type FetchInput<T, U extends object> = {
  by: Record<string, any>,
  fields: SelectSubset<T, U>
}

type UserFetchInput<T> = {
  by: { id: string },
  fields: SelectSubset<T, UserSelect>
}

type TruthyKeys<T> = keyof {
  [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
}

type AddressFetchPayload<S extends AddressSelect | null | undefined> = {
  [P in TruthyKeys<S>]: P extends keyof AddressType ? AddressType[P] : never
}

type UserFetchPayload<S extends UserSelect> = {
  [P in TruthyKeys<S>]: P extends 'address' ? AddressFetchPayload<S[P]> | null : P extends keyof UserNode ? UserNode[P] : never
}

type Edge<T> = {
  node: T
}

type CollectionResponse<T> = {
  edges: Edge<T>[]
}

interface CollectionSelect<T> {
  edges: Edge<T>
}

type OrderByDirection = 'ASC' | 'DESC'

interface CollectionArgs<T> {
  after?: string
  before?: string
  first?: number
  last?: number
  orderBy?: T
}

class CollectionQuery<T, U extends object> {
  collection: string
  input: CollectionInput<T, U>

  constructor(collection: string, input: CollectionInput<T, U>) {
    this.input = input
    this.collection = collection
  }

  public toString(): string {
    const filterSelection = (val: object | boolean): boolean => {
      if (typeof val === 'object') {
        const filtered = Object
          .entries(val)
          .filter(([_, val]) => filterSelection(val))

        return filtered.length > 0
      } else {
        return val
      }
    }

    const renderSelection = (key: string, val: object | boolean): string => {
      if (typeof val === 'object') {
        const inner = Object
          .entries(val)
          .map(([key, val]) => renderSelection(key, val))
          .join(' ')

        return `${key} { ${inner} }`
      } else {
        return key
      }
    }

    const params = Object
      .entries(this.input.args)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ')

    const select = Object
      .entries(this.input.fields.edges.node)
      .filter(([_, val]) => filterSelection(val))
      .map(([key, val]) => renderSelection(key, val))
      .join(' ')

    return gql`
      query {
        ${this.collection}(${params}) {
          edges {
            node { ${select} }
          }
        }
      }
    `
  }
}

class Query<T, U extends object> {
  collection: string
  queryName: string
  input: FetchInput<T, U>
  typeInfo: Record<string, string>

  constructor(
    collection: string,
    queryName: string,
    input: FetchInput<T, U>,
    typeInfo: Record<string, string>
  ) {
    this.collection = collection
    this.queryName = queryName
    this.input = input
    this.typeInfo = typeInfo
  }

  public toString(): string {
    const params = Object
      .entries(this.input.by)
      .map(([key, _]) => `$${key}: ${this.typeInfo[key]}`)
      .join(', ')

    const filter = Object
      .entries(this.input.by)
      .map(([key, _]) => `${key}: $${key}`)
      .join(', ')

    const select = Object
      .entries(this.input.fields)
      .filter(([_, val]) => val)
      .map(([key, _]) => `${key}`)
      .join(' ')

    return gql`
      query ${this.queryName}(${params}) {
        ${this.collection}(by: { ${filter} }) { ${select} }
      }
    `
  }
}

class GrafbaseClient {
  conn: GraphQLClient
  typeInfo: Record<string, Record<string, string>>

  constructor(endpoint: string, apiKey: string) {
    this.conn = new GraphQLClient(endpoint, {
      headers: {
        'x-api-key': apiKey
      }
    })

    this.typeInfo = {
      user: {
        id: 'ID!',
        name: 'String!',
        createdAt: 'DateTime!',
        updatedAt: 'DateTime'
      }
    }
  }

  async request(query: string, params?: Record<string, any>): Promise<any> {
    if (params) {
      return await this.conn.request(query, params)
    } else {
      return await this.conn.request(query)
    }
  }

  public async userCollection<T extends UserSelect>(
    request: UserCollectionInput<T>
  ): Promise<CollectionResponse<UserFetchPayload<T>>> {
    const query = new CollectionQuery('userCollection', request)
    const result = await this.request(query.toString())

    return result['userCollection']
  }

  public async user<T extends UserSelect>(
    request: UserFetchInput<T>
  ): Promise<UserFetchPayload<T>> {
    const query = new Query('user', 'getUser', request, this.typeInfo['user'])
    const result = await this.request(query.toString(), request.by)

    return result['user']
  }
}

const client = new GrafbaseClient('http://127.0.0.1:4000/graphql', '')

async function main() {
  const result = await client.userCollection({
    args: {
      first: 10
    },
    fields: {
      edges: {
        node: {
          id: true,
          name: true,
          address: { 
            street: true
          },
          createdAt: true,
          updatedAt: true
        }
      }
    }
  })

  // console.log(result.edges[0].node.id)
  // console.log(result.edges[0].node.address?.street)
  console.log(JSON.stringify(result, null, 2))

  // const result2 = await client.user({
  //   by: { id: 'user_01H1XQY17SPBCJMEXRN48PDQB9' },
  //   fields: {
  //     id: true,
  //     name: true,
  //     createdAt: true,
  //     updatedAt: true
  //   }
  // })

  // console.log(result2.id)
  // console.log(JSON.stringify(result2, null, 2))
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})