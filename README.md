# AI Health Consultation System

# **ngrok Usage**
### **Purpose:** Development tunnel for Twilio webhook testing

**ngrok** is used to create a secure tunnel to localhost for:
1. Testing Twilio webhooks in development.
2. Allowing Twilio to reach the local server.
3. Real-time phone call handling during development.

### **Setup Steps:**
```
npm install -g ngrok
npm run dev
ngrok http 3000
```
Use the generated **HTTPS URL** in Twilio webhook configuration.

### **Environment Variable for Production:**
```
NEXT_PUBLIC_SERVER_URL=your_production_url_or_ngrok_url
```
**Note:** ngrok is only needed for development; use an actual server URL in production.

## Installation & Setup
### **Prerequisites**
Ensure you have the following installed:
- **Node.js** (Latest LTS version)
- **Firebase CLI**
- **Twilio Account & API Key**
- **Google Gemini API Key**

### **Clone the Repository**
```
git clone https://github.com/saadshafiq15/health-consultation.git
```

### **Install Dependencies**
```
npm install
```

### **Set Environment Variables**
Create a `.env` file and add:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
GEMINI_API_KEY=your_gemini_api_key
```

### **Run the Application**
```
npm run dev
```
The app will be available locally as of now **http://localhost:3000**.

## Overview
Our **AI Health Consultation System** improves healthcare accessibility by providing **instant health assessments**, precautionary measures, and **seamless doctor appointment booking**. Built with **TypeScript, Gemini API, Firebase, Tailwind, Twilio, and Python**, this solution bridges the gap between patients and medical professionals, reducing long wait times in hospitals and clinics across Canada.

## Key Features
### 🔍 Symptom-Based Diagnosis
- Users enter their symptoms, and our AI (powered by **Gemini API**) provides an **instant health assessment** with a brief condition overview.
- Recommends necessary precautions and advises when to seek medical attention.

### 📅 Doctor Appointment Booking
- Users can choose between **Family Doctor 🏡** or **Therapist 🧠** based on their health needs.
- The system contacts doctors directly via **Twilio**, sending the patient's diagnosis and preferred appointment date.

### 📄 Diagnosis Summary & History
- Users receive a **detailed diagnosis summary** and suggested precautions.
- Consultation history is securely stored in **Firebase** for future reference.

### 🎨 User-Friendly Interface
- **Tailwind CSS** ensures a **sleek and responsive UI** for an effortless user experience.
- **Minimalist design** with easy navigation for all age groups.

Classification Model

We used Classification Model in Python to determine potential diseases based on user-reported symptoms.

Setup and Execution:

Navigate to the model directory.

Create a virtual environment:

python -m venv venv
source venv/bin/activate  # For macOS/Linux
venv\Scripts\activate  # For Windows

Install dependencies:

pip install -r requirements.txt

Run the model:

python app.py

Training the Model

The model is trained using a Jupyter Notebook file that contains datasets and training logic.

Data preprocessing, feature extraction, and classification techniques are implemented within the notebook.

## Tech Stack
### **Frontend**
- **Next.js** – Fast, server-side rendered React framework for optimal performance.
- **React & React Hooks** – Dynamic UI components and state management.
- **Tailwind CSS** – Modern, utility-first styling.
- **Framer Motion** – Smooth animations.
- **ShadCN UI & Lucide React** – Prebuilt UI components and elegant icons.
- **TypeScript** – Ensures type safety and scalability.

### **Backend & AI**
- **Google Gemini API & OpenAI API** – AI-powered symptom analysis.
- **Firebase** – Secure authentication and real-time data storage.
- **Twilio** – Direct doctor calls for streamlined appointment booking.

### **Communication & Email Services**
- **SendGrid, Nodemailer & Resend** – Email notifications for appointment confirmations.
- **React Hot Toast** – Real-time notifications.

## Visuals
### **Main Page**
- A welcoming home screen introducing the AI Health Consultation service.

### **Consultation**
- A user-friendly chat interface where users enter symptoms and receive AI-generated diagnoses.

### **Diagnosis Summary**
- A detailed report displaying diagnosed conditions, precautions, and appointment booking options.

## Impact
By leveraging AI and automation, our system **reduces hospital wait times**, ensures **faster medical consultations**, and improves **healthcare accessibility** for all Canadians. 🚀💙

# Page-by-Page Technology Breakdown

## **Home Page (`app/page.tsx`)**
**Purpose:** Landing page with authentication and navigation.
**Technologies Used:**
- Next.js 13+ (App Router)
- Firebase Authentication
- React Hooks
- React Hot Toast
- Tailwind CSS

## **AI Doctor Page (`app/ai/page.tsx`)**
**Purpose:** AI-powered medical consultation via voice interaction.
**Technologies Used:**
- Google's Gemini AI API
- Web Speech API (Speech Recognition & Synthesis)
- Firebase Firestore
- React Hooks
- Tailwind CSS

## **Therapist Page (`app/therapist/page.tsx`)**
**Purpose:** AI-powered mental health consultation via text chat.
**Technologies Used:**
- Google's Gemini AI API
- Firebase Firestore
- React Hooks
- Tailwind CSS

## **Choose Doctor Page (`app/choose-doctor/page.tsx`)**
**Purpose:** Selection interface between AI Doctor and Therapist.
**Technologies Used:**
- Next.js Navigation
- Firebase Authentication
- React Hot Toast
- Tailwind CSS

## **Edit Profile Page (`app/edit-profile/page.tsx`)**
**Purpose:** User profile management and consultation history.
**Technologies Used:**
- Firebase Firestore
- Firebase Authentication
- React Firebase Hooks
- React Hot Toast
- Tailwind CSS

## **Summary Page (`app/summary/page.tsx`)**
**Purpose:** Consultation summary and report generation.
**Technologies Used:**
- Firebase Authentication
- Next.js Navigation
- React Hot Toast
- Tailwind CSS

## **Sign Up Page (`app/sign-up/page.tsx`)**
**Purpose:** User registration with validation.
**Technologies Used:**
- Firebase Authentication
- Firebase Firestore
- React Hot Toast
- Form Validation
- Tailwind CSS

## **Sign In Page (`app/sign-in/page.tsx`)**
**Purpose:** User authentication and login interface.
**Technologies Used:**
- Next.js 13+ (App Router)
- Firebase Authentication
- React Hooks
- React Hot Toast
- Form Validation
- Tailwind CSS

## **User Profile Page (`app/user-profile/page.tsx`)**
**Purpose:** Initial profile setup and information collection.
**Technologies Used:**
- Next.js 13+ (App Router)
- Firebase Firestore
- Firebase Authentication
- React Firebase Hooks
- React Hot Toast
- Tailwind CSS

# API Routes

## **Phone Call API (`app/api/phone-call/route.tsx`)**
**Purpose:** Handles Twilio integration for appointment booking via phone calls.
**Technologies Used:**
- Twilio API
- Next.js API Routes
- Node-Fetch
- TwiML (Twilio Markup Language)

## **Process Response API (`app/api/process-response/route.tsx`)**
**Purpose:** Handles AI responses and symptom extraction.
**Technologies Used:**
- Google's Gemini AI API
- Next.js API Routes
- Edge Runtime
- JSON Processing




