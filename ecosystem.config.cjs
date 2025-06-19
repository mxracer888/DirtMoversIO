module.exports = {
  apps: [{
    name: 'dirtmovers',
    script: 'dist/index.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/dirtmovers-error.log',
    out_file: './logs/dirtmovers-out.log',
    log_file: './logs/dirtmovers.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};