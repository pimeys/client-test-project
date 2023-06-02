async function main() {
  console.log('Hello world')
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})