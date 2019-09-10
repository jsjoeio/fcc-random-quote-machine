const { ApolloServer, gql } = require('apollo-server')
const { QUOTES } = require('./quotes')
const {
  extractBearerToken,
  hasRoleDirective,
  isAuthenticatedDirective,
  makeOneGraphJwtVerifier
} = require('./oneGraphHelper')

const typeDefs = gql`
  ## These two custom directives are implemented by the
  ## onegraph-apollo-server-auth package
  directive @isAuthenticated on QUERY | FIELD_DEFINITION
  directive @hasRole(oneOf: [String!]) on QUERY | OBJECT | FIELD_DEFINITION
  # This "Quote" type can be used in other type declarations.
  type Quote {
    quote: String
    id: ID
  }

  # The "Query" type is the root of all GraphQL queries.
  type Query @hasRole(oneOf: ["contributor"]){
    randomQuote: Quote
  }
`

const resolvers = {
  Query: {
    randomQuote: ctx => {
      // Get a random index
      const randomNumber = Math.floor(Math.random() * QUOTES.length)
      return QUOTES[randomNumber]
    }
  }
}

const verifyJwt = makeOneGraphJwtVerifier(
  'e36d0159-7794-4374-afd9-55c90fc29d32',
  {}
)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    isAuthenticated: isAuthenticatedDirective,
    hasRole: hasRoleDirective
  },
  context: async incoming => {
    // Anything else you'd like in the resolver context goes here.
    let context = {}

    // Extract the JWT using OneGraph's helper function
    const token = extractBearerToken(incoming.req)

    if (!token) {
      return { ...context, jwt: null }
    }

    // If we have a token, try to decode and verify it using either
    // public/private or shared-secret, depending on the preference
    // stored in the JWT. If we fail, discard the token and return
    // a mostly-empty context
    try {
      const decoded = await verifyJwt(token).catch(rejection =>
        console.warn(`JWT verification failed: `, rejection)
      )
      return { ...context, jwt: decoded }
    } catch (rejection) {
      console.warn(rejection)
      return { ...context, jwt: null }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
