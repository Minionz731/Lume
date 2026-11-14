// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

function setMenuOpen(open) {
    navLinks.classList.toggle('active', open);
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuToggle.addEventListener('click', () => {
    setMenuOpen(!navLinks.classList.contains('active'));
});

// Close mobile menu when any nav link (or Book Now) is clicked
document.querySelectorAll('.nav-links a, .btn-reservation').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
});

// Form Submission
const bookingForm = document.getElementById('bookingForm');
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const services = selectedValues('service');
    const addons = selectedValues('addons');
    const location = document.getElementById('location').value;

    const message = `Hi! I would like to book or inquire about a session at Lumé by Keisha.

Name: ${name}
Email: ${email}
Phone: ${phone}
Services: ${services.join(', ')}
Add Ons: ${addons.length ? addons.join(', ') : 'None'}
Estimated total: R${estimateTotal()}
Location: ${location}

Thank you!`;

    // Send the booking / inquiry to the business WhatsApp
    const whatsappUrl = `https://wa.me/27637578070?text=${encodeURIComponent(message)}`;
    const win = window.open(whatsappUrl, '_blank');
    if (win) {
        win.opener = null;
    } else {
        window.location.href = whatsappUrl; // popup blocked: open in this tab
    }

    // Reset form and remove the extra dropdown rows
    bookingForm.reset();
    document.querySelectorAll('.select-row.extra').forEach(row => row.remove());
    refreshSelectGroups();
});

// Multiple services / add ons: each group starts with one dropdown and an
// "Add another" button that adds rows up to the group's data-max.
const selectGroups = [...document.querySelectorAll('.select-rows')];

function selectedValues(name) {
    return [...bookingForm.querySelectorAll(`select[name="${name}"]`)]
        .map(s => s.value)
        .filter(Boolean);
}

function priceOf(text) {
    const match = text.match(/R(\d+)/);
    return match ? Number(match[1]) : 0;
}

function estimateTotal() {
    return [...selectedValues('service'), ...selectedValues('addons')]
        .reduce((sum, value) => sum + priceOf(value), 0);
}

function refreshSelectGroups() {
    selectGroups.forEach(group => {
        const selects = [...group.querySelectorAll('select')];
        // Don't offer an option that is already chosen in another row
        selects.forEach(select => {
            const takenElsewhere = selects.filter(s => s !== select).map(s => s.value).filter(Boolean);
            [...select.options].forEach(option => {
                option.disabled = option.value !== '' && takenElsewhere.includes(option.value);
            });
        });
        const addButton = group.querySelector('.add-row');
        const optionCount = [...selects[0].options].filter(o => o.value !== '').length;
        addButton.hidden = selects.length >= Math.min(Number(group.dataset.max), optionCount);
    });

    const total = estimateTotal();
    document.getElementById('estimate').hidden = total === 0;
    document.getElementById('estimateValue').textContent = `R${total}`;
}

selectGroups.forEach(group => {
    const template = group.querySelector('select');

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'add-row';
    addButton.innerHTML = `<span aria-hidden="true">+</span> ${group.dataset.addLabel}`;
    group.appendChild(addButton);

    addButton.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'select-row extra';

        const select = template.cloneNode(true);
        select.removeAttribute('id');
        select.removeAttribute('required');
        select.value = '';
        select.options[0].textContent = template.name === 'service' ? 'Select another service' : 'Select another add on';
        select.setAttribute('aria-label', group.dataset.addLabel);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-row';
        remove.setAttribute('aria-label', 'Remove');
        remove.innerHTML = '&times;';
        remove.addEventListener('click', () => {
            row.remove();
            refreshSelectGroups();
        });

        row.append(select, remove);
        group.insertBefore(row, addButton);
        refreshSelectGroups();
        select.focus();
    });

    group.addEventListener('change', refreshSelectGroups);
});

refreshSelectGroups();

// Combo "Book Now" buttons: preselect the combo and jump to the form
document.querySelectorAll('[data-service]').forEach(button => {
    button.addEventListener('click', () => {
        const select = document.getElementById('service');
        const match = [...select.options].find(o => o.text.startsWith(button.dataset.service));
        if (match && !match.disabled) select.value = match.value;
        refreshSelectGroups();
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll animation for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .reason-card, .price-card').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
});

// Active nav link
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Phone input: digits only, max 10, shown as "071 234 5678"
document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', (e) => {
        let digits = e.target.value.replace(/\D/g, '');
        // Convert an international +27 number (e.g. +27 63 757 8070) to local 063 757 8070
        if (digits.startsWith('27') && digits.length > 10) {
            digits = '0' + digits.slice(2);
        }
        digits = digits.slice(0, 10);
        if (digits.length <= 3) {
            e.target.value = digits;
        } else if (digits.length <= 6) {
            e.target.value = digits.slice(0, 3) + ' ' + digits.slice(3);
        } else {
            e.target.value = digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
        }
        e.target.setCustomValidity(
            digits.length === 10 ? '' : 'Please enter a 10 digit phone number, e.g. 071 234 5678'
        );
    });
});
