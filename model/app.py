from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)

CORS(app)

# Load the trained model
model = joblib.load('./disease_model.joblib')

# Load the precaution data
disease_precaution = pd.read_csv('./data/Disease precaution.csv')
disease_description = pd.read_csv('./data/DiseaseDescription.csv')

# Combine all precautions into a single string for each disease
disease_precaution['Precautions'] = disease_precaution.apply(
    lambda row: ', '.join([str(row[f'Precaution_{i}']).strip() for i in range(1, 5) if pd.notna(row[f'Precaution_{i}'])]),
    axis=1
)

#Use existing to send symptomps to the model


# Create a dictionary for easy lookup
precaution_dict = {}
description_dict = {}
for _, row in disease_precaution.iterrows():
    precaution_dict[row['Disease'].strip().lower()] = {
        'Precautions': row['Precautions']
    }

for _, row in disease_description.iterrows():
    description_dict[row['Disease'].strip().lower()] = row['Description']


@app.route('/', methods=['POST'])
def diagnose():
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({"error": "No symptoms provided"}), 400

    symptoms = data['symptoms']
    print(symptoms)

    try:
        # Ensure the symptoms format is compatible with the model
        prediction = model.predict([symptoms])[0]  # Extract first element # Ensure it's a 2D array
        print(prediction)
        prediction = prediction.lower()
        print(prediction)
    except Exception as e:
        print("Prediction error:", str(e)) 
        return jsonify({"error": str(e)}), 500
    

    precautions = precaution_dict.get(prediction, {})

    precaution = None
    description = None

    if "hypertension" in prediction.lower():
        precaution = "meditation,salt baths,reduce stress,get proper sleep"
        description = "Hypertension is a condition in which the force of the blood against the artery walls is too high. Usually hypertension is defined as blood pressure above 140/90, and is considered severe if the pressure is above 180/120."
    elif "diabetes" in prediction.lower():
        precaution = "eat healthy foods,exercise regularly,monitor blood sugar,monitor blood pressure"
        description = "Diabetes is a disease that occurs when your blood glucose, also called blood sugar, is too high. Blood glucose is your main source of energy and comes from the food you eat."
    else:
        precaution = precautions.get('Precautions', 'Not available')
        description = description_dict.get(prediction, 'Not available')
    return jsonify({
        'disease': prediction,
        'precautions': precaution,
        'description': description
    })

if __name__ == '__main__':
    app.run(debug=True)