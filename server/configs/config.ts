import customerConfig from './customer.config';

export default {
  port: 3000,
  env: '',
  mongo: {
    uri: `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/douban`,
    isDebug: false,
  },
  ...customerConfig
}
