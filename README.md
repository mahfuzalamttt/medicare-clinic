# MediCare Clinic Management System
A web-based clinic management system built with HTML, CSS, JavaScript, and Firebase. Designed for doctors and receptionists to manage patients, generate tokens manually, and track clinic activities.

## Features
- User authentication for doctors and receptionists.
- Patient management (add, delete).
- Manual token generation, completion, and reset.
- Dashboard with statistics (total patients, tokens).
- Recent activity tracking.
- Responsive design for mobile and desktop.
- Modular code structure.

## Prerequisites
- Modern web browser (e.g., Chrome, Firefox).
- Firebase project with Authentication and Firestore enabled.

## Installation
1. **Clone the Repository**  
   - You already have the files from this repo. Extract them to a folder (e.g., `medicare-clinic`).

2. **Install Live-Server**

3. Set Up Firebase

   -Create a Firebase project at console.firebase.google.com.
   -Enable Authentication (Email/Password) and Firestore.
   -Create js/config.js with your Firebase config (do not upload)
4. Set Up Test Users

   -Firebase Console > Authentication > Users > Add User:
      -Doctor: doctor@clinic.com, Password: doctor123
      -Receptionist: receptionist@clinic.com, Password: receptionist123

5. Run Locally
   -Open http://127.0.0.1:8080 in your browser.

## Usage
    -Log in with receptionist@clinic.com/receptionist123 or doctor@clinic.com/doctor123.
    -Manage patients in the "Patients" tab.
    -Generate tokens manually in the "Tokens" tab (receptionists only).
    -View dashboard and recent activities in the "Overview" tab.
    -Log out when done.

## Project Structure

     -index.html: Main HTML file.
     -css/styles.css: Styles.
     -js/:
       -app.js: Firebase init and events.
       -auth.js: Authentication.
       -patients.js: Patient management.
       -tokens.js: Token management.
       -activities.js: Activity tracking.
       -utils.js: Utilities.
       -config.js: Firebase config (local only).
     -.gitignore: Excludes js/config.js.
