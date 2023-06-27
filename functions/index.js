import functions from "firebase-functions";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get('/test', (req, res) => { 
  res.send('You did it! 🥳'); 
});

export const api = functions.https.onRequest(app);
