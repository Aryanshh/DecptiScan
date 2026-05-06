module.exports = {
  apps: [
    {
      name: 'deceptiscan-app',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'deceptiscan-ml',
      script: 'ml_service.py',
      interpreter: 'python3',
      env: {
        PORT: 8000
      }
    }
  ]
};
