const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/dev'
      },
    })
  );
};
