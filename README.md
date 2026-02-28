# 🦾 GETA_OS: Gemini Enhanced Training Algorithm

> **SYSTEM_STATUS: OPERATIONAL // THEME: CYBERNETIC_BRUTALISM**

GETA_OS is a high-performance, automated pipeline designed to generate high-quality AI training datasets from raw video data. By combining the reasoning power of **Gemini 2.5 Flash** with the precise localization of **YOLOv8**, GETA_OS extracts, filters, and labels specific objects of interest to create "plug-and-play" training sets.

---

## ⚡ CORE_FEATURES

- **🎯 DYNAMIC_OBJECT_TAGGING**: Input any object identifier (e.g., "car", "traffic light", "person").
- **🧠 GEMINI_RELEVANCE_FILTER**: Uses Gemini 2.5 Flash to analyze extracted frames and discard irrelevant ones based on your tag.
- **🏷️ YOLO_AUTO_LABELING**: Automatically generates precise bounding boxes for relevant frames using YOLOv8.
- **📦 TRAINING_READY_EXPORT**: Generates a complete dataset with:
  - Normalized YOLO format (`.txt`) labels.
  - Automatically configured `data.yaml` for immediate training.
  - One-click **DOWNLOAD_DATASET.ZIP** from the dashboard.
- **🖥️ CYBERNETIC_BRUTALISM_UI**: A high-contrast, terminal-style interface with glitch effects and scanline overlays.

---

## 🛠️ TECH_STACK

- **FRONTEND**: Next.js 15, React, Tailwind CSS (Brutalist HUD).
- **BACKEND**: Node.js API (Bridge) + Python 3.12 (Engine).
- **AI_MODELS**: 
  - **Gemini 2.5 Flash** (Scene Understanding & Filtering).
  - **YOLOv8** (Object Detection & Labeling).
- **INFRASTRUCTURE**: 
  - **Supabase** (Database & Storage).
  - **FFmpeg** (Frame Extraction).

---

## 🚀 INITIALIZATION

### 1. ENVIRONMENT_VARIABLES
Create a `.env` file in the root directory:

```env
# SUPABASE_CREDENTIALS
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key

# GOOGLE_GENERATIVE_AI
GEMINI_API_KEY=your_gemini_api_key
```

### 2. PYTHON_DEPENDENCIES
Ensure you have Python 3.12+ and FFmpeg installed.

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows

# Install core requirements
pip install ultralytics opencv-python ffmpeg-python google-genai supabase pillow scikit-image python-dotenv
```

### 3. FRONTEND_SETUP
```bash
npm install
npm run dev
```

---

## 🕹️ OPERATIONAL_FLOW

1. **IDENTIFY**: Enter the object type you want to tag (e.g., `// TAG_OBJECT_IDENTIFIER: car`).
2. **UPLOAD**: Drag and drop your video data into the terminal.
3. **PROCESS**: Watch as GETA_OS initializes extraction and AI analysis.
4. **INSPECT**: Review the grayscale inspected data stream on your dashboard.
5. **EXPORT**: Use the **DOWNLOAD_DATASET.ZIP** button to retrieve your training-ready YOLO archive.

---

## 📂 SYSTEM_ARCHITECTURE

```text
├── app/                  # Next.js App Router (HUD)
├── components/          # Cybernetic UI components
├── extract_frames.py    # Main processing engine (Gemini + FFmpeg)
├── yolo_labeling/       # YOLOv8 integration & Export logic
├── public/              # Static assets & HUD overlays
└── types/               # System interface definitions
```

---

> // END_OF_TRANSMISSION
> // SYSTEM_DEVELOPED_FOR_GEMINI_HACKATHON
