export default {
  proxy: {
    phone: '',
    password: '',
    packageNum: '',
    defaultToken: '',
    whitelistUrl:
      '',
  },
  freeProxy: {
    baseUrl: `http://${process.env.FREE_PROXY_HOST || 'localhost'}:${process.env.FREE_PROXY_PORT || 5010}`,
  },
};
