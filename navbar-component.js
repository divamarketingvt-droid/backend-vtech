// navbar-component.js

class VerifitechNavbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initScripts();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        /* Import Bootstrap Icons */
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        :host {
          display: block;
          width: 100%;
          font-family: 'Inter', sans-serif;
          --primary: #1ac2c1;
          --primary-dark: #16a8a7;
          --navy: #1e293b;
          --dark: #0f172a;
          --gray: #64748b;
        }

        /* --- NAVBAR CONTAINER --- */
        .navbar {
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          height: 80px; /* Reduced height slightly for better fit */
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1050;
          display: flex;
          align-items: center;
        }
        
        .navbar.scrolled {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          height: 70px; /* Shrink on scroll */
        }

        .container {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-brand img {
          height: 50px;
          width: auto;
          max-width: 200px;
          object-fit: contain;
        }

        /* --- COLLAPSE SECTION --- */
        .navbar-collapse {
          display: flex; 
          flex-grow: 1;
          align-items: center;
          justify-content: space-between; 
          margin-left: 3rem; 
        }

        .navbar-nav {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 0.5rem; 
        }

        .nav-item { position: relative; }

        .nav-link {
          font-weight: 600;
          color: var(--navy);
          text-decoration: none;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 0;
          cursor: pointer;
          white-space: nowrap;
        }

        .nav-link:hover { color: var(--primary); }

        .dropdown-arrow { font-size: 0.7rem; }

        /* Dropdown Styles */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: none;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 1rem;
          min-width: 280px;
          border-top: 3px solid var(--primary);
          display: none;
          z-index: 1060;
        }
        
        .dropdown-menu.show { display: block; }
        .dropdown-menu.mega-menu { min-width: 600px; }

        .dropdown-header {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--primary);
          margin-bottom: 0.5rem;
          padding: 0.5rem 1rem;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.6rem 1rem;
          color: var(--navy);
          text-decoration: none;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        
        .dropdown-item:hover { background: #e0f7f7; color: var(--primary); }
        .dropdown-item i { color: var(--primary); }

        /* Right Side Buttons */
        .d-flex { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
        }
        
        .btn-sales {
          background: var(--primary);
          color: white !important;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(26, 194, 193, 0.3);
        }
        
        .btn-sales:hover { background: var(--primary-dark); }

        .country-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--navy);
          cursor: pointer;
        }

        /* Toggler (Hamburger) */
        .navbar-toggler {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--navy);
        }

        /* --- Mobile Responsiveness --- */
        @media (max-width: 991px) {
          .navbar-toggler { display: block; }
          
          .navbar-collapse {
            display: none; 
            position: absolute;
            top: 80px; /* Align with navbar height */
            left: 0;
            width: 100%;
            background: white;
            padding: 1.5rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            
            /* FIX: Use ROW layout for mobile as requested */
            flex-direction: row; 
            
            /* Allow items to wrap to next line if screen is too small, but keep them in rows */
            flex-wrap: wrap; 
            
            align-items: flex-start;
            margin-left: 0; 
            gap: 1.5rem; /* Space between links and buttons */
          }
          
          .navbar-collapse.show { 
              display: flex; 
          }
          
          .navbar-nav { 
              /* Keep nav items horizontal or wrap them */
              flex-direction: row; 
              flex-wrap: wrap;
              width: auto; 
          }
          
          .nav-link { 
              width: auto; 
              justify-content: flex-start; 
              padding: 0.5rem;
          }
          
          /* Dropdowns on mobile */
          .dropdown-menu { 
            position: absolute; 
            top: 100%;
            left: 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
            background: white; 
            width: max-content; 
            min-width: 200px;
            display: none; 
          }
          
          .dropdown-menu.show { display: block; }
          .dropdown-menu.mega-menu { 
              min-width: 90vw; 
              left: 50%;
              transform: translateX(-50%); /* Center mega menu */
          }
          
          /* Fix for Mega menu columns on mobile */
          .dropdown-menu.mega-menu > div {
              flex-direction: column; 
          }
          .dropdown-menu.mega-menu > div > div {
              min-width: 100%; 
          }

          /* Right side buttons container */
          .d-flex { 
              flex-direction: row; /* Keep buttons in a row */
              align-items: center; 
              margin-top: 0; 
              width: auto; 
              margin-left: auto; /* Push buttons to the far right if space permits, or let them wrap */
          }
        }
      </style>

      <!-- NAV HTML -->
      <nav class="navbar">
        <div class="container">
            <a class="navbar-brand" href="../index.html">
                <!-- Using a placeholder logo if the SVG link breaks, or your provided link -->
                <img src="https://www.verifitech.com/wp-content/uploads/2022/05/verifitech-logo.svg" alt="Verifitech" onerror="this.src='https://via.placeholder.com/150x50?text=Verifitech'">
            </a>

            <button class="navbar-toggler">
                <span>&#9776;</span>
            </button>

            <div class="navbar-collapse">
                <ul class="navbar-nav">
                    <!-- SOLUTIONS Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Solutions <span class="dropdown-arrow">▾</span>
                        </a>
                        <div class="dropdown-menu mega-menu">
                            <div style="display:flex; flex-wrap:wrap;">
                                <div style="flex:1; min-width: 200px;">
                                    <h6 class="dropdown-header">Verification Services</h6>
                                    <a href="./checks/lp-id verification.html" class="dropdown-item"><i class="bi bi-person-badge"></i> ID Verification</a>
                                    <a href="./checks/lp-ADRESS VERIFICATION.html" class="dropdown-item"><i class="bi bi-geo-alt"></i> Address Verification</a>
                                    <a href="./checks/lp-employment.html" class="dropdown-item"><i class="bi bi-briefcase"></i> Employment Verification</a>
                                    <a href="./checks/lp-education check.html" class="dropdown-item"><i class="bi bi-mortarboard"></i> Education Verification</a>
                                    <a href="./checks/LP-court verification.html" class="dropdown-item"><i class="bi bi-shield-exclamation"></i> Court Record Verification</a>
                                    <a href="./checks/lp-refernce.html" class="dropdown-item"><i class="bi bi-people"></i> Reference Check</a>
                                    <a href="./checks/DIN-verification.html" class="dropdown-item"><i class="fa-regular fa-id-card"></i> DIN Verification</a>
                                    <a href="./checks/LP-Directorship check.html" class="dropdown-item"><i class="fa-regular fa-user"></i> Directorship</a>
                                </div>
                                <div style="flex:1; min-width: 200px;">
                                    <h6 class="dropdown-header">Specialized Checks</h6>
                                    <a href="../checks/global check.html" class="dropdown-item"><i class="bi bi-globe"></i> Global Database Verification</a>
                                    <a href="./checks/lp-credit check.html" class="dropdown-item"><i class="bi bi-credit-card"></i> Credit Check</a>
                                    <a href="./checks/lp-gap verification.html" class="dropdown-item"><i class="bi bi-calendar-x"></i> Gap Check</a>
                                    <a href="./checks/lp-socialmeidaverification.html" class="dropdown-item"><i class="bi bi-share"></i> Social Media Verification</a>
                                    <a href="./checks/lp-police clearnce.html" class="dropdown-item"><i class="bi bi-shield-check"></i> Police Clearance</a>
                                    <a href="./checks/lp-drug test.html" class="dropdown-item"><i class="bi bi-capsule"></i> Drug Test Screening</a>
                                    <a class="dropdown-item" href="./checks/vendor.html"><i class="fa-solid fa-magnifying-glass"></i> Vendor Digillencs</a>
                                    <a href="./checks/lp-passport verification.html" class="dropdown-item"><i class="fa-solid fa-passport"></i> Passport Verification</a>
                                </div>
                            </div>
                        </div>
                    </li>

                    <!-- Products Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Products <span class="dropdown-arrow">▾</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="./products/exitinterview.html"><i class="bi bi-box-arrow-right"></i> Exit interviews</a></li>
                            <li><a class="dropdown-item" href="./products/pm.html"><i class="bi bi-graph-up"></i> Psychometric</a></li>
                        </ul>
                    </li>

                    <!-- INDUSTRY Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Industry <span class="dropdown-arrow">▾</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="./industries/lp-banks.html"><i class="bi bi-bank"></i> Banking & Financial Services</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-healthcare.html"><i class="bi bi-heart-pulse"></i> Healthcare and Pharma</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-education.html"><i class="bi bi-book"></i> Education</a></li>
                            <li><a class="dropdown-item" href="../industries/lpi-Manfacturing.html"><i class="bi bi-building-gear"></i> Manufacturing</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-IT-ITES.html"><i class="bi bi-laptop"></i> IT/ITeS</a></li>
                            <li><a class="dropdown-item" href="../industries/LP-FMCG.html"><i class="bi bi-box"></i> FMCG</a></li>
                            <li><a class="dropdown-item" href="./industries/Logistics.html"><i class="bi bi-truck"></i> Logistics</a></li>
                            <li><a class="dropdown-item" href="./industries/Realestate & Constructation.html"><i class="bi bi-house"></i> Realestate & Construcataion</a></li>
                            <li><a class="dropdown-item" href="./industries/Retail & E-commerce.html"><i class="bi bi-shop"></i> Retail & E-commerce</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-travel industries.html"><i class="bi bi-airplane"></i> Travel and Hospitality</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-staffing.html"><i class="bi bi-person-workspace"></i> Staffing and Recruitment</a></li>
                            <li><a class="dropdown-item" href="./industries/lpi-telecom.html"><i class="bi bi-broadcast"></i> Telecom</a></li>
                        </ul>
                    </li>

                    <!-- RESOURCES Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Resources <span class="dropdown-arrow">▾</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="./resources/blog.html"><i class="bi bi-journal-text"></i> Blogs</a></li>
                            <li><a class="dropdown-item" href="./resources/whitepapers.html"><i class="bi bi-file-earmark-text"></i> Whitepapers</a></li>
                            <li><a class="dropdown-item" href="./resources/casestudy.html"><i class="bi bi-star"></i> Case Study</a></li>
                            <li><a class="dropdown-item" href="./resources/webinar.html"><i class="bi bi-camera-video"></i> Webinar</a></li>
                            <li><a class="dropdown-item" href="./products/api.html"><i class="bi bi-plug"></i> API</a></li>
                        </ul>
                    </li>

                    <!-- COMPANY Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Company <span class="dropdown-arrow">▾</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="./company/partnership.html"><i class="bi bi-hand-thumbs-up"></i> Partnership</a></li>
                            <li><a class="dropdown-item" href="./company/aboutus.html"><i class="bi bi-info-circle"></i> About Us</a></li>
                            <li><a class="dropdown-item" href="./company/careers.html"><i class="bi bi-briefcase"></i> Careers</a></li>
                        </ul>
                    </li>

                    <!-- HELP CENTER Dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle">
                            Help Center <span class="dropdown-arrow">▾</span> 
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="./helpcenter/customer.html"><i class="bi bi-building"></i> For Customers</a></li>
                            <li><a class="dropdown-item" href="./helpcenter/partner.html"><i class="bi bi-people"></i> For Partners</a></li>
                            <li><a class="dropdown-item" href="./affilate/affilate.html"><i class="bi bi-link-45deg"></i> Affiliate Program </a></li>
                        </ul>
                    </li>
                </ul>

                <!-- Right Side Buttons -->
                <div class="d-flex">
                    <a href="https://web.verifitech.com/" target="_blank" style="text-decoration: none; color: black;">Login</a>
                    <a href="./contact/contact.html" class="btn-sales">Talk to Sales</a>

                    <!-- Country Selector -->
                    <div class="dropdown">
                        <div class="country-selector dropdown-toggle-country">
                            <span class="country-flag">🇮🇳</span>
                            <span>India</span>
                            <i class="bi bi-chevron-down" style="font-size: 0.7rem"></i>
                        </div>
                        <ul class="dropdown-menu dropdown-menu-end" style="min-width: 180px">
                            <li><a href="./countries/usa.html" class="dropdown-item country-option"><span class="country-flag">🇺🇸</span> USA</a></li>
                            <li><a class="dropdown-item country-option" href="./countries/UAE.html"><span class="country-flag">🇦🇪</span> UAE</a></li>
                            <li><a class="dropdown-item country-option" href="./countries/aus.html"><span class="country-flag">🇦🇺</span> Australia</a></li>
                            <li><a class="dropdown-item country-option" href="./countries/uk.html"><span class="country-flag">🇬🇧</span> UK</a></li>
                            <li><a class="dropdown-item country-option" href="./countries/sigapore.html"><span class="country-flag">🇸🇬</span> Singapore</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </nav>
    `;
  }

  initScripts() {
    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
      const navbar = this.shadowRoot.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Mobile Menu Toggle
    const toggler = this.shadowRoot.querySelector('.navbar-toggler');
    const collapse = this.shadowRoot.querySelector('.navbar-collapse');
    
    if(toggler) {
        toggler.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing immediately
            collapse.classList.toggle('show');
        });
    }

    // Desktop/Mobile Dropdowns
    const dropdownToggles = this.shadowRoot.querySelectorAll('.dropdown-toggle, .dropdown-toggle-country');
    
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const parent = toggle.closest('.nav-item, .dropdown');
        if(!parent) return;

        const menu = parent.querySelector(':scope > .dropdown-menu');
        if (menu) {
            // Close others first
            this.shadowRoot.querySelectorAll('.dropdown-menu').forEach(m => {
                if(m !== menu) m.classList.remove('show');
            });
            menu.classList.toggle('show');
        }
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Check if click is inside the shadow DOM
        if (!this.shadowRoot.contains(e.target)) {
            this.shadowRoot.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            // Optional: Close collapse menu when clicking outside? 
            // Usually better to keep it open unless toggler is clicked, or escape key is pressed.
            // collapse.classList.remove('show'); 
        }
    });
  }
}

customElements.define('verifitech-navbar', VerifitechNavbar);
