/**
 * BAFA Main JavaScript File
 * Handles common frontend functionality across the site
 */

document.addEventListener('DOMContentLoaded', function() {
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
    // Contact Form Validation
    // ======================
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        const emailInput = this.querySelector('input[type="email"]');
        const messageInput = this.querySelector('textarea');
        let isValid = true;
        
        // Simple email validation
        if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
          emailInput.classList.add('is-invalid');
          isValid = false;
        } else {
          emailInput.classList.remove('is-invalid');
        }
        
        // Message length validation
        if (messageInput.value.trim().length < 10) {
          messageInput.classList.add('is-invalid');
          isValid = false;
        } else {
          messageInput.classList.remove('is-invalid');
        }
        
        if (!isValid) {
          e.preventDefault();
          
          // Scroll to first invalid field
          const firstInvalid = this.querySelector('.is-invalid');
          if (firstInvalid) {
            firstInvalid.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            
            // Focus the field
            firstInvalid.focus();
          }
        }
      });
    }
    
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
    
  });