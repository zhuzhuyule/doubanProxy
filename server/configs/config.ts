import customerConfig from './customer.config';
export default {
  port: process.env.SERVER_PORT || 3000,
  env: '',
  mongo: {
    host: process.env.MONGODB_HOST || 'mongodb://127.0.0.1/douban',
    port: process.env.MONGODB_PORT || 27017,
    isDebug: false,
  },
  ...customerConfig
}
