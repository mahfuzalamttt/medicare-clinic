// Import Firebase Config
import { firebaseConfig } from './config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Import modules
import { handleLogin, handleLogout, showLogin, showDashboard, setupAuthListeners } from './auth.js';
import { handleAddPatient, loadPatientsFromFirebase, loadPatients, deletePatient } from './patients.js';
import { handleGenerateToken, loadTokensFromFirebase, loadTokens, handleNextToken, handleResetTokens, completeToken, populatePatientSelect } from './tokens.js';
import { addRecentActivity, loadRecentActivities, handleClearActivities, deleteActivity } from './activities.js';
import { showSection, filterPatients, updateDashboard, globalVars } from './utils.js';

// DOM Elements (common UI elements)
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const navBtns = document.querySelectorAll('.nav-btn');
const patientModal = document.getElementById('patientModal');
const tokenModal = document.getElementById('tokenModal');
const patientForm = document.getElementById('patientForm');
const tokenForm = document.getElementById('tokenForm');
const patientSearch = document.getElementById('patientSearch');
const clearActivitiesBtn = document.getElementById('clearActivitiesBtn');

// Setup Event Listeners
function setupEventListeners() {
    // Login/Logout
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showSection(section);
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Patients
    document.getElementById('addPatientBtn').addEventListener('click', () => {
        patientModal.classList.remove('hidden');
    });
    document.getElementById('closePatientModal').addEventListener('click', () => {
        patientModal.classList.add('hidden');
    });
    document.getElementById('cancelPatientModal').addEventListener('click', () => {
        patientModal.classList.add('hidden');
    });
    patientForm.addEventListener('submit', handleAddPatient);
    patientSearch.addEventListener('input', filterPatients);

    // Tokens
    document.getElementById('generateTokenBtn').addEventListener('click', () => {
        populatePatientSelect();
        tokenModal.classList.remove('hidden');
    });
    document.getElementById('closeTokenModal').addEventListener('click', () => {
        tokenModal.classList.add('hidden');
    });
    document.getElementById('cancelTokenModal').addEventListener('click', () => {
        tokenModal.classList.add('hidden');
    });
    tokenForm.addEventListener('submit', handleGenerateToken);
    document.getElementById('nextTokenBtn').addEventListener('click', handleNextToken);
    document.getElementById('resetTokensBtn').addEventListener('click', handleResetTokens);

    // Activities
    clearActivitiesBtn.addEventListener('click', handleClearActivities);
}

// Initialize the application
async function init() {
    setupEventListeners();
    setupAuthListeners();  // From auth.js
    await loadRecentActivities();  // Initial load
}

init();

export { db, auth };  // Export for other modules

// Make functions globally accessible for inline onclick events
window.completeToken = (tokenId) => completeToken(tokenId);
window.deletePatient = (patientId) => deletePatient(patientId);
window.deleteActivity = (activityId) => deleteActivity(activityId);