import { db } from './app.js';
import { globalVars } from './utils.js';
import { addRecentActivity } from './activities.js';
import { updateDashboard } from './utils.js';

export async function loadTokensFromFirebase() {
    try {
        const snapshot = await db.collection('tokens').orderBy('generatedAt', 'desc').get();
        globalVars.tokens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading tokens:', error);
        globalVars.tokens = [];
    }
}

export async function loadSettingsFromFirebase() {
    try {
        const settingsDoc = await db.collection('settings').doc('clinic').get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            globalVars.currentTokenNumber = settings.currentTokenNumber || 0;
            globalVars.lastServedToken = settings.lastServedToken || 0;
        } else {
            await db.collection('settings').doc('clinic').set({
                currentTokenNumber: 0,
                lastServedToken: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            globalVars.currentTokenNumber = 0;
            globalVars.lastServedToken = 0;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        globalVars.currentTokenNumber = 0;
        globalVars.lastServedToken = 0;
    }
}

export function loadTokens() {
    const pendingList = document.getElementById('pendingTokensList');
    const completedList = document.getElementById('completedTokensList');
    const currentTokenDisplay = document.getElementById('currentTokenDisplay');
    
    const pendingTokens = globalVars.tokens.filter(t => t.status === 'pending').sort((a, b) => a.number - b.number);
    const completedTokens = globalVars.tokens.filter(t => t.status === 'completed').sort((a, b) => b.number - a.number);
    
    if (globalVars.lastServedToken > 0) {
        currentTokenDisplay.textContent = globalVars.lastServedToken;
    } else {
        currentTokenDisplay.textContent = '-';
    }
    
    if (pendingTokens.length === 0) {
        pendingList.innerHTML = '<p class="text-gray-500 text-center py-4">No pending tokens</p>';
    } else {
        pendingList.innerHTML = pendingTokens.map(token => `
            <div class="token-item pending">
                <div class="token-item-content">
                    <div>
                        <span class="token-number-small">Token #${token.number}</span>
                        <p class="patient-name">${token.patientName}</p>
                        <p class="visit-type">${token.visitType}</p>
                    </div>
                    <button onclick="completeToken('${token.id}')" class="btn btn-success btn-small">
                        Complete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    if (completedTokens.length === 0) {
        completedList.innerHTML = '<p class="text-center py-8">No completed tokens</p>';
    } else {
        completedList.innerHTML = completedTokens.slice(0, 10).map(token => `
            <div class="token-item completed">
                <div class="token-item-content">
                    <div>
                        <span class="token-number-small">Token #${token.number}</span>
                        <p class="patient-name">${token.patientName}</p>
                        <p class="visit-type">${token.visitType}</p>
                    </div>
                    <span class="status-badge">✓ Completed</span>
                </div>
            </div>
        `).join('');
    }
}

export function populatePatientSelect() {
    const select = document.getElementById('tokenPatient');
    select.innerHTML = '<option value="">Select a patient</option>' + 
        globalVars.patients.map(patient => `<option value="${patient.id}">${patient.name} - ${patient.phone}</option>`).join('');
}

export async function handleGenerateToken(e) {
    e.preventDefault();
    
    const patientId = document.getElementById('tokenPatient').value;
    const patient = globalVars.patients.find(p => p.id === patientId);
    const visitType = document.getElementById('visitType').value;
    const notes = document.getElementById('tokenNotes').value;
    
    try {
        globalVars.currentTokenNumber++;
        
        const token = {
            number: globalVars.currentTokenNumber,
            patientId: patientId,
            patientName: patient.name,
            visitType: visitType,
            notes: notes,
            status: 'pending',
            generatedBy: globalVars.currentUser.name,
            generatedByUid: globalVars.currentUser.uid,
            generatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('tokens').add(token);
        
        await db.collection('settings').doc('clinic').update({
            currentTokenNumber: globalVars.currentTokenNumber
        });
        
        globalVars.tokens.unshift({
            id: docRef.id,
            ...token,
            generatedAt: new Date().toISOString()
        });
        
        document.getElementById('tokenModal').classList.add('hidden');
        document.getElementById('tokenForm').reset();
        
        loadTokens();
        updateDashboard();
        await addRecentActivity(`Token #${token.number} generated for ${patient.name}`);
        
        alert(`Token #${token.number} generated successfully!`);
    } catch (error) {
        console.error('Error generating token:', error);
        alert('Error generating token. Please try again.');
        globalVars.currentTokenNumber--;
    }
}

export async function handleNextToken() {
    const pendingTokens = globalVars.tokens.filter(t => t.status === 'pending').sort((a, b) => a.number - b.number);
    
    if (pendingTokens.length > 0) {
        const nextToken = pendingTokens[0];
        
        try {
            await db.collection('tokens').doc(nextToken.id).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                completedBy: globalVars.currentUser.name,
                completedByUid: globalVars.currentUser.uid
            });
            
            globalVars.lastServedToken = nextToken.number;
            await db.collection('settings').doc('clinic').update({
                lastServedToken: globalVars.lastServedToken
            });
            
            nextToken.status = 'completed';
            nextToken.completedAt = new Date().toISOString();
            
            loadTokens();
            updateDashboard();
            await addRecentActivity(`Token #${nextToken.number} completed`);
            
        } catch (error) {
            console.error('Error completing token:', error);
            alert('Error completing token. Please try again.');
        }
    } else {
        alert('No pending tokens to process.');
    }
}

export async function handleResetTokens() {
    if (confirm('Are you sure you want to reset all tokens? This action cannot be undone.')) {
        try {
            const batch = db.batch();
            const tokensSnapshot = await db.collection('tokens').get();
            
            tokensSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            await db.collection('settings').doc('clinic').update({
                currentTokenNumber: 0,
                lastServedToken: 0
            });
            
            globalVars.tokens = [];
            globalVars.currentTokenNumber = 0;
            globalVars.lastServedToken = 0;
            
            loadTokens();
            updateDashboard();
            await addRecentActivity('All tokens have been reset');
            
            alert('All tokens have been reset successfully.');
        } catch (error) {
            console.error('Error resetting tokens:', error);
            alert('Error resetting tokens. Please try again.');
        }
    }
}

export async function completeToken(tokenId) {
    console.log('Attempting to complete token with ID:', tokenId);
    const token = globalVars.tokens.find(t => t.id === tokenId);
    if (!token) {
        console.error('Token not found in globalVars.tokens:', tokenId);
        alert('Token not found. Please refresh and try again.');
        return;
    }
    console.log('Found token:', token);
    try {
        console.log('Updating token in Firestore:', tokenId);
        await db.collection('tokens').doc(tokenId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedBy: globalVars.currentUser.name,
            completedByUid: globalVars.currentUser.uid
        });
        
        globalVars.lastServedToken = token.number;
        await db.collection('settings').doc('clinic').update({
            lastServedToken: globalVars.lastServedToken
        });
        
        token.status = 'completed';
        token.completedAt = new Date().toISOString();
        
        loadTokens();
        updateDashboard();
        await addRecentActivity(`Token #${token.number} completed`);
        console.log('Token completed successfully:', token.number);
        
    } catch (error) {
        console.error('Error completing token:', error);
        alert('Error completing token. Please try again. Check console for details.');
    }
}