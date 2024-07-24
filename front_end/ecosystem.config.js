module.exports = {
  apps: [
    {
      name: 'front_end',
      script: 'node_modules/react-scripts/scripts/start.js',
      cwd: '/root/Kasta/front_end',
      watch: true,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};