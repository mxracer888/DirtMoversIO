module.exports = {
  apps: [{
    name: 'dirtmovers',
    script: 'server/index.js',
    cwd: '/home/pi/DirtMoversIO',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/dirtmovers-error.log',
    out_file: '/var/log/pm2/dirtmovers-out.log',
    log_file: '/var/log/pm2/dirtmovers.log',
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