import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeRealtime } from './realtime/socket.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initializeRealtime(server);

  server.listen(PORT, () => {
    // Base server ready; funcionalidad de negocio se agregara despues.
    console.log(`Medical system server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Unable to start server:', error);
  process.exit(1);
});
