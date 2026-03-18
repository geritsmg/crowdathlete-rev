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
