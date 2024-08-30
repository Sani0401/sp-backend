import Bull from 'bull';
import axios from 'axios';
import sharp from 'sharp';
import supabase from '../Config/supabaseConfig.js';

const imageQueue = new Bull('image-processing', {
    redis: {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || '127.0.0.1',
    }
});

imageQueue.process(async (job) => {
    const { requestID, results } = job.data; // Extract requestID and results from job data

    for (const { srNo, product, inputImageUrl } of results) {
        const outputImageUrls = []; // Initialize an array to store processed image URLs for this record

        for (const url of inputImageUrl) {
            try {
                const filename = url.split('/').pop(); // Extract the filename from the URL
                const imageResponse = await axios.get(url, { responseType: 'arraybuffer' }); // Download the image
                const compressedImage = await sharp(imageResponse.data) // Compress the image using sharp
                    .jpeg({ quality: 50 })
                    .toBuffer();

                // Construct the storage path: `requestID/srNo/images/filename`
                const storagePath = `${requestID}/${srNo}/${filename}`;

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('spyneAssesment')
                    .upload(storagePath, compressedImage, {
                        contentType: 'image/jpeg',
                    });

                if (uploadError) {
                    console.error('Error uploading image to Supabase storage:', uploadError);
                    continue; // Skip to the next image if upload fails
                }

                const publicUrl = supabase
                    .storage
                    .from('spyneAssesment')
                    .getPublicUrl(uploadData.path)
                    .data.publicUrl; // Get the public URL of the uploaded image

                outputImageUrls.push(publicUrl); // Add the public URL to the outputImageUrls array
            } catch (imageError) {
                console.error('Error processing image:', imageError); // Log any errors during image processing
            }
        }

        // Update the fileData table with processed image URLs
        try {
            const { error: updateError } = await supabase
                .from('fileData')
                .update({ output_image_url: outputImageUrls })
                .eq('requestId', requestID)
                .eq('sr_no', srNo);

            if (updateError) {
                console.error('Error updating fileData table with processed image URLs:', updateError);
            }
        } catch (updateError) {
            console.error('Error during fileData update:', updateError);
        }
    }

    // After processing all rows, update the fileStatus table to mark processing as complete
    try {
        const { error: statusUpdateError } = await supabase
            .from('fileStatus')
            .update({ status: true })
            .eq('request_id', requestID);

        if (statusUpdateError) {
            console.error('Error updating fileStatus table:', statusUpdateError);
        } else {
            // Call the webhook API to notify that processing is complete
            try {
                console.log("This is the requestID being sent to webhook: ", requestID);
                
                const webhookResponse = await axios.post('http://localhost:3000/webhook', { requestID: requestID });
                console.log('Webhook response:', webhookResponse.data);
            } catch (webhookError) {
                console.error('Error calling webhook API:', webhookError);
            }
        }
    } catch (statusUpdateError) {
        console.error('Error during fileStatus update:', statusUpdateError);
    }
});

export default imageQueue;
