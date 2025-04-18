import { createClient } from '@supabase/supabase-js';

class InvoiceNumberService {
    constructor() {
        this.supabase = createClient(
            'https://zqnthduqpzriydgbdojy.supabase.co',
            'your-supabase-key'
        );
    }

    async getNextInvoiceNumber() {
        try {
            const currentYear = new Date().getFullYear();
            const prefix = 'INV';

            // Get the latest invoice for current year
            const { data, error } = await this.supabase
                .from('invoices')
                .select('invoice_number')
                .ilike('invoice_number', `${prefix}-${currentYear}-%`)
                .order('invoice_number', { ascending: false })
                .limit(1);

            if (error) throw error;

            let sequenceNumber = 1;
            
            if (data && data.length > 0) {
                // Extract sequence number from last invoice
                const lastNumber = data[0].invoice_number;
                const sequence = parseInt(lastNumber.split('-')[2]);
                sequenceNumber = sequence + 1;
            }

            // Format: INV-YYYY-0000
            const formattedNumber = `${prefix}-${currentYear}-${String(sequenceNumber).padStart(4, '0')}`;
            
            return formattedNumber;
        } catch (error) {
            console.error('Error generating invoice number:', error);
            throw error;
        }
    }
}

export default new InvoiceNumberService();
