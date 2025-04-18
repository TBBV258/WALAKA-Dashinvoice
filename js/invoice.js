// Invoice Management Module JavaScript


//const supabase = supabase.createClient('https://zqnthduqpzriydgbdojy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbnRoZHVxcHpyaXlkZ2Jkb2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTkzOTcsImV4cCI6MjA1NzQ3NTM5N30.fZqsPqkbJ4m-Lp7BRTAOuxU5_6MXj8QJERUTreshKIU');
 
/*const supabase = createClient(
    'https://zqnthduqpzriydgbdojy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbnRoZHVxcHpyaXlkZ2Jkb2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTkzOTcsImV4cCI6MjA1NzQ3NTM5N30.fZqsPqkbJ4m-Lp7BRTAOuxU5_6MXj8QJERUTreshKIU'
  );*/


document.addEventListener('DOMContentLoaded', function() {
    initializeInvoiceModule();
    setupEventListeners();
    setupCharts();
//    fetchClients();
//    displayClients();
});

let cachedClients = []; // Add this near the top with other global variables

async function setupClientSuggestions() {
    const clientInput = document.getElementById('clientName');
    if (!clientInput) return;

    // Create suggestions container
    const suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'suggestion-box';
    suggestionsBox.style.display = 'none';
    document.body.appendChild(suggestionsBox);

    let activeIndex = -1;

    // Fetch clients from database
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, taxId, email, address');

    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    cachedClients = clients;

    clientInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        activeIndex = -1;

        if (searchTerm.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const matches = cachedClients.filter(client => 
            client.name.toLowerCase().includes(searchTerm)
        ).slice(0, 5);

        if (matches.length > 0) {
            const rect = e.target.getBoundingClientRect();
            suggestionsBox.style.display = 'block';
            suggestionsBox.style.top = `${rect.bottom + window.scrollY}px`;
            suggestionsBox.style.left = `${rect.left + window.scrollX}px`;
            suggestionsBox.style.width = `${e.target.offsetWidth}px`;

            suggestionsBox.innerHTML = matches.map(client => `
                <div class="suggestion-item" 
                     data-id="${client.id}"
                     data-name="${client.name}"
                     data-tax-id="${client.taxId}"
                     data-email="${client.email}"
                     data-address="${client.address}">
                    <div>${client.name}</div>
                    <small>NUIT: ${client.taxId}</small>
                </div>
            `).join('');
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    // Handle keyboard navigation
    clientInput.addEventListener('keydown', function(e) {
        const suggestions = suggestionsBox.querySelectorAll('.suggestion-item');
        if (!suggestions.length) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
                updateActiveSelection(suggestions);
                break;

            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                updateActiveSelection(suggestions);
                break;

            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0) {
                    selectClient(suggestions[activeIndex]);
                }
                break;

            case 'Escape':
                suggestionsBox.style.display = 'none';
                break;
        }
    });

    // Handle click selection
    document.addEventListener('click', function(e) {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            selectClient(suggestionItem);
        } else if (!e.target.closest('#clientName')) {
            suggestionsBox.style.display = 'none';
        }
    });

    function updateActiveSelection(suggestions) {
        suggestions.forEach((s, i) => {
            if (i === activeIndex) {
                s.classList.add('active');
                s.scrollIntoView({ block: 'nearest' });
            } else {
                s.classList.remove('active');
            }
        });
    }

    function selectClient(element) {
        const clientData = {
            id: element.dataset.id,
            name: element.dataset.name,
            taxId: element.dataset.taxId,
            email: element.dataset.email,
            address: element.dataset.address
        };

        // Fill in form fields
        document.getElementById('clientName').value = clientData.name;
        document.getElementById('clientTaxId').value = clientData.taxId;
        document.getElementById('clientEmail').value = clientData.email;
        document.getElementById('clientAddress').value = clientData.address;

        // Hide suggestions
        suggestionsBox.style.display = 'none';
    }
}

function initializeInvoiceModule() {
    console.log('Invoice Management Module initialized');
    setupItemCalculations();
    initializeDateFields();
    setupClientSuggestions();
    loadInvoiceTemplates();
}

function setupEventListeners() {
    // Create Invoice Button
    const createInvoiceBtn = document.getElementById('createInvoiceBtn');
    if (createInvoiceBtn) {
        createInvoiceBtn.addEventListener('click', function() {
            openModal('invoiceModal');
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal, #closeInvoiceBtn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Modal overlay click to close
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function() {
            closeAllModals();
        });
    }
    
    // Prevent closing when clicking inside modal content
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addInvoiceItem);
    }
    
    // Remove item buttons (for dynamically added items)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item-btn') || e.target.closest('.remove-item-btn')) {
            const button = e.target.classList.contains('remove-item-btn') ? e.target : e.target.closest('.remove-item-btn');
            const row = button.closest('.item-row');
            
            // Don't remove if it's the last row
            const rows = document.querySelectorAll('.item-row');
            if (rows.length > 1) {
                row.remove();
                updateInvoiceTotals();
            } else {
                // Clear the fields instead of removing
                const inputs = row.querySelectorAll('input');
                inputs.forEach(input => input.value = input.type === 'number' ? '0' : '');
                updateInvoiceTotals();
            }
        }
    });
    
    // View Invoice buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const invoiceNumber = this.getAttribute('data-invoice');
            openViewInvoiceModal(invoiceNumber);
        });
    });
    
    // Setup invoice item calculations
    setupItemCalculations();
    
    // Payment terms dropdown
    const paymentTermsSelect = document.getElementById('paymentTerms');
    if (paymentTermsSelect) {
        paymentTermsSelect.addEventListener('change', function() {
            updateDueDate();
        });
    }
    
    // Issue date field
    const issueDateField = document.getElementById('issueDate');
    if (issueDateField) {
        issueDateField.addEventListener('change', function() {
            updateDueDate();
        });
    }
    
    // Form submission
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveInvoice();
        });
    }

    // Preview button
    const previewInvoiceBtn = document.getElementById('previewInvoiceBtn');
    if (previewInvoiceBtn) {
        previewInvoiceBtn.addEventListener('click', function() {
            previewInvoice();
        });
    }
    
    // Template selector
    const templateSelector = document.getElementById('templateSelector');
    if (templateSelector) {
        templateSelector.addEventListener('change', function() {
            updateInvoiceTemplate(this.value);
        });
    }
    
    // Chart period buttons
    setupChartPeriodControls();
    
    // Table filters
    setupTableFilters();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.modal-overlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Initialize or reset form if it's the invoice creation modal
        if (modalId === 'invoiceModal') {
            resetInvoiceForm();
        }
    }
}

function closeAllModals() {
    const viewInvoiceModal = document.getElementById('viewInvoiceModal');
    const invoiceModal = document.getElementById('invoiceModal');
    const overlay = document.querySelector('.modal-overlay');
    
    // If we're in preview mode, just close the preview
    if (viewInvoiceModal && viewInvoiceModal.style.display === 'block' 
        && invoiceModal.style.display === 'none') {
        viewInvoiceModal.style.display = 'none';
        invoiceModal.style.display = 'block';
        return;
    }
    
    // Otherwise close everything
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    document.body.style.overflow = ''; // Re-enable scrolling
}

function setupItemCalculations() {
    // Add event listeners for quantity and price changes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            const row = e.target.closest('.item-row');
            if (row) {
                calculateRowTotal(row);
                updateInvoiceTotals();
            }
        }
    });
}

function calculateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    
    const subtotal = quantity * price;
    const vat = subtotal * 0.16; // 16% VAT
    
    row.querySelector('.item-vat').textContent = vat.toFixed(2);
    row.querySelector('.item-total').textContent = (subtotal + vat).toFixed(2);
}

function updateInvoiceTotals() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    
    // Calculate subtotal from items
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        subtotal += quantity * price;
    });
    
    // Get discount and retention
    const discount = parseFloat(document.getElementById('discountAmount').value) || 0;
    const retention = parseFloat(document.getElementById('retentionAmount').value) || 0;
    
    // Calculate taxable amount
    const taxableAmount = subtotal - discount;
    
    // Calculate VAT
    const vat = taxableAmount * 0.16; // 16% VAT
    
    // Calculate grand total
    const grandTotal = taxableAmount + vat - retention;
    
    // Calculate change amount
    const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
    const changeAmount = amountReceived - grandTotal;
    
    // Update display
    const currency = document.getElementById('currency').value;
    const currencyInfo = CURRENCIES[currency];
    
    // Format numbers according to currency decimal places
    const formatter = new Intl.NumberFormat('pt-MZ', {
        minimumFractionDigits: currencyInfo.decimal,
        maximumFractionDigits: currencyInfo.decimal
    });

    document.getElementById('subtotal').textContent = 
        `${currencyInfo.symbol} ${formatter.format(subtotal)}`;
    document.getElementById('taxableAmount').textContent = taxableAmount.toFixed(2);
    document.getElementById('totalVat').textContent = vat.toFixed(2);
    document.getElementById('invoiceTotal').textContent = grandTotal.toFixed(2);
    document.getElementById('changeAmount').textContent = changeAmount.toFixed(2);
}

// Add event listeners for new fields
document.getElementById('discountAmount').addEventListener('input', updateInvoiceTotals);
document.getElementById('retentionAmount').addEventListener('input', updateInvoiceTotals);
document.getElementById('amountReceived').addEventListener('input', updateInvoiceTotals);

function addInvoiceItem() {
    const itemsTableBody = document.querySelector('#itemsTable tbody');
    const newRowHTML = `
        <tr class="item-row">
            <td>
                <input type="text" class="item-description" placeholder="Enter item description">
            </td>
            <td>
                <input type="number" class="item-quantity" value="1" min="1" step="1">
            </td>
            <td>
                <input type="number" class="item-price" value="0.00" min="0" step="0.01">
            </td>
            <td>
                <span class="item-vat">0.00</span>
            </td>
            <td>
                <span class="item-total">0.00</span>
            </td>
            <td>
                <button type="button" class="remove-item-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    
    itemsTableBody.insertAdjacentHTML('beforeend', newRowHTML);
    
    // Initialize the new row
    const newRow = itemsTableBody.lastElementChild;
    calculateRowTotal(newRow);
    updateInvoiceTotals();
}

function initializeDateFields() {
    const issueDate = document.getElementById('issueDate');
    const dueDate = document.getElementById('dueDate');
    
    if (issueDate && dueDate) {
        // Set issue date to today's date if not already set
        if (!issueDate.value) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            issueDate.value = formattedDate;
        }
        
        // Set due date based on payment terms
        updateDueDate();
    }
}

function updateDueDate() {
    const issueDate = document.getElementById('issueDate');
    const dueDate = document.getElementById('dueDate');
    const paymentTerms = document.getElementById('paymentTerms');
    
    if (issueDate && dueDate && paymentTerms) {
        const selectedDate = new Date(issueDate.value);
        
        if (isNaN(selectedDate.getTime())) {
            return; // Invalid date
        }
        
        let daysToAdd = 30; // Default to Net-30
        
        switch (paymentTerms.value) {
            case 'net15':
                daysToAdd = 15;
                break;
            case 'net30':
                daysToAdd = 30;
                break;
            case 'net60':
                daysToAdd = 60;
                break;
            // For 'custom', let the user enter manually
            case 'custom':
                return;
        }
        
        const newDueDate = new Date(selectedDate);
        newDueDate.setDate(newDueDate.getDate() + daysToAdd);
        
        const formattedDueDate = newDueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        dueDate.value = formattedDueDate;
    }
}

function resetInvoiceForm() {
    const form = document.getElementById('invoiceForm');
    if (form) {
        form.reset();
        
        // Set currency to MZN by default
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            currencySelect.value = 'MZN';
        }
        
        // Clear all invoice items except the first row
        const itemsTableBody = document.querySelector('#itemsTable tbody');
        const rows = itemsTableBody.querySelectorAll('.item-row');
        
        // Remove all rows except the first one
        for (let i = 1; i < rows.length; i++) {
            rows[i].remove();
        }
        
        // Reset the first row
        const firstRow = itemsTableBody.querySelector('.item-row');
        if (firstRow) {
            const inputs = firstRow.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.classList.contains('item-quantity')) {
                    input.value = '1';
                } else if (input.classList.contains('item-price')) {
                    input.value = '0.00';
                } else {
                    input.value = '';
                }
            });
            
            // Reset calculated values
            firstRow.querySelector('.item-vat').textContent = '0.00';
            firstRow.querySelector('.item-total').textContent = '0.00';
        }
        
        // Reset totals
        document.getElementById('subtotal').textContent = '0.00';
        document.getElementById('totalVat').textContent = '0.00';
        document.getElementById('invoiceTotal').textContent = '0.00';
        
        // Initialize date fields with fresh values
        initializeDateFields();
        
        // Generate a new invoice number
        const invoiceNumberField = document.getElementById('invoiceNumber');
        if (invoiceNumberField) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            // In a real app, we would get the next sequence number from the server
            const nextNumber = Math.floor(Math.random() * 1000) + 1;
            invoiceNumberField.value = `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
        }
    }
}

// Add new invoice generation functions
async function generateInvoiceQRCode(invoiceData) {
    const qrData = JSON.stringify({
        nuit: invoiceData.issuerNUIT,
        invoice: invoiceData.invoiceNumber,
        date: invoiceData.invoiceDate,
        total: invoiceData.grossTotal,
        tax: invoiceData.taxAmount,
        hash: invoiceData.signatureHash
    });
    
    // Use QR code library to generate code
    const qr = await QRCode.toDataURL(qrData);
    return `<img src="${qr}" alt="Invoice QR Code">`;
}

async function signInvoice(invoiceData) {
    // Generate hash of invoice data
    const dataToSign = `${invoiceData.invoiceNumber}${invoiceData.invoiceDate}${invoiceData.grossTotal}`;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToSign));
    return {
        hash: Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''),
        timestamp: new Date().toISOString()
    };
}

function generateSAFTXML(invoiceData) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:MZ_1.0_01">
        <Header>
            <NUIT>${invoiceData.issuerNUIT}</NUIT>
            <CompanyName>${invoiceData.companyName}</CompanyName>
            <FiscalYear>${invoiceData.fiscalYear}</FiscalYear>
            <StartDate>${invoiceData.startDate}</StartDate>
            <EndDate>${invoiceData.endDate}</EndDate>
            <CurrencyCode>MZN</CurrencyCode>
            <DateCreated>${new Date().toISOString()}</DateCreated>
            <SoftwareValidationNumber>${invoiceData.softwareCertNo}</SoftwareValidationNumber>
        </Header>
        <Invoice>
            <InvoiceNo>${invoiceData.invoiceNumber}</InvoiceNo>
            <DocumentStatus>N</DocumentStatus>
            <InvoiceDate>${invoiceData.invoiceDate}</InvoiceDate>
            <CustomerID>${invoiceData.customerId}</CustomerID>
            <!-- Add more invoice details -->
        </Invoice>
    </AuditFile>`;
    
    return xml;
}

// Modify existing save function to include new requirements
async function saveInvoice() {
    const invoiceData = collectInvoiceData();
    const errors = validateInvoiceForm(invoiceData);
    
    if (Object.keys(errors).length > 0) {
        displayFormErrors(errors);
        return;
    }
    
    // Generate sequential invoice number
    invoiceData.invoiceNumber = await generateInvoiceNumber(invoiceData.documentType);
    
    // Add digital signature
    const signature = await signInvoice(invoiceData);
    invoiceData.signatureHash = signature.hash;
    invoiceData.signatureTimestamp = signature.timestamp;
    
    // Generate QR code
    invoiceData.qrCode = await generateInvoiceQRCode(invoiceData);
    
    // Generate SAF-T XML
    const saftXML = generateSAFTXML(invoiceData);
    
    try {
        const { data, error } = await supabase
            .from('invoices')
            .insert([{
                ...invoiceData,
                saft_xml: saftXML,
                status: invoiceData.amountReceived >= invoiceData.total ? 'paid' : 'pending'
            }]);
            
        if (error) throw error;
        
        showNotification('Invoice created successfully');
        closeAllModals();
    } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('Error creating invoice', 'error');
    }
}

async function generateInvoiceNumber(documentType) {
    const date = new Date();
    const year = date.getFullYear();
    const series = 'A'; // Can be configurable
    
    // Get last invoice number from database
    const { data, error } = await supabase
        .from('invoice_sequences')
        .select('last_number')
        .eq('year', year)
        .eq('document_type', documentType)
        .eq('series', series)
        .single();
        
    let sequence = 1;
    if (data) {
        sequence = data.last_number + 1;
    }
    
    // Format: FT A/001/2024
    return `${documentType} ${series}/${sequence.toString().padStart(3, '0')}/${year}`;
}

function collectInvoiceData() {
    return {
        // Document Information
        documentType: document.getElementById('documentType').value,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        selfBilling: document.getElementById('selfBilling').checked,
        cashVATScheme: document.getElementById('cashVATScheme').checked,
        
        // Company Information
        companyName: 'WALAKA SISTEMAS',
        companyNUIT: '123456789',
        companyAddress: 'Av. 25 de Setembro, 1234',
        companyCity: 'Maputo',
        companyPostalCode: '1100',
        companyProvince: 'Maputo',
        
        // Client Information
        clientName: document.getElementById('clientName').value,
        clientNUIT: document.getElementById('clientTaxId').value,
        clientAddress: document.getElementById('clientAddress').value,
        
        // Invoice Details
        issueDate: document.getElementById('issueDate').value,
        dueDate: document.getElementById('dueDate').value,
        paymentTerms: document.getElementById('paymentTerms').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        
        // Amounts
        subtotal: parseFloat(document.getElementById('subtotal').textContent),
        discount: parseFloat(document.getElementById('discountAmount').textContent),
        taxableAmount: parseFloat(document.getElementById('taxableAmount').textContent),
        vatRate: parseInt(document.getElementById('vatRate').value),
        vatAmount: parseFloat(document.getElementById('totalVat').textContent),
        withholdingTax: parseFloat(document.getElementById('withholdingTax').value),
        retentionAmount: parseFloat(document.getElementById('retentionAmount').textContent),
        total: parseFloat(document.getElementById('invoiceTotal').textContent),
        amountReceived: parseFloat(document.getElementById('amountReceived').value),
        changeAmount: parseFloat(document.getElementById('changeAmount').textContent),
        
        // Items with required SAF-T fields
        items: Array.from(document.querySelectorAll('.item-row')).map(row => ({
            lineNumber: row.dataset.lineNumber,
            productCode: row.querySelector('.item-code').value,
            description: row.querySelector('.item-description').value,
            quantity: parseFloat(row.querySelector('.item-quantity').value),
            unit: row.querySelector('.item-unit').value || 'UN',
            unitPrice: parseFloat(row.querySelector('.item-price').value),
            taxType: 'IVA',
            taxCountryRegion: 'MZ',
            taxCode: document.getElementById('vatRate').value === '0' ? 'ISE' : 'NOR',
            taxPercentage: parseInt(document.getElementById('vatRate').value),
            taxAmount: parseFloat(row.querySelector('.item-vat').textContent),
            total: parseFloat(row.querySelector('.item-total').textContent)
        }))
    };
}

function updateCalculations() {
    const data = collectInvoiceData();
    
    // Calculate line totals
    let subtotal = 0;
    data.items.forEach(item => {
        const lineSubtotal = item.quantity * item.unitPrice;
        subtotal += lineSubtotal;
    });
    
    // Apply discount
    const discount = data.discount || 0;
    const taxableAmount = subtotal - discount;
    
    // Calculate VAT
    const vatAmount = (taxableAmount * data.vatRate) / 100;
    
    // Calculate withholding tax
    const retentionAmount = (taxableAmount * data.withholdingTax) / 100;
    
    // Calculate final total
    const total = taxableAmount + vatAmount - retentionAmount;
    
    // Calculate change amount
    const changeAmount = Math.max(0, data.amountReceived - total);
    
    // Update display
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('taxableAmount').textContent = taxableAmount.toFixed(2);
    document.getElementById('totalVat').textContent = vatAmount.toFixed(2);
    document.getElementById('retentionAmount').textContent = retentionAmount.toFixed(2);
    document.getElementById('invoiceTotal').textContent = total.toFixed(2);
    document.getElementById('changeAmount').textContent = changeAmount.toFixed(2);
}

function previewInvoice() {
    const invoiceData = getInvoiceData();
    
    // Generate template URL
    generateInvoiceHTML(invoiceData).then(templateUrl => {
        const frame = document.getElementById('invoicePreviewFrame');
        frame.src = templateUrl;
        
        // Clean up blob URL when frame loads
        frame.onload = () => {
            URL.revokeObjectURL(frame.src);
            
            // Send data to template
            frame.contentWindow.postMessage({
                type: 'updateData',
                invoiceData
            }, '*');
        };
        
        document.getElementById('viewInvoiceModal').style.display = 'block';
    });
}

function openViewInvoiceModal(invoiceNumber) {
    // Show timeline and buttons for view mode
    const timelineSection = document.querySelector('.invoice-view-footer');
    const modalFooter = document.querySelector('#viewInvoiceModal .modal-footer');
    if (timelineSection) timelineSection.style.display = 'block';
    if (modalFooter) modalFooter.style.display = 'block';
    
    // Update modal title for viewing
    const modalTitle = document.querySelector('#viewInvoiceModal .modal-header h2');
    if (modalTitle) modalTitle.textContent = 'Invoice Details';
    
    // In a real app, you would fetch the invoice details from the server
    // For demo, we'll use hardcoded data
    const invoiceDetails = {
        'INV-2025-0001': {
            invoiceNumber: 'INV-2025-0001',
            status: 'paid',
            clientName: 'Globex Industries',
            issueDate: '2025-03-15',
            dueDate: '2025-04-14',
            amount: '$2,580.00',
            timeline: [
                { date: 'Mar 15, 2025', title: 'Invoice Created', active: true },
                { date: 'Mar 16, 2025', title: 'Sent to Client', active: true },
                { date: 'Mar 20, 2025', title: 'Payment Received', active: true }
            ]
        },
        'INV-2025-0002': {
            invoiceNumber: 'INV-2025-0002',
            status: 'pending',
            clientName: 'Stark Industries',
            issueDate: '2025-03-18',
            dueDate: '2025-04-17',
            amount: '$4,750.00',
            timeline: [
                { date: 'Mar 18, 2025', title: 'Invoice Created', active: true },
                { date: 'Mar 19, 2025', title: 'Sent to Client', active: true },
                { date: 'Pending', title: 'Payment Received', active: false }
            ]
        },
        'INV-2025-0003': {
            invoiceNumber: 'INV-2025-0003',
            status: 'overdue',
            clientName: 'Wayne Enterprises',
            issueDate: '2025-03-10',
            dueDate: '2025-04-09',
            amount: '$8,350.00',
            timeline: [
                { date: 'Mar 10, 2025', title: 'Invoice Created', active: true },
                { date: 'Mar 11, 2025', title: 'Sent to Client', active: true },
                { date: 'Overdue', title: 'Payment Received', active: false }
            ]
        }
    };
    
    // If the invoice exists in our demo data
    if (invoiceDetails[invoiceNumber]) {
        const invoice = invoiceDetails[invoiceNumber];
        
        // Update the modal with invoice details
        document.getElementById('viewInvoiceNumber').textContent = invoice.invoiceNumber;
        
        const statusElement = document.getElementById('viewInvoiceStatus');
        statusElement.textContent = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
        statusElement.className = 'status ' + invoice.status;
        
        // Update timeline
        const timelineContainer = document.querySelector('.status-timeline');
        timelineContainer.innerHTML = '';
        
        invoice.timeline.forEach(event => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item' + (event.active ? ' active' : '');
            
            timelineItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${event.date}</span>
                    <span class="timeline-title">${event.title}</span>
                </div>
            `;
            
            timelineContainer.appendChild(timelineItem);
        });
        
        // Set up the iframe to display the invoice template
        // In a real app, this would load the actual invoice template with data
        const iframe = document.getElementById('invoicePreviewFrame');
        iframe.src = 'template01.html';
        
        // Show/hide "Mark as Paid" button based on status
        const markPaidBtn = document.getElementById('markPaidBtn');
        if (markPaidBtn) {
            if (invoice.status === 'paid') {
                markPaidBtn.style.display = 'none';
            } else {
                markPaidBtn.style.display = '';
                
                // Add event listener for mark as paid button
                markPaidBtn.onclick = function() {
                    markInvoiceAsPaid(invoiceNumber);
                };
            }
        }
        
        // Open the modal
        openModal('viewInvoiceModal');
    } else {
        console.error('Invoice not found:', invoiceNumber);
    }
}

function markInvoiceAsPaid(invoiceNumber) {
    // In a real app, you would make an API call to update the invoice status
    console.log('Marking invoice as paid:', invoiceNumber);
    
    // For demo, simulate successful update
    document.getElementById('viewInvoiceStatus').textContent = 'Paid';
    document.getElementById('viewInvoiceStatus').className = 'status paid';
    
    // Update timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => item.classList.add('active'));
    
    const lastTimelineItem = timelineItems[timelineItems.length - 1];
    if (lastTimelineItem) {
        const dateSpan = lastTimelineItem.querySelector('.timeline-date');
        if (dateSpan) {
            dateSpan.textContent = new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
    }
    
    // Hide the "Mark as Paid" button
    document.getElementById('markPaidBtn').style.display = 'none';
    
    showNotification('Invoice marked as paid');
}

function updateInvoiceTemplate(templateId) {
    // In a real app, this would load different invoice templates
    console.log('Switching to template:', templateId);
    
    const iframe = document.getElementById('invoicePreviewFrame');
    switch (templateId) {
        case 'template1':
            iframe.src = 'template01.html';
            break;
        case 'template2':
            iframe.src = 'template02.html';
            break;
        case 'template3':
            iframe.src = 'template01.html'; // For demo, just reuse template1
            break;
    }
}

function setupCharts() {
    // Invoice Distribution Chart
    const invoiceDistributionCtx = document.getElementById('invoiceDistributionChart');
    if (invoiceDistributionCtx) {
        const invoiceDistributionChart = new Chart(invoiceDistributionCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Invoices Created',
                    data: [5, 7, 10, 8, 12, 3, 1],
                    borderColor: '#007ec7',
                    backgroundColor: 'rgba(0, 126, 199, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Store the chart instance for later updates
        window.invoiceDistributionChart = invoiceDistributionChart;
    }
    
    // Revenue by Status Chart
    const revenueByStatusCtx = document.getElementById('revenueByStatusChart');
    if (revenueByStatusCtx) {
        const revenueByStatusChart = new Chart(revenueByStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Pending', 'Overdue', 'Draft'],
                datasets: [{
                    data: [65, 15, 12, 8],
                    backgroundColor: [
                        '#3bb077', // Paid - green
                        '#f0ad4e', // Pending - amber
                        '#e55353', // Overdue - red
                        '#6c757d'  // Draft - gray
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                cutout: '70%'
            }
        });
        
        // Store the chart instance for later updates
        window.revenueByStatusChart = revenueByStatusChart;
    }
}

function setupChartPeriodControls() {
    // Invoice Distribution Chart period controls
    const weeklyBtn = document.getElementById('weeklyBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    const quarterlyBtn = document.getElementById('quarterlyBtn');
    
    if (weeklyBtn && monthlyBtn && quarterlyBtn) {
        weeklyBtn.addEventListener('click', function() {
            updateChartPeriodButtons(this, [monthlyBtn, quarterlyBtn]);
            updateInvoiceDistributionChart('weekly');
        });
        
        monthlyBtn.addEventListener('click', function() {
            updateChartPeriodButtons(this, [weeklyBtn, quarterlyBtn]);
            updateInvoiceDistributionChart('monthly');
        });
        
        quarterlyBtn.addEventListener('click', function() {
            updateChartPeriodButtons(this, [weeklyBtn, monthlyBtn]);
            updateInvoiceDistributionChart('quarterly');
        });
    }
    
    // Revenue by Status Chart period controls
    const revenueMonthlyBtn = document.getElementById('revenueMonthlyBtn');
    const revenueYearlyBtn = document.getElementById('revenueYearlyBtn');
    
    if (revenueMonthlyBtn && revenueYearlyBtn) {
        revenueMonthlyBtn.addEventListener('click', function() {
            updateChartPeriodButtons(this, [revenueYearlyBtn]);
            updateRevenueByStatusChart('monthly');
        });
        
        revenueYearlyBtn.addEventListener('click', function() {
            updateChartPeriodButtons(this, [revenueMonthlyBtn]);
            updateRevenueByStatusChart('yearly');
        });
    }
}

function updateChartPeriodButtons(activeButton, inactiveButtons) {
    activeButton.classList.add('active');
    inactiveButtons.forEach(button => button.classList.remove('active'));
}

function updateInvoiceDistributionChart(period) {
    const chart = window.invoiceDistributionChart;
    if (!chart) return;
    
    let labels = [];
    let data = [];
    
    switch (period) {
        case 'weekly':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            data = [5, 7, 10, 8, 12, 3, 1];
            break;
        case 'monthly':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            data = [25, 38, 42, 35];
            break;
        case 'quarterly':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            data = [42, 38, 55, 40, 45, 42, 38, 35, 42, 48, 50, 65];
            break;
    }
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

function updateRevenueByStatusChart(period) {
    const chart = window.revenueByStatusChart;
    if (!chart) return;
    
    // Just update the data (percentage distribution) based on the period
    if (period === 'monthly') {
        chart.data.datasets[0].data = [65, 15, 12, 8];
    } else { // yearly
        chart.data.datasets[0].data = [78, 10, 8, 4];
    }
    
    chart.update();
}

function setupTableFilters() {
    // Get filter elements
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const clientFilter = document.getElementById('clientFilter');
    const searchInput = document.getElementById('searchInvoices');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const resetFiltersLink = document.getElementById('resetFiltersLink');
    
    // Get table elements
    const table = document.getElementById('invoicesTable');
    const rows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
    
    if (!table || rows.length === 0) return;
    
    // Function to apply all filters
    function applyFilters() {
        const status = statusFilter ? statusFilter.value : 'all';
        const date = dateFilter ? dateFilter.value : 'all';
        const client = clientFilter ? clientFilter.value : 'all';
        const searchText = searchInput ? searchInput.value.toLowerCase() : '';
        
        let visibleCount = 0;
        
        rows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            const rowDate = new Date(row.getAttribute('data-date'));
            const rowClient = row.getAttribute('data-client').toLowerCase();
            const rowInvoice = row.querySelector('td:first-child').textContent.toLowerCase();
            
            // Match status
            const statusMatch = status === 'all' || rowStatus === status;
            
            // Match date range
            let dateMatch = true;
            
            if (date !== 'all') {
                const today = new Date();
                const oneWeek = new Date(today);
                oneWeek.setDate(today.getDate() - 7);
                
                const oneMonth = new Date(today);
                oneMonth.setMonth(today.getMonth() - 1);
                
                const oneQuarter = new Date(today);
                oneQuarter.setMonth(today.getMonth() - 3);
                
                const oneYear = new Date(today);
                oneYear.setFullYear(today.getFullYear() - 1);
                
                switch (date) {
                    case 'today':
                        dateMatch = rowDate.toDateString() === today.toDateString();
                        break;
                    case 'week':
                        dateMatch = rowDate >= oneWeek;
                        break;
                    case 'month':
                        dateMatch = rowDate >= oneMonth;
                        break;
                    case 'quarter':
                        dateMatch = rowDate >= oneQuarter;
                        break;
                    case 'year':
                        dateMatch = rowDate >= oneYear;
                        break;
                }
            }
            
            // Match client
            const clientMatch = client === 'all' || rowClient.includes(client.toLowerCase());
            
            // Match search text
            const searchMatch = !searchText || 
                                rowInvoice.includes(searchText) || 
                                rowClient.includes(searchText);
            
            // Apply all filters
            const shouldShow = statusMatch && dateMatch && clientMatch && searchMatch;
            row.style.display = shouldShow ? '' : 'none';
            
            if (shouldShow) visibleCount++;
        });
        
        // Show/hide "No results" message
        const noResultsMessage = document.getElementById('noResultsMessage');
        if (noResultsMessage) {
            if (visibleCount === 0) {
                table.style.display = 'none';
                noResultsMessage.style.display = 'block';
            } else {
                table.style.display = '';
                noResultsMessage.style.display = 'none';
            }
        }
        
        // Update page info
        const pageInfo = document.querySelector('.page-info');
        if (pageInfo) {
            pageInfo.textContent = `Showing ${visibleCount} of ${rows.length} invoices`;
        }
    }
    
    // Add event listeners to filters
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    if (clientFilter) {
        clientFilter.addEventListener('change', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Debounce search for better performance
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(applyFilters, 300);
        });
    }
    
    // Reset filters function
    function resetFilters() {
        if (statusFilter) statusFilter.value = 'all';
        if (dateFilter) dateFilter.value = 'month';
        if (clientFilter) clientFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        
        applyFilters();
    }
    
    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Reset filters link (in no results message)
    if (resetFiltersLink) {
        resetFiltersLink.addEventListener('click', function(e) {
            e.preventDefault();
            resetFilters();
        });
    }
    
    // Initialize sorting
    setupTableSorting(table, rows);
}

function setupTableSorting(table, rows) {
    const sortIcons = table ? table.querySelectorAll('.sort-icon') : [];
    
    sortIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const sortKey = this.getAttribute('data-sort');
            const ascending = !this.classList.contains('ascending');
            
            // Reset all icons
            sortIcons.forEach(i => {
                i.classList.remove('ascending', 'descending');
            });
            
            // Set this icon's state
            this.classList.add(ascending ? 'ascending' : 'descending');
            
            // Sort rows
            rows.sort((a, b) => {
                let aVal, bVal;
                
                // Get appropriate values based on sort key
                switch (sortKey) {
                    case 'invoice':
                        aVal = a.querySelector('td:nth-child(1)').textContent.trim();
                        bVal = b.querySelector('td:nth-child(1)').textContent.trim();
                        break;
                    case 'client':
                        aVal = a.querySelector('td:nth-child(2)').textContent.trim();
                        bVal = b.querySelector('td:nth-child(2)').textContent.trim();
                        break;
                    case 'date':
                        aVal = new Date(a.getAttribute('data-date'));
                        bVal = new Date(b.getAttribute('data-date'));
                        return ascending ? aVal - bVal : bVal - aVal;
                    case 'dueDate':
                        aVal = new Date(a.getAttribute('data-duedate'));
                        bVal = new Date(b.getAttribute('data-duedate'));
                        return ascending ? aVal - bVal : bVal - aVal;
                    case 'amount':
                        aVal = parseFloat(a.getAttribute('data-amount'));
                        bVal = parseFloat(b.getAttribute('data-amount'));
                        return ascending ? aVal - bVal : bVal - aVal;
                    case 'status':
                        aVal = a.getAttribute('data-status');
                        bVal = b.getAttribute('data-status');
                        break;
                }
                
                // String comparison for non-numeric fields
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                
                return 0;
            });
            
            // Reattach rows in new sorted order
            const tbody = table.querySelector('tbody');
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

function showNotification(message) {
    // In a real application, you would use a proper notification system
    alert(message);
}

document.getElementById('invoiceForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Collect data from the form
    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientTaxId = document.getElementById('clientTaxId').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const issueDate = document.getElementById('issueDate').value;
    const dueDate = document.getElementById('dueDate').value;
    const paymentTerms = document.getElementById('paymentTerms').value;
    const issuerName = document.getElementById('issuerName').value;
    const issuerNuit = document.getElementById('issuerNuit').value;
    const issuerAddress = document.getElementById('issuerAddress').value;
    const description = document.getElementById('description').value;
    const totalWithoutTaxes = document.getElementById('totalWithoutTaxes').value;
    const vatRate = document.getElementById('vatRate').value;
    const vatAmount = document.getElementById('vatAmount').value;
    const totalAmountPayable = document.getElementById('totalAmountPayable').value;
    const paymentConditions = document.getElementById('paymentConditions').value;
    const legalInfo = document.getElementById('legalInfo').value;
});

// Generate Invoice HTML
async function generateInvoiceHTML(invoiceData) {
    try {
        // Store current invoice data globally
        window.currentInvoiceData = invoiceData;
        
        // Load template
        const response = await fetch('/templates/invoice_template01.html');
        const template = await response.text();
        
        // Create a blob URL for the template
        const blob = new Blob([template], { type: 'text/html' });
        const templateUrl = URL.createObjectURL(blob);
        
        return templateUrl;
    } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
    }
}

function getInvoiceData() {
    const form = document.getElementById('invoiceForm');
    const itemRows = document.querySelectorAll('.item-row');

    // Fetch client name from the input field (handles both new and existing clients)
    const clientInput = document.getElementById('client-input');
    const clientName = clientInput ? clientInput.value : '';

    return {
        // Company Information
        companyName: 'WALAKA SISTEMAS',
        companyNUIT: '123456789',
        commercialRegNo: 'RC123456',
        companyAddress: 'Av. 25 de Setembro, 1234',
        companyCity: 'Maputo',
        companyPostalCode: '1100',
        companyProvince: 'Maputo',
        
        // Invoice Details
        invoiceNumber: document.getElementById('invoiceNumber').value,
        issueDate: document.getElementById('issueDate').value,
        dueDate: document.getElementById('dueDate').value,
        currency: 'MZN', // Fixed to MZN for Mozambique
        
        // Client Details
        customerId: document.getElementById('customerId').value,
        clientName: document.getElementById('clientName').value,
        clientTaxId: document.getElementById('clientTaxId').value,
        clientAddress: document.getElementById('clientAddress').value,
        
        // Items remain the same but add required fields
        items: Array.from(document.querySelectorAll('.item-row')).map(row => ({
            code: row.querySelector('.item-code').value,
            description: row.querySelector('.item-description').value,
            quantity: row.querySelector('.item-quantity').value,
            unit: row.querySelector('.item-unit').value || 'UN',
            unitPrice: row.querySelector('.item-price').value,
            taxCode: 'IVA',
            taxCountryRegion: 'MZ',
            vatRate: 16,
            vat: row.querySelector('.item-vat').textContent,
            total: row.querySelector('.item-total').textContent
        })),
        
        // Totals
        subtotal: document.getElementById('subtotal').textContent,
        totalVat: document.getElementById('totalVat').textContent,
        total: document.getElementById('invoiceTotal').textContent,
        
        // Payment Information
        paymentMethod: document.getElementById('paymentMethod').value,
        paymentTerms: document.getElementById('paymentTerms').value,
        
        // Software Details
        softwareName: 'WALAKA ERP',
        softwareVersion: '1.0.0',
        softwareCertNo: 'AGT/2024/0001',
        
        // Timestamp for the digital signature
        signatureTimestamp: new Date().toISOString(),
        
        // Notes
        notes: document.getElementById('notes').value
    };
}

// Preview functionality
document.getElementById('previewInvoiceBtn').addEventListener('click', async function() {
    const invoiceData = getInvoiceData();
    const invoiceHTML = await generateInvoiceHTML(invoiceData);
    
    const frame = document.getElementById('invoicePreviewFrame');
    frame.contentWindow.document.open();
    frame.contentWindow.document.write(invoiceHTML);
    frame.contentWindow.document.close();
    
    document.getElementById('viewInvoiceModal').style.display = 'block';
});

// Download functionality
document.getElementById('downloadPdfBtn').addEventListener('click', async function() {
    const invoiceData = getInvoiceData();
    const invoiceHTML = await generateInvoiceHTML(invoiceData);
    
    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(invoiceHTML);
    iframe.contentWindow.document.close();
    
    // Wait for content to load
    setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
});

// Generate QR code with required Mozambican tax information
async function generateInvoiceQRCode(invoiceData) {
    const qrData = {
        nuit: invoiceData.companyNUIT,
        invoiceNo: invoiceData.invoiceNumber,
        date: invoiceData.issueDate,
        total: invoiceData.totalAmount,
        tax: invoiceData.vatAmount,
        hash: invoiceData.signatureHash
    };
    
    return await QRCode.toDataURL(JSON.stringify(qrData));
}

// Generate digital signature hash
async function generateSignatureHash(invoiceData) {
    const dataToHash = `${invoiceData.companyNUIT}|${invoiceData.invoiceNumber}|${invoiceData.issueDate}|${invoiceData.totalAmount}|${invoiceData.vatAmount}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate SAF-T MZ XML
function generateSAFTXML(invoiceData) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:MZ_1.0_01">
    <Header>
        <AuditFileVersion>1.0.1</AuditFileVersion>
        <CompanyID>${invoiceData.companyNUIT}</CompanyID>
        <TaxRegistrationNumber>${invoiceData.companyNUIT}</TaxRegistrationNumber>
        <TaxAccountingBasis>F</TaxAccountingBasis>
        <CompanyName>${invoiceData.companyName}</CompanyName>
        <BusinessName>${invoiceData.companyName}</BusinessName>
        <CompanyAddress>
            <AddressDetail>${invoiceData.companyAddress}</AddressDetail>
            <City>${invoiceData.companyCity}</City>
            <PostalCode>${invoiceData.companyPostalCode}</PostalCode>
            <Country>MZ</Country>
        </CompanyAddress>
        <FiscalYear>${new Date().getFullYear()}</FiscalYear>
        <StartDate>${invoiceData.startDate}</StartDate>
        <EndDate>${invoiceData.endDate}</EndDate>
        <CurrencyCode>MZN</CurrencyCode>
        <DateCreated>${new Date().toISOString()}</DateCreated>
        <TaxEntity>Global</TaxEntity>
        <ProductCompanyTaxID>${invoiceData.softwareCompanyNUIT}</ProductCompanyTaxID>
        <SoftwareCertificateNumber>${invoiceData.softwareCertNo}</SoftwareCertificateNumber>
        <ProductID>${invoiceData.softwareId}</ProductID>
        <ProductVersion>${invoiceData.softwareVersion}</ProductVersion>
    </Header>
    <SourceDocuments>
        <SalesInvoices>
            <NumberOfEntries>1</NumberOfEntries>
            <TotalDebit>0.00</TotalDebit>
            <TotalCredit>${invoiceData.totalAmount}</TotalCredit>
            <Invoice>
                <InvoiceNo>${invoiceData.invoiceNumber}</InvoiceNo>
                <DocumentStatus>
                    <InvoiceStatus>N</InvoiceStatus>
                    <InvoiceStatusDate>${invoiceData.issueDate}T${invoiceData.issueTime}</InvoiceStatusDate>
                    <SourceID>${invoiceData.userId}</SourceID>
                    <SourceBilling>P</SourceBilling>
                </DocumentStatus>
                <Hash>${invoiceData.signatureHash}</Hash>
                <HashControl>1</HashControl>
                <Period>${new Date().getMonth() + 1}</Period>
                <InvoiceDate>${invoiceData.issueDate}</InvoiceDate>
                <InvoiceType>FT</InvoiceType>
                <SpecialRegimes>
                    <SelfBillingIndicator>0</SelfBillingIndicator>
                    <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
                    <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
                </SpecialRegimes>
                <SourceID>${invoiceData.userId}</SourceID>
                <SystemEntryDate>${invoiceData.issueDate}T${invoiceData.issueTime}</SystemEntryDate>
                <CustomerID>${invoiceData.clientId}</CustomerID>
                <Line>${generateSAFTLines(invoiceData.items)}</Line>
                <DocumentTotals>
                    <TaxPayable>${invoiceData.vatAmount}</TaxPayable>
                    <NetTotal>${invoiceData.subtotal}</NetTotal>
                    <GrossTotal>${invoiceData.totalAmount}</GrossTotal>
                </DocumentTotals>
            </Invoice>
        </SalesInvoices>
    </SourceDocuments>
</AuditFile>`;
}

function generateSAFTLines(items) {
    return items.map((item, index) => `
        <LineNumber>${index + 1}</LineNumber>
        <ProductCode>${item.code}</ProductCode>
        <ProductDescription>${item.description}</ProductDescription>
        <Quantity>${item.quantity}</Quantity>
        <UnitOfMeasure>${item.unit}</UnitOfMeasure>
        <UnitPrice>${item.unitPrice}</UnitPrice>
        <TaxPointDate>${item.date}</TaxPointDate>
        <Description>${item.description}</Description>
        <CreditAmount>${item.total}</CreditAmount>
        <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>MZ</TaxCountryRegion>
            <TaxCode>${item.taxCode}</TaxCode>
            <TaxPercentage>${item.vatRate}</TaxPercentage>
        </Tax>
    `).join('');
}

function validateInvoiceForm(data) {
    const errors = {};
    
    // Required fields validation
    if (!data.documentType) errors.documentType = 'Document type is required';
    if (!data.clientNUIT) errors.clientNUIT = 'Client NUIT is required';
    if (!data.issueDate) errors.issueDate = 'Issue date is required';
    if (data.items.length === 0) errors.items = 'At least one item is required';
    
    // NUIT format validation (9 digits)
    if (data.clientNUIT && !/^\d{9}$/.test(data.clientNUIT)) {
        errors.clientNUIT = 'NUIT must be 9 digits';
    }
    
    // Items validation
    data.items.forEach((item, index) => {
        if (!item.description) errors[`item_${index}_description`] = 'Description is required';
        if (!item.quantity || item.quantity <= 0) errors[`item_${index}_quantity`] = 'Valid quantity is required';
        if (!item.unitPrice || item.unitPrice < 0) errors[`item_${index}_price`] = 'Valid price is required';
    });
    
    return errors;
}

const CURRENCIES = {
    MZN: { symbol: 'MT', name: 'Metical', decimal: 2 },
    USD: { symbol: '$', name: 'US Dollar', decimal: 2 },
    EUR: { symbol: '€', name: 'Euro', decimal: 2 },
    ZAR: { symbol: 'R', name: 'Rand', decimal: 2 }
};

function initializePaymentMethods() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (!paymentMethodSelect) return;

    // Clear existing options
    paymentMethodSelect.innerHTML = '';

    // Add basic payment methods
    const basicMethods = [
        ['CASH', 'Cash Payment'],
        ['BANK', 'Bank Transfer'],
        ['MOBILE', 'Mobile Money']
    ];

    basicMethods.forEach(([value, text]) => {
        const option = new Option(text, value);
        paymentMethodSelect.add(option);
    });

    // Add configured payment gateways
    paymentManager.paymentMethods.forEach((method, gateway) => {
        const gatewayInfo = PAYMENT_GATEWAYS[gateway];
        if (gatewayInfo && method.active) {
            const option = new Option(gatewayInfo.name, gateway);
            paymentMethodSelect.add(option);
        }
    });
}

function showPaymentDetails(gateway) {
    const detailsContainer = document.getElementById('paymentDetailsContainer');
    if (!detailsContainer) return;

    const method = paymentManager.paymentMethods.get(gateway);
    if (!method) return;

    const gatewayInfo = PAYMENT_GATEWAYS[gateway];
    let html = `<div class="payment-details-box">
        <h4><i class="${gatewayInfo.icon}"></i> ${gatewayInfo.name}</h4>`;

    for (const [key, value] of Object.entries(method.details)) {
        html += `<div class="detail-row">
            <span class="detail-label">${key}:</span>
            <span class="detail-value">${value}</span>
        </div>`;
    }

    html += '</div>';
    detailsContainer.innerHTML = html;
}

function loadInvoiceTemplates() {
    const templateSelect = document.getElementById('templateSelector');
    if (!templateSelect) return;

    templateSelect.innerHTML = '';

    // Available templates with previews
    const templates = [
        { 
            id: 'template1', 
            name: 'Standard Invoice', 
            preview: '/templates/preview1.png',
            file: 'invoice_template01.html'
        },
        { 
            id: 'template2', 
            name: 'Professional', 
            preview: '/templates/preview2.png',
            file: 'invoice_template02.html'
        },
        { 
            id: 'template3', 
            name: 'Modern Design', 
            preview: '/templates/preview3.png',
            file: 'invoice_template03.html'
        }
    ];

    // Create template selector grid
    const templateGrid = document.createElement('div');
    templateGrid.className = 'template-grid';

    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;
        card.innerHTML = `
            <img src="${template.preview}" alt="${template.name}" class="template-preview">
            <div class="template-name">${template.name}</div>
        `;
        
        card.addEventListener('click', () => selectTemplate(template));
        templateGrid.appendChild(card);
    });

    const container = templateSelect.parentElement;
    container.appendChild(templateGrid);
}

function selectTemplate(template) {
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.templateId === template.id) {
            card.classList.add('selected');
        }
    });

    // Store selected template
    localStorage.setItem('selectedTemplate', JSON.stringify(template));

    // Preview template with current data
    const currentData = getInvoiceData();
    previewTemplate(template.file, currentData);
}

// Enhanced validation for Mozambican requirements
function validateInvoiceForm(data) {
    const errors = {};
    
    // Document type validation
    if (!data.documentType) {
        errors.documentType = 'Document type is required';
    }

    // NUIT validation (9 digits)
    if (!data.clientNUIT || !/^\d{9}$/.test(data.clientNUIT)) {
        errors.clientNUIT = 'Valid NUIT with 9 digits is required';
    }

    // Required client fields
    if (!data.clientName) errors.clientName = 'Client name is required';
    if (!data.clientAddress) errors.clientAddress = 'Client address is required';

    // Fiscal validation
    if (data.selfBilling && !data.clientTaxId) {
        errors.clientTaxId = 'Client Tax ID is required for self-billing';
    }

    // Items validation
    if (!data.items || data.items.length === 0) {
        errors.items = 'At least one item is required';
    } else {
        data.items.forEach((item, index) => {
            const itemPrefix = `item_${index}`;
            if (!item.description) {
                errors[`${itemPrefix}_description`] = 'Description is required';
            }
            if (!item.quantity || item.quantity <= 0) {
                errors[`${itemPrefix}_quantity`] = 'Valid quantity is required';
            }
            if (!item.unitPrice || item.unitPrice < 0) {
                errors[`${itemPrefix}_price`] = 'Valid price is required';
            }
            if (!item.unit) {
                errors[`${itemPrefix}_unit`] = 'Unit of measure is required';
            }
            // VAT validation
            if (item.vatExempt && !item.vatExemptReason) {
                errors[`${itemPrefix}_vatExempt`] = 'Reason for VAT exemption is required';
            }
        });
    }

    // Payment validation
    if (data.amountReceived > 0 && !data.paymentMethod) {
        errors.paymentMethod = 'Payment method is required when amount is received';
    }

    // Date validation
    if (!data.issueDate) {
        errors.issueDate = 'Issue date is required';
    } else {
        const issueDate = new Date(data.issueDate);
        if (isNaN(issueDate.getTime())) {
            errors.issueDate = 'Invalid issue date';
        }
    }

    return errors;
}

// Modify save as draft to choose template
document.getElementById('saveAsDraftBtn').addEventListener('click', function() {
    const templateModal = document.getElementById('templateModal');
    if (templateModal) {
        templateModal.style.display = 'block';
    }
});

// Company Profile and Invoice Management
class InvoiceManager {
    constructor() {
        this.companyProfile = null;
        this.currentInvoiceNumber = 0;
        this.initialize();
    }

    async initialize() {
        await this.loadCompanyProfile();
        await this.loadLastInvoiceNumber();
        this.setupEventListeners();
        this.populateCompanyData();
    }

    async loadCompanyProfile() {
        const { data, error } = await window.supabase
            .from('company_profile')
            .select('*')
            .single();
        
        if (error) {
            console.error('Error loading company profile:', error);
            return;
        }
        
        this.companyProfile = data;
    }

    async loadLastInvoiceNumber() {
        const { data, error } = await window.supabase
            .from('invoices')
            .select('invoice_number')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!error && data.length > 0) {
            this.currentInvoiceNumber = parseInt(data[0].invoice_number.split('-')[2]);
        }
    }

    getNextInvoiceNumber() {
        this.currentInvoiceNumber++;
        const year = new Date().getFullYear();
        return `INV-${year}-${String(this.currentInvoiceNumber).padStart(4, '0')}`;
    }

    setupEventListeners() {
        // Template selection handler
        document.getElementById('invoiceTemplate')?.addEventListener('change', (e) => {
            this.loadTemplate(e.target.value);
        });

        // Recurring invoice toggle
        document.getElementById('isRecurring')?.addEventListener('change', (e) => {
            const recurringOptions = document.getElementById('recurringOptions');
            recurringOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Currency change handler
        document.getElementById('currency')?.addEventListener('change', (e) => {
            this.updateCurrency(e.target.value);
        });
    }

    async loadTemplate(templateId) {
        const { data, error } = await window.supabase
            .from('invoice_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (error) {
            console.error('Error loading template:', error);
            return;
        }

        this.populateTemplate(data);
    }

    populateTemplate(template) {
        // Populate form fields with template data
        document.getElementById('notes').value = template.default_notes || '';
        // Add more template population logic
    }

    updateCurrency(currency) {
        // Update all amount fields to use selected currency
        const amountElements = document.querySelectorAll('.item-price, .item-total');
        amountElements.forEach(el => {
            // Update currency symbol and formatting
            this.formatAmount(el, currency);
        });
    }

    formatAmount(element, currency) {
        const amount = parseFloat(element.textContent.replace(/[^\d.-]/g, ''));
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        });
        element.textContent = formatter.format(amount);
    }

    populateCompanyData() {
        if (!this.companyProfile) return;

        // Populate company information in the invoice
        const companyFields = {
            'companyName': this.companyProfile.name,
            'companyAddress': this.companyProfile.address,
            'companyVAT': this.companyProfile.vat_number,
            // Add more fields as needed
        };

        for (const [id, value] of Object.entries(companyFields)) {
            const element = document.getElementById(id);
            if (element) element.value = value;
        }
    }
}

// Initialize invoice manager
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceManager = new InvoiceManager();
});

