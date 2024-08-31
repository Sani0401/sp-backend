import multer from 'multer';
import { parse } from 'csv-parse/sync';
import supabase from '../Config/supabaseConfig.js';
import imageQueue from '../workers/imageWorker.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('csvFile');

export default function uploadFile(req, res) {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(400).json({ message: 'Error uploading file', error: err });
        }

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        console.log('File content received:\n', fileContent);

        let records;
        try {
            records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            console.log('Parsed CSV records:', records);

            const requiredColumns = ['S.No.', 'Product Name', 'Input Image Urls'];
            const actualColumns = Object.keys(records[0] || {});
            
            if (!requiredColumns.every(col => actualColumns.includes(col))) {
                console.error('Invalid column names in CSV file');
                return res.status(400).json({ message: 'Invalid formatting: Incorrect column names' });
            }
        } catch (parseError) {
            console.error('Error parsing CSV file:', parseError);
            return res.status(400).json({ message: 'Error parsing CSV file', error: parseError });
        }

        const { data: fileStatusData, error: fileStatusError } = await supabase
            .from('fileStatus')
            .insert([
                { file_name: req.file.originalname, status: false }
            ])
            .select('request_id');

        if (fileStatusError) {
            console.error('Error inserting into fileStatus table:', fileStatusError);
            return res.status(500).json({ message: 'Error inserting into file status table', error: fileStatusError });
        }

        const requestID = fileStatusData[0].request_id;
        console.log('Generated RequestID:', requestID);

        const results = records.map(record => ({
            srNo: record['S.No.'] ? record['S.No.'].trim() : '',
            product: record['Product Name'] ? record['Product Name'].trim() : '',
            inputImageUrl: record['Input Image Urls'] ? record['Input Image Urls'].trim().split(',').map(url => url.trim()) : [],
            requestID
        }));

        const { error: fileDataError } = await supabase
            .from('fileData')
            .insert(results.map(({ srNo, product, inputImageUrl, requestID }) => ({
                sr_no: srNo,
                product,
                input_image_url: inputImageUrl,
                requestId: requestID,
                output_image_url: [],
            })));

        if (fileDataError) {
            console.error('Error inserting data into fileData table:', fileDataError);
            return res.status(500).json({ message: 'Error inserting data into fileData table', error: fileDataError });
        }

        await imageQueue.add({ requestID, results });

        res.json({ message: 'File processed successfully', requestID });
    });
}
