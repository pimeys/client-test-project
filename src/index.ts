import { GrafbaseClient } from "./generated";

const client = new GrafbaseClient("http://127.0.0.1:4000/graphql", "");

// play around with the selection. by removing a field from the selection, it's
// not in the return type anymore and you should get a compilation error.
async function main() {
  const result = await client.blogCollection({
    args: {
      first: 10,
    },
    fields: {
      edges: {
        node: {
          id: true,
          name: true,
          owner: {
            id: true,
            name: true,
          },
        },
      },
    },
  });

  console.log(result.edges[0].node.owner.id);
  console.log(result.edges[0].node.owner.name);
  console.log(JSON.stringify(result, null, 2));

  const result2 = await client.userCollection({
    args: {
      first: 10,
    },
    fields: {
      edges: {
        node: {
          id: true,
          name: true,
          address: {
            street: true,
          },
          addresses: {
            street: true,
          },
          blogs: {
            args: {
              first: 10,
            },
            fields: {
              edges: {
                node: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  console.log(result2.edges[0].node.blogs?.edges[0].node.id);
  console.log(JSON.stringify(result2, null, 2));

  const result3 = await client.user({
    by: { id: "user_01H264P7DZCN4ADZHM9EHH1F0G" },
    fields: {
      id: true,
      name: true,
      address: {
        street: true,
      },
      blogs: {
        args: {
          first: 10,
        },
        fields: {
          edges: {
            node: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(JSON.stringify(result3, null, 2));
  console.log(result3?.id);
  console.log(result3?.address?.street);
  console.log(result3?.blogs?.edges[0].node.name)
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
