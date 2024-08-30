import express from "express";
import { config as configDotenv } from 'dotenv';
import userRouter from "./userRoutes.js";
configDotenv();
const app = express();
const PORT = process.env.PORT;
app.use(express.json());

app.use("/",userRouter )


app.listen(3000, () => {
  console.log(`Listening on port ${PORT}`);
});
