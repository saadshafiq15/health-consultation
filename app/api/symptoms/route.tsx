import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const SYMPTOMS_LIST = [' unsteadiness', ' puffy_face_and_eyes', ' brittle_nails', ' enlarged_thyroid', ' muscle_weakness', ' redness_of_eyes', ' fluid_overload', ' bloody_stool', ' cough', ' yellowing_of_eyes', ' high_fever', ' irregular_sugar_level', ' swollen_blood_vessels', ' headache', ' pain_in_anal_region', ' irritability', ' extra_marital_contacts', ' shivering', ' diarrhoea', ' irritation_in_anus', ' weakness_in_limbs', ' movement_stiffness', ' obesity', 'itching', ' swelling_of_stomach', ' acute_liver_failure', ' blood_in_sputum', ' patches_in_throat', ' dischromic patches', ' ulcers_on_tongue', ' excessive_hunger', ' muscle_pain', ' palpitations', ' stomach_bleeding', ' yellow_crust_ooze', ' receiving_unsterile_injections', ' skin_rash', ' joint_pain', ' skin_peeling', ' small_dents_in_nails', ' acidity', ' cramps', ' red_sore_around_nose', ' polyuria', ' bladder_discomfort', ' congestion', ' loss_of_balance', ' altered_sensorium', ' mood_swings', ' coma', ' weight_gain', ' sunken_eyes', ' pus_filled_pimples', ' bruising', ' hip_joint_pain', ' restlessness', ' depression', ' continuous_sneezing', ' chest_pain', ' sinus_pressure', ' muscle_wasting', ' yellowish_skin', ' spinning_movements', ' scurring', ' visual_disturbances', ' runny_nose', ' back_pain', ' swelling_joints', ' blister', ' foul_smell_of urine', ' stomach_pain', ' fast_heart_rate', ' dark_urine', ' indigestion', ' loss_of_appetite', ' distention_of_abdomen', ' painful_walking', ' yellow_urine', ' increased_appetite', ' breathlessness', ' drying_and_tingling_lips', ' toxic_look(typhos)', ' receiving_blood_transfusion', ' slurred_speech', ' blurred_and_distorted_vision', ' anxiety', ' dehydration', ' pain_behind_the_eyes', ' red_spots_over_body', ' knee_pain', ' lethargy', ' sweating', ' swollen_legs', ' abnormal_menstruation', ' fatigue', ' swollen_extremeties', ' inflammatory_nails', ' mild_fever', ' belly_pain', ' abdominal_pain', ' loss_of_smell', ' stiff_neck', ' vomiting', ' throat_irritation', ' family_history', ' cold_hands_and_feets', ' watering_from_eyes', ' malaise', ' dizziness', ' continuous_feel_of_urine', ' history_of_alcohol_consumption', ' phlegm', ' nausea', ' silver_like_dusting', ' chills', ' constipation', ' nodal_skin_eruptions', ' blackheads', ' swelled_lymph_nodes', ' prominent_veins_on_calf', ' rusty_sputum', ' passage_of_gases', ' weight_loss', ' spotting_ urination', ' lack_of_concentration', ' internal_itching', ' neck_pain', ' pain_during_bowel_movements', ' mucoid_sputum', ' burning_micturition', ' weakness_of_one_body_side'];

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const AI_PROMPT = `You are a medical symptom analyzer. Your task is to extract symptoms from the user responses and match them to the following predefined list of symptoms: ${SYMPTOMS_LIST.join(", ")}

If a mentioned symptom is similar to one in the list, map it to the closest matching term.

Return the symptoms in this JSON format:
{
  "symptoms": ["symptom1", "symptom2", ...]
}

If no symptoms are detected, return:
{
  "symptoms": []
}`;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: AI_PROMPT },
        { role: "user", content: text }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"symptoms": []}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing symptoms:', error);
    return NextResponse.json({ error: 'Failed to process symptoms' }, { status: 500 });
  }
}
