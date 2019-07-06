const { ApolloServer, gql } = require('apollo-server')
const { QUOTES } = require('./quotes')

const typeDefs = gql`
  # This "Quote" type can be used in other type declarations.
  type Quote {
    quote: String
    id: ID
  }

  # The "Query" type is the root of all GraphQL queries.
  type Query {
    randomQuote: Quote
  }
`

const resolvers = {
  Query: {
    randomQuote: () => {
      // Get a random index
      const randomNumber = Math.floor(Math.random() * QUOTES.length)
      return QUOTES[randomNumber]
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
