import express from 'express';
import cors from 'cors';
import router from './src/routes/router.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use('/users', router);
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});