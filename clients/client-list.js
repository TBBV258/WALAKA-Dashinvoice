/**
 * Client List Handler
 * Manages the client list functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize client list components
  initClientList();
  initSearchAndFilters();
  initViewToggle();
  initDeleteModal();
  initPagination();
  
  // Call refresh to load initial data
  refreshClientList();
});

// Global variables for list state
let currentPage = 1;
const pageSize = 10;
let filteredClients = [];
let searchQuery = '';
let statusFilter = 'all';
let typeFilter = 'all';
let viewMode = 'grid';

/**
 * Initialize the client list
 */
function initClientList() {
  // Check if client list container exists
  const clientListContainer = document.getElementById('client-list');
  if (!clientListContainer) return;
  
  // Setup sample data if localStorage is empty
  setupSampleData();
}

/**
 * Initialize search and filter functionality
 */
function initSearchAndFilters() {
  const searchInput = document.getElementById('client-search');
  const statusFilterSelect = document.getElementById('status-filter');
  const typeFilterSelect = document.getElementById('type-filter');
  
  if (!searchInput || !statusFilterSelect || !typeFilterSelect) return;
  
  // Setup search debounce
  searchInput.addEventListener('input', window.appUtils.debounce(() => {
    searchQuery = searchInput.value.toLowerCase().trim();
    currentPage = 1; // Reset to first page on search
    refreshClientList();
  }, 300));
  
  // Setup status filter
  statusFilterSelect.addEventListener('change', () => {
    statusFilter = statusFilterSelect.value;
    currentPage = 1; // Reset to first page on filter change
    refreshClientList();
  });
  
  // Setup type filter
  typeFilterSelect.addEventListener('change', () => {
    typeFilter = typeFilterSelect.value;
    currentPage = 1; // Reset to first page on filter change
    refreshClientList();
  });
}

/**
 * Initialize view toggle (grid/list)
 */
function initViewToggle() {
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const clientList = document.getElementById('client-list');
  
  if (!gridViewBtn || !listViewBtn || !clientList) return;
  
  // Set initial view from localStorage or default to grid
  viewMode = localStorage.getItem('client-view-mode') || 'grid';
  updateViewMode(viewMode);
  
  // Grid view button
  gridViewBtn.addEventListener('click', () => {
    updateViewMode('grid');
  });
  
  // List view button
  listViewBtn.addEventListener('click', () => {
    updateViewMode('list');
  });
  
  // Helper to update view mode
  function updateViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('client-view-mode', mode);
    
    // Update buttons
    gridViewBtn.classList.toggle('active', mode === 'grid');
    listViewBtn.classList.toggle('active', mode === 'list');
    
    // Update list class
    clientList.className = `client-list ${mode}-view`;
    
    // Refresh list to apply the new view
    refreshClientList();
  }
}

/**
 * Initialize delete confirmation modal
 */
function initDeleteModal() {
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  if (!deleteModal || !confirmDeleteBtn || !cancelDeleteBtn) return;
  
  let clientToDelete = null;
  
  // Setup delete client function for external access
  window.deleteClient = (clientId) => {
    clientToDelete = clientId;
    deleteModal.classList.add('active');
  };
  
  // Confirm delete button
  confirmDeleteBtn.addEventListener('click', () => {
    if (clientToDelete) {
      // Delete the client
      const success = removeClient(clientToDelete);
      if (success) {
        window.appUtils.showToast('Client deleted successfully', 'success');
        refreshClientList();
      } else {
        window.appUtils.showToast('Error deleting client', 'error');
      }
      clientToDelete = null;
    }
    deleteModal.classList.remove('active');
  });
  
  // Cancel delete button
  cancelDeleteBtn.addEventListener('click', () => {
    clientToDelete = null;
    deleteModal.classList.remove('active');
  });
  
  // Close modal buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      clientToDelete = null;
      deleteModal.classList.remove('active');
    });
  });
}

/**
 * Initialize pagination controls
 */
function initPagination() {
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  
  if (!prevPageBtn || !nextPageBtn || !pageInfo) return;
  
  // Previous page button
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      refreshClientList();
    }
  });
  
  // Next page button
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredClients.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      refreshClientList();
    }
  });
}

/**
 * Refresh the client list with current filters and pagination
 */
function refreshClientList() {
  const clientList = document.getElementById('client-list');
  const pageInfo = document.getElementById('page-info');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  
  if (!clientList) return;
  
  // Show loading state
  clientList.innerHTML = `
    <div class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading clients...</span>
    </div>
  `;
  
  // Get all clients
  const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
  
  // Apply filters
  filteredClients = allClients.filter(client => {
    // Status filter
    if (statusFilter !== 'all' && client.status !== statusFilter) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== 'all' && client.clientType !== typeFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const searchFields = [
        client.firstName,
        client.lastName,
        client.companyName,
        client.displayName,
        client.email
      ].filter(Boolean).map(field => field.toLowerCase());
      
      return searchFields.some(field => field.includes(searchQuery));
    }
    
    return true;
  });
  
  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  
  // Update pagination controls
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
  
  // Get current page of clients
  const startIndex = (currentPage - 1) * pageSize;
  const currentPageClients = filteredClients.slice(startIndex, startIndex + pageSize);
  
  // Clear loading state
  clientList.innerHTML = '';
  
  // Show empty state if no clients
  if (currentPageClients.length === 0) {
    clientList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No clients found</h3>
        <p>Try adjusting your search or filters, or add a new client.</p>
      </div>
    `;
    return;
  }
  
  // Render clients based on view mode
  currentPageClients.forEach(client => {
    const clientElement = document.createElement('div');
    clientElement.className = 'client-item';
    
    if (viewMode === 'grid') {
      clientElement.innerHTML = `
        <div class="client-info">
          <span class="client-type ${client.clientType}">${client.clientType === 'business' ? 'Business' : 'Individual'}</span>
          <h4>${client.displayName || `${client.firstName} ${client.lastName}`}</h4>
          <p>${client.email || ''}</p>
          ${client.companyName ? `<p>${client.companyName}</p>` : ''}
          <div class="client-contact">
            ${client.workPhone ? `<p><i class="fas fa-phone"></i> ${client.workPhone}</p>` : ''}
            ${client.mobile ? `<p><i class="fas fa-mobile-alt"></i> ${client.mobile}</p>` : ''}
          </div>
          <span class="status-btn ${client.status}">${client.status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="client-actions">
          <button class="edit-btn" onclick="editClient(${client.id})" aria-label="Edit client">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" onclick="deleteClient(${client.id})" aria-label="Delete client">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    } else {
      clientElement.innerHTML = `
        <div class="client-info">
          <span class="client-type ${client.clientType}">${client.clientType === 'business' ? 'Business' : 'Individual'}</span>
          <h4>${client.displayName || `${client.firstName} ${client.lastName}`}</h4>
          <div class="client-details">
            <p>${client.email || ''}</p>
            ${client.workPhone ? `<span><i class="fas fa-phone"></i> ${client.workPhone}</span>` : ''}
          </div>
        </div>
        <div class="client-actions">
          <span class="status-btn ${client.status}">${client.status === 'active' ? 'Active' : 'Inactive'}</span>
          <button class="edit-btn" onclick="editClient(${client.id})" aria-label="Edit client">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" onclick="deleteClient(${client.id})" aria-label="Delete client">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }
    
    clientList.appendChild(clientElement);
  });
}

/**
 * Remove a client by ID
 * @param {number} clientId - ID of the client to remove
 * @returns {boolean} - Success status
 */
function removeClient(clientId) {
  // Get all clients
  const clients = JSON.parse(localStorage.getItem('clients') || '[]');
  
  // Find client index
  const index = clients.findIndex(client => client.id === clientId);
  
  if (index !== -1) {
    // Remove client
    clients.splice(index, 1);
    
    // Save back to localStorage
    localStorage.setItem('clients', JSON.stringify(clients));
    
    return true;
  }
  
  return false;
}

/**
 * Setup sample data if no clients exist
 */
function setupSampleData() {
  // Check if sample data already exists
  const existingClients = JSON.parse(localStorage.getItem('clients') || '[]');
  
  if (existingClients.length === 0) {
    // Create sample clients
    const sampleClients = [
      {
        id: 1,
        clientType: 'business',
        salutation: 'Mr.',
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'Acme Corporation',
        displayName: 'Acme Corporation',
        email: 'john.smith@acme.com',
        workPhone: '555-123-4567',
        mobile: '555-987-6543',
        currency: 'USD',
        taxRate: 'standard',
        paymentTerms: 'net-30',
        priceList: 'standard',
        enablePortal: true,
        portalLanguage: 'en',
        status: 'active',
        createdAt: '2023-07-15T10:30:00Z',
        billingAddress: {
          attention: 'Accounts Payable',
          country: 'us',
          street1: '123 Business Ave',
          street2: 'Suite 500',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          phone: '555-111-2222'
        },
        shippingAddress: {
          attention: 'Receiving Dept',
          country: 'us',
          street1: '123 Business Ave',
          street2: 'Loading Dock B',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          phone: '555-333-4444'
        }
      },
      {
        id: 2,
        clientType: 'individual',
        salutation: 'Ms.',
        firstName: 'Sarah',
        lastName: 'Johnson',
        displayName: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        mobile: '555-222-3333',
        currency: 'USD',
        taxRate: 'exempt',
        paymentTerms: 'due-receipt',
        enablePortal: false,
        status: 'active',
        createdAt: '2023-08-20T14:15:00Z',
        billingAddress: {
          country: 'us',
          street1: '456 Residential St',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001'
        },
        shippingAddress: {
          country: 'us',
          street1: '456 Residential St',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001'
        }
      },
      {
        id: 3,
        clientType: 'business',
        salutation: 'Dr.',
        firstName: 'Robert',
        lastName: 'Chen',
        companyName: 'TechInnovate Solutions',
        displayName: 'TechInnovate Solutions',
        email: 'robert@techinnovate.com',
        workPhone: '555-444-5555',
        currency: 'USD',
        taxRate: 'standard',
        paymentTerms: 'net-15',
        priceList: 'vip',
        enablePortal: true,
        portalLanguage: 'en',
        status: 'inactive',
        createdAt: '2023-06-05T09:45:00Z',
        billingAddress: {
          attention: 'Finance Department',
          country: 'us',
          street1: '789 Tech Park',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          phone: '555-666-7777'
        },
        shippingAddress: {
          attention: 'Warehouse',
          country: 'us',
          street1: '789 Tech Park',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          phone: '555-666-7777'
        }
      },
      {
        id: 4,
        clientType: 'individual',
        salutation: 'Mrs.',
        firstName: 'Emily',
        lastName: 'Williams',
        displayName: 'Emily Williams',
        email: 'emily.w@example.com',
        workPhone: '555-888-9999',
        mobile: '555-777-8888',
        currency: 'USD',
        taxRate: 'reduced',
        paymentTerms: 'net-30',
        enablePortal: false,
        status: 'active',
        createdAt: '2023-09-12T11:20:00Z',
        billingAddress: {
          country: 'us',
          street1: '321 Main St',
          city: 'Chicago',
          state: 'IL',
          zip: '60601'
        },
        shippingAddress: {
          country: 'us',
          street1: '321 Main St',
          city: 'Chicago',
          state: 'IL',
          zip: '60601'
        }
      },
      {
        id: 5,
        clientType: 'business',
        salutation: 'Mr.',
        firstName: 'David',
        lastName: 'Lee',
        companyName: 'Global Logistics Inc.',
        displayName: 'Global Logistics Inc.',
        email: 'david.lee@globallogistics.com',
        workPhone: '555-333-2222',
        currency: 'USD',
        taxRate: 'standard',
        paymentTerms: 'net-60',
        priceList: 'wholesale',
        enablePortal: true,
        portalLanguage: 'en',
        status: 'active',
        createdAt: '2023-05-18T08:10:00Z',
        billingAddress: {
          attention: 'Accounts Department',
          country: 'us',
          street1: '555 Shipping Way',
          street2: 'Floor 3',
          city: 'Miami',
          state: 'FL',
          zip: '33101',
          phone: '555-111-3333'
        },
        shippingAddress: {
          attention: 'Distribution Center',
          country: 'us',
          street1: '999 Harbor Dr',
          city: 'Miami',
          state: 'FL',
          zip: '33101',
          phone: '555-222-4444'
        }
      }
    ];
    
    // Save sample clients to localStorage
    localStorage.setItem('clients', JSON.stringify(sampleClients));
  }
}

// Make refresh function globally available
window.refreshClientList = refreshClientList;
