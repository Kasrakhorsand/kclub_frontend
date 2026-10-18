// PM2 config (alternative to Docker). Run after `npm run build`:
//   pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "kclub-web",
      script: ".next/standalone/server.js",
      env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "127.0.0.1" },
      max_memory_restart: "512M",
    },
  ],
};
