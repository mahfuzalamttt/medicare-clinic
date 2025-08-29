// Global variables
export const globalVars = {
    currentUser: null,
    patients: [],
    tokens: [],
    currentTokenNumber: 0,
    lastServedToken: 0
};

export function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionName).classList.remove('hidden');
}

export function filterPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const filteredPatients = globalVars.patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.phone.includes(searchTerm)
    );
    
    const tbody = document.getElementById('patientsTable');
    
    if (filteredPatients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No patients found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredPatients.map(patient => `
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

export function updateDashboard() {
    const today = new Date().toDateString();
    const todayTokens = globalVars.tokens.filter(t => new Date(t.generatedAt).toDateString() === today);
    const pendingTokens = globalVars.tokens.filter(t => t.status === 'pending');
    const completedTokens = globalVars.tokens.filter(t => t.status === 'completed');
    
    document.getElementById('totalPatients').textContent = globalVars.patients.length;
    document.getElementById('todayTokens').textContent = todayTokens.length;
    document.getElementById('pendingTokens').textContent = pendingTokens.length;
    document.getElementById('completedTokens').textContent = completedTokens.length;
}