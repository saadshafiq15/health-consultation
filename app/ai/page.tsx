'use client';

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/config';
import { collection, addDoc, doc, Timestamp } from 'firebase/firestore';
import { auth } from '@/firebase/config';


// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const INITIAL_PROMPT = "Hello, I'm here to help you today. I'll ask you some questions about how you're feeling.";

const QUESTIONS = [
    "How are you feeling today?",
    "What symptoms are you experiencing today?",
    "How long have you been feeling this way?",
    "How severe are the symptoms?",
    "Have you experienced these symptoms before?",
    "What else can you tell me about your condition?",
    "Let me analyze your symptoms further, give me up to a minute.",
  ];
  
  const SYMPTOMS_LIST = [' unsteadiness', ' puffy_face_and_eyes', ' brittle_nails', ' enlarged_thyroid', ' muscle_weakness', ' redness_of_eyes', ' fluid_overload', ' bloody_stool', ' cough', ' yellowing_of_eyes', ' high_fever', ' irregular_sugar_level', ' swollen_blood_vessels', ' headache', ' pain_in_anal_region', ' irritability', ' extra_marital_contacts', ' shivering', ' diarrhoea', ' irritation_in_anus', ' weakness_in_limbs', ' movement_stiffness', ' obesity', 'itching', ' swelling_of_stomach', ' acute_liver_failure', ' blood_in_sputum', ' patches_in_throat', ' dischromic patches', ' ulcers_on_tongue', ' excessive_hunger', ' muscle_pain', ' palpitations', ' stomach_bleeding', ' yellow_crust_ooze', ' receiving_unsterile_injections', ' skin_rash', ' joint_pain', ' skin_peeling', ' small_dents_in_nails', ' acidity', ' cramps', ' red_sore_around_nose', ' polyuria', ' bladder_discomfort', ' congestion', ' loss_of_balance', ' altered_sensorium', ' mood_swings', ' coma', ' weight_gain', ' sunken_eyes', ' pus_filled_pimples', ' bruising', ' hip_joint_pain', ' restlessness', ' depression', ' continuous_sneezing', ' chest_pain', ' sinus_pressure', ' muscle_wasting', ' yellowish_skin', ' spinning_movements', ' scurring', ' visual_disturbances', ' runny_nose', ' back_pain', ' swelling_joints', ' blister', ' foul_smell_of urine', ' stomach_pain', ' fast_heart_rate', ' dark_urine', ' indigestion', ' loss_of_appetite', ' distention_of_abdomen', ' painful_walking', ' yellow_urine', ' increased_appetite', ' breathlessness', ' drying_and_tingling_lips', ' toxic_look(typhos)', ' receiving_blood_transfusion', ' slurred_speech', ' blurred_and_distorted_vision', ' anxiety', ' dehydration', ' pain_behind_the_eyes', ' red_spots_over_body', ' knee_pain', ' lethargy', ' sweating', ' swollen_legs', ' abnormal_menstruation', ' fatigue', ' swollen_extremeties', ' inflammatory_nails', ' mild_fever', ' belly_pain', ' abdominal_pain', ' loss_of_smell', ' stiff_neck', ' vomiting', ' throat_irritation', ' family_history', ' cold_hands_and_feets', ' watering_from_eyes', ' malaise', ' dizziness', ' continuous_feel_of_urine', ' history_of_alcohol_consumption', ' phlegm', ' nausea', ' silver_like_dusting', ' chills', ' constipation', ' nodal_skin_eruptions', ' blackheads', ' swelled_lymph_nodes', ' prominent_veins_on_calf', ' rusty_sputum', ' passage_of_gases', ' weight_loss', ' spotting_ urination', ' lack_of_concentration', ' internal_itching', ' neck_pain', ' pain_during_bowel_movements', ' mucoid_sputum', ' burning_micturition', ' weakness_of_one_body_side'];
  
  const AI_PROMPT = {
    role: "user",
    parts: [
      {
        text: `A patient is describing their symptoms. Your job is to extract only the relevant symptoms from the provided text. Follow these strict guidelines:
  
          Only extract symptoms present in the predefined list below:
          ${SYMPTOMS_LIST.join(", ")}
  
          If a symptom is described with a synonym or similar phrase, map it to the closest matching term from the list.
  
          Example: "My stomach hurts" → "stomach_pain"
          Example: "I feel weak" → "fatigue"
          Do not invent or assume symptoms if they are not clearly mentioned.
  
          Output format (strict JSON format):
  
          json
          Copy
          Edit
          {
          "symptoms": ["symptom1", "symptom2", ...]
          }
          If no symptoms are detected, return:
  
          json
          Copy
          Edit
          {
          "symptoms": []
          }
              `,
      }
    ],
  };

export default function ConsultationPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      //@ts-expect-error
      speechRecognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechSynthesisRef.current = window.speechSynthesis;

      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
        //@ts-expect-error
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setCurrentMessage(transcript);
      };

      return () => {
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
      };
    }
  }, []);

  const speak = async (text: string) => {
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

    const DIAGNOSIS_PROMPT = (symptoms: string[]) => ({
    role: "user",
    parts: [
        {
        text: `
    You are a medical assistant. Based on the following symptoms, provide:
    - The most likely diagnosis (disease name)
    - A brief description of the disease
    - Recommended precautions

    Symptoms: ${symptoms.join(", ")}

    Output format (strict JSON):
    {
    "disease": "disease_name",
    "description": "short description",
    "precautions": "recommended precautions"
    }
    If you cannot diagnose, return:
    {
    "disease": "Unknown",
    "description": "Unable to determine based on provided symptoms.",
    "precautions": "Consult a healthcare professional."
    }
        `,
        },
    ],
    });

    const getDiagnosis = async (symptoms: string[]) => {
    try {
        const chat = await model.startChat({
        history: [DIAGNOSIS_PROMPT(symptoms)],
        });
        const result = await chat.sendMessage('');
        const text = result.response.text();
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : '{}';
        const data = JSON.parse(jsonStr);

        setDiagnosis(data);
        await saveToFirestore(data);
    } catch (error) {
        console.error('Error getting diagnosis:', error);
    }
    };

  const handleUserResponse = async () => {
    speechRecognitionRef.current?.stop();
    setIsListening(false);
    
    if (currentMessage.trim()) {
      setChatHistory(prev => [...prev, `You: ${currentMessage}`]);
      
      if (currentQuestionIndex >= QUESTIONS.length - 1) {
        const chat = await model.startChat({
          history: [AI_PROMPT],
        });
        
        const result = await chat.sendMessage(chatHistory.join('\n'));
        const extractedSymptoms = result.response.text().split(',').map(s => s.trim());
        setSymptoms(extractedSymptoms);
        await getDiagnosis(extractedSymptoms);
        setShowResults(true);
        setConsultationComplete(true);
        
        speak("Thank you for sharing all this information. I've recorded your symptoms. This consultation is now complete.");
        setIsStarted(false);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentMessage('');
        speak(QUESTIONS[currentQuestionIndex + 1]);
      }
    }
  };

  const startConsultation = async () => {
    if (consultationComplete) return;
    setIsStarted(true);
    setShowResults(false);
    speak(QUESTIONS[0]);
  };

  const toggleListening = () => {
    if (isListening) {
      handleUserResponse();
    } else {
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-800 mb-4">AI Medical Assistant</h1>
          <p className="text-gray-600 text-lg">Your Virtual Healthcare Companion</p>
        </div>

        {!isStarted && !consultationComplete && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Important Disclaimer</h2>
            <div className="prose text-gray-700">
              <p className="mb-4">This AI Medical Assistant is for informational purposes only and should not be considered as a replacement for professional medical advice, diagnosis, or treatment.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Always consult with a qualified healthcare provider for medical concerns</li>
                <li>In case of emergency, call your local emergency services immediately</li>
                <li>The AI's suggestions are based on the symptoms you describe and may not be completely accurate</li>
                <li>Your data is processed securely and not stored permanently</li>
              </ul>
              <p className="mt-4 font-semibold">By continuing, you acknowledge and accept these terms.</p>
            </div>
          </div>
        )}

        {!isStarted ? (
          <div className="flex flex-col items-center gap-8">
            {!consultationComplete ? (
              <button
                onClick={startConsultation}
                className="px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-2xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Begin Consultation
              </button>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 w-full">
                <h2 className="text-3xl font-bold text-blue-800 mb-6">Consultation Summary</h2>
                <div className="space-y-6">
                  {diagnosis && (
                    <div className="space-y-6">
                      <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-green-900 mb-2">Potential Diagnosis:</h3>
                        <p className="text-gray-700">{diagnosis.disease}</p>
                      </div>
                      <div className="bg-yellow-50 p-6 rounded-lg">
                        <h4 className="text-xl font-semibold text-yellow-900 mb-2">Description:</h4>
                        <p className="text-gray-700">{diagnosis.description}</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-lg">
                        <h4 className="text-xl font-semibold text-red-900 mb-2">Recommended Precautions:</h4>
                        <p className="text-gray-700">{diagnosis.precautions}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={() => router.push('/edit-profile')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8 flex flex-col items-center">
              {isSpeaking && (
                <div className="text-6xl animate-pulse mb-4">
                  🎙️
                </div>
              )}
              <div className="bg-gray-50 p-6 rounded-xl w-full border border-gray-200">
                <p className="text-xl text-gray-800 text-center">
                  {currentMessage || (isListening ? "Listening..." : "Ready to start")}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto custom-scrollbar">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${
                    message.startsWith('AI:') 
                      ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-500' 
                      : 'bg-gray-50 text-gray-800 border-l-4 border-gray-500'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-6">
              <button
                onClick={toggleListening}
                disabled={isSpeaking}
                className={`px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white shadow-lg hover:shadow-xl ${
                  isSpeaking ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isListening ? '⏹️ Stop Speaking' : '🎤 Start Speaking'}
              </button>
              <button
                onClick={endConsultation}
                className="px-8 py-4 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                End Consultation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}