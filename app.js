// Mock Database and State Management
const DEFAULT_STATE = {
    currentUserEmail: null,
    currentUserType: null, // 'athlete' or 'investor'
    activeView: 'landing',

    // Investor State (Mocking a simple DB where we'd lookup by email)
    investors: {
        // 'test@investor.com': { balance, riskProfile, portfolio }
    },

    // Athlete State (Lookup by email)
    athletes: {
        // 'test@athlete.com': { name, sport, goal, raised, plan, earnings, revenueShare, videoUrl }
    },

    // Mock Database of Athletes in the Market (Updated for Co-Investment Model)
    marketAthletes: [
        {
            id: 'a1',
            name: 'Carlos Silva',
            sport: 'Tennis',
            country: 'Chile',
            fundingGoal: 25000,
            amountRaised: 8500,
            coInvested: 5000, // Platform skin in the game
            sharesTotal: 1000,
            sharePrice: 25,
            stats: { winRate: '82%', rank: 'Top 50 ITF' },
            bio: 'I have dominated the South American junior circuit, but transitioning to the ATP Challenger Tour requires heavy travel to Europe. This funding unlocks a full year of European tournaments and a specialized clay-court coach.',
            image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?fit=crop&w=500&q=80',
            plan: {
                useOfFunds: 'Full time coaching and travel for the ITF Futures circuit over the next 12 months.',
                budget: { training: 8000, travel: 15000, equipment: 2000 },
                timePeriod: '12 Months',
                estEarnings: 800000,
                revenueShare: 12
            },
            age: 19,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 'a2',
            name: 'Sofia Gomez',
            sport: 'Track',
            country: 'Colombia',
            fundingGoal: 15000,
            amountRaised: 2000,
            coInvested: 3000,
            sharesTotal: 500,
            sharePrice: 30,
            stats: { pb: '11.2s 100m', rank: 'National Champ' },
            bio: 'Sprinter targeting the Pan American games. I have reached the ceiling of what my local facilities can offer. I need funding for an elite high-altitude training camp in Bogota to shave off those final milliseconds.',
            image: 'https://images.unsplash.com/photo-1552674605-1a8fb1de3e15?fit=crop&w=500&q=80',
            plan: {
                useOfFunds: 'Moving to a high-altitude training camp in Bogota for 6 months prior to qualifications.',
                budget: { training: 6000, travel: 5000, equipment: 4000 },
                timePeriod: '6 Months',
                estEarnings: 200000,
                revenueShare: 8
            },
            age: 21,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 'a3',
            name: 'Diego Costa',
            sport: 'Soccer',
            country: 'Brazil',
            fundingGoal: 40000,
            amountRaised: 18000,
            coInvested: 8000,
            sharesTotal: 1000,
            sharePrice: 40,
            stats: { goals: '24 this season', club: 'Santos Acad' },
            bio: 'Currently scouted by three top-tier European clubs. Seeking capital to finalize my move across the Atlantic, secure independent legal representation, and hire a private physio to ensure I pass all medicals.',
            image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?fit=crop&w=500&q=80',
            plan: {
                useOfFunds: 'Relocation expenses to Europe, legal representation fees, and physical therapy for 1 year.',
                budget: { training: 10000, travel: 25000, equipment: 5000 },
                timePeriod: '1 Year',
                estEarnings: 3000000,
                revenueShare: 5
            },
            age: 20,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
    ],

    // Mock Secondary Market Orders
    secondaryMarket: [
        { id: 'o1', athleteId: 'a3', sellerId: 'inv_123', shares: 10, price: 45, type: 'sell' },
        { id: 'o2', athleteId: 'a1', sellerId: 'inv_456', shares: 5, price: 28, type: 'sell' }
    ]
};

// Initialize or Load State
let STATE = JSON.parse(localStorage.getItem('crowdAthleteDB')) || DEFAULT_STATE;

// Helper to save state
const saveState = () => {
    localStorage.setItem('crowdAthleteDB', JSON.stringify(STATE));
};

// Core Application Logic
const app = {
    // Initialize application
    init() {
        lucide.createIcons();
        if (STATE.currentUserEmail && STATE.currentUserType) {
            // Restore session
            this.showToast(`Welcome back, ${STATE.currentUserEmail.split('@')[0]}!`);
            this.navigate(STATE.currentUserType === 'investor' ? 'marketplace' : 'athlete-dashboard');
        } else {
            this.navigate('landing');
        }

        // Attach listeners for the budget calculator
        setTimeout(() => this.attachBudgetListeners(), 500);
    },

    // Navigation and Routing
    navigate(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Show target view
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        STATE.activeView = viewId;

        // Toggle landing body class for nav transparency
        document.body.classList.toggle('on-landing', viewId === 'landing');

        // Scroll to top on navigation
        window.scrollTo(0, 0);

        // Update Nav
        if (viewId !== 'landing') {
            document.getElementById('main-nav').classList.remove('hidden');
        } else {
            document.getElementById('main-nav').classList.add('hidden');
        }

        // View specific logic triggers
        this.triggerViewLogic(viewId);
        this.renderNavbar();
    },

    triggerViewLogic(viewId) {
        switch (viewId) {
            case 'marketplace':
                this.populateCountryFilter();
                this.renderMarketplace();
                break;
            case 'portfolio':
                this.renderPortfolio();
                break;
            case 'secondary-market':
                this.renderSecondaryMarket();
                break;
            case 'edit-profile':
                this.populateEditProfile();
                break;
            case 'edit-investor-profile':
                this.populateInvestorEditProfile();
                break;
        }
    },

    // UI Updates
    renderNavbar() {
        const linksContainer = document.getElementById('nav-links-container');
        const profileContainer = document.getElementById('nav-user-profile');

        if (STATE.currentUserType === 'investor') {
            const inv = STATE.investors[STATE.currentUserEmail];
            linksContainer.innerHTML = `
                <a onclick="app.navigate('marketplace')" class="${STATE.activeView === 'marketplace' ? 'active-link' : ''}">Marketplace</a>
                <a onclick="app.navigate('portfolio')" class="${STATE.activeView === 'portfolio' ? 'active-link' : ''}">Portfolio</a>
                <a onclick="app.navigate('secondary-market')" class="${STATE.activeView === 'secondary-market' ? 'active-link' : ''}">Trading Floor</a>
            `;
            profileContainer.innerHTML = `
            <span class="wallet-badge">$${inv ? inv.balance.toLocaleString() : '0'}</span>
            <i data-lucide="user"></i>
            <button class="btn secondary sm" style="margin-left: 1rem;" onclick="app.navigate('edit-investor-profile')" title="Edit Profile"><i data-lucide="edit-2"></i></button>
            <button class="btn secondary sm" style="margin-left: 0.5rem;" onclick="app.logout()" title="Logout"><i data-lucide="log-out"></i></button>
        `;
        } else if (STATE.currentUserType === 'athlete') {
            const ath = STATE.athletes[STATE.currentUserEmail];
            linksContainer.innerHTML = `
                <a onclick="app.navigate('athlete-dashboard')" class="active-link">Dashboard</a>
            `;
            profileContainer.innerHTML = `
            <span>${ath ? ath.name : 'Athlete'}</span>
            <i data-lucide="award"></i>
            <button class="btn secondary sm" style="margin-left: 1rem;" onclick="app.navigate('edit-profile')" title="Edit Profile"><i data-lucide="edit-2"></i></button>
            <button class="btn secondary sm" style="margin-left: 0.5rem;" onclick="app.logout()" title="Logout"><i data-lucide="log-out"></i></button>
        `;
        } else {
            // Not logged in
            linksContainer.innerHTML = '';
            profileContainer.innerHTML = `<button class="btn secondary sm" onclick="app.viewLogin()">Login</button>`;
        }
        lucide.createIcons();
    },

    showToast(message, type = "success") {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i> <span>${message}</span>`;
        document.getElementById('toast-container').appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- AUTHENTICATION ---

    viewRegister(type) {
        document.getElementById('register-type').value = type;
        document.getElementById('register-title').innerText = type === 'investor' ? 'Investor Registration' : 'Athlete Registration';
        this.navigate('register');
    },

    navigateHome() {
        if (STATE.currentUserType === 'investor') {
            this.navigate('marketplace');
        } else if (STATE.currentUserType === 'athlete') {
            this.navigate('athlete-dashboard');
        } else {
            this.navigate('landing');
        }
    },

    viewLogin() {
        this.navigate('login');
    },

    socialAuth(provider) {
        const type = document.getElementById('register-type').value;
        const modal = document.getElementById('oauth-modal');
        const overlay = document.getElementById('oauth-modal-overlay');
        const header = document.getElementById('oauth-modal-header');
        const accountsEl = document.getElementById('oauth-accounts');
        const addBtn = document.getElementById('oauth-add-account');

        const mockAccounts = provider === 'google'
            ? [
                { name: 'Alex Rivera',    email: 'alex.rivera@gmail.com',   color: '#ea4335' },
                { name: 'Jordan Smith',   email: 'jordan.smith@gmail.com',  color: '#34a853' },
              ]
            : [
                { name: 'Alex Rivera',    email: 'alex.rivera@outlook.com', color: '#0078d4' },
                { name: 'Jordan Smith',   email: 'jordan.smith@hotmail.com',color: '#106ebe' },
              ];

        const isGoogle = provider === 'google';

        header.innerHTML = `
            <div class="oauth-logo">
                ${isGoogle
                    ? `<svg width="24" height="24" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>`
                    : `<svg width="24" height="24" viewBox="0 0 18 18" fill="none"><path d="M0 0h8.571v8.571H0z" fill="#F25022"/><path d="M9.429 0H18v8.571H9.429z" fill="#7FBA00"/><path d="M0 9.429h8.571V18H0z" fill="#00A4EF"/><path d="M9.429 9.429H18V18H9.429z" fill="#FFB900"/></svg>`
                }
                <span style="font-size:1.1rem;font-weight:700;color:#202124;">${isGoogle ? 'Google' : 'Microsoft'}</span>
            </div>
            <h3>Sign in to CrowdAthletes</h3>
            <p>to continue to CrowdAthletes</p>
        `;

        accountsEl.innerHTML = mockAccounts.map(acc => `
            <button class="oauth-account-item" onclick="app.completeSocialAuth('${acc.email}', '${acc.name}', '${provider}')">
                <div class="oauth-account-avatar" style="background:${acc.color};">${acc.name.charAt(0)}</div>
                <div class="oauth-account-info">
                    <span class="oauth-account-name">${acc.name}</span>
                    <span class="oauth-account-email">${acc.email}</span>
                </div>
            </button>
        `).join('');

        addBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 8v6M22 11h-6"/></svg>
            Use another account
        `;
        addBtn.onclick = () => {
            this.closeOAuthModal();
            this.showToast(`Enter your ${isGoogle ? 'Google' : 'Microsoft'} email below instead.`);
        };

        modal.className = `oauth-modal ${provider}`;
        overlay.classList.remove('hidden');
    },

    completeSocialAuth(email, name, provider) {
        this.closeOAuthModal();
        const type = document.getElementById('register-type').value;

        if (STATE.investors[email]) {
            STATE.currentUserEmail = email;
            STATE.currentUserType = 'investor';
            saveState();
            this.showToast(`Welcome back, ${name}!`);
            this.navigate('marketplace');
            this.renderNavbar();
            return;
        }
        if (STATE.athletes[email] !== undefined) {
            STATE.currentUserEmail = email;
            STATE.currentUserType = 'athlete';
            saveState();
            this.showToast(`Welcome back, ${name}!`);
            this.navigate('athlete-dashboard');
            this.renderAthleteDashboard();
            this.renderNavbar();
            return;
        }

        STATE.currentUserEmail = email;
        STATE.currentUserType = type;

        if (type === 'investor') {
            STATE.investors[email] = { balance: 10000, riskProfile: null, portfolio: [], name };
            saveState();
            this.showToast(`Signed in as ${name}!`);
            this.navigate('onboarding-investor');
        } else {
            STATE.athletes[email] = null;
            saveState();
            this.showToast(`Signed in as ${name}!`);
            this.navigate('onboarding-athlete-wizard');
        }
        this.renderNavbar();
    },

    closeOAuthModal(event) {
        if (event && event.target !== document.getElementById('oauth-modal-overlay')) return;
        document.getElementById('oauth-modal-overlay').classList.add('hidden');
    },

    submitRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const type = formData.get('type');

        if (STATE.investors[email] || STATE.athletes[email] !== undefined) {
            return this.showToast('Account already exists. Please log in.', 'error');
        }

        STATE.currentUserEmail = email;
        STATE.currentUserType = type;

        if (type === 'investor') {
            STATE.investors[email] = {
                balance: 10000,
                riskProfile: null,
                portfolio: []
            };
            saveState();
            this.navigate('onboarding-investor');
        } else {
            STATE.athletes[email] = null;
            saveState();
            this.navigate('onboarding-athlete-wizard');
        }
    },

    submitLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');

        if (STATE.investors[email]) {
            STATE.currentUserEmail = email;
            STATE.currentUserType = 'investor';
            saveState();
            this.showToast('Logged in successfully');
            this.navigate('marketplace');
        } else if (STATE.athletes[email] !== undefined) {
            STATE.currentUserEmail = email;
            STATE.currentUserType = 'athlete';
            saveState();
            this.showToast('Logged in successfully');
            this.navigate('athlete-dashboard');
        } else {
            this.showToast('Account not found. Please check your email or register.', 'error');
        }
    },

    logout() {
        STATE.currentUserEmail = null;
        STATE.currentUserType = null;
        saveState();
        window.location.reload();
    },

    // --- INVESTOR LOGIC ---

    submitRiskTest(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const riskScore = formData.get('q1') === 'high' ? 'high' : formData.get('q1') === 'medium' ? 'medium' : 'low';

        STATE.investors[STATE.currentUserEmail].riskProfile = riskScore;
        saveState();

        this.showToast('Profile analyzed! Finding your matches...');
        this.navigate('marketplace');
    },

    calculateMatchScore(athlete) {
        return 90 + Math.floor(Math.random() * 10); // Simplified for new curated model
    },

    populateCountryFilter() {
        const countrySelect = document.getElementById('filter-country');
        if (!countrySelect) return;

        countrySelect.innerHTML = '<option value="all">All Countries</option>';
        const countries = [...new Set(STATE.marketAthletes.map(a => a.country))].sort();

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.innerText = country;
            countrySelect.appendChild(option);
        });
    },

    renderMarketplace() {
        const grid = document.getElementById('athlete-grid');
        grid.innerHTML = '';

        const sportFilter = document.getElementById('filter-sport')?.value || 'all';
        const countryFilter = document.getElementById('filter-country')?.value || 'all';
        const ageFilter = document.getElementById('filter-age')?.value || 'all';

        const filteredAthletes = STATE.marketAthletes.filter(athlete => {
            if (sportFilter !== 'all' && athlete.sport !== sportFilter) return false;
            if (countryFilter !== 'all' && athlete.country !== countryFilter) return false;
            if (ageFilter !== 'all') {
                if (!athlete.age) return false;
                if (ageFilter === 'under18' && athlete.age >= 18) return false;
                if (ageFilter === '18to24' && (athlete.age < 18 || athlete.age > 24)) return false;
                if (ageFilter === '25plus' && athlete.age < 25) return false;
            }
            return true;
        });

        if (filteredAthletes.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-muted);">No athletes found matching your filters.</div>';
            return;
        }

        filteredAthletes.forEach(athlete => {
            const progress = (athlete.amountRaised / athlete.fundingGoal) * 100;
            // Calculate co-investment percentage
            const coInvestPct = athlete.coInvested ? Math.round((athlete.coInvested / athlete.fundingGoal) * 100) : 20;

            const card = document.createElement('div');
            card.className = 'card athlete-card';
            card.innerHTML = `
                <div class="athlete-image" style="background-image: url('${athlete.image}')">
                    <div class="match-score"><i data-lucide="shield-check" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Verified</div>
                </div>
                <div class="athlete-info">
                    <h3>${athlete.name}</h3>
                    <p class="stat-label">${athlete.sport} • ${athlete.country}</p>
                    
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>$${athlete.amountRaised.toLocaleString()}</span>
                        <span>$${athlete.fundingGoal.toLocaleString()}</span>
                    </div>

                    <div class="athlete-stats">
                        <div class="stat">
                            <span class="stat-label">Platform Backing</span>
                            <span class="stat-val text-green">${coInvestPct}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Rev. Share</span>
                            <span class="stat-val">${athlete.plan ? athlete.plan.revenueShare : 10}%</span>
                        </div>
                    </div>
                    
                    <button class="btn primary full-width" onclick="app.viewAthleteDetails('${athlete.id}')">View & Invest</button>
                </div>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    },

    viewAthleteDetails(id) {
        const athlete = STATE.marketAthletes.find(a => a.id === id);
        if (!athlete) return;

        const container = document.getElementById('athlete-profile-container');
        const progress = (athlete.amountRaised / athlete.fundingGoal) * 100;
        const coInvested = athlete.coInvested || (athlete.fundingGoal * 0.2); 
        const coInvestPct = Math.round((coInvested / athlete.fundingGoal) * 100);

        // Generate Budget HTML
        let budgetHtml = '';
        if (athlete.plan && athlete.plan.budget) {
            budgetHtml = `
                <li><i data-lucide="check-circle"></i> <strong>$${(athlete.plan.budget.training || 0).toLocaleString()}</strong> - Elite Coaching & Training</li>
                <li><i data-lucide="check-circle"></i> <strong>$${(athlete.plan.budget.travel || 0).toLocaleString()}</strong> - Travel & Tournament Fees</li>
                <li><i data-lucide="check-circle"></i> <strong>$${(athlete.plan.budget.equipment || 0).toLocaleString()}</strong> - Equipment & Recovery</li>
            `;
        } else {
            budgetHtml = `<li><i data-lucide="check-circle"></i> <strong>$${athlete.fundingGoal.toLocaleString()}</strong> - Core Athletic Development</li>`;
        }

        // Potential Returns Logic
        const estEarnings = athlete.plan ? athlete.plan.estEarnings : 1000000;
        const revShare = athlete.plan ? athlete.plan.revenueShare / 100 : 0.1;

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem;">
                <img src="${athlete.image}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-accent);">
                <div>
                    <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                        <h2 style="margin: 0; font-size: 2.5rem;">${athlete.name}</h2>
                        <span style="background: rgba(16, 185, 129, 0.2); color: var(--color-accent); padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--color-accent);"><i data-lucide="shield-check" style="width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom;"></i> Verified & Co-Invested</span>
                    </div>
                    <p style="font-size: 1.2rem; color: var(--color-text); margin: 0;">${athlete.sport} • ${athlete.country} • ${athlete.age || 'N/A'} Years Old</p>
                </div>
                <div style="margin-left: auto; text-align: right;">
                    <button class="btn secondary mb-2" onclick="app.navigate('marketplace')"><i data-lucide="arrow-left"></i> Back to Market</button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                
                <div>
                    <div class="card mb-4">
                        <h3 style="font-size: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem;">The Athlete's Story</h3>
                        <p>${athlete.bio || 'Currently raising funds on CrowdAthlete to pursue professional athletic goals.'}</p>
                    </div>

                    <div class="card mb-4">
                        <h3 style="font-size: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem;">Use of Funds (Milestones)</h3>
                        <p style="color: var(--color-text-muted); margin-bottom: 1rem;">${athlete.plan ? athlete.plan.useOfFunds : 'Funding supports direct athletic progression.'}</p>
                        <ul class="dual-list">
                            ${budgetHtml}
                        </ul>
                    </div>

                    ${athlete.videoUrl ? `
                    <div class="card" style="padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; width: 100%;">
                            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="${athlete.videoUrl}" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>` : ''}
                </div>

                <div>
                    <div class="card" style="background: rgba(249, 115, 22, 0.05); border-color: var(--color-primary);">
                        <h3 style="font-size: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--color-primary);">Investment Details</h3>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <span style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase;">Funding Goal</span>
                            <div style="font-size: 2rem; font-weight: 800; color: white;">$${athlete.fundingGoal.toLocaleString()}</div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <span style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase;">Revenue Share Offered</span>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent);">${athlete.plan ? athlete.plan.revenueShare : 10}% <span style="font-size: 0.9rem; font-weight: 400; color: var(--color-text-muted);">of Pro Earnings (10 Yrs)</span></div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <span style="font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase;">Platform Co-Investment</span>
                            <div style="font-size: 1.2rem; font-weight: 700; color: white;">$${coInvested.toLocaleString()} <span style="font-size: 0.9rem; font-weight: 400; color: var(--color-text-muted);">(${coInvestPct}% completed)</span></div>
                        </div>

                        <div class="progress-bar-container large">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-stats mb-4">
                            <span>$${athlete.amountRaised.toLocaleString()} Raised total</span>
                        </div>

                        <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                                <span>Share Price</span>
                                <strong>$${athlete.sharePrice}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                                <span>Your Balance</span>
                                <strong class="text-green">$${STATE.investors[STATE.currentUserEmail] ? STATE.investors[STATE.currentUserEmail].balance.toLocaleString() : 0}</strong>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Shares to Purchase</label>
                            <input type="number" id="invest-shares" value="10" min="1" max="100" onchange="document.getElementById('invest-total').innerText = '$' + (this.value * ${athlete.sharePrice})">
                        </div>
                        
                        <button class="btn primary full-width" onclick="app.investInAthlete('${athlete.id}', ${athlete.sharePrice})">
                            Invest <span id="invest-total">$${athlete.sharePrice * 10}</span>
                        </button>
                    </div>
                </div>
                
            </div>
        `;

        this.navigate('athlete-profile');
        lucide.createIcons();
    },

    investInAthlete(id, price) {
        const sharesInput = document.getElementById('invest-shares');
        const shares = parseInt(sharesInput.value);
        if (isNaN(shares) || shares <= 0) return this.showToast('Invalid shares amount', 'error');

        const totalCost = shares * price;
        const inv = STATE.investors[STATE.currentUserEmail];

        if (!inv) return this.showToast('Please log in as an investor to purchase shares.', 'error');

        if (inv.balance < totalCost) {
            return this.showToast('Insufficient balance', 'error');
        }

        inv.balance -= totalCost;

        const existing = inv.portfolio.find(p => p.athleteId === id);
        if (existing) {
            existing.sharesOwned += shares;
            existing.investedAmount += totalCost;
        } else {
            inv.portfolio.push({ athleteId: id, sharesOwned: shares, investedAmount: totalCost });
        }

        const athlete = STATE.marketAthletes.find(a => a.id === id);
        if (athlete) athlete.amountRaised += totalCost;

        this.showToast(`Successfully invested $${totalCost} in ${athlete.name}!`);
        this.renderNavbar();
        this.navigate('portfolio');
    },

    renderPortfolio() {
        const inv = STATE.investors[STATE.currentUserEmail];
        if (!inv) return;

        STATE.investor = inv; // Legacy support

        let totalInvested = 0;
        inv.portfolio.forEach(p => { totalInvested += p.investedAmount; });

        document.getElementById('port-total-invested').innerText = `$${totalInvested.toLocaleString()}`;
        document.getElementById('port-athletes-backed').innerText = inv.portfolio.length;

        const list = document.getElementById('portfolio-holdings');
        list.innerHTML = '';

        if (inv.portfolio.length === 0) {
            list.innerHTML = '<p class="text-center mt-4">You have not backed any athletes yet. Visit the Marketplace to discover talent.</p>';
            return;
        }

        inv.portfolio.forEach(holding => {
            const athlete = STATE.marketAthletes.find(a => a.id === holding.athleteId);
            if (!athlete) return;

            // Simplified secondary pricing logic
            const currentPrice = athlete.sharePrice + 4; 
            const currentValue = holding.sharesOwned * currentPrice;
            const profitStr = currentValue > holding.investedAmount ? `+$${(currentValue - holding.investedAmount).toLocaleString()}` : `-$${(holding.investedAmount - currentValue).toLocaleString()}`;
            const profitClass = currentValue >= holding.investedAmount ? 'text-green' : 'text-danger';

            const item = document.createElement('div');
            item.className = 'list-item fade-in';
            item.innerHTML = `
                <div class="list-item-main">
                    <div class="athlete-avatar" style="background-image: url('${athlete.image}')"></div>
                    <div>
                        <h4 style="margin: 0;">${athlete.name}</h4>
                        <span style="font-size: 0.85rem; color: var(--color-text-muted);">${holding.sharesOwned} Shares</span>
                    </div>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <div>
                        <div style="font-weight: 700;">$${currentValue.toLocaleString()}</div>
                        <div class="${profitClass}" style="font-size: 0.85rem;">${profitStr} Returns</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn secondary sm" onclick="app.viewAthleteDetails('${holding.athleteId}')">View Profile</button>
                        <button class="btn secondary sm" onclick="app.listOnSecondary('${holding.athleteId}')">List on Market</button>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
    },

    listOnSecondary(athleteId) {
        const athlete = STATE.marketAthletes.find(a => a.id === athleteId);
        if (!athlete) return;

        const holding = STATE.investor.portfolio.find(p => p.athleteId === athleteId);
        if (!holding || holding.sharesOwned <= 0) return this.showToast('You do not own shares to sell.', 'error');

        const sellAmountStr = prompt(`How many shares of ${athlete.name} do you want to list? (You own ${holding.sharesOwned})`, holding.sharesOwned);
        if (sellAmountStr === null) return;

        const sellAmount = parseInt(sellAmountStr);
        if (isNaN(sellAmount) || sellAmount <= 0 || sellAmount > holding.sharesOwned) {
            return this.showToast('Invalid share amount.', 'error');
        }

        const currentEstPrice = athlete.sharePrice + 4;
        const askingPriceStr = prompt(`What is your asking price per share? (Suggested: $${currentEstPrice})`, currentEstPrice);
        if (askingPriceStr === null) return;

        const askingPrice = parseFloat(askingPriceStr);
        if (isNaN(askingPrice) || askingPrice <= 0) {
            return this.showToast('Invalid asking price.', 'error');
        }

        holding.sharesOwned -= sellAmount;
        const ratioSold = sellAmount / (holding.sharesOwned + sellAmount);
        holding.investedAmount = holding.investedAmount * (1 - ratioSold);

        if (holding.sharesOwned <= 0) {
            STATE.investor.portfolio = STATE.investor.portfolio.filter(p => p.athleteId !== athleteId);
        }

        STATE.secondaryMarket.push({
            id: 'o_' + Date.now(),
            athleteId: athleteId,
            sellerId: STATE.currentUserEmail,
            shares: sellAmount,
            price: askingPrice,
            type: 'sell'
        });

        saveState();
        this.showToast(`Listed ${sellAmount} shares of ${athlete.name} for sale at $${askingPrice}/share!`);
        this.renderPortfolio();
    },

    renderSecondaryMarket() {
        const grid = document.getElementById('secondary-market-grid');
        grid.innerHTML = '';

        STATE.secondaryMarket.forEach(order => {
            const athlete = STATE.marketAthletes.find(a => a.id === order.athleteId);
            if (!athlete) return;

            const card = document.createElement('div');
            card.className = 'card list-item fade-in';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'flex-start';
            card.style.gap = '1rem';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
                    <div class="list-item-main">
                        <div class="athlete-avatar" style="background-image: url('${athlete.image}'); width: 40px; height: 40px;"></div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.1rem;">${athlete.name}</h4>
                            <span style="font-size: 0.8rem; color: var(--color-accent); font-weight: 600;">FOR SALE</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.8rem; color: var(--color-text-muted);">Asking Price</span>
                        <div style="font-size: 1.5rem; font-weight: 800;">$${order.price} <span style="font-size: 0.9rem; font-weight: 400; color: var(--color-text-muted);">/ share</span></div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <div>
                        <span style="color: var(--color-text-muted);">Available: </span>
                        <strong>${order.shares} Shares</strong>
                    </div>
                    <button class="btn secondary sm" onclick="app.buyFromSecondary('${order.id}', ${order.price}, ${order.shares}, '${athlete.id}')">
                        Buy Block ($${order.price * order.shares})
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    },

    buyFromSecondary(orderId, price, shares, athleteId) {
        const order = STATE.secondaryMarket.find(o => o.id === orderId);
        if (!order) return this.showToast('Order not found.', 'error');

        if (order.sellerId === STATE.currentUserEmail) {
            return this.showToast('You cannot buy your own listing.', 'error');
        }

        const totalCost = price * shares;
        const buyer = STATE.investors[STATE.currentUserEmail];

        if (buyer.balance < totalCost) {
            return this.showToast('Insufficient balance for this block trade.', 'error');
        }

        buyer.balance -= totalCost;

        const buyerExisting = buyer.portfolio.find(p => p.athleteId === athleteId);
        if (buyerExisting) {
            buyerExisting.sharesOwned += shares;
            buyerExisting.investedAmount += totalCost;
        } else {
            buyer.portfolio.push({ athleteId: athleteId, sharesOwned: shares, investedAmount: totalCost });
        }

        if (STATE.investors[order.sellerId]) {
            STATE.investors[order.sellerId].balance += totalCost;
        }

        STATE.secondaryMarket = STATE.secondaryMarket.filter(o => o.id !== orderId);
        saveState();

        const athlete = STATE.marketAthletes.find(a => a.id === athleteId);
        this.showToast(`Bought ${shares} shares of ${athlete.name} from secondary market!`);
        this.renderNavbar();
        this.renderSecondaryMarket();
    },

    // --- ATHLETE LOGIC ---

    // NEW: Budget Calculator Listeners
    attachBudgetListeners() {
        const inputs = ['wiz-budget-training', 'wiz-budget-travel', 'wiz-budget-equipment'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.calculateBudgetTotal());
            }
        });
    },

    calculateBudgetTotal() {
        const training = parseFloat(document.getElementById('wiz-budget-training')?.value || 0);
        const travel = parseFloat(document.getElementById('wiz-budget-travel')?.value || 0);
        const equipment = parseFloat(document.getElementById('wiz-budget-equipment')?.value || 0);
        
        const total = training + travel + equipment;
        const goalInput = document.getElementById('wiz-goal');
        if (goalInput) goalInput.value = total > 0 ? total : '';
    },

    nextWizardStep(currentStep, e) {
        if (e) e.preventDefault();

        document.getElementById(`wiz-form-${currentStep}`).classList.add('hidden');
        document.getElementById(`wiz-step-${currentStep}`).classList.remove('text-green');
        document.getElementById(`wiz-step-${currentStep}`).style.fontWeight = 'normal';
        document.getElementById(`wiz-step-${currentStep}`).style.color = 'var(--color-text-muted)';

        const nextStep = currentStep + 1;

        if (nextStep === 4) {
            this.calculateContractTerms();
        }

        document.getElementById(`wiz-form-${nextStep}`).classList.remove('hidden');
        document.getElementById(`wiz-step-${nextStep}`).classList.add('text-green');
        document.getElementById(`wiz-step-${nextStep}`).style.fontWeight = '700';
        document.getElementById(`wiz-step-${nextStep}`).style.color = '';
    },

    prevWizardStep(currentStep) {
        document.getElementById(`wiz-form-${currentStep}`).classList.add('hidden');
        document.getElementById(`wiz-step-${currentStep}`).classList.remove('text-green');
        document.getElementById(`wiz-step-${currentStep}`).style.fontWeight = 'normal';
        document.getElementById(`wiz-step-${currentStep}`).style.color = 'var(--color-text-muted)';

        const prevStep = currentStep - 1;

        document.getElementById(`wiz-form-${prevStep}`).classList.remove('hidden');
        document.getElementById(`wiz-step-${prevStep}`).classList.add('text-green');
        document.getElementById(`wiz-step-${prevStep}`).style.fontWeight = '700';
        document.getElementById(`wiz-step-${prevStep}`).style.color = '';
    },

    calculateContractTerms() {
        const goal = parseFloat(document.getElementById('wiz-goal').value) || 0;
        const sport = document.getElementById('wiz-sport').value;

        // Mock AI Valuation Logic
        let earnings = 0;
        let justification = "";

        if (sport === 'Tennis') {
            earnings = 1500000;
            justification = "Our AI evaluates historical data. A top national prospect averages $1.5M over their first 10 professional years via Challenger/ATP tours & sponsorships.";
        } else if (sport === 'Soccer') {
            earnings = 3000000;
            justification = "AI evaluation indicates top academy players jumping to first-team contracts average $3.0M collectively in their first 10 years playing in tier-1 or tier-2 European leagues.";
        } else if (sport === 'Track') {
            earnings = 500000;
            justification = "Based on national finalist sprinting data, a 10-year professional window yields $500k in prize money and shoe/equipment sponsorship deals on average.";
        } else if (sport === 'Golf') {
            earnings = 2500000;
            justification = "Using WAGR and lower-tour estimations, moving into the Korn Ferry or PGA tour generates roughly $2.5M in standard 10-year earnings.";
        } else {
            earnings = 1000000;
            justification = "Baseline algorithmic estimation for highly-rated amateur athletes turning pro over a 10-year period.";
        }

        let calculatedShare = 0;
        if (earnings > 0) {
            let rawPct = (goal / earnings) * 100;
            calculatedShare = rawPct * 1.5; // Risk Premium
            if (calculatedShare > 30) calculatedShare = 30; // Max Cap
            if (calculatedShare < 1) calculatedShare = 1;   // Min Cap
        }

        const finalShare = parseFloat(calculatedShare.toFixed(1));

        document.getElementById('calc-goal').innerText = goal.toLocaleString();
        document.getElementById('calc-earnings').innerText = earnings.toLocaleString();
        document.getElementById('calc-justification').innerText = justification;
        document.getElementById('calc-share').innerText = finalShare;

        window._tempContractShare = finalShare;
        window._tempEstEarnings = earnings;
    },

    renderDynamicSportFields() {
        const sport = document.getElementById('wiz-sport').value;
        const container = document.getElementById('sport-specific-stats-container');

        if (!sport) {
            container.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">Please select a sport in Step 1 to enter your statistics.</p>';
            return;
        }

        let html = '';
        if (sport === 'Tennis') {
            html = `
                <div class="form-group">
                    <label>Current WTN or UTR Rating</label>
                    <input type="text" id="wiz-dyn1" required placeholder="e.g. UTR 11.5">
                </div>
                <div class="form-group">
                    <label>Current National/ITF Rank</label>
                    <input type="text" id="wiz-dyn2" required placeholder="e.g. Top 50 National">
                </div>
                <div class="form-group">
                    <label>Notable Titles/Results</label>
                    <input type="text" id="wiz-dyn3" required placeholder="e.g. 2x Regional Champion">
                </div>
            `;
        } else if (sport === 'Soccer') {
            html = `
                <div class="form-group">
                    <label>Primary Position</label>
                    <input type="text" id="wiz-dyn1" required placeholder="e.g. Center Attacking Mid">
                </div>
                <div class="form-group">
                    <label>Current Team / Academy</label>
                    <input type="text" id="wiz-dyn2" required placeholder="e.g. Santos Academy">
                </div>
                <div class="form-group">
                    <label>Goals/Assists (Last Season)</label>
                    <input type="text" id="wiz-dyn3" required placeholder="e.g. 15 Goals, 8 Assists">
                </div>
            `;
        } else if (sport === 'Track') {
            html = `
                <div class="form-group">
                    <label>Main Event</label>
                    <input type="text" id="wiz-dyn1" required placeholder="e.g. 100m Sprint">
                </div>
                <div class="form-group">
                    <label>Personal Best (PB)</label>
                    <input type="text" id="wiz-dyn2" required placeholder="e.g. 10.5s">
                </div>
                <div class="form-group">
                    <label>Current Rank / Titles</label>
                    <input type="text" id="wiz-dyn3" required placeholder="e.g. State Finalist">
                </div>
            `;
        } else if (sport === 'Golf') {
            html = `
                <div class="form-group">
                    <label>Current Handicap</label>
                    <input type="text" id="wiz-dyn1" required placeholder="e.g. +2.5">
                </div>
                <div class="form-group">
                    <label>WAGR (If applicable)</label>
                    <input type="text" id="wiz-dyn2" placeholder="e.g. 850">
                </div>
                <div class="form-group">
                    <label>Lowest Tournament Round</label>
                    <input type="text" id="wiz-dyn3" required placeholder="e.g. 66 (-6)">
                </div>
            `;
        }
        container.innerHTML = html;
    },

    submitAthleteWizard(e) {
        e.preventDefault();

        const bdayStr = document.getElementById('wiz-birthday').value;
        let calculatedAge = null;
        if (bdayStr) {
            const birthDate = new Date(bdayStr);
            const today = new Date();
            calculatedAge = today.getFullYear() - birthDate.getFullYear();
        }

        const sport = document.getElementById('wiz-sport').value;
        let dynamicStats = {};
        if (sport === 'Tennis') {
            dynamicStats = { rating: document.getElementById('wiz-dyn1').value, rank: document.getElementById('wiz-dyn2').value, titles: document.getElementById('wiz-dyn3').value };
        } else if (sport === 'Soccer') {
            dynamicStats = { position: document.getElementById('wiz-dyn1').value, team: document.getElementById('wiz-dyn2').value, performance: document.getElementById('wiz-dyn3').value };
        } else if (sport === 'Track') {
            dynamicStats = { event: document.getElementById('wiz-dyn1').value, pb: document.getElementById('wiz-dyn2').value, rank: document.getElementById('wiz-dyn3').value };
        } else if (sport === 'Golf') {
            dynamicStats = { handicap: document.getElementById('wiz-dyn1').value, wagr: document.getElementById('wiz-dyn2').value, lowestRound: document.getElementById('wiz-dyn3').value };
        }

        // Parse new budget inputs
        const training = parseFloat(document.getElementById('wiz-budget-training')?.value || 0);
        const travel = parseFloat(document.getElementById('wiz-budget-travel')?.value || 0);
        const equipment = parseFloat(document.getElementById('wiz-budget-equipment')?.value || 0);
        const goal = training + travel + equipment;
        const platformCoInvest = goal * 0.2; // 20% platform commitment

        const profileData = {
            email: STATE.currentUserEmail,
            name: document.getElementById('wiz-name').value,
            country: document.getElementById('wiz-country').value,
            birthday: bdayStr,
            age: calculatedAge,
            sport: sport,
            image: document.getElementById('wiz-image').value || '',
            goal: goal,
            raised: 0,
            coInvested: platformCoInvest,
            stats: dynamicStats,
            plan: {
                useOfFunds: document.getElementById('wiz-use').value,
                budget: { training, travel, equipment },
                timePeriod: document.getElementById('wiz-time')?.value || '12 Months',
                estEarnings: window._tempEstEarnings,
                revenueShare: window._tempContractShare
            },
            bio: document.getElementById('wiz-about').value,
            videoUrl: document.getElementById('wiz-video').value
        };

        const newId = 'a_' + Date.now();
        profileData.marketId = newId;

        STATE.athletes[STATE.currentUserEmail] = profileData;

        STATE.marketAthletes.unshift({
            id: newId,
            name: profileData.name,
            sport: profileData.sport,
            country: profileData.country,
            birthday: profileData.birthday,
            fundingGoal: profileData.goal,
            amountRaised: 0,
            coInvested: platformCoInvest,
            sharePrice: 10,  
            sharesTotal: Math.floor(profileData.goal / 10),
            stats: profileData.stats,
            bio: profileData.bio,
            image: profileData.image || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?fit=crop&w=500&q=80',
            plan: profileData.plan,
            videoUrl: profileData.videoUrl
        });

        saveState();
        this.showToast('Contract Signed! Platform Co-investment initiated. Profile is live.');
        this.navigate('athlete-dashboard');
        this.renderAthleteDashboard();
    },

    renderAthleteDashboard() {
        const ath = STATE.athletes[STATE.currentUserEmail];
        if (!ath) return;

        document.getElementById('dash-ath-name').innerText = `Welcome, ${ath.name}`;
        document.getElementById('dash-ath-raised').innerText = `$${ath.raised.toLocaleString()} raised`;
        document.getElementById('dash-ath-goal').innerText = `of $${ath.goal.toLocaleString()} goal`;

        const pct = ath.goal > 0 ? (ath.raised / ath.goal) * 100 : 0;
        document.getElementById('dash-ath-progress').style.width = `${pct}%`;
    },

    populateEditProfile() {
        const ath = STATE.athletes[STATE.currentUserEmail];
        if (!ath) return;

        document.getElementById('edit-name').value = ath.name || '';
        document.getElementById('edit-country').value = ath.country || '';
        document.getElementById('edit-birthday').value = ath.birthday || '';
        document.getElementById('edit-bio').value = ath.bio || '';
        document.getElementById('edit-use').value = ath.plan?.useOfFunds || '';
        document.getElementById('edit-image').value = ath.image || '';
        document.getElementById('edit-video').value = ath.videoUrl || '';
    },

    submitEditProfile(e) {
        e.preventDefault();

        const ath = STATE.athletes[STATE.currentUserEmail];
        if (!ath) return;

        ath.name = document.getElementById('edit-name').value;
        ath.country = document.getElementById('edit-country').value;
        ath.birthday = document.getElementById('edit-birthday').value;
        ath.bio = document.getElementById('edit-bio').value;
        if (ath.plan) {
            ath.plan.useOfFunds = document.getElementById('edit-use').value;
        } else {
            ath.plan = { useOfFunds: document.getElementById('edit-use').value, budget: {}, timePeriod: 'N/A', estEarnings: 0, revenueShare: 10 };
        }
        ath.image = document.getElementById('edit-image').value;
        ath.videoUrl = document.getElementById('edit-video').value;

        if (ath.marketId) {
            const marketAthlete = STATE.marketAthletes.find(a => a.id === ath.marketId);
            if (marketAthlete) {
                marketAthlete.name = ath.name;
                marketAthlete.country = ath.country;
                marketAthlete.bio = ath.bio;
                marketAthlete.image = ath.image;
                marketAthlete.videoUrl = ath.videoUrl;
                if (marketAthlete.plan) marketAthlete.plan.useOfFunds = ath.plan.useOfFunds;
            }
        }

        saveState();
        this.showToast('Profile updated successfully!');
        this.navigate('athlete-dashboard');
        this.renderAthleteDashboard();
    },

    populateInvestorEditProfile() {
        const inv = STATE.investors[STATE.currentUserEmail];
        if (!inv) return;
        document.getElementById('edit-inv-name').value = inv.name || '';
        document.getElementById('edit-inv-country').value = inv.country || '';
        document.getElementById('edit-inv-birthday').value = inv.birthday || '';
        document.getElementById('edit-inv-image').value = inv.image || '';
    },

    submitInvestorEditProfile(e) {
        e.preventDefault();
        const inv = STATE.investors[STATE.currentUserEmail];
        if (!inv) return;
        inv.name = document.getElementById('edit-inv-name').value;
        inv.country = document.getElementById('edit-inv-country').value;
        inv.birthday = document.getElementById('edit-inv-birthday').value;
        inv.image = document.getElementById('edit-inv-image').value || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=500&q=80';

        saveState();
        this.showToast('Investor Profile updated successfully!');
        this.navigate('portfolio');
        this.renderNavbar();
    }
};

// Start app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Render success stories
function renderSuccessStories() {
    const container = document.getElementById('success-stories-container');
    if (!container) return;
    
    // (Array omitted here for brevity if it's already in your file, but we will assume it's loaded before this)
    // To ensure it doesn't break if you copy-pasted:
    const successData = [
        { name: "Mateo Rossi", sport: "Tennis", raised: "$25,000", roi: "18% ROI", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=400&h=300", story: "Mateo used funding to join the European tour. He broke into the top 100 and signed a major racket sponsorship." },
        { name: "Sarah Jenkins", sport: "Track & Field", raised: "$12,000", roi: "14% ROI", image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=400&h=300", story: "Funded her elite coaching and travel to the national trials, securing a spot on the Olympic team." },
        { name: "Diego Fernandez", sport: "Soccer", raised: "$40,000", roi: "22% ROI", image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=400&h=300", story: "Moved to Europe for academy training without taking on debt, eventually signing a first-team contract in La Liga." },
        { name: "Elena Kova", sport: "Golf", raised: "$30,000", roi: "16% ROI", image: "https://images.unsplash.com/photo-1535139262971-c51845709a48?auto=format&fit=crop&q=80&w=400&h=300", story: "Covered Q-School registration and travel expenses, earning her LPGA tour card in her impressive rookie season." }
    ];

    container.innerHTML = successData.map(story => `
        <div class="story-card">
            <img src="${story.image}" alt="${story.name}" class="story-img">
            <div class="story-content">
                <div class="story-badge">${story.sport}</div>
                <h3>${story.name}</h3>
                <p class="story-desc">${story.story}</p>
                <div class="story-stats">
                    <div class="story-stat">
                        <span>Capital Raised</span>
                        <strong>${story.raised}</strong>
                    </div>
                    <div class="story-stat">
                        <span>Investor Return</span>
                        <strong class="text-green">${story.roi}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}
document.addEventListener('DOMContentLoaded', renderSuccessStories);
