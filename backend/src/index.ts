// FIX: Use standard ES module 'import' syntax for Express to ensure proper type resolution.
// FIX: Using a default import for express and referencing types via the namespace (e.g., express.Request) resolves type ambiguity issues with CommonJS modules.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse JSON bodies

// Health check route
// FIX: Use Request and Response types imported from express to ensure correct types.
// FIX: Use express.Request and express.Response to ensure correct types are resolved from the express module.
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', message: 'Backend is running!' });
});

// --- FUTURE API ENDPOINTS WILL GO HERE ---

// Start the server
app.listen(port, () => {
    console.log(`🚀 Backend server is listening on http://localhost:${port}`);
});