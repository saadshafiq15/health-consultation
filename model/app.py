from flask import Flask, request, jsonify, render_template
import joblib
import pandas as pd

app = Flask(__name__)

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



# Create a dictionary for easy lookup
precaution_dict = {}
description_dict = {}
for _, row in disease_precaution.iterrows():
    precaution_dict[row['Disease'].strip().lower()] = {
        'Precautions': row['Precautions']
    }

for _, row in disease_description.iterrows():
    description_dict[row['Disease'].strip().lower()] = row['Description']

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.get_json()
    symptoms = data['symptoms']
    predictions = model.predict([symptoms])
    print(predictions)
    prediction = model.predict([symptoms])[0]
    precautions = precaution_dict.get(prediction.lower(), {})

    return jsonify({
        'disease': prediction,
        'precautions': precautions.get('Precautions', 'Not available'),
        'description': description_dict.get(prediction.lower(), 'Not available')
    })

if __name__ == '__main__':
    app.run(debug=True)

