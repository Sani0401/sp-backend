import supabase from '../Config/supabaseConfig.js';

export default async function checkStatus(req, res) {
    const { requestID } = req.params;

    if (!requestID) {
        return res.status(400).json({ message: 'RequestID is required' });
    }

    try {
        const { data, error } = await supabase
            .from('fileStatus')
            .select('status')
            .eq('request_id', requestID)
            .single();

        if (error) {
            console.error('Error querying Supabase:', error);
            return res.status(500).json({ message: 'Error retrieving status' });
        }

        if (!data) {
            return res.status(404).json({ message: 'RequestID not found' });
        }

        res.json({ status: data.status === true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
}
