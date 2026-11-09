import app from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
  console.log(
    `Midtrans ${config.midtrans.isProduction ? 'production' : 'sandbox'} configuration: ${
      config.midtrans.serverKey && config.midtrans.clientKey ? 'ready' : 'incomplete'
    }`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
