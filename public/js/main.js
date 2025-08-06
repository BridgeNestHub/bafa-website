/**
 * MELBA Main JavaScript File
 * Handles common frontend functionality across the site
 * Includes Universal Mobile Form Optimization
 */

document.addEventListener('DOMContentLoaded', function() {
    
  // ======================
  // Mobile Form Optimization - PRIORITY LOAD
  // ======================
  
  // Fix viewport height for mobile browsers
  function setVH() {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
  
  // Universal input focus fix for mobile
  document.addEventListener('focusin', function(e) {
      if (e.target.matches('input, textarea, select')) {
          // Only apply on mobile devices
          if (window.innerWidth <= 768) {
              setTimeout(() => {
                  e.target.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                  });
              }, 300); // Wait for keyboard to appear
          }
      }
  });
  
  // Fix modal backdrop scroll on mobile
  document.addEventListener('shown.bs.modal', function (e) {
      if (window.innerWidth <= 768) {
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
          document.body.style.paddingRight = '0px';
      }
  });
  
  document.addEventListener('hidden.bs.modal', function (e) {
      if (window.innerWidth <= 768) {
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.paddingRight = '';
      }
  });
  
  // Prevent double-tap zoom on mobile
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
          e.preventDefault();
      }
      lastTouchEnd = now;
  }, { passive: false });
  
  // Handle button clicks specifically
  document.addEventListener('touchend', function(e) {
      if (e.target.matches('button, .btn, [type="submit"], [role="button"]')) {
          e.preventDefault();
          setTimeout(() => e.target.click(), 0);
      }
  }, { passive: false });
  
  // iOS Safari specific fixes
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.addEventListener('focusout', function(e) {
          if (e.target.matches('input, textarea, select')) {
              setTimeout(() => {
                  window.scrollTo(0, document.documentElement.scrollTop || document.body.scrollTop);
              }, 100);
          }
      });
      
      document.addEventListener('focus', function(e) {
          if (e.target.matches('input, textarea, select')) {
              e.target.style.transform = 'translateZ(0)';
          }
      });
  }
  
  // ======================
  // Navigation
  // ======================
  
  // Mobile menu toggle
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  
  if (navbarToggler && navbarCollapse) {
      navbarToggler.addEventListener('click', function() {
          navbarCollapse.classList.toggle('show');
      });
  }
  
  // Close mobile menu when clicking a nav link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
      link.addEventListener('click', () => {
          if (navbarCollapse.classList.contains('show')) {
              navbarCollapse.classList.remove('show');
          }
      });
  });
  
  // ======================
  // Smooth Scrolling
  // ======================
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
              window.scrollTo({
                  top: targetElement.offsetTop - 80,
                  behavior: 'smooth'
              });
              
              // Update URL without jumping
              if (history.pushState) {
                  history.pushState(null, null, targetId);
              } else {
                  window.location.hash = targetId;
              }
          }
      });
  });
  
  // ======================
  // Program Tabs
  // ======================
  
  const programTabs = document.querySelectorAll('[data-program-tab]');
  if (programTabs.length > 0) {
      programTabs.forEach(tab => {
          tab.addEventListener('click', function(e) {
              e.preventDefault();
              
              // Get target tab content
              const targetId = this.getAttribute('data-program-tab');
              const targetContent = document.querySelector(targetId);
              
              if (!targetContent) return;
              
              // Hide all tab content
              document.querySelectorAll('.program-content').forEach(content => {
                  content.classList.remove('active');
              });
              
              // Show selected tab content
              targetContent.classList.add('active');
              
              // Update active tab styling
              programTabs.forEach(t => t.classList.remove('active'));
              this.classList.add('active');
          });
      });
      
      // Activate first tab by default
      if (programTabs[0]) {
          programTabs[0].click();
      }
  }
  
  // ======================
  // Universal Form Validation & Handling
  // ======================
  
  // Enhanced contact form validation (mobile optimized)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      const emailInput = this.querySelector('input[type="email"]');
      const messageInput = this.querySelector('textarea');
      let isValid = true;

      // Reset any existing messages
      document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

      // Simple email validation
      if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
        emailInput.classList.add('is-invalid');
        showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
      }

      // Message length validation
      if (messageInput.value.trim().length < 10) {
        messageInput.classList.add('is-invalid');
        showError(messageInput, 'Message must be at least 10 characters.');
        isValid = false;
      } else {
        messageInput.classList.remove('is-invalid');
      }

      if (!isValid) {
        e.preventDefault(); // Block form submission
        scrollToFirstInvalidField(this);
      } else {
        console.log('Form is valid, submitting...');
      }
    });

    function showError(inputElement, message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = message;
      inputElement.parentNode.appendChild(errorDiv);
    }

    function scrollToFirstInvalidField(form) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  // Universal Bootstrap validation forms
  const validationForms = document.querySelectorAll('.needs-validation');
  validationForms.forEach(form => {
      form.addEventListener('submit', function(e) {
          if (!form.checkValidity()) {
              e.preventDefault();
              e.stopPropagation();
              scrollToFirstInvalidField(form);
          }
          form.classList.add('was-validated');
      });
  });
  
  // Mobile-optimized forms
  const mobileForms = document.querySelectorAll('.mobile-form');
  mobileForms.forEach(form => {
      form.addEventListener('submit', function(e) {
          const requiredFields = form.querySelectorAll('[required]');
          let isValid = true;
          
          requiredFields.forEach(field => {
              if (field.type === 'checkbox' || field.type === 'radio') {
                  const name = field.name;
                  const groupChecked = form.querySelector(`[name="${name}"]:checked`);
                  if (!groupChecked) {
                      isValid = false;
                      field.classList.add('is-invalid');
                  }
              } else if (!field.value.trim()) {
                  isValid = false;
                  field.classList.add('is-invalid');
              } else {
                  field.classList.remove('is-invalid');
              }
          });
          
          if (!isValid) {
              e.preventDefault();
              scrollToFirstInvalidField(form);
          }
      });
  });
  
  // Data attribute optimized forms
  const dataOptimizedForms = document.querySelectorAll('form[data-mobile-optimize="true"]');
  dataOptimizedForms.forEach(form => {
      form.addEventListener('submit', function(e) {
          if (!validateForm(form)) {
              e.preventDefault();
              scrollToFirstInvalidField(form);
          }
      });
  });
  
  // Auto-optimize modal forms
  const modalForms = document.querySelectorAll('.modal form');
  modalForms.forEach(form => {
      if (!form.classList.contains('needs-validation') && 
          !form.classList.contains('mobile-form') && 
          !form.hasAttribute('data-mobile-optimize')) {
          
          form.addEventListener('submit', function(e) {
              if (!validateForm(form)) {
                  e.preventDefault();
                  scrollToFirstInvalidField(form);
              }
          });
      }
  });
  
  // Handle forms with data-submit-url
  document.addEventListener('submit', function(e) {
      const form = e.target;
      const submitUrl = form.getAttribute('data-submit-url');
      
      if (submitUrl && validateForm(form)) {
          e.preventDefault();
          handleUniversalFormSubmission(form, submitUrl);
      }
  });
  
  // ======================
  // Form Helper Functions
  // ======================
  
  function scrollToFirstInvalidField(form) {
      let firstInvalid = form.querySelector(':invalid') || 
                        form.querySelector('.is-invalid') ||
                        form.querySelector('[aria-invalid="true"]') ||
                        form.querySelector('input[required]:not([value]):not([type="checkbox"]):not([type="radio"])') ||
                        form.querySelector('select[required][value=""]') ||
                        form.querySelector('textarea[required]:empty');
      
      if (firstInvalid) {
          if (window.innerWidth <= 768) {
              setTimeout(() => {
                  firstInvalid.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                  });
                  firstInvalid.focus();
              }, 100);
          } else {
              firstInvalid.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
              });
              firstInvalid.focus();
          }
      }
      
      form.classList.add('was-validated');
  }
  
  function validateForm(form) {
      let isValid = true;
      
      // Check required fields
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach(field => {
          if (field.type === 'checkbox' || field.type === 'radio') {
              const name = field.name;
              const groupChecked = form.querySelector(`[name="${name}"]:checked`);
              if (!groupChecked) {
                  isValid = false;
                  field.classList.add('is-invalid');
              }
          } else if (!field.value.trim()) {
              isValid = false;
              field.classList.add('is-invalid');
          } else {
              field.classList.remove('is-invalid');
          }
      });
      
      // Check email fields
      const emailFields = form.querySelectorAll('input[type="email"]');
      emailFields.forEach(field => {
          if (field.value && !isValidEmail(field.value)) {
              isValid = false;
              field.classList.add('is-invalid');
          }
      });
      
      return isValid;
  }
  
  function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  }
  
  function handleUniversalFormSubmission(form, submitUrl) {
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...';
      
      const formData = new FormData(form);
      
      // Handle checkbox groups
      const checkboxGroups = {};
      form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
          const name = checkbox.name;
          if (!checkboxGroups[name]) checkboxGroups[name] = [];
          checkboxGroups[name].push(checkbox.value);
      });
      
      for (const [name, values] of Object.entries(checkboxGroups)) {
          formData.set(name, values.join(', '));
      }
      
      fetch(submitUrl, {
          method: 'POST',
          body: formData,
          headers: {
              'X-Requested-With': 'XMLHttpRequest'
          }
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              showUniversalSuccess(form);
          } else {
              showUniversalError(form, data.message || 'Submission failed. Please try again.');
          }
      })
      .catch(error => {
          console.error('Form submission error:', error);
          showUniversalError(form, 'Network error. Please check your connection and try again.');
      })
      .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
      });
  }
  
  function showUniversalSuccess(form) {
      let successMsg = form.parentNode.querySelector('.alert-success') ||
                      form.querySelector('.alert-success') ||
                      document.querySelector(`#${form.id}SuccessMessage`) ||
                      document.querySelector(`#${form.id}Success`);
      
      if (!successMsg) {
          successMsg = document.createElement('div');
          successMsg.className = 'alert alert-success mt-3';
          successMsg.innerHTML = `
              <i class="fas fa-check-circle me-2"></i>
              <strong>Success!</strong> Your form has been submitted successfully.
          `;
          form.parentNode.insertBefore(successMsg, form.nextSibling);
      }
      
      successMsg.style.display = 'block';
      form.style.display = 'none';
      
      if (window.innerWidth <= 768) {
          setTimeout(() => {
              successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
      
      setTimeout(() => {
          successMsg.style.display = 'none';
          form.style.display = 'block';
          form.reset();
          form.classList.remove('was-validated');
      }, 5000);
  }
  
  function showUniversalError(form, message) {
      let errorMsg = form.parentNode.querySelector('.alert-danger') ||
                    form.querySelector('.alert-danger') ||
                    document.querySelector(`#${form.id}ErrorMessage`) ||
                    document.querySelector(`#${form.id}Error`);
      
      if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'alert alert-danger mt-3';
          form.parentNode.insertBefore(errorMsg, form.nextSibling);
      }
      
      errorMsg.innerHTML = `
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Error:</strong> ${message}
      `;
      errorMsg.style.display = 'block';
      
      setTimeout(() => {
          errorMsg.style.display = 'none';
      }, 5000);
  }
  
  // ======================
  // Auto-Optimize Forms
  // ======================
  
  function autoOptimizeForms() {
      // Auto-add mobile-form class to forms in modals
      document.querySelectorAll('.modal form').forEach(form => {
          if (!form.classList.contains('needs-validation')) {
              form.classList.add('mobile-form');
          }
      });
      
      // Auto-add to forms with certain IDs
      const formPatterns = ['contact', 'register', 'enroll', 'apply', 'subscribe', 'volunteer', 'bootcamp', 'tutor'];
      formPatterns.forEach(pattern => {
          document.querySelectorAll(`form[id*="${pattern}"], #${pattern}Form, .${pattern}-form`).forEach(form => {
              form.setAttribute('data-mobile-optimize', 'true');
          });
      });
  }
  
  autoOptimizeForms();
  
  // ======================
  // Animations
  // ======================
  
  // Initialize AOS (Animate On Scroll) if loaded
  if (typeof AOS !== 'undefined') {
      AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true
      });
  }
  
  // Fallback animation for elements with .fade-in class
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0 && typeof AOS === 'undefined') {
      fadeElements.forEach((el, index) => {
          el.style.opacity = '0';
          setTimeout(() => {
              el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
          }, index * 200);
      });
  }
  
  // ======================
  // Lazy Loading Images
  // ======================
  
  const lazyImages = document.querySelectorAll('img[data-src]');
  if ('IntersectionObserver' in window && lazyImages.length > 0) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  const img = entry.target;
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  observer.unobserve(img);
              }
          });
      }, {
          rootMargin: '200px 0px'
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
  }
  
  // ======================
  // Console Log Success
  // ======================
  
  // console.log('✅ MELBA Main JS loaded with Universal Mobile Form Optimization');
  
});

// ======================
// USAGE GUIDE FOR FORMS
// ======================

/*
FORM OPTIMIZATION METHODS:

1. BOOTSTRAP VALIDATION (Recommended):
 <form class="needs-validation" novalidate>

2. MOBILE-OPTIMIZED CLASS:
 <form class="mobile-form">

3. DATA ATTRIBUTE:
 <form data-mobile-optimize="true">

4. AUTO-SUBMIT WITH ENDPOINT:
 <form data-submit-url="/submit-contact" class="needs-validation">

5. AUTOMATIC (No changes needed):
 - All modal forms are auto-optimized
 - Forms with IDs containing: contact, register, enroll, apply, subscribe, volunteer, bootcamp, tutor

EXAMPLES:

<!-- Your existing forms - just add one class -->
<form class="needs-validation" novalidate id="bootcampRegistrationForm">
<form class="needs-validation" novalidate id="enrollmentApplicationForm">
<form class="needs-validation" novalidate id="tutorApplicationForm">

<!-- Contact form -->
<form class="mobile-form" id="contactForm">

<!-- Newsletter with auto-submit -->
<form data-submit-url="/newsletter-signup" data-mobile-optimize="true">
*/

function formatPhoneNumber(input) {
  // Remove all non-numeric characters from the input value
  let cleaned = input.value.replace(/\D/g, '');

  // Truncate the string to 10 digits to prevent extra numbers
  if (cleaned.length > 10) {
    cleaned = cleaned.substring(0, 10);
  }

  // Check if the cleaned number has 10 digits to be formatted
  if (cleaned.length === 10) {
    // Apply the desired format: (xxx) xxx-xxxx
    let formatted = `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    input.value = formatted;
  } else {
    // If it's not a valid 10-digit number, just keep the cleaned numbers
    input.value = cleaned;
  }
}
