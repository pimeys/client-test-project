import { GrafbaseClient } from "./generated"

const client = new GrafbaseClient('http://127.0.0.1:4000/graphql', '')

async function main() {
  const result = await client.blogCollection({
    args: {
      first: 10
    },
    fields: {
      edges: {
        node: {
          id: true,
          name: true,
          owner: {
            id: true,
            name: true
          }
        }
      }
    }
  })

  console.log(result.edges[0].node.owner.id)
  console.log(result.edges[0].node.owner.name)
  console.log(JSON.stringify(result, null, 2))

  // const result2 = await client.userCollection({
  //   args: {
  //     first: 10
  //   },
  //   fields: {
  //     edges: {
  //       node: {
  //         id: true,
  //         name: true,
  //         address: { 
  //           street: true
  //         },
  //         addresses: {
  //           street: true
  //         },
  //         blogs: {
  //           args: {
  //             first: 10
  //           },
  //           fields: {
  //             edges: {
  //               node: {
  //                 id: true,
  //                 name: true
  //               }
  //             }
  //           }
  //         },
  //         createdAt: true,
  //         updatedAt: true
  //       }
  //     }
  //   }
  // })

  // console.log(JSON.stringify(result2, null, 2))

  // const result2 = await client.user({
  //   by: { id: 'user_01H260X6QQRAQJDRZPFS5JH57W' },
  //   fields: {
  //     id: true,
  //     name: true,
  //     address: { 
  //       street: true
  //     },
  //     createdAt: true,
  //     updatedAt: true
  //   }
  // })

  // console.log(result2.id)
  // console.log(result2.address?.street)
  // console.log(JSON.stringify(result2, null, 2))
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})