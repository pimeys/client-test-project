import { GraphQLClient, gql } from 'graphql-request'

// A full type we return per single blog
export interface BlogNode {
  id: string
  name: string
  owner: UserNode
  createdAt: Date
  updatedAt: Date
}

// A full type we return per multiple blogs
export interface BlogEdges {
  edges: Edge<BlogNode>[]
}

// A full type we return per single user
export interface UserNode {
  id: string
  name: string
  address: AddressNode | null
  addresses: AddressNode[]
  blogs: BlogEdges | null
  createdAt: Date
  updatedAt: Date
}

// Type for selecting a single address
export interface AddressSelect {
  street?: boolean | null
}

// Interface for a relation select from the many side
export interface RelationManySelect<
  T,
  U extends Record<string, null | boolean | object>
> {
  after?: string
  before?: string
  first?: number
  last?: number
  orderBy?: T
  fields: U
}

// Interface for selecting a blog
export interface BlogSelect {
  id?: boolean | null
  name?: boolean | null
  owner?: UserSelect | null
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

// Interface for selecting a collection of blogs
export interface BlogCollectionSelect {
  fields: { edges: { node: BlogSelect } }
  args: CollectionArgs<BlogOrderByInput>
}

// Interface for selecting a user
export interface UserSelect {
  id?: boolean | null
  name?: boolean | null
  address?: AddressSelect | null
  addresses?: AddressSelect | null
  blogs?: BlogCollectionInput<BlogSelect>
  createdAt?: boolean | null
  updatedAt?: boolean | null
}

// A full return type of an address
export interface AddressNode {
  street: string
}

// Possible fields we can use to order a blog collection
export interface BlogOrderByInput {
  createdAt: OrderByDirection
}

// Possible fields we can use to order a user collection
export interface UserOrderByInput {
  createdAt: OrderByDirection
}

// A subset selection, defining the fields of the return type.
export type SelectSubset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
}

// Generic input type to fetch a collection
export interface CollectionInput<T, U> {
  args: CollectionArgs<T>
  fields: CollectionSelect<U>
}

// Output type for returing a collection of users with
// fields from the selection.
export interface UserCollectionEdges<T> {
  edges: { node: SelectSubset<T, UserSelect> }
}

// Input to fetch a collection of users
export interface UserCollectionInput<T> {
  args: CollectionArgs<UserOrderByInput>
  fields: UserCollectionEdges<T>
}

// Input type for selecting a collection of blogs.
export interface BlogCollectionEdges<T> {
  edges: { node: SelectSubset<T, BlogSelect> }
}

// Input to fetch a collection of blogs
export interface BlogCollectionInput<T> {
  args: CollectionArgs<BlogOrderByInput>
  fields: BlogCollectionEdges<T>
}

// A generic input type to fetch one document
export interface FetchInput<T, U extends object> {
  by: Record<string, any>
  fields: SelectSubset<T, U>
}

// A generic input type to fetch one blog
export interface BlogFetchInput<T> {
  by: { id: string }
  fields: SelectSubset<T, BlogSelect>
}

// A generic input type to fetch one user
export interface UserFetchInput<T> {
  by: { id: string }
  fields: SelectSubset<T, UserSelect>
}

// This type allows us to iterate all truethy values of an object for selection.
export type TruthyKeys<T> = keyof {
  [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
}

// Payload to return a subset of fields of an address.
export type AddressFetchPayload<S extends AddressSelect | null | undefined> = {
  [P in TruthyKeys<S>]: P extends keyof AddressNode ? AddressNode[P] : never
}

// Payload to return a subset of fields of a blog.
export type BlogFetchPayload<S extends BlogSelect | null | undefined> =
  S extends BlogSelect
    ? {
        [P in TruthyKeys<S>]: P extends 'owner'
          ? UserFetchPayload<S[P]>
          : P extends keyof BlogNode
          ? BlogNode[P]
          : never
      }
    : never

// Payload to return a subset of fields of collection of blogs.
export type BlogCollectionFetchPayload<
  S extends BlogCollectionSelect | null | undefined
> = S extends BlogCollectionSelect
  ? { edges: { node: BlogFetchPayload<S['fields']['edges']['node']> }[] }
  : never

// Payload to return a subset of fields of a user.
export type UserFetchPayload<S extends UserSelect | null | undefined> =
  S extends UserSelect
    ? {
        [P in TruthyKeys<S>]: P extends 'blogs'
          ? BlogCollectionFetchPayload<S[P]> | null
          : P extends 'address'
          ? AddressFetchPayload<S[P]> | null
          : P extends 'addresses'
          ? Array<AddressFetchPayload<S[P]>>
          : P extends keyof UserNode
          ? UserNode[P]
          : never
      }
    : never

export interface Edge<T> {
  node: T
}

export interface CollectionResponse<T> {
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

// True, if the value is true or a nested object has a true value
function filterSelection(val: object | boolean): boolean {
  if (typeof val === 'object') {
    const filtered = Object.entries(val).filter(([_, val]) =>
      filterSelection(val)
    )

    return filtered.length > 0
  } else {
    return val
  }
}

// Render a selection for a value.
function renderSelection(
  key: string,
  val: object | boolean,
  args?: RelationManySelect<any, any>
): string {
  if (typeof val === 'object') {
    const inner = Object.entries(val)
      .map(([key, val]) => renderSelection(key, val))
      .join(' ')

    if (args) {
      const renderedArgs = Object.entries(args)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

      return `${key}(${renderedArgs}) { ${inner} }`
    } else {
      return `${key} { ${inner} }`
    }
  } else {
    return key
  }
}

// Query collections with this.
export class CollectionQuery<T, U extends object> {
  collection: string
  input: CollectionInput<T, U>
  relationLists: Set<string>

  constructor(
    collection: string,
    input: CollectionInput<T, U>,
    relationLists: Set<string>
  ) {
    this.input = input
    this.collection = collection
    this.relationLists = relationLists
  }

  public toString(): string {
    const params = Object.entries(this.input.args)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ')

    const select = Object.entries(this.input.fields.edges.node)
      .filter(([key, val]) => {
        const value = this.relationLists.has(key) ? val['fields'] : val

        return filterSelection(value)
      })
      .map(([key, val]) => {
        if (this.relationLists.has(key)) {
          return renderSelection(key, val['fields'], val['args'])
        } else {
          return renderSelection(key, val)
        }
      })
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

// Query single documents with this.
export class Query<T, U extends object> {
  collection: string
  queryName: string
  input: FetchInput<T, U>
  // This here holds the type info of the input for parameterization.
  typeInfo: Record<string, string>
  // Relation lists are handled in a specific way, so we need to store them here.
  // todo: not yet in use
  relationLists: Set<string>

  constructor(
    collection: string,
    queryName: string,
    input: FetchInput<T, U>,
    typeInfo: Record<string, string>,
    relationLists: Set<string>
  ) {
    this.collection = collection
    this.queryName = queryName
    this.input = input
    this.typeInfo = typeInfo
    this.relationLists = relationLists
  }

  public toString(): string {
    const params = Object.entries(this.input.by)
      .map(([key, _]) => `$${key}: ${this.typeInfo[key]}`)
      .join(', ')

    const filter = Object.entries(this.input.by)
      .map(([key, _]) => `${key}: $${key}`)
      .join(', ')

    const select = Object.entries(this.input.fields)
      .filter(([key, val]: [string, any]) => {
        return filterSelection(
          this.relationLists.has(key) ? val['fields'] : val
        )
      })
      .map(([key, val]: [string, any]) => {
        if (this.relationLists.has(key)) {
          return renderSelection(key, val['fields'], val['args'])
        } else {
          return renderSelection(key, val)
        }
      })
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
  relationCollections: Record<string, Set<string>>

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
        address: 'Address',
        addresses: '[Address!]!',
        blogs: '[Blog!]',
        createdAt: 'DateTime!',
        updatedAt: 'DateTime!'
      },
      blog: {
        id: 'ID!',
        name: 'String!',
        owner: 'User!',
        createdAt: 'DateTime!',
        updatedAt: 'DateTime!'
      }
    }

    this.relationCollections = {
      user: new Set(['blogs']),
      blog: new Set()
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
    const query = new CollectionQuery(
      'userCollection',
      request,
      this.relationCollections['user']
    )
    const result = await this.request(query.toString())

    return result['userCollection']
  }

  public async user<T extends UserSelect>(
    request: UserFetchInput<T>
  ): Promise<UserFetchPayload<T> | null> {
    const query = new Query(
      'user',
      'getUser',
      request,
      this.typeInfo['user'],
      this.relationCollections['user']
    )

    const result = await this.request(query.toString(), request.by)

    return result['user']
  }

  public async blogCollection<T extends BlogSelect>(
    request: BlogCollectionInput<T>
  ): Promise<CollectionResponse<BlogFetchPayload<T>>> {
    const query = new CollectionQuery(
      'blogCollection',
      request,
      this.relationCollections['blog']
    )
    const result = await this.request(query.toString())

    return result['blogCollection']
  }

  public async blog<T extends BlogSelect>(
    request: BlogFetchInput<T>
  ): Promise<BlogFetchPayload<T> | null> {
    const query = new Query(
      'blog',
      'getBlog',
      request,
      this.typeInfo['blog'],
      this.relationCollections['blog']
    )

    const result = await this.request(query.toString(), request.by)

    return result['user']
  }
}
