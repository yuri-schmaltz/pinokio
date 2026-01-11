#!/usr/bin/env python3
"""
Face Detector App - OpenCV Cascade-based face detection
Features: Real-time face detection, multi-face support, export annotations
"""

import os
import sys
import cv2
import json
from pathlib import Path
from datetime import datetime

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import numpy as np

# App configuration
app = Flask(__name__)
CORS(app)

# Load cascade classifier for face detection
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

# Paths
HOME = Path(__file__).parent
INPUT_DIR = HOME / "input"
OUTPUT_DIR = HOME / "output"
INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Global state
detection_results = {}

def detect_faces(image_path):
    """Detect faces in image using OpenCV Cascade Classifier"""
    try:
        image = cv2.imread(str(image_path))
        if image is None:
            return None, "Failed to load image"
        
        height, width = image.shape[:2]
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        face_list = []
        for (x, y, w, h) in faces:
            confidence = 0.95  # Cascade doesn't return confidence, use default
            
            face_list.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': float(confidence),
                'landmarks': []
            })
            
            # Draw bounding box
            cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(image, f"Face ({confidence:.1%})", 
                      (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Save annotated image
        output_path = OUTPUT_DIR / f"annotated_{Path(image_path).stem}.jpg"
        cv2.imwrite(str(output_path), image)
        
        return {
            'filename': Path(image_path).name,
            'output_filename': output_path.name,
            'width': width,
            'height': height,
            'faces_detected': len(face_list),
            'faces': face_list,
            'timestamp': datetime.now().isoformat()
        }, None
        
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    """Serve main dashboard"""
    return render_template('index.html')

@app.route('/api/detect', methods=['POST'])
def api_detect():
    """API endpoint for face detection"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file
        filename = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = INPUT_DIR / filename
        file.save(str(filepath))
        
        # Detect faces
        result, error = detect_faces(filepath)
        if error:
            return jsonify({'error': error}), 500
        
        # Store in memory
        detection_results[filename] = result
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/results', methods=['GET'])
def api_results():
    """Get all detection results"""
    return jsonify({
        'total': len(detection_results),
        'results': list(detection_results.values())
    })

@app.route('/api/export', methods=['POST'])
def api_export():
    """Export results as JSON"""
    try:
        export_data = {
            'app': 'Face Detector',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'total_detections': len(detection_results),
            'results': list(detection_results.values())
        }
        
        export_path = OUTPUT_DIR / f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(export_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'filename': export_path.name,
            'path': str(export_path),
            'records': len(detection_results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'app': 'Face Detector',
        'version': '1.0.0',
        'python_version': sys.version,
        'opencv_version': cv2.__version__,
        'input_files': len(list(INPUT_DIR.glob('*'))),
        'output_files': len(list(OUTPUT_DIR.glob('*'))),
        'cached_results': len(detection_results)
    })

@app.route('/output/<filename>')
def serve_output(filename):
    """Serve output files"""
    filepath = OUTPUT_DIR / filename
    if filepath.exists():
        return send_file(str(filepath), mimetype='image/jpeg')
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print(f"🎬 Face Detector App started")
    print(f"📁 Input directory: {INPUT_DIR}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print(f"🌐 Server running at http://localhost:5000")
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
