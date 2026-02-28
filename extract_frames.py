import os
import ffmpeg 
import cv2
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim
from supabase import create_client, Client
from google import genai
import json
from dotenv import load_dotenv

load_dotenv()

# configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

VIDEO_ID = "video_001"
FPS = 2
SSIM_THRESHOLD = 0.50

# init 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

client = genai.Client(api_key=GEMINI_API_KEY)

# frame distinctness check using Structural Similarity Index (SSIM)
def is_distinct(prev_frame, curr_frame, threshold=0.50):
    if prev_frame is None:
        return True

    prev_frame = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
    curr_frame = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)
    score, _ = ssim(prev_frame, curr_frame, full=True)

    return score < threshold

# gemini analysis
def analyze_frame_with_gemini(image_path):
    img = Image.open(image_path)

    prompt = """
    You are selecting frames for training car detection AI model.

    Describe the scene briefly.
    Is it relevant for training a train detection model? (yes/no)

    Respond with raw JSON only. Do NOT use markdown or code blocks.
    {
        "relevant": true/false,
        "label": "short scene label",
        "confidence": 0-1
    }    
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            img
        ],
    )
    try:
        return json.loads(response.text)
    except:
        print("Failed to parse Gemini response:", response.text)
        return None

# main pipeline
def process_video(video_path, output_folder="temp_frames"):
    os.makedirs(output_folder, exist_ok=True)

    # extract frames using ffmpeg
    output_pattern = os.path.join(output_folder, 'frame_%04d.png')
    (
        ffmpeg
        .input(video_path)
        .output(output_pattern, vf=f"fps={FPS}")
        .run(quiet=True, overwrite_output=True)
    )

    prev_frame = None

    for frame_name in sorted(os.listdir(output_folder)):
        frame_path = os.path.join(output_folder, frame_name)
        curr_frame = cv2.imread(frame_path)
        if curr_frame is None:
            continue

        if not is_distinct(prev_frame, curr_frame):
            os.remove(frame_path)
            continue
        
        prev_frame = curr_frame
            
        # upload to supabase storage
        storage_path = f"{VIDEO_ID}/{frame_name}"
        with open(frame_path, "rb") as f:
            supabase.storage.from_("frames").upload(
                storage_path,
                f,
                {
                    "content-type":"image/png",
                    "upsert": "true"
                }
            )

        # gemini analysis
        gemini_result = analyze_frame_with_gemini(frame_path)

        if gemini_result is None:
            continue

        # insert metadata into DB
        supabase.table("frames").insert({
            "video_id": VIDEO_ID,
            "frame_path": storage_path,
            "relevant": gemini_result.get("relevant", False),
            "label": gemini_result.get("label", ""),
            "confidence": gemini_result.get("confidence", 0.0)
        }).execute()

        print(f"Processed {frame_name}: {gemini_result}")

    print("Video process complete!")

if __name__ == "__main__":
    process_video("car_video.mp4")