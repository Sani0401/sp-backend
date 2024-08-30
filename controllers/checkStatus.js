import supabase from '../Config/supabaseConfig.js';

/**
 * Check if the status for the given requestID is true.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>} - Sends a response with the status result.
 */
export default async function checkStatus(req, res) {
    const { requestID } = req.params; // Extract requestID from params

    // Validate requestID
    if (!requestID) {
        return res.status(400).json({ message: 'RequestID is required' });
    }

    try {
        // Query Supabase for the status
        const { data, error } = await supabase
            .from('fileStatus')
            .select('status')
            .eq('request_id', requestID)
            .single(); // Ensure single result for the given requestID

        // Handle query errors
        if (error) {
            console.error('Error querying Supabase:', error);
            return res.status(500).json({ message: 'Error retrieving status' });
        }

        // Handle case where requestID is not found
        if (!data) {
            return res.status(404).json({ message: 'RequestID not found' });
        }

        // Return true if status is true, otherwise false
        res.json({ status: data.status === true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
}
