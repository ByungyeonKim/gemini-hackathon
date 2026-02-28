"""
YOLOv8 Object Labeling + Visualization (All-in-One)
====================================================
Usage:
    python label_and_visualize.py --img_dir ./img

Requirements:
    pip install ultralytics pillow

출력:
    - coco_labels.json         (COCO JSON 라벨)
    - output_vis/              (바운딩박스 시각화 이미지)
"""

import argparse
import glob
import json
import os
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

# 카테고리별 색상
COLORS = [
    "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00C7BE",
    "#30B0C7", "#32ADE6", "#007AFF", "#5856D6", "#AF52DE",
    "#FF2D55", "#A2845E", "#8E8E93", "#FF6B6B", "#4ECDC4",
    "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8",
]


# ── 유틸 ──────────────────────────────────────────────────────────────

def get_color(category_id: int) -> str:
    return COLORS[category_id % len(COLORS)]


def load_font(size: int):
    for path in [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()


def collect_images(img_dir: str):
    EXTENSIONS = ["jpg", "jpeg", "png", "bmp", "webp", "tiff"]
    paths = []
    for ext in EXTENSIONS:
        paths += glob.glob(os.path.join(img_dir, "**", f"*.{ext}"), recursive=True)
        paths += glob.glob(os.path.join(img_dir, "**", f"*.{ext.upper()}"), recursive=True)
    return sorted(set(paths))


# ── Step 1: YOLOv8 라벨링 ─────────────────────────────────────────────

def run_labeling(image_paths, model_name: str, conf: float):
    print(f"\n[STEP 1] YOLOv8 Object Detection")
    print(f"         모델: {model_name} | confidence: {conf}")
    print(f"         이미지 수: {len(image_paths)}\n")

    model = YOLO(model_name)

    coco = {
        "info": {
            "description": "YOLOv8 Auto-Labeled Dataset",
            "version": "1.0",
            "year": datetime.now().year,
            "date_created": datetime.now().strftime("%Y/%m/%d"),
        },
        "licenses": [],
        "images": [],
        "annotations": [],
        "categories": [
            {"id": int(k), "name": v, "supercategory": "object"}
            for k, v in model.names.items()
        ],
    }

    annotation_id = 1

    for image_id, img_path in enumerate(image_paths, start=1):
        img = Image.open(img_path)
        img_w, img_h = img.size
        filename = os.path.basename(img_path)

        coco["images"].append({
            "id": image_id,
            "file_name": filename,
            "width": img_w,
            "height": img_h,
        })

        # iou=0.3: 겹치는 박스를 더 공격적으로 제거
        results = model(img_path, conf=conf, iou=0.3, verbose=False)
        boxes = results[0].boxes

        if boxes is None or len(boxes) == 0:
            print(f"  [{filename}] → No objects detected")
            continue

        # Cross-class NMS: 같은 위치에 다른 클래스가 겹치면 confidence 높은 것만 유지
        # prevent overlapping & confidence higher
        kept = []
        for i, box_a in enumerate(boxes):
            x1a, y1a, x2a, y2a = box_a.xyxy[0].tolist()
            conf_a = float(box_a.conf[0].item())
            dominated = False
            for j, box_b in enumerate(boxes):
                if i == j:
                    continue
                x1b, y1b, x2b, y2b = box_b.xyxy[0].tolist()
                conf_b = float(box_b.conf[0].item())
                ix1, iy1 = max(x1a, x1b), max(y1a, y1b)
                ix2, iy2 = min(x2a, x2b), min(y2a, y2b)
                inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                union = (x2a-x1a)*(y2a-y1a) + (x2b-x1b)*(y2b-y1b) - inter
                iou = inter / union if union > 0 else 0
                if iou > 0.5 and conf_b > conf_a:
                    dominated = True
                    break
            if not dominated:
                kept.append(box_a)

        count = 0
        for box in kept:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bw, bh = x2 - x1, y2 - y1
            coco["annotations"].append({
                "id": annotation_id,
                "image_id": image_id,
                "category_id": int(box.cls[0].item()),
                "bbox": [round(x1, 2), round(y1, 2), round(bw, 2), round(bh, 2)],
                "area": round(bw * bh, 2),
                "segmentation": [],
                "iscrowd": 0,
                "score": round(float(box.conf[0].item()), 4),
            })
            annotation_id += 1
            count += 1

        print(f"  [{filename}] → {count} object(s) detected")

    return coco, model.names


# ── Step 2: 시각화 ────────────────────────────────────────────────────

def run_visualization(coco: dict, image_paths: list, output_dir: str):
    print(f"\n[STEP 2] Bounding Box 시각화")
    os.makedirs(output_dir, exist_ok=True)

    categories = {c["id"]: c["name"] for c in coco["categories"]}

    # image_id → annotation 리스트
    ann_by_image = {}
    for ann in coco["annotations"]:
        ann_by_image.setdefault(ann["image_id"], []).append(ann)

    # filename → 실제 경로
    path_by_name = {os.path.basename(p): p for p in image_paths}

    saved = 0
    for img_info in coco["images"]:
        filename = img_info["file_name"]
        img_path = path_by_name.get(filename)

        if not img_path:
            print(f"  [SKIP] 파일 없음: {filename}")
            continue

        annotations = ann_by_image.get(img_info["id"], [])
        if not annotations:
            print(f"  [SKIP] annotation 없음: {filename}")
            continue

        img = Image.open(img_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        font_size = max(14, img.width // 60)
        font = load_font(font_size)

        for ann in annotations:
            cat_id = ann["category_id"]
            name = categories.get(cat_id, str(cat_id))
            score = ann.get("score", 0)
            color = get_color(cat_id)

            x, y, w, h = ann["bbox"]
            x1, y1, x2, y2 = x, y, x + w, y + h
            line_w = max(2, img.width // 400)
            draw.rectangle([x1, y1, x2, y2], outline=color, width=line_w)

            label = f"{name} {score:.2f}"
            try:
                bb = font.getbbox(label)
                tw, th = bb[2] - bb[0], bb[3] - bb[1]
            except:
                tw, th = font_size * len(label) // 2, font_size

            ty = max(0, y1 - th - 6)
            draw.rectangle([x1, ty, x1 + tw + 8, ty + th + 6], fill=color)
            draw.text((x1 + 4, ty + 3), label, fill="white", font=font)

        out_path = os.path.join(output_dir, f"{Path(filename).stem}_labeled.jpg")
        img.save(out_path)
        print(f"  [{filename}] → {out_path}")
        saved += 1

    return saved


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="YOLOv8 Labeling + Visualization (All-in-One)")
    parser.add_argument("--img_dir",    type=str, default="./img",
                        help="이미지 폴더 (하위 폴더 재귀 탐색, default: ./img)")
    parser.add_argument("--output_dir", type=str, default="./output_vis",
                        help="시각화 결과 저장 폴더 (default: ./output_vis)")
    parser.add_argument("--json_out",   type=str, default="coco_labels.json",
                        help="COCO JSON 출력 경로 (default: coco_labels.json)")
    parser.add_argument("--model",      type=str, default="yolov8n.pt",
                        choices=["yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"])
    parser.add_argument("--conf",       type=float, default=0.25,
                        help="Detection confidence threshold (default: 0.25)")
    args = parser.parse_args()

    # 이미지 수집
    image_paths = collect_images(args.img_dir)
    if not image_paths:
        print(f"[ERROR] 이미지가 없습니다: {args.img_dir}")
        return

    # Step 1: 라벨링
    coco, _ = run_labeling(image_paths, args.model, args.conf)

    # COCO JSON 저장
    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(coco, f, ensure_ascii=False, indent=2)
    print(f"\n  JSON 저장 완료 → {args.json_out}")

    # Step 2: 시각화
    saved = run_visualization(coco, image_paths, args.output_dir)

    # 최종 요약
    print(f"""
========================================
 완료 요약
========================================
 이미지 수       : {len(coco['images'])}
 총 annotation  : {len(coco['annotations'])}
 시각화 저장     : {saved}개 → {args.output_dir}/
 COCO JSON      : {args.json_out}
========================================
""")


if __name__ == "__main__":
    main()