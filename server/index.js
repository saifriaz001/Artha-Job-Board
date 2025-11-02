import express from "express";
import dotenv, { configDotenv } from "dotenv";
configDotenv();
import cors from "cors";
import helmet from "helmet";
import {connectMongo} from "./src/config/db.js";
import indexRoutes from "./src/routes/index.js";
import "./src/cron/hourlyImport.cron.js";

const app = express();

const PORT  = process.env.PORT || 3000;

const allowedOrigins = [
  "https://artha-job-board-ruby.vercel.app",                       // main production site
  "https://artha-job-board-git-main-saifriaz001s-projects.vercel.app", // Vercel preview link
  "https://artha-job-board-engu9560o-saifriaz001s-projects.vercel.app", // another preview link
  "http://localhost:3000", // local dev (optional)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or Postman) or listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

connectMongo();

app.use("/api", indexRoutes);

app.use("/",(req, res)=>{
   res.send("API is working properly");
})

app.listen(PORT , ()=>{
    console.log(`App is running on this port ${PORT}`);
})