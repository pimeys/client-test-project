import { GraphQLClient, gql } from 'graphql-request'

export type BlogNode = {
  id: string
  name: string
  owner: UserNode
  createdAt: Date
  updatedAt: Date
}

export type UserNode = {
  id: string
  name: string
  address: AddressNode | null
  addresses: AddressNode[]
  blogs: { edges: { node: BlogNode }} | null
  createdAt: Date
  updatedAt: Date
}

export type AddressSelect = {
  street?: boolean | null
}

export interface RelationManySelect<T, U extends Record<string, null | boolean | object>> {
  after?: string
  before?: string
  first?: number
  last?: number
  orderBy?: T
  fields: U
}

export type BlogSelect = {
  id?: boolean | null
  name?: boolean | null
  owner?: UserSelect | null
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

export type UserSelect = {
  id?: boolean | null
  name?: boolean | null
  address?: AddressSelect | null
  addresses?: AddressSelect | null
  blogs?: BlogCollectionInput<BlogSelect>,
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

export type AddressNode = {
  street: string
}

export interface BlogOrderByInput {
  createdAt: OrderByDirection
}

export interface UserOrderByInput {
  createdAt: OrderByDirection
}

export type SelectSubset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
}

export interface CollectionInput<T, U> {
  args: CollectionArgs<T>
  fields: CollectionSelect<U>
}

export type UserCollectionInput<T> = {
  args: CollectionArgs<UserOrderByInput>
  fields: { edges: { node: SelectSubset<T, UserSelect> } }
}

export type BlogCollectionInput<T> = {
  args: CollectionArgs<BlogOrderByInput>
  fields: { edges: { node: SelectSubset<T, BlogSelect> } }
}

export type FetchInput<T, U extends object> = {
  by: Record<string, any>,
  fields: SelectSubset<T, U>
}

export type UserFetchInput<T> = {
  by: { id: string },
  fields: SelectSubset<T, UserSelect>
}

export type TruthyKeys<T> = keyof {
  [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
}

export type AddressFetchPayload<S extends AddressSelect | null | undefined> = {
  [P in TruthyKeys<S>]: P extends keyof AddressNode ? AddressNode[P] : never
}

export type BlogFetchPayload<S extends BlogSelect | null | undefined> =
  S extends BlogSelect ? {
    [P in TruthyKeys<S>]:
      P extends 'owner' ? UserFetchPayload<S[P]> :
      P extends keyof UserNode ? UserNode[P] : never
  } : never

export type UserFetchPayload<S extends UserSelect | null | undefined> =
  S extends UserSelect ? {
    [P in TruthyKeys<S>]:
      P extends 'address' ? AddressFetchPayload<S[P]> | null :
      P extends 'addresses' ? Array<AddressFetchPayload<S[P]>> :
      P extends keyof UserNode ? UserNode[P] : never
  } : never

export type Edge<T> = {
  node: T
}

export type CollectionResponse<T> = {
  edges: Edge<T>[]
}

export interface CollectionSelect<T> {
  edges: Edge<T>
}

export type OrderByDirection = 'ASC' | 'DESC'

export interface CollectionArgs<T> {
  after?: string
  before?: string
  first?: number
  last?: number
  orderBy?: T
}

function filterSelection(val: object | boolean): boolean {
  if (typeof val === 'object') {
    const filtered = Object
      .entries(val)
      .filter(([_, val]) => filterSelection(val))

    return filtered.length > 0
  } else {
    return val
  }
}

function renderSelection(key: string, val: object | boolean): string {
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

export class CollectionQuery<T, U extends object> {
  collection: string
  input: CollectionInput<T, U>

  constructor(collection: string, input: CollectionInput<T, U>) {
    this.input = input
    this.collection = collection
  }

  public toString(): string {
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

export class Query<T, U extends object> {
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
      .filter(([_, val]) => filterSelection(val as object | boolean))
      .map(([key, val]) => renderSelection(key, val as object | boolean))
      .join(' ')

    return gql`
      query ${this.queryName}(${params}) {
        ${this.collection}(by: { ${filter} }) { ${select} }
      }
    `
  }
}

export class GrafbaseClient {
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

  public async blogCollection<T extends BlogSelect>(
    request: BlogCollectionInput<T>
  ): Promise<CollectionResponse<BlogFetchPayload<T>>> {
    const query = new CollectionQuery('blogCollection', request)
    const result = await this.request(query.toString())

    return result['blogCollection']
  }
}

