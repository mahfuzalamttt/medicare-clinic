import { db } from './app.js';
import { globalVars } from './utils.js';
import { addRecentActivity } from './activities.js';
import { updateDashboard } from './utils.js';

export async function loadPatientsFromFirebase() {
    try {
        const snapshot = await db.collection('patients').orderBy('addedDate', 'desc').get();
        globalVars.patients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading patients:', error);
        globalVars.patients = [];
    }
}

export function loadPatients() {
    const tbody = document.getElementById('patientsTable');
    
    if (globalVars.patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8">No patients found</td></tr>';
        return;
    }
    
    tbody.innerHTML = globalVars.patients.map(patient => `
        <tr>
            <td>
                <div class="font-medium">${patient.name}</div>
            </td>
            <td class="text-gray">${patient.phone}</td>
            <td class="text-gray">${patient.age}</td>
            <td class="text-gray">${patient.gender}</td>
            <td class="text-gray">${patient.addedBy}</td>
            <td>
                <button onclick="deletePatient('${patient.id}')" class="text-red cursor-pointer">Delete</button>
            </td>
        </tr>
    `).join('');
}

export async function handleAddPatient(e) {
    e.preventDefault();
    
    const patient = {
        name: document.getElementById('patientName').value,
        phone: document.getElementById('patientPhone').value,
        age: parseInt(document.getElementById('patientAge').value),
        gender: document.getElementById('patientGender').value,
        history: document.getElementById('patientHistory').value,
        addedBy: globalVars.currentUser.name,
        addedByUid: globalVars.currentUser.uid,
        addedDate: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await db.collection('patients').add(patient);
        
        globalVars.patients.unshift({
            id: docRef.id,
            ...patient,
            addedDate: new Date().toISOString()
        });
        
        document.getElementById('patientModal').classList.add('hidden');
        document.getElementById('patientForm').reset();
        
        loadPatients();
        updateDashboard();
        await addRecentActivity(`New patient added: ${patient.name}`);
        
        alert('Patient added successfully!');
    } catch (error) {
        console.error('Error adding patient:', error);
        alert('Error adding patient. Please try again.');
    }
}

export async function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient?')) {
        try {
            await db.collection('patients').doc(patientId).delete();
            
            const patientName = globalVars.patients.find(p => p.id === patientId)?.name || 'Unknown';
            globalVars.patients = globalVars.patients.filter(p => p.id !== patientId);
            
            loadPatients();
            updateDashboard();
            await addRecentActivity(`Patient deleted: ${patientName}`);
            
            alert('Patient deleted successfully.');
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('Error deleting patient. Please try again.');
        }
    }
}