module.exports = {
  apps: [
    {
      name: 'malikina-api',
      script: 'dist/api/server.js',
      node_args: '--env-file=/var/www/malikina-api/api/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
    },
  ],
};
