import { GraphQLClient, gql } from 'graphql-request'

type UserNode = {
  id: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

type UserSelect = {
  id?: boolean | null
  name?: boolean | null
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

interface UserOrderByInput {
  createdAt: OrderByDirection
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

interface CollectionInput<T, U> {
  args: CollectionArgs<T>
  fields: CollectionSelect<U>
}

class CollectionQuery<T, U extends object> {
  collection: string
  input: CollectionInput<T, U>

  constructor(collection: string, input: CollectionInput<T, U>) {
    this.input = input
    this.collection = collection
  }

  public toString(): string {
    var params = Object
      .entries(this.input.args)
      .filter(([_, val]) => val)
      .map(([key, val]) => `${key}: ${val}`)
      .join(',')

    var select = Object
      .entries(this.input.fields.edges.node)
      .filter(([_, val]) => val)
      .map(([key, _]) => `${key}`)
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

export type SelectSubset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
}

type UserCollectionArgs<T> = {
  args: CollectionArgs<UserOrderByInput>
  fields: { edges: { node: SelectSubset<T, UserSelect> } }
}

export type TruthyKeys<T> = keyof {
  [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
}

export type UserFetchPayload<S extends boolean | null | undefined | UserSelect> = {
  [P in TruthyKeys<S>]: P extends keyof UserNode ? UserNode[P] : never
}

class GrafbaseClient {
  conn: GraphQLClient

  constructor(endpoint: string, apiKey: string) {
    this.conn = new GraphQLClient(endpoint, {
      headers: {
        'x-api-key': apiKey
      }
    })
  }

  async request(query: string): Promise<any> {
    return await this.conn.request(query)
  }

  public async userCollection<T extends UserSelect>(
    request: UserCollectionArgs<T>
  ): Promise<CollectionResponse<UserFetchPayload<T>>> {
    const query = new CollectionQuery('userCollection', request)
    const result = await this.request(query.toString())

    return result['userCollection']
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
          createdAt: true,
          updatedAt: true
        }
      }
    }
  })

  console.log(result.edges[0].node.id)
  console.log(JSON.stringify(result, null, 2))
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})