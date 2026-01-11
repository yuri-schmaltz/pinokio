# Face Detector - Example App

Professional face detection application using MediaPipe and Flask.

## 📦 Features

✅ **Real-time Face Detection** - Detects multiple faces in images  
✅ **Confidence Scores** - Shows detection confidence for each face  
✅ **Annotated Output** - Saves images with bounding boxes  
✅ **JSON Export** - Export results for analysis  
✅ **Modern Dashboard** - Dark mode, responsive UI  
✅ **GPU Support** - Optional NVIDIA/AMD acceleration  

## 🚀 Quick Start

### 1. Install Dependencies
Click the **"🚀 Install Dependencies"** button in the Pinokio launcher, or run:
```bash
./install.json
```

### 2. Start Server
```bash
./start.json
```

The app opens at `http://localhost:5000`

### 3. Upload Image & Detect Faces
1. Go to "Upload Image" tab
2. Upload a photo with faces
3. Click "🚀 Detect Faces"
4. View results in "Results" tab

### 4. Export Results
Export detection data as JSON for further analysis:
```bash
./api/export
```

### 5. Stop Server
```bash
./stop.json
```

## 📁 Directory Structure

```
face-detector/
├── pinokio.js              # Pinokio config (launcher)
├── install.json            # Install dependencies
├── start.json              # Start server
├── stop.json               # Stop server
├── update.json             # Update packages
├── reset.json              # Factory reset
├── diagnostics.json        # System info
├── check_gpu.json          # GPU detection
├── app.py                  # Flask server
├── templates/
│   └── index.html          # Web UI (7 tabs)
├── input/                  # Uploaded images
└── output/                 # Annotated images + exports
```

## 🔧 Requirements

- Python 3.8+
- MediaPipe 0.8.11+
- OpenCV 4.5+
- Flask 2.0+

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/api/detect` | POST | Upload image for detection |
| `/api/results` | GET | Get all detection results |
| `/api/export` | POST | Export results as JSON |
| `/api/health` | GET | Health check |
| `/output/<file>` | GET | Download annotated image |

## 🎨 Customization

### Change Confidence Threshold
Edit `app.py` line ~63:
```python
with mp_face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.7  # Change this (0.0-1.0)
) as face_detection:
```

### Change Port
Edit `app.py` last line:
```python
app.run(host='127.0.0.1', port=8080)  # Change port here
```

### Add Custom Model
Extend `detect_faces()` function with your own ML model.

## 🐛 Troubleshooting

### Import Error: `No module named mediapipe`
Run install.json again to ensure all dependencies installed.

### Port 5000 in use
Change port in `app.py` or run:
```bash
lsof -i :5000
kill -9 <PID>
```

### No faces detected
Ensure image has clear, front-facing faces. Try increasing confidence threshold.

## 📈 Performance

- **Processing Speed**: ~100ms per image (CPU)
- **Memory Usage**: ~150MB base + image size
- **Max Image Size**: Limited by available RAM
- **GPU Acceleration**: Optional (detected automatically)

## 📝 Example Output

```json
{
  "app": "Face Detector",
  "timestamp": "2026-01-11T10:30:45.123456",
  "results": [
    {
      "filename": "photo.jpg",
      "width": 1920,
      "height": 1080,
      "faces_detected": 3,
      "faces": [
        {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 250,
          "confidence": 0.95,
          "landmarks": []
        }
      ]
    }
  ]
}
```

## 📄 License

MIT License - See LICENSE file

## 🔗 Resources

- [MediaPipe Docs](https://mediapipe.dev)
- [Flask Docs](https://flask.palletsprojects.com)
- [OpenCV Docs](https://docs.opencv.org)

---

**Version:** 1.0.0  
**Last Updated:** Jan 11, 2026
