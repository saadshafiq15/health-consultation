'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/firebase/config';
import { collection, addDoc, doc, Timestamp } from 'firebase/firestore';

const INITIAL_PROMPT = "Hello, I'm here to help you today. I'll ask you some questions about how you're feeling.";

const QUESTIONS = [
  "How are you feeling today?",
  "What symptoms are you experiencing today?",
  "How long have you been feeling this way?",
  "How severe are the symptoms?",
  "Have you experienced these symptoms before?",
  "What else can you tell me about your condition?",    
];

const SYMPTOMS_LIST = [
  'unsteadiness', 'puffy_face_and_eyes', 'brittle_nails', 
  'enlarged_thyroid', 'muscle_weakness', 'redness_of_eyes',
  // ... (rest of your symptoms)
];

export default function ConsultationPage() {
  const router = useRouter();

  // States
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [consultationComplete, setConsultationComplete] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Dynamic imports for Firebase and Gemini
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    // Speech recognition initialization
    if (typeof window !== 'undefined') {
      // @ts-ignore
      speechRecognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechSynthesisRef.current = window.speechSynthesis;

      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setCurrentMessage(transcript);
      };

      return () => {
        speechRecognitionRef.current?.stop();
        speechSynthesisRef.current?.cancel();
      };
    }
  }, []);

  useEffect(() => {
    // Lazy load Gemini AI (only in the browser)
    if (typeof window !== 'undefined' && !model) {
      import('@google/generative-ai').then(({ GoogleGenerativeAI }) => {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
        setModel(genAI.getGenerativeModel({ model: "gemini-pro" }));
      });
    }
  }, [model]);

  const speak = (text: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current?.speak(utterance);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsListening(true);
      speechRecognitionRef.current?.start();
    };
    setChatHistory(prev => [...prev, `AI: ${text}`]);
  };

  const saveToFirestore = async (diagnosisData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const consultationsCollectionRef = collection(userDocRef, 'consultations');
      
      await addDoc(consultationsCollectionRef, {
        diagnosis: diagnosisData.disease,
        description: diagnosisData.description,
        precautions: diagnosisData.precautions,
        timestamp: Timestamp.now()
      });

    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  };

  const getDiagnosis = async (symptoms: string[]) => {
    try {
      const response = await fetch('http://localhost:5000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptoms.join(',') }),
      });
      const data = await response.json();
      setDiagnosis(data);
      await saveToFirestore(data);
    } catch (error) {
      console.error('Error getting diagnosis:', error);
    }
  };

  const handleUserResponse = async () => {
    speechRecognitionRef.current?.stop();
    setIsListening(false);

    if (!currentMessage.trim()) return;

    setChatHistory(prev => [...prev, `You: ${currentMessage}`]);

    if (currentQuestionIndex >= QUESTIONS.length - 1) {
      if (!model) return;

      const AI_PROMPT = {
        role: "user",
        parts: [{
          text: `A patient is describing their symptoms. Extract relevant symptoms from the text.
          Only consider: ${SYMPTOMS_LIST.join(', ')}
          Output as JSON: { "symptoms": ["symptom1", "symptom2", ...] }`
        }]
      };

      const chat = await model.startChat({ history: [AI_PROMPT] });
      const result = await chat.sendMessage(chatHistory.join('\n'));
      const extractedSymptoms = result.response.text().split(',').map((s: string) => s.trim());

      setSymptoms(extractedSymptoms);
      await getDiagnosis(extractedSymptoms);
      setShowResults(true);
      setConsultationComplete(true);

      speak("Thank you. Consultation complete.");
      setIsStarted(false);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentMessage('');
      speak(QUESTIONS[currentQuestionIndex + 1]);
    }
  };

  const startConsultation = () => {
    if (consultationComplete) return;
    setIsStarted(true);
    setShowResults(false);
    speak(QUESTIONS[0]);
  };

  const toggleListening = () => {
    if (isListening) handleUserResponse();
    else {
      setIsListening(true);
      speechRecognitionRef.current?.start();
    }
  };

  const endConsultation = () => {
    speechRecognitionRef.current?.stop();
    speechSynthesisRef.current?.cancel();
    setIsStarted(false);
    setIsListening(false);
    setIsSpeaking(false);
    setShowResults(true);
    setConsultationComplete(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-5xl font-bold text-blue-800 mb-4 text-center">AI Medical Assistant</h1>
        {!isStarted && !consultationComplete && (
          <button
            onClick={startConsultation}
            className="px-12 py-6 bg-blue-600 text-white rounded-xl text-2xl font-semibold"
          >
            Begin Consultation
          </button>
        )}
        {/* Add your chat UI here */}
      </div>
    </div>
  );
}
