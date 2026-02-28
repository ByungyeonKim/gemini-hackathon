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

# VIDEO_ID = "video_001"
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
def analyze_frame_with_gemini(image_path, tag="car"):
    img = Image.open(image_path)

    prompt = f"""
    You are selecting frames for training {tag} detection AI model.

    Describe the scene briefly.
    Is it relevant for training a {tag} detection model? (yes/no)

    Respond with raw JSON only. Do NOT use markdown or code blocks.
    {{
        "relevant": true/false,
        "label": "short scene label",
        "confidence": 0-1
    }}    
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
def process_video(video_path, tag="car", video_id="video_001"):
    # Create a unique temporary folder for frames
    import tempfile
    import shutil
    
    output_folder = tempfile.mkdtemp(prefix="frames_")
    
    try:
        # extract frames using ffmpeg
        output_pattern = os.path.join(output_folder, 'frame_%04d.png')
        (
            ffmpeg
            .input(video_path)
            .output(output_pattern, vf=f"fps={FPS}")
            .run(quiet=True, overwrite_output=True)
        )

        prev_frame = None
        processed_count = 0
        frame_urls = []
        
        # Create a folder for frames that Gemini thinks are relevant
        relevant_frames_dir = os.path.join(output_folder, "relevant_frames")
        os.makedirs(relevant_frames_dir, exist_ok=True)

        for frame_name in sorted(os.listdir(output_folder)):
            if frame_name == "relevant_frames": continue
            
            frame_path = os.path.join(output_folder, frame_name)
            curr_frame = cv2.imread(frame_path)
            if curr_frame is None:
                continue

            if not is_distinct(prev_frame, curr_frame):
                continue
            
            prev_frame = curr_frame
                
            # upload to supabase storage
            storage_path = f"{video_id}/{frame_name}"
            with open(frame_path, "rb") as f:
                supabase.storage.from_("frames").upload(
                    storage_path,
                    f,
                    {
                        "content-type":"image/png",
                        "upsert": "true"
                    }
                )
            
            # Get public URL
            public_url = supabase.storage.from_("frames").get_public_url(storage_path)
            
            # gemini analysis
            gemini_result = analyze_frame_with_gemini(frame_path, tag=tag)

            if gemini_result is None or not gemini_result.get("relevant", False):
                continue

            # If Gemini says it's relevant, save it for YOLO labeling
            shutil.copy2(frame_path, os.path.join(relevant_frames_dir, frame_name))
            frame_urls.append(public_url)

            # insert metadata into DB
            supabase.table("frames").insert({
                "video_id": video_id,
                "frame_path": storage_path,
                "relevant": True,
                "label": gemini_result.get("label", ""),
                "confidence": gemini_result.get("confidence", 0.0)
            }).execute()

            processed_count += 1

        # Trigger YOLO labeling if we found relevant frames
        dataset_url = None
        if processed_count > 0:
            import subprocess
            print(f"Triggering YOLO labeling for {processed_count} relevant frames...")
            dataset_out = f"dataset_{video_id}"
            subprocess.run([
                "python3", "yolo_labeling/label_and_visualize.py",
                "--img_dir", relevant_frames_dir,
                "--tag", tag,
                "--json_out", f"{dataset_out}.json",
                "--output_dir", f"{dataset_out}_vis"
            ])
            # The labeling script creates 'submit_dataset' by default. 
            # Let's move it to a unique name.
            if os.path.exists("submit_dataset"):
                if os.path.exists(dataset_out):
                    shutil.rmtree(dataset_out)
                os.rename("submit_dataset", dataset_out)
                print(f"Training dataset ready at: {dataset_out}")

                # Zip the dataset for download
                zip_path = shutil.make_archive(dataset_out, 'zip', dataset_out)
                print(f"Dataset zipped at: {zip_path}")

                # Upload zip to Supabase
                zip_name = os.path.basename(zip_path)
                storage_zip_path = f"datasets/{zip_name}"
                with open(zip_path, "rb") as f:
                    supabase.storage.from_("frames").upload(
                        storage_zip_path,
                        f,
                        {
                            "content-type": "application/zip",
                            "upsert": "true"
                        }
                    )
                
                dataset_url = supabase.storage.from_("frames").get_public_url(storage_zip_path)
                
                # Cleanup zip and dataset folder after upload
                os.remove(zip_path)
                shutil.rmtree(dataset_out)

    finally:
        # Clean up frames
        shutil.rmtree(output_folder)

    # Final output for the API bridge
    print(json.dumps({
        "status": "success", 
        "video_id": video_id,
        "processed_count": processed_count,
        "frame_urls": frame_urls,
        "dataset_path": f"dataset_{video_id}" if processed_count > 0 else None,
        "dataset_url": dataset_url
    }))

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Extract frames and analyze with Gemini.")
    parser.add_argument("--video", type=str, default="car_video.mp4", help="Path to the video file.")
    parser.add_argument("--tag", type=str, default="car", help="Object to tag.")
    parser.add_argument("--video_id", type=str, default="video_001", help="Unique ID for the video.")
    
    args = parser.parse_args()
    process_video(args.video, tag=args.tag, video_id=args.video_id)