// PM2 — gerenciador de processo para a VPS
// Instale: npm install -g pm2
// Inicie:  pm2 start ecosystem.config.js
// Salve:   pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'secretaria-dental',
      cwd: './webapp',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_local: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
