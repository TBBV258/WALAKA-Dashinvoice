// Invoice Management Module JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeInvoiceModule();
    setupEventListeners();
    setupCharts();
});

function initializeInvoiceModule() {
    console.log('Invoice Management Module initialized');
    
    // Setup invoice item calculations
    setupItemCalculations();
    
    // Initialize date fields with appropriate values
    initializeDateFields();
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
    
    // Draft button
    const saveAsDraftBtn = document.getElementById('saveAsDraftBtn');
    if (saveAsDraftBtn) {
        saveAsDraftBtn.addEventListener('click', function() {
            saveInvoiceAsDraft();
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
    const modals = document.querySelectorAll('.modal');
    const overlay = document.querySelector('.modal-overlay');
    
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
    let totalVat = 0;
    
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        
        const rowSubtotal = quantity * price;
        const rowVat = rowSubtotal * 0.16;
        
        subtotal += rowSubtotal;
        totalVat += rowVat;
    });
    
    const grandTotal = subtotal + totalVat;
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('totalVat').textContent = totalVat.toFixed(2);
    document.getElementById('invoiceTotal').textContent = grandTotal.toFixed(2);
}

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

function saveInvoice() {
    // Collect form data
    const invoiceData = collectInvoiceData();
    
    // Simulate API call to save invoice
    console.log('Saving invoice:', invoiceData);
    
    // In a real application, you would send this data to your server
    // fetch('/api/invoices', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(invoiceData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     // Handle successful save
    // })
    // .catch(error => {
    //     // Handle error
    // });
    
    // For demo, simulate successful save
    showNotification('Invoice created successfully!');
    closeAllModals();
    
    // In a real app, you would refresh the invoice list or add the new invoice to the table
}

function saveInvoiceAsDraft() {
    // Similar to saveInvoice but with draft status
    const invoiceData = collectInvoiceData();
    invoiceData.status = 'draft';
    
    console.log('Saving invoice as draft:', invoiceData);
    
    showNotification('Invoice saved as draft');
    closeAllModals();
}

function collectInvoiceData() {
    // Collect all form data into a structured object
    const invoiceData = {
        invoiceNumber: document.getElementById('invoiceNumber').value,
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientTaxId: document.getElementById('clientTaxId').value,
        issueDate: document.getElementById('issueDate').value,
        dueDate: document.getElementById('dueDate').value,
        currency: document.getElementById('currency').value,
        paymentTerms: document.getElementById('paymentTerms').value,
        notes: document.getElementById('notes').value,
        status: 'pending', // Default status for new invoices
        items: [],
        subtotal: parseFloat(document.getElementById('subtotal').textContent),
        totalTax: parseFloat(document.getElementById('totalVat').textContent),
        total: parseFloat(document.getElementById('invoiceTotal').textContent)
    };
    
    // Collect all invoice items
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        const vat = parseFloat(row.querySelector('.item-vat').textContent);
        const total = parseFloat(row.querySelector('.item-total').textContent);
        
        // Only add non-empty items
        if (description.trim() !== '' && quantity > 0) {
            invoiceData.items.push({
                description,
                quantity,
                price,
                iva: 16, // 16% VAT rate
                vat,
                total
            });
        }
    });
    
    return invoiceData;
}

function previewInvoice() {
    // Collect the invoice data
    const invoiceData = collectInvoiceData();
    
    // Store in localStorage for the template to use
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    
    // Store template settings if needed
    const templateSettings = {
        color: '#007ec7', // Default WALAKA blue
        // Add other template settings as needed
    };
    localStorage.setItem('templateSettings', JSON.stringify(templateSettings));
    
    // Open the preview in a new tab/window
    window.open('template01.html', '_blank');
}

function openViewInvoiceModal(invoiceNumber) {
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

    // Supabase interaction (replace with your actual Supabase details)
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function insertInvoice() {
        const { data, error } = await supabase
            .from('invoices')
            .insert([
                {
                    user_id: 'your-user-id', // Replace with the actual user ID
                    issuer_name: issuerName,
                    issuer_nuit: issuerNuit,
                    issuer_address: issuerAddress,
                    client_name: clientName,
                    client_nuit: clientTaxId,
                    client_address: clientAddress,
                    invoice_number: invoiceNumber,
                    issue_date: issueDate,
                    description: description,
                    total_without_taxes: totalWithoutTaxes,
                    vat_rate: vatRate,
                    vat_amount: vatAmount,
                    total_amount_payable: totalAmountPayable,
                    payment_conditions: paymentConditions,
                    legal_info: legalInfo
                }
            ]);

        if (error) {
            console.error('Error inserting invoice:', error);
            alert('Failed to create invoice. See console for details.');
        } else {
            console.log('Invoice created successfully:', data);
            alert('Invoice created successfully!');
            // Close the modal and refresh the invoice table
            document.querySelector('.close-modal').click(); // Trigger the close modal
            // You might need to implement a function to refresh the invoice table display
            // refreshInvoiceTable();
        }
    }

    insertInvoice();
});