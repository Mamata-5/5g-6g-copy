from flask import Flask, request, jsonify
from flask_cors import CORS
from model import AnomalyDetector
import time
import os
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from React frontend

detector = AnomalyDetector()

# Initialize Firebase
db = None
try:
    if os.path.exists('serviceAccountKey.json'):
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Firestore Connected")
    else:
        print("Warning: serviceAccountKey.json not found. Running in in-memory mode.")
except Exception as e:
    print(f"Error initializing Firebase: {e}")

# In-memory store (fallback)
user_activity = {}

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    wallet = data.get('wallet')
    resource = data.get('resource')
    timestamp = data.get('timestamp') or time.time()
    
    # Calculate simple features for the model
    # 1. Frequency: Requests in last 60 seconds
    
    current_time = time.time()
    if wallet not in user_activity:
        user_activity[wallet] = []
    
    # Prune old activity (>60s)
    user_activity[wallet] = [t for t in user_activity[wallet] if current_time - t < 60]
    
    # Add new request
    user_activity[wallet].append(current_time)
    
    req_freq = len(user_activity[wallet])
    # Simulate duration (random for demo, or passed from frontend)
    duration = data.get('duration', 200) 
    
    result = detector.predict(req_freq, duration)
    
    response = {
        "wallet": wallet,
        "input_features": {
            "requests_last_60s": req_freq,
            "duration": duration
        },
        "analysis": result
    }

    # Persist to Firestore if available
    if db:
        try:
            doc_ref = db.collection('access_logs').document()
            doc_ref.set({
                'wallet': wallet,
                'resource': resource,
                'timestamp': timestamp,
                'is_anomaly': result['is_anomaly'],
                'anomaly_score': result['score'],
                'req_freq': req_freq,
                'duration': duration
            })
            if result['is_anomaly']:
                db.collection('anomalies').add({
                    'wallet': wallet,
                    'timestamp': timestamp,
                    'score': result['score'],
                    'details': response
                })
        except Exception as e:
            print(f"Firestore Error: {e}")
    
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "firebase": db is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
