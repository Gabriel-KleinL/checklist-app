module.exports = {
  apps: [
    {
      name: 'checklist-backend',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8001
      },
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart configuration
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Advanced features
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
