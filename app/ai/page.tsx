'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export default function ConsultationPage() {
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
      speechRecognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechSynthesisRef.current = window.speechSynthesis;

      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
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
      setDiagnosis(data);
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">AI Medical Assistant</h1>

        {!isStarted ? (
          <div className="flex flex-col items-center gap-8">
            {!consultationComplete ? (
              <button
                onClick={startConsultation}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-semibold transition-colors"
              >
                Start Consultation
              </button>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Consultation Summary</h2>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-700">Identified Symptoms:</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {symptoms.map((symptom, i) => (
                      <li key={i} className="text-gray-600">{symptom}</li>
                    ))}
                  </ul>
                  {diagnosis && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold text-gray-700">Diagnosis:</h3>
                      <p className="text-gray-600">{diagnosis.disease}</p>
                      <h4 className="text-lg font-semibold text-gray-700 mt-4">Description:</h4>
                      <p className="text-gray-600">{diagnosis.description}</p>
                      <h4 className="text-lg font-semibold text-gray-700 mt-4">Precautions:</h4>
                      <p className="text-gray-600">{diagnosis.precautions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                onClick={toggleListening}
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
                onClick={endConsultation}
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