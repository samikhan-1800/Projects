/**
 * Page Transitions and Animations
 * Provides smooth page transitions and loading states
 */

// Initialize page transition on load
document.addEventListener('DOMContentLoaded', () => {
    // Fade in page
    document.body.classList.add('page-loaded');
    
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 600,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
            offset: 50
        });
    }
    
    // Add smooth transitions to all internal links
    addLinkTransitions();
    
    // Add loading states to buttons
    addButtonLoadingStates();
    
    // Animate counters on home page
    animateHeroStats();
});

/**
 * Add smooth transitions to all internal links
 */
function addLinkTransitions() {
    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="http"]):not([target="_blank"])');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a JavaScript void link or special link
            if (!href || href === '#' || href.startsWith('javascript:')) {
                return;
            }
            
            e.preventDefault();
            
            // Fade out current page
            document.body.classList.remove('page-loaded');
            document.body.style.opacity = '0';
            
            // Navigate to new page after animation
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
}

/**
 * Add loading states to form buttons
 */
function addButtonLoadingStates() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                submitBtn.disabled = true;
                
                // Re-enable after 10 seconds as fallback
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 10000);
            }
        });
    });
}

/**
 * Show loading overlay
 */
function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Animate element on scroll into view
 */
function animateOnScroll(element, animation = 'fadeInUp') {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', `animate__${animation}`);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    observer.observe(element);
}

/**
 * Add stagger animation to list items
 */
function staggerAnimation(container, itemSelector, delay = 100) {
    const items = container.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
        item.style.animationDelay = `${index * delay}ms`;
        item.classList.add('fade-in-up');
    });
}

/**
 * Counter animation for numbers
 */
function animateCounter(element, target, duration = 1000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = Math.ceil(target).toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.ceil(start).toLocaleString();
        }
    }, 16);
}

/**
 * Animate hero stats on index page
 */
function animateHeroStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length === 0) return;
    
    // Parse the numbers from the stat elements
    const stats = Array.from(statNumbers).map(el => {
        const text = el.textContent;
        const number = parseInt(text.replace(/[^0-9]/g, ''));
        const suffix = text.replace(/[0-9,]/g, '');
        return { element: el, number, suffix };
    });
    
    // Animate each stat with stagger effect
    stats.forEach((stat, index) => {
        setTimeout(() => {
            let start = 0;
            const duration = 2000;
            const increment = stat.number / (duration / 16);
            
            const timer = setInterval(() => {
                start += increment;
                if (start >= stat.number) {
                    stat.element.textContent = stat.number.toLocaleString() + stat.suffix;
                    clearInterval(timer);
                } else {
                    stat.element.textContent = Math.ceil(start).toLocaleString() + stat.suffix;
                }
            }, 16);
        }, index * 200);
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoadingOverlay,
        hideLoadingOverlay,
        animateOnScroll,
        staggerAnimation,
        animateCounter,
        animateHeroStats
    };
}
