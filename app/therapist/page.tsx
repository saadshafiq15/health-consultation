'use client';

export const dynamic = "force-dynamic";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase/config';
import { doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast from 'react-hot-toast';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const INITIAL_PROMPT = "Hello, I'm here to listen and support you. This is a safe space where you can share whatever is on your mind. Would you like to tell me what brings you here today?";

const AI_PROMPT = {
    role: "user",
    parts: [{
        text: `You are an empathetic AI therapist having a conversation with someone seeking emotional support. Your role is to:
- have a 1.5 second delay before responding and reduce the typing speed a bit
-give concise answers with sentiments 
- there should be constrcutive feedback and a balance between being empathetic and helpful
-it should provide solutions and not just listen
- Listen actively and respond with genuine empathy
- Help the person explore their feelings and thoughts
- Validate their emotions without judgment
- Ask thoughtful follow-up questions
- Offer gentle guidance and coping strategies when appropriate

Guidelines for your responses:
- Keep responses concisewarm, personal, and conversational
- Use reflective listening ("It sounds like...", "I hear that...")
- Ask open-ended questions to explore deeper
- Validate emotions ("It's completely natural to feel...")
- Share relevant coping strategies or insights gently


- Be patient and give space for complex emotions
- If crisis signs appear, recommend professional help immediately

Response structure:
1. Acknowledge their feelings
2. Reflect understanding
3. Ask a relevant follow-up question OR offer gentle guidance
4. Always maintain a supportive, non-judgmental tone

Examples :
User:
"I'm feeling really uncertain about my future. I don't know if I'm making the right choices, and it's starting to stress me out."

AI Response:
"I hear you, and I just want to acknowledge how heavy that must feel. It's completely understandable to feel this way—life can be so unpredictable, and when you're standing at a crossroads, it's natural to question whether you're making the right decisions.

But here's something I want you to remember: You don't have to have it all figured out right now. No one truly does. The future is built one small step at a time, and sometimes, the best thing you can do is focus on what feels right for you in this moment, rather than trying to see the whole picture at once.

You are doing the best you can with what you know right now, and that is enough. Is there something that has been pulling at your heart lately, something you feel drawn to explore? Sometimes, the answers come not through overthinking, but through experiencing."


User:
"I keep overthinking everything. Even small decisions make me anxious, and I just feel stuck in my own head all the time."

AI Response:
"That sounds incredibly exhausting, and I just want you to know—I truly understand how draining it can be when your mind feels like it won't slow down. Anxiety has a way of making every choice feel monumental, like there's a 'right' and 'wrong' answer for everything, but the truth is, most of the time, there isn't. You are allowed to make choices without knowing exactly how they'll turn out.

Your mind is working overtime to protect you, to help you avoid mistakes, to keep you safe. But sometimes, it helps to remind yourself that not every thought deserves your full attention. One thing that might help is grounding yourself in something physical—maybe holding something cold, taking deep breaths, or even stepping outside for a few moments. The goal isn't to 'stop' the thoughts, but to remind yourself that you are here, in this moment, and you are safe.

What's something small and comforting you could do for yourself right now? Even a tiny act of self-kindness—listening to music, stretching, or making a warm drink—can be a powerful way to shift your focus for a moment."


CRITICAL SAFETY PROTOCOL:
If you detect any signs of:
- Suicidal thoughts
- Self-harm
- Abuse
- Severe crisis
Immediately provide:
- Crisis hotline number: 988
- Urgent recommendation to seek professional help
- Reminder that they're not alone

Remember: You're not here to diagnose or solve problems, but to listen, understand, and support.`
    }]
};

export default function TherapistPage() {
    const router = useRouter();
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const [isStarted, setIsStarted] = useState(false);
    const [consultationComplete, setConsultationComplete] = useState(false);

    const saveToFirestore = async (sessionData: any) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userDocRef = doc(db, 'users', user.uid);
            const therapySessionsRef = collection(userDocRef, 'therapy_sessions');
            
            await addDoc(therapySessionsRef, {
                conversation: chatHistory,
                timestamp: Timestamp.now()
            });
        } catch (error) {
            console.error('Error saving therapy session:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!currentMessage.trim()) return;

        setIsLoading(true);
        const userMessage = currentMessage;
        setCurrentMessage('');
        setChatHistory(prev => [...prev, `You: ${userMessage}`]);

        try {
            const chat = await model.startChat({
                history: [AI_PROMPT],
            });
            
            const result = await chat.sendMessage(chatHistory.join('\n') + '\n' + userMessage);
            const response = result.response.text();
            
            setChatHistory(prev => [...prev, `Therapist: ${response}`]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            toast.error('Failed to get response');
        } finally {
            setIsLoading(false);
        }
    };

    const startConsultation = () => {
        setIsStarted(true);
        setChatHistory([`Therapist: ${INITIAL_PROMPT}`]);
    };

    const endConsultation = async () => {
        await saveToFirestore({
            conversation: chatHistory
        });
        setChatHistory(prev => [...prev, 
            "Therapist: Thank you for sharing with me today. Remember, it's okay to seek support when you need it. Take care of yourself."
        ]);
        setConsultationComplete(true);
        setIsStarted(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
            <div className="max-w-4xl mx-auto p-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-slate-700 mb-4">AI Therapist</h1>
                    <p className="text-gray-600 text-lg">Your Mental Health Companion</p>
                </div>

                {!isStarted && !consultationComplete && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-semibold text-slate-600 mb-4">Important Information</h2>
                        <div className="prose text-gray-700">
                            <p className="mb-4">This AI Therapist is here to provide emotional support and a listening ear. However, please note:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>This is not a replacement for professional mental health treatment</li>
                                <li>In case of crisis, please contact emergency services or crisis hotline (988)</li>
                                <li>All conversations are confidential and secure</li>
                                <li>You can end the session at any time</li>
                            </ul>
                            <p className="mt-4 font-semibold">Your wellbeing is important. By continuing, you understand these terms.</p>
                        </div>
                    </div>
                )}

                {isStarted ? (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
                            {chatHistory.map((message, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl ${
                                        message.startsWith('You:') 
                                            ? 'bg-blue-50 ml-12' 
                                            : 'bg-slate-50 mr-12'
                                    }`}
                                >
                                    {message}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-center">
                                    <div className="animate-pulse text-slate-600">Therapist is typing...</div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message here..."
                                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !currentMessage.trim()}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                Send
                            </button>
                            <button
                                onClick={endConsultation}
                                className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <button
                            onClick={startConsultation}
                            className="px-12 py-6 bg-blue-500 text-white rounded-xl text-2xl font-semibold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Start Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}