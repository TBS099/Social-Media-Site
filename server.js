// server.mjs
import express from 'express';

const app = express();
const PORT = 5000; // Using port 5000
const STUDENT_ID = 'YOUR-ID'; // Student ID, just for requirement, use home if needed

// Redirect from the root URL to ID
app.get('/', (req, res) => {
    res.redirect(`/${STUDENT_ID}/`);
});

// Middleware to serve static files from the 'public' directory under ID
app.use(`/${STUDENT_ID}`, express.static('public'));

// Basic route for the home page
app.get(`/${STUDENT_ID}/`, (req, res) => {
    res.send('Hello, world! This is my web app.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/${STUDENT_ID}/`);
});
