<div align="center">

# GETA_OS  
### Gemini-Enhanced Training Algorithm  

<p><strong>Transforming Raw Gameplay Video into Structured, Training-Ready Vision Datasets</strong></p>

<br/>

<img src="https://github.com/user-attachments/assets/d4de6473-57cd-4d2d-84bd-1fac944ba9e2" 
     alt="GETA_OS System Preview" 
     width="850"/>

<br/>

<p>
  <em>Automated Frame Extraction • Semantic Filtering • Auto-Annotation • One-Click Dataset Export</em>
</p>

</div>
GETA_OS is an automated pipeline that transforms unstructured video (e.g., gaming livestreams) into training-ready computer vision datasets. By combining multimodal reasoning from Gemini with automatic object localization from YOLO, GETA_OS filters, annotates, and exports domain-specific datasets ready for model fine-tuning.

## 🎯 Why GETA_OS?

Gaming videos contain:
- Complex motion
- Rare lighting/weather conditions
- Synthetic but realistic environments
- High object density
- Unique camera angles

These properties make them a powerful — and underutilized — source of training data for vision models.

GETA_OS unlocks that potential!

## ⚡ Core Features
### 🎯 Dynamic Object Targeting

Specify any detectable object (e.g., car, person, traffic light) to generate a focused dataset.

### 🧠 Gemini Relevance Filtering

- Uses Gemini 1.5 Flash to:
- Analyze extracted frames
- Determine semantic relevance
- Remove low-signal or irrelevant frames
  
This reduces noise before labeling.

### 🏷 YOLO Auto-Annotation

Uses YOLOv8 to:

- Detect objects in filtered frames
- Generate bounding boxes
- Export normalized YOLO-format .txt annotations

### 📦 Training-Ready Export

Automatically generates:

```images/```

```labels/```

```data.yaml```

Downloadable ZIP archive

The dataset is immediately usable for YOLO fine-tuning or other object detection frameworks.

### 🖥 Cybernetic Brutalism Interface

Terminal-inspired UI for:

- Upload
- Processing visualization
- Dataset export

### 🧠 System Pipeline
```
VIDEO INPUT
    ↓
FFmpeg Frame Extraction
    ↓
Gemini Semantic Filtering
    ↓
YOLO Object Detection (Auto-labeling)
    ↓
YOLO-format Dataset Export
    ↓
Optional Fine-Tuning
```

### 🛠 Tech Stack

- Frontend
  - Next.js 15
  - React
  - Tailwind CSS

- Backend
  - Node.js (API bridge)
  - Python 3.12 (processing engine)

- AI Models
  - Gemini 2.5 Flash — semantic filtering
  - YOLOv8 — bounding box annotation

- Infrastructure
  - Supabase — storage & dataset management
  - FFmpeg — frame extraction

## 🚀 Setup Instructions
### 1️⃣ Environment Variables
Create .env in the root directory:
```
# SUPABASE
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key

# GOOGLE AI
GEMINI_API_KEY=your_api_key
```
### 2️⃣ Python Environment
Requires:
- Python 3.12+
- FFmpeg installed system-wide
```
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install ultralytics opencv-python ffmpeg-python google-genai supabase pillow scikit-image python-dotenv
```

### 3️⃣ Frontend
```
npm install
npm run dev```
```

## 🕹 Operational Flow
Enter target object
// TAG_OBJECT_IDENTIFIER: car

- Upload gameplay video
- System extracts frames
- Gemini filters relevant frames
- YOLO generates bounding box annotations
- Export dataset ZIP

## 📊 Demonstrating Dataset Utility

- GETA_OS enables domain adaptation.
- Example evaluation workflow:
  - Run pretrained YOLOv8 on raw gameplay → baseline performance
  - Fine-tune YOLOv8 on exported dataset
  - Re-evaluate on gameplay footage
- Compare:
  - mAP
  - Precision
  - Recall

Improvement demonstrates that gameplay-derived datasets improve performance in gaming environments.

## 📂 Project Structure
```
├── app/                  # Next.js App Router
├── components/           # UI components
├── extract_frames.py     # Frame extraction + Gemini filtering
├── yolo_labeling/        # YOLO inference + dataset export
├── public/               # UI assets
├── dataset_exports/      # Generated datasets
└── types/                # Type definitions
```

## 🔬 Future Extensions
- Multi-object dataset generation
- Pseudo-label refinement
- Human-in-the-loop correction
- Transformer-based detector fine-tuning
- Temporal modeling for action recognition
