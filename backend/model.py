import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import pickle
import os

class AnomalyDetector:
    def __init__(self, model_path='model.pkl'):
        self.model_path = model_path
        self.model = None
        self.rng = np.random.RandomState(42)
        
        # Load existing model or train a new one
        if os.path.exists(model_path):
            self.load_model()
        else:
            print("No model found, training initial model...")
            self.train_initial_model()

    def train_initial_model(self):
        # Generate synthetic 'normal' training data
        # Feature 1: Request Frequency (requests per minute) - Normal: 1-60
        # Feature 2: Resource Access Duration (ms) - Normal: 50-500
        
        X_train = 0.3 * self.rng.randn(100, 2)
        X_train = np.r_[X_train + 2, X_train - 2] # Two clusters of normal data
        
        # Add some more realistic data points
        # Normal user: 5-20 req/min, 100-300ms duration
        normal_data = []
        for _ in range(200):
            req_freq = self.rng.randint(1, 20)
            duration = self.rng.randint(50, 500)
            normal_data.append([req_freq, duration])
            
        X = np.array(normal_data)
        
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.model.fit(X)
        self.save_model()
        print("Model trained and saved.")

    def predict(self, req_freq, duration):
        if self.model is None:
            self.load_model()
            
        data = np.array([[req_freq, duration]])
        # Prediction: 1 for inliers (normal), -1 for outliers (anomaly)
        pred = self.model.predict(data)[0]
        # Score: Lower is more anomalous
        score = self.model.decision_function(data)[0]
        
        return {
            "is_anomaly": bool(pred == -1),
            "score": float(score),
            "prediction_label": "Anomaly" if pred == -1 else "Normal"
        }

    def save_model(self):
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)

    def load_model(self):
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
        except:
            self.train_initial_model()
