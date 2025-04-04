/**
 * WALAKA Onboarding Script
 * Handles the step-by-step onboarding process
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the onboarding process
    initOnboarding();
});

/**
 * Initialize the onboarding process
 */
function initOnboarding() {
    // Set random reference numbers for payment options
    const referenceNumber = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    
    const refNumberElem = document.getElementById('reference-number');
    if (refNumberElem) {
        refNumberElem.textContent = referenceNumber;
    }
    
    const mpesaRefElem = document.getElementById('mpesa-reference');
    if (mpesaRefElem) {
        mpesaRefElem.textContent = referenceNumber;
    }
    
    // Setup event listeners for navigation
    setupNavigationButtons();
    
    // Setup other interactive elements
    setupTemplateSelection();
    setupColorSelection();
    setupInvoiceFormatSelection();
    setupPaymentMethodSelection();
    
    // Setup click listeners for progress steps in sidebar
    setupSidebarNavigation();
}

/**
 * Setup navigation buttons (next and previous)
 */
function setupNavigationButtons() {
    // Step 1 next button
    const step1Next = document.getElementById('step1-next');
    if (step1Next) {
        step1Next.addEventListener('click', function() {
            showStep(2);
        });
    }
    
    // Step 2 prev/next buttons
    const step2Prev = document.getElementById('step2-prev');
    if (step2Prev) {
        step2Prev.addEventListener('click', function() {
            showStep(1);
        });
    }
    
    const step2Next = document.getElementById('step2-next');
    if (step2Next) {
        step2Next.addEventListener('click', function() {
            // Validate company name field (minimal validation for demo)
            const companyName = document.getElementById('company-name').value;
            if (!companyName.trim()) {
                showNotification('error', 'Please enter your company name');
                return;
            }
            
            showStep(3);
        });
    }
    
    // Step 3 prev/next buttons
    const step3Prev = document.getElementById('step3-prev');
    if (step3Prev) {
        step3Prev.addEventListener('click', function() {
            showStep(2);
        });
    }
    
    const step3Next = document.getElementById('step3-next');
    if (step3Next) {
        step3Next.addEventListener('click', function() {
            showStep(4);
        });
    }
    
    // Step 4 prev button and complete setup button
    const step4Prev = document.getElementById('step4-prev');
    if (step4Prev) {
        step4Prev.addEventListener('click', function() {
            showStep(3);
        });
    }
    
    const completeSetupBtn = document.getElementById('complete-setup');
    if (completeSetupBtn) {
        completeSetupBtn.addEventListener('click', function() {
            completeSetup();
        });
    }
}

/**
 * Setup sidebar navigation steps
 */
function setupSidebarNavigation() {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.getAttribute('data-step'));
            const currentStep = getCurrentStep();
            
            // Only allow navigation to completed steps or the current step
            if (stepNum <= currentStep) {
                showStep(stepNum);
            }
        });
    });
}

/**
 * Get the current active step
 * @returns {number} - The current step number
 */
function getCurrentStep() {
    const activeStep = document.querySelector('.progress-step.active');
    return activeStep ? parseInt(activeStep.getAttribute('data-step')) : 1;
}

/**
 * Show a specific step in the onboarding process
 * @param {number} stepNumber - The step number to show
 */
function showStep(stepNumber) {
    // Validate step number
    if (stepNumber < 1 || stepNumber > 4) {
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Show the target step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.remove('hidden');
    }
    
    // Update progress indicators
    updateProgressIndicators(stepNumber);
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Update the progress indicators in the sidebar
 * @param {number} currentStep - The current step number
 */
function updateProgressIndicators(currentStep) {
    // Reset all steps
    document.querySelectorAll('.progress-step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        
        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });
}

/**
 * Setup template selection functionality
 */
function setupTemplateSelection() {
    const templateOptions = document.querySelectorAll('.template-option');
    
    templateOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            templateOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            showNotification('info', 'Template selected');
        });
    });
}

/**
 * Setup color theme selection functionality
 */
function setupColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Get the selected color
            const selectedColor = this.getAttribute('data-color');
            
            // Update root CSS variable
            document.documentElement.style.setProperty('--primary-color', selectedColor);
            
            // Also update primary-dark with a slightly darker version
            const darkerColor = getDarkerColor(selectedColor);
            document.documentElement.style.setProperty('--primary-dark', darkerColor);
            
            showNotification('info', 'Color theme updated');
        });
    });
}

/**
 * Get a darker shade of a color
 * @param {string} color - The hexadecimal color
 * @returns {string} - A darker shade of the provided color
 */
function getDarkerColor(color) {
    // Convert hex to RGB
    let r = parseInt(color.substr(1, 2), 16);
    let g = parseInt(color.substr(3, 2), 16);
    let b = parseInt(color.substr(5, 2), 16);
    
    // Darken by 15%
    r = Math.max(0, Math.floor(r * 0.85));
    g = Math.max(0, Math.floor(g * 0.85));
    b = Math.max(0, Math.floor(b * 0.85));
    
    // Convert back to hex
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Setup invoice format selection functionality
 */
function setupInvoiceFormatSelection() {
    const invoiceFormatSelect = document.getElementById('invoice-format');
    const customPrefixContainer = document.querySelector('.custom-prefix');
    
    if (invoiceFormatSelect && customPrefixContainer) {
        invoiceFormatSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            // Show custom prefix field if custom format is selected
            if (selectedValue === '{PREFIX}-{NUMBER}') {
                customPrefixContainer.style.display = 'block';
            } else {
                customPrefixContainer.style.display = 'none';
            }
        });
    }
}

/**
 * Setup payment method selection functionality
 */
function setupPaymentMethodSelection() {
    const bankDepositRadio = document.getElementById('bank-deposit');
    const mpesaRadio = document.getElementById('mpesa');
    
    const bankDepositContent = document.getElementById('bank-deposit-content');
    const mpesaContent = document.getElementById('mpesa-content');
    
    if (bankDepositRadio && mpesaRadio && bankDepositContent && mpesaContent) {
        bankDepositRadio.addEventListener('change', function() {
            if (this.checked) {
                bankDepositContent.style.display = 'block';
                mpesaContent.style.display = 'none';
            }
        });
        
        mpesaRadio.addEventListener('change', function() {
            if (this.checked) {
                bankDepositContent.style.display = 'none';
                mpesaContent.style.display = 'block';
            }
        });
    }
}

/**
 * Handle form submission and complete the setup process
 */
function completeSetup() {
    // Get company name
    const companyName = document.getElementById('company-name').value;
    
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Create and show completion message
    const wizardContainer = document.querySelector('.onboarding-wizard');
    wizardContainer.innerHTML = `
        <div class="completion-message">
            <div class="completion-icon success">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 data-lang="en">Setup Complete!</h2>
            <h2 data-lang="pt">Configuração Concluída!</h2>
            <p data-lang="en">Congratulations${companyName ? ' ' + companyName : ''}! Your WALAKA account is now ready to use.</p>
            <p data-lang="pt">Parabéns${companyName ? ' ' + companyName : ''}! Sua conta WALAKA está pronta para uso.</p>
            <div class="completion-actions">
                <a href="dashboard.html" class="btn btn-primary">
                    <i class="fas fa-tachometer-alt"></i>
                    <span data-lang="en">Go to Dashboard</span>
                    <span data-lang="pt">Ir para o Painel</span>
                </a>
            </div>
        </div>
    `;
    
    // Apply styles for completion message
    const style = document.createElement('style');
    style.textContent = `
        .completion-message {
            text-align: center;
            padding: 3rem 1rem;
        }
        .completion-icon {
            font-size: 5rem;
            margin-bottom: 2rem;
        }
        .completion-icon.success {
            color: #2ecc71;
        }
        .completion-actions {
            margin-top: 2.5rem;
        }
    `;
    document.head.appendChild(style);
    
    // Update all progress steps to completed
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active');
        step.classList.add('completed');
    });
    
    // Show success notification
    showNotification('success', 'Setup completed successfully!');
    
    // Initialize language display for new elements
    if (typeof initLanguage === 'function') {
        initLanguage();
    }
}

/**
 * Show a notification message
 * @param {string} type - The notification type ('success', 'error', 'info')
 * @param {string} message - The message to display
 */
function showNotification(type, message) {
    const container = document.querySelector('.notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Determine icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'info':
        default:
            icon = 'info-circle';
            break;
    }
    
    // Set notification content
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
        notification.remove();
    });
    
    // Append to container
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}