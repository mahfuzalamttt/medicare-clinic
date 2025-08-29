import { db } from './app.js';
import { globalVars } from './utils.js';

export async function addRecentActivity(activity) {
    try {
        await db.collection('activities').add({
            text: activity,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            user: globalVars.currentUser.name,
            userUid: globalVars.currentUser.uid
        });
        
        await loadRecentActivities();
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

export async function handleClearActivities() {
    if (confirm('Are you sure you want to clear all recent activities? This action cannot be undone.')) {
        try {
            const batch = db.batch();
            const activitiesSnapshot = await db.collection('activities').get();
            
            activitiesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            await loadRecentActivities();
            
            alert('All recent activities have been cleared successfully.');
        } catch (error) {
            console.error('Error clearing activities:', error);
            alert('Error clearing activities. Please try again.');
        }
    }
}

export async function deleteActivity(activityId) {
    try {
        await db.collection('activities').doc(activityId).delete();
        
        await loadRecentActivities();
    } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Error deleting activity. Please try again.');
    }
}

export async function loadRecentActivities() {
    try {
        const snapshot = await db.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        const activities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                text: data.text,
                user: data.user,
                timestamp: data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now'
            };
        });
        
        const recentActivity = document.getElementById('recentActivity');
        
        if (activities.length === 0) {
            recentActivity.innerHTML = '<p class="text-gray-500 text-center py-8">No recent activity</p>';
        } else {
            recentActivity.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div>
                        <p class="activity-text">${activity.text}</p>
                        <p class="activity-user">by ${activity.user}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="activity-time">${activity.timestamp}</span>
                        <button onclick="deleteActivity('${activity.id}')" class="text-red cursor-pointer" style="background: none; border: none; font-size: 0.75rem; padding: 0.25rem;">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        const recentActivity = document.getElementById('recentActivity');
        recentActivity.innerHTML = '<p class="text-gray-500 text-center py-8">Error loading activities</p>';
    }
}