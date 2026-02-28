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

def run_labeling(image_paths, model_name: str, conf: float, tag: str = None):
    print(f"[PROCESS] Initializing YOLOv8 Object Detection...")
    print(f"[PROCESS] Parameters: model={model_name}, confidence={conf}, tag={tag}")
    print(f"[PROCESS] Batch size: {len(image_paths)} frames")

    model = YOLO(model_name)

    # 태그를 클래스 ID로 매핑
    target_class_ids = []
    if tag:
        tag_lower = tag.lower()
        for idx, name in model.names.items():
            if tag_lower in name.lower() or name.lower() in tag_lower:
                target_class_ids.append(int(idx))
        
        if not target_class_ids:
            print(f"[PROCESS] WARNING: Tag '{tag}' not found in model classes.")
            tag = None

    coco = {
        "info": {
            "description": f"YOLOv8 Auto-Labeled Dataset (Tag: {tag if tag else 'All'})",
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
            print(f"[PROCESS] Image {image_id}/{len(image_paths)}: No objects detected in {filename}")
            continue

        # Cross-class NMS: 같은 위치에 다른 클래스가 겹치면 confidence 높은 것만 유지
        kept = []
        for i, box_a in enumerate(boxes):
            # 필터링: 태그가 지정된 경우 해당 태그 클래스만 유지
            cls_id = int(box_a.cls[0].item())
            if target_class_ids and cls_id not in target_class_ids:
                continue

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

        print(f"[PROCESS] Image {image_id}/{len(image_paths)}: Identified {count} labels for {filename}")

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


# ── Step 3: YOLO Training 데이터셋 추출 ──────────────────────────────────

def run_yolo_export(coco: dict, image_paths: list, export_dir: str, filter_tag: str = None):
    print(f"\n[STEP 3] YOLO Training 데이터셋 생성")
    if filter_tag:
        print(f"         필터링 태그: {filter_tag} (Class ID 0으로 매핑)")
    
    images_dir = os.path.join(export_dir, "images")
    labels_dir = os.path.join(export_dir, "labels")
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    # image_id → filename & size
    image_map = {img["id"]: img for img in coco["images"]}
    # image_id → annotations
    ann_by_image = {}
    for ann in coco["annotations"]:
        ann_by_image.setdefault(ann["image_id"], []).append(ann)

    # filename → full_path
    path_by_name = {os.path.basename(p): p for p in image_paths}

    import shutil

    exported = 0
    for img_id, img_info in image_map.items():
        filename = img_info["file_name"]
        img_path = path_by_name.get(filename)
        if not img_path:
            continue

        annotations = ann_by_image.get(img_id, [])
        if not annotations:
            continue

        # 1. 이미지 복사
        dest_img_path = os.path.join(images_dir, filename)
        shutil.copy2(img_path, dest_img_path)

        # 2. 라벨 생성 (YOLO format: class_id x_center y_center width height - normalized)
        label_filename = f"{Path(filename).stem}.txt"
        label_path = os.path.join(labels_dir, label_filename)
        
        with open(label_path, "w") as f:
            for ann in annotations:
                x, y, w, h = ann["bbox"]
                img_w, img_h = img_info["width"], img_info["height"]
                
                # 정규화 및 중심점 계산
                x_center = (x + w / 2) / img_w
                y_center = (y + h / 2) / img_h
                w_norm = w / img_w
                h_norm = h / img_h
                
                # YOLO format: 필터링 태그가 있으면 0으로, 아니면 원본 ID 사용
                class_id = 0 if filter_tag else ann['category_id']
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}\n")
        
        exported += 1

    # 3. data.yaml 생성 (YOLOv8 훈련용 필수 파일)
    yaml_path = os.path.join(export_dir, "data.yaml")
    with open(yaml_path, "w") as f:
        f.write(f"path: {os.path.abspath(export_dir)}\n")
        f.write(f"train: images\n")
        f.write(f"val: images\n\n")
        if filter_tag:
            f.write(f"names:\n  0: {filter_tag}\n")
        else:
            names_dict = {c["id"]: c["name"] for c in coco["categories"]}
            f.write("names:\n")
            for cid, cname in sorted(names_dict.items()):
                f.write(f"  {cid}: {cname}\n")

    print(f"  데이터 이미지/라벨/yaml 저장 완료 → {export_dir}")
    return exported


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
    parser.add_argument("--tag",        type=str, default=None,
                        help="필터링할 객체 태그 (예: car, person)")
    args = parser.parse_args()

    # 이미지 수집
    image_paths = collect_images(args.img_dir)
    if not image_paths:
        print(f"[ERROR] 이미지가 없습니다: {args.img_dir}")
        return

    # Step 1: 라벨링
    coco, _ = run_labeling(image_paths, args.model, args.conf, tag=args.tag)

    # COCO JSON 저장
    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(coco, f, ensure_ascii=False, indent=2)
    print(f"\n  JSON 저장 완료 → {args.json_out}")

    # Step 2: 시각화
    run_visualization(coco, image_paths, args.output_dir)

    # Step 3: YOLO 데이터셋 수출 (훈련용)
    dataset_dir = "submit_dataset"
    exported_count = run_yolo_export(coco, image_paths, dataset_dir, filter_tag=args.tag)

    # 최종 요약
    print(f"""
========================================
 완료 요약
========================================
 이미지 수       : {len(coco['images'])}
 총 annotation  : {len(coco['annotations'])}
 데이터셋 수출   : {exported_count}개 세트 → {dataset_dir}/
 COCO JSON      : {args.json_out}
========================================
""")


if __name__ == "__main__":
    main()