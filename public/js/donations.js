/**
 * BAFA Donations JavaScript
 * Handles Stripe checkout integration and donation form functionality
 */

// Initialize Stripe with public key
const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_test_key_here');

// DOM Elements
const donationForm = document.getElementById('donationForm');
const amountInput = document.getElementById('amount');
const presetAmounts = document.querySelectorAll('.preset-amount');
const donateButton = document.getElementById('donateButton');

// ======================
// Event Listeners
// ======================

// Handle preset amount buttons
if (presetAmounts.length > 0) {
  presetAmounts.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all buttons
      presetAmounts.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      this.classList.remove('btn-outline-primary');
      this.classList.add('btn-primary');
      
      // Update amount input
      amountInput.value = this.dataset.amount;
    });
  });
}

// Handle form submission
if (donationForm) {
  donationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate amount
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid donation amount');
      return;
    }
    
    // Disable button during processing
    if (donateButton) {
      donateButton.disabled = true;
      donateButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';
    }
    
    try {
      // Create checkout session
      const response = await fetch('/donate/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          description: 'BAFA Donation'
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });
      
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error:', error);
      showError('There was an error processing your donation. Please try again.');
      
      // Re-enable button
      if (donateButton) {
        donateButton.disabled = false;
        donateButton.innerHTML = 'Donate Now';
      }
    }
  });
}

// ======================
// Helper Functions
// ======================

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Remove any existing error alerts
  const existingAlert = document.querySelector('.donation-error');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // Create error alert element
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger donation-error mt-3';
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    <i class="fas fa-exclamation-circle me-2"></i>
    ${message}
  `;
  
  // Insert after the form
  donationForm.parentNode.insertBefore(alertDiv, donationForm.nextSibling);
  
  // Scroll to error
  alertDiv.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

/**
 * Show success message (for use after returning from Stripe)
 */
function showSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('payment_success')) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success mb-4';
    successDiv.innerHTML = `
      <i class="fas fa-check-circle me-2"></i>
      Thank you for your donation! Your support helps empower Seattle youth.
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.prepend(successDiv);
    
    // Clear the success parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Show success message if returning from Stripe
document.addEventListener('DOMContentLoaded', showSuccess);

// ======================
// Tribute Gift Toggle
// ======================

const tributeCheckbox = document.getElementById('tributeGift');
const tributeFields = document.getElementById('tributeFields');

if (tributeCheckbox && tributeFields) {
  tributeCheckbox.addEventListener('change', function() {
    tributeFields.style.display = this.checked ? 'block' : 'none';
  });
}