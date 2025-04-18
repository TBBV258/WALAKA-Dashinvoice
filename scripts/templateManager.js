/**
 * Load a template by name
 * @param {string} templateName - The name of the template to load
 * @returns {Promise<string>} The template HTML content
 */
function loadTemplate(templateName) {
    // First try to load from server
    return fetch(`/templates/${templateName}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .catch(error => {
            console.error('Error loading template:', error);
            // Try to load from attached assets if server load fails
            return fetch(`/attached_assets/invoice_template${templateName.substring(templateName.length - 2)}.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load template from assets: ${response.status} ${response.statusText}`);
                    }
                    return response.text();
                })
                .catch(error => {
                    console.error('Error loading template from assets:', error);
                    // Fall back to default template
                    return fallbackTemplate();
                });
        });
}

/**
 * Fallback template in case loading fails
 * @returns {string} The fallback template HTML
 */
function fallbackTemplate() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice</title>
            <style>
                body { font-family: 'Inter', sans-serif; line-height: 1.6; }
                .invoice-container { max-width: 800px; margin: 20px auto; padding: 20px; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .company-info { flex: 1; }
                .invoice-details { text-align: right; }
                .client-info { margin-bottom: 30px; }
                .invoice-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .invoice-items th, .invoice-items td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                .invoice-totals { text-align: right; margin-top: 30px; }
                .total-row { margin: 5px 0; }
                .grand-total { font-weight: bold; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="company-info">
                        <h1 id="company-name">Company Name</h1>
                        <p id="company-address">Company Address</p>
                        <p id="company-contact">Email: <span id="company-email"></span> | Phone: <span id="company-phone"></span></p>
                        <p>NUIT: <span id="company-nuit"></span></p>
                    </div>
                    <div class="invoice-details">
                        <h2>INVOICE</h2>
                        <p>Invoice #: <span id="invoice-number"></span></p>
                        <p>Date: <span id="issue-date"></span></p>
                        <p>Due Date: <span id="due-date"></span></p>
                    </div>
                </div>
                
                <div class="client-info">
                    <h3>Bill To:</h3>
                    <p id="client-name">Client Name</p>
                    <p id="client-address">Client Address</p>
                    <p>NUIT: <span id="client-nuit"></span></p>
                    <p>Email: <span id="client-email"></span></p>
                    <p>Contact: <span id="client-contact"></span></p>
                </div>
                
                <table class="invoice-items">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>VAT (16%)</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="invoice-items-body">
                        <!-- Items will be inserted here -->
                    </tbody>
                </table>
                
                <div class="invoice-totals">
                    <div class="total-row">Subtotal: <span id="subtotal"></span></div>
                    <div class="total-row">VAT: <span id="total-vat"></span></div>
                    <div class="total-row">Discount: <span id="discount"></span></div>
                    <div class="total-row grand-total">Total: <span id="total"></span></div>
                </div>
                
                <div class="notes">
                    <h4>Notes:</h4>
                    <p id="notes"></p>
                </div>
                
                <div class="invoice-footer" style="margin-top: 40px; font-size: 0.9em; color: #666;">
                    <p>This invoice was generated using WALAKA Invoice Generator</p>
                    <p>Software Certification Number: <span id="software-cert-no"></span></p>
                    <p>Document Control Hash: <span id="invoice-hash"></span></p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Populate a template with invoice data
 * @param {Document} doc - The document to populate
 * @param {string} templateContent - The template HTML content
 * @param {Object} invoiceData - The invoice data to populate with
 */
function populateTemplate(doc, templateContent, invoiceData) {
    // Apply template color
    const style = doc.createElement('style');
    style.textContent = `:root { --primary-color: ${invoiceData.template.color}; }`;
    doc.head.appendChild(style);
    
    // Company information
    setElementText(doc, '#company-name, #display-company-name', invoiceData.company.name);
    setElementText(doc, '#company-address, #display-company-address', invoiceData.company.address);
    setElementText(doc, '#company-email, #display-company-email', invoiceData.company.email);
    setElementText(doc, '#company-phone, #display-company-phone', invoiceData.company.phone);
    setElementText(doc, '#company-nuit', invoiceData.company.nuit);
    setElementText(doc, '#software-cert-no', invoiceData.company.softwareCertNo);
    
    // Client information
    setElementText(doc, '#client-name, #display-client-name', invoiceData.client.name);
    setElementText(doc, '#client-address, #display-address, #display-client-address', invoiceData.client.address);
    setElementText(doc, '#client-nuit, #display-nuit, #display-clientTaxId', invoiceData.client.nuit);
    setElementText(doc, '#client-email, #display-mail-address', invoiceData.client.email);
    setElementText(doc, '#client-contact, #display-contact', invoiceData.client.contact);
    
    // Invoice details
    const invoiceNumberPrefix = invoiceData.invoice.type || 'FT';
    setElementText(doc, '#invoice-number, #display-invoice-number', `${invoiceNumberPrefix} ${invoiceData.invoice.number}`);
    setElementText(doc, '#issue-date, #display-issue-date', formatDate(invoiceData.invoice.issueDate));
    setElementText(doc, '#due-date, #display-due-date', formatDate(invoiceData.invoice.dueDate));
    setElementText(doc, '#payment-terms, #display-payment-terms', invoiceData.invoice.paymentTerms);
    setElementText(doc, '#project-name, #display-project-name', invoiceData.invoice.projectName);
    setElementText(doc, '#notes, #display-notes', invoiceData.invoice.notes);
    setElementText(doc, '#display-currency', invoiceData.invoice.currency);
    
    // Document status - add at the top of the invoice
    const statusIndicator = document.createElement('div');
    statusIndicator.style.textAlign = 'center';
    statusIndicator.style.padding = '5px';
    statusIndicator.style.marginBottom = '10px';
    statusIndicator.style.fontWeight = 'bold';
    
    if (invoiceData.invoice.documentStatus === 'A') {
        statusIndicator.style.backgroundColor = '#f44336';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = 'DOCUMENTO ANULADO';
        doc.body.insertBefore(statusIndicator, doc.body.firstChild);
    }
    
    // Set up currency formatter
    const formatter = new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: invoiceData.invoice.currency
    });
    
    // Format totals
    const formattedSubtotal = formatter.format(invoiceData.invoice.totals.subtotal);
    const formattedVat = formatter.format(invoiceData.invoice.totals.vat);
    const formattedDiscount = formatter.format(invoiceData.invoice.totals.discount);
    const formattedTotal = formatter.format(invoiceData.invoice.totals.total);
    
    setElementText(doc, '#subtotal, #display-subtotal', formattedSubtotal);
    setElementText(doc, '#total-vat, #display-totalVat, #display-iva', formattedVat);
    setElementText(doc, '#discount, #display-discount', formattedDiscount);
    setElementText(doc, '#total, #display-total', formattedTotal);
    
    // Populate invoice items
    populateInvoiceItems(doc, invoiceData);
    
    // Add company logo if available
    if (invoiceData.template.logo) {
        const logoContainers = doc.querySelectorAll('#company-logo');
        logoContainers.forEach(container => {
            container.innerHTML = `<img src="${invoiceData.template.logo}" alt="${invoiceData.company.name}" style="max-height: 60px; max-width: 200px;">`;
        });
    }
    
    // Generate and add verification hash
    const invoiceHash = generateInvoiceHash(invoiceData);
    setElementText(doc, '#invoice-hash', invoiceHash);
}

/**
 * Populate invoice items in the template
 * @param {Document} doc - The document to populate
 * @param {Object} invoiceData - The invoice data
 */
function populateInvoiceItems(doc, invoiceData) {
    const { items, currency } = invoiceData.invoice;
    
    // Set up currency formatter
    const formatter = new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: currency
    });
    
    // Try different item containers based on template
    const itemsContainer = 
        doc.querySelector('#invoice-items-body') || 
        doc.querySelector('#display-items') || 
        doc.querySelector('#invoice-items');
    
    if (!itemsContainer) {
        console.error('Could not find items container in template');
        return;
    }
    
    // Clear existing items
    itemsContainer.innerHTML = '';
    
    // Add items
    items.forEach(item => {
        const row = doc.createElement('tr');
        
        // Format item values
        const formattedPrice = formatter.format(item.price);
        const formattedTotal = formatter.format(item.total);
        
        row.innerHTML = `
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formattedPrice}</td>
            <td>${item.vat}%</td>
            <td>${formattedTotal}</td>
        `;
        
        itemsContainer.appendChild(row);
    });
}

/**
 * Set text content for elements matching a selector
 * @param {Document} doc - The document containing the elements
 * @param {string} selector - CSS selector for the elements
 * @param {string} text - The text to set
 */
function setElementText(doc, selector, text) {
    if (!text) return;
    
    const elements = doc.querySelectorAll(selector);
    elements.forEach(element => {
        element.textContent = text;
    });
}
