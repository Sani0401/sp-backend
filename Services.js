import uploadFile from "./controllers/uploadController.js"
import checkStatus from "./controllers/checkStatus.js";
import webhookController from "./controllers/webhookController.js";
export const services = {
    uploadFile,
    checkStatus,
    webhookController
}