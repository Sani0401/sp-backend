// userRouter.js
import express from 'express';
import { services } from './Services.js';
const userRouter = express.Router();

userRouter.post('/upload', services.uploadFile);
userRouter.get('/status/:requestID', services.checkStatus); 
userRouter.post('/webhook', services.webhookController)

export default userRouter;
