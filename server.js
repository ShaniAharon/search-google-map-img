import express from 'express'
import cors from 'cors'
import cron from 'node-cron';
import axios from 'axios';
import dotenv from "dotenv"; //import the dotenv

dotenv.config(); // add the config


import { loggerService } from './services/logger.service.js';
import { searchGoogleMaps } from './services/scrap.service.js';

const app = express()


// App Configuration
const corsOptions = {
    origin: [
        '*',
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.json()) // for req.body



app.post('/search-img', async (req, res) => {
    const { query } = req.body;
    console.log('query', query)
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const result = await searchGoogleMaps(query);
        res.json(result);
    } catch (error) {
        console.error('Error handling /search request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/wake-up', (req, res) => {
    console.log('Service is awake and working');
    res.send('Service is awake and working');
});

// Wake-up task to keep the service active
cron.schedule('*/13 * * * *', async () => {
    try {
        console.log('Wake-up task running');
        await axios.get(`https://search-google-map-img.onrender.com/wake-up`);
    } catch (error) {
        console.error('Error during wake-up task:', error);
    }
});


//TODO: add this line 
const port = process.env.PORT || 3060
app.listen(port, () => {
    loggerService.info(`Server listening on port http://127.0.0.1:${port}/`)
})