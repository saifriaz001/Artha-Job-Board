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

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

connectMongo();

app.use("/api", indexRoutes);

app.use("/",(req, res)=>{
   res.send("API is working properly");
})

app.listen(PORT , ()=>{
    console.log(`App is running on this port ${PORT}`);
})