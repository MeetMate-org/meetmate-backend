export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGO_URI,
  },
  debug: process.env.DEBUG === 'true',
});