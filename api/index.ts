import { createExpressApp } from "../server/app";
import { initDatabase } from "../server/database/connection";

// Initialize database
initDatabase();

// Create Express App instance
const app = createExpressApp();

// Export as Vercel / serverless default handler
export default app;
