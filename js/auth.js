import { db, auth } from './app.js';
import { globalVars, showSection, updateDashboard } from './utils.js';
import { loadPatientsFromFirebase, loadPatients } from './patients.js';
import { loadTokensFromFirebase, loadTokens } from './tokens.js';
import { loadRecentActivities } from './activities.js';
import { loadSettingsFromFirebase } from './tokens.js';

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const userInfo = document.getElementById('userInfo');
const tokensTab = document.getElementById('tokensTab');

export function setupAuthListeners() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                globalVars.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    ...userDoc.data()
                };
                showDashboard();
                await loadData();
            } else {
                const userType = user.email.includes('doctor') ? 'doctor' : 'receptionist';
                const userName = user.email.includes('doctor') ? 'Dr. Smith' : 'Sarah Johnson';
                
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    type: userType,
                    name: userName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                globalVars.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    type: userType,
                    name: userName
                };
                showDashboard();
                await loadData();
            }
        } else {
            globalVars.currentUser = null;
            showLogin();
        }
    });
}

async function loadData() {
    try {
        await Promise.all([
            loadPatientsFromFirebase(),
            loadTokensFromFirebase(),
            loadSettingsFromFirebase()
        ]);
        updateDashboard();
        loadPatients();
        loadTokens();
        loadRecentActivities();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

export async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().type !== userType) {
            await auth.signOut();
            alert('Invalid user type selected. Please select the correct user type.');
            return;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No user found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage += 'Please check your credentials and try again.';
        }
        
        alert(errorMessage);
    }
}

export async function handleLogout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error signing out. Please try again.');
    }
}

export function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    document.getElementById('loginForm').reset();
}

export function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    userInfo.textContent = `${globalVars.currentUser.name} (${globalVars.currentUser.type})`;
    
    if (globalVars.currentUser.type === 'doctor') {
        tokensTab.style.display = 'none';
    } else {
        tokensTab.style.display = 'block';
    }
    
    updateDashboard();
    loadPatients();
    loadTokens();
}