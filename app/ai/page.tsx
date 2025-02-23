'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Heart, Activity, Stethoscope } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from 'next/navigation';

// Add at the top of the file, after the imports
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const INITIAL_PROMPT = "Hello, I'm here to help you today. I'll ask you some questions about how you're feeling.";

const QUESTIONS = [
  "What symptoms are you experiencing today?",
];

const SYMPTOMS_LIST = [' unsteadiness', ' puffy_face_and_eyes', ' brittle_nails', ' enlarged_thyroid', ' muscle_weakness', ' redness_of_eyes', ' fluid_overload', ' bloody_stool', ' cough', ' yellowing_of_eyes', ' high_fever', ' irregular_sugar_level', ' swollen_blood_vessels', ' headache', ' pain_in_anal_region', ' irritability', ' extra_marital_contacts', ' shivering', ' diarrhoea', ' irritation_in_anus', ' weakness_in_limbs', ' movement_stiffness', ' obesity', 'itching', ' swelling_of_stomach', ' acute_liver_failure', ' blood_in_sputum', ' patches_in_throat', ' dischromic patches', ' ulcers_on_tongue', ' excessive_hunger', ' muscle_pain', ' palpitations', ' stomach_bleeding', ' yellow_crust_ooze', ' receiving_unsterile_injections', ' skin_rash', ' joint_pain', ' skin_peeling', ' small_dents_in_nails', ' acidity', ' cramps', ' red_sore_around_nose', ' polyuria', ' bladder_discomfort', ' congestion', ' loss_of_balance', ' altered_sensorium', ' mood_swings', ' coma', ' weight_gain', ' sunken_eyes', ' pus_filled_pimples', ' bruising', ' hip_joint_pain', ' restlessness', ' depression', ' continuous_sneezing', ' chest_pain', ' sinus_pressure', ' muscle_wasting', ' yellowish_skin', ' spinning_movements', ' scurring', ' visual_disturbances', ' runny_nose', ' back_pain', ' swelling_joints', ' blister', ' foul_smell_of urine', ' stomach_pain', ' fast_heart_rate', ' dark_urine', ' indigestion', ' loss_of_appetite', ' distention_of_abdomen', ' painful_walking', ' yellow_urine', ' increased_appetite', ' breathlessness', ' drying_and_tingling_lips', ' toxic_look(typhos)', ' receiving_blood_transfusion', ' slurred_speech', ' blurred_and_distorted_vision', ' anxiety', ' dehydration', ' pain_behind_the_eyes', ' red_spots_over_body', ' knee_pain', ' lethargy', ' sweating', ' swollen_legs', ' abnormal_menstruation', ' fatigue', ' swollen_extremeties', ' inflammatory_nails', ' mild_fever', ' belly_pain', ' abdominal_pain', ' loss_of_smell', ' stiff_neck', ' vomiting', ' throat_irritation', ' family_history', ' cold_hands_and_feets', ' watering_from_eyes', ' malaise', ' dizziness', ' continuous_feel_of_urine', ' history_of_alcohol_consumption', ' phlegm', ' nausea', ' silver_like_dusting', ' chills', ' constipation', ' nodal_skin_eruptions', ' blackheads', ' swelled_lymph_nodes', ' prominent_veins_on_calf', ' rusty_sputum', ' passage_of_gases', ' weight_loss', ' spotting_ urination', ' lack_of_concentration', ' internal_itching', ' neck_pain', ' pain_during_bowel_movements', ' mucoid_sputum', ' burning_micturition', ' weakness_of_one_body_side'];

const AI_PROMPT = {
  role: "user",
  parts: [
    {
      text: `
      Your task is to extract **only relevant symptoms** from a conversation.
      Symptoms must match one of the following predefined terms: ${SYMPTOMS_LIST.join(", ")}.

      If a symptom is mentioned using a synonym, map it to the correct term from the list.

      **Output format:**
      Return the symptoms as a JSON array, e.g.:
      {
        "symptoms": ["", "", ""]
      }

      If no symptoms are detected, return:
      {
        "symptoms": []
      }
      `,
    }
  ],
};

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
      <div className="flex flex-col items-center text-center">
        <div className="mb-2 p-2 bg-gray-50 rounded-xl">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  const router = useRouter();
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [consultationComplete, setConsultationComplete] = useState(false);

  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechRecognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechSynthesisRef.current = window.speechSynthesis;

      speechRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0])
          .map((result: SpeechRecognitionAlternative) => result.transcript)
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

  const getDiagnosis = async (symptoms: string[]) => {
    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptoms.join(',') }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setSymptoms(data.symptoms);
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
        await getDiagnosis(extractedSymptoms);
        
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
    speak(QUESTIONS[0]);
  };

  const handleEndConsultation = () => {
    speechRecognitionRef.current?.stop();
    speechSynthesisRef.current?.cancel();
    setIsStarted(false);
    setIsListening(false);
    setIsSpeaking(false);
    setConsultationComplete(true);
    router.push('/summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        {!isStarted ? (
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl rotate-45 transform transition-transform hover:rotate-[60deg]">
                      <div className="absolute inset-0 -rotate-45 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Medical Assistant</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Experience the future of healthcare with our AI-powered medical consultation
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
                  <FeatureCard 
                    icon={<Heart className="w-8 h-8 text-red-500" />}
                    title="Smart Diagnosis"
                    description="Advanced AI analysis for accurate symptom assessment"
                  />
                  <FeatureCard 
                    icon={<Activity className="w-8 h-8 text-blue-500" />}
                    title="Real-time Analysis"
                    description="Instant processing of your medical concerns"
                  />
                  <FeatureCard 
                    icon={<Stethoscope className="w-8 h-8 text-green-500" />}
                    title="Medical Expertise"
                    description="Backed by comprehensive medical knowledge"
                  />
                </div>

                {!consultationComplete && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <button
                      onClick={startConsultation}
                      className="relative px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center gap-2"
                    >
                      <Bot className="w-5 h-5" />
                      Start Consultation
                    </button>
                  </div>
                )}
                
                <div className="bg-gray-100 px-4 py-3 rounded-xl text-gray-700 text-center max-w-lg shadow-md transition-transform duration-300 hover:scale-105 flex items-center gap-2">
                  <span className="text-xl">🛡️</span> 
                  <span className="text-sm">Disclaimer: Any information you provide is strictly for the purpose of assisting you and remains safe and confidential.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-8 flex flex-col items-center">
              {isSpeaking && (
                <div className="text-6xl text-blue-500 animate-bounce mb-4">
                  🎙️
                </div>
              )}
              <div className="bg-gray-100 p-4 rounded-lg w-full">
                <p className="text-xl text-gray-800">{currentMessage || "Listening..."}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.startsWith('AI:') 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleUserResponse}
                disabled={isSpeaking}
                className={`px-6 py-3 rounded-lg ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors ${
                  isSpeaking ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isListening ? 'Stop Speaking' : 'Start Speaking'}
              </button>
              <button
                onClick={handleEndConsultation}
                className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
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