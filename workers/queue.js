// /worker/queue.js
import Bull from 'bull';
import Redis from 'ioredis';

// Create a Bull queue
const redisClient = new Redis(process.env.REDIS_URL); // Adjust based on your Redis setup
const imageQueue = new Bull('image-processing', {
    redis: redisClient
});

export default imageQueue;
