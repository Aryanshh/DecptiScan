module.exports = {
  apps: [
    {
      name: 'deceptiscan-app',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      node_args: '--max-old-space-size=400'
    }
  ]
};
