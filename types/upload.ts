export interface UploadResponse {
  savedFrames: number;
  /** 프레임 이미지 URL 또는 data URL 목록 (선택) */
  frames?: string[];
  /** 생성된 YOLO 데이터셋 경로 (선택) */
  datasetPath?: string;
  /** 생성된 YOLO 데이터셋 다운로드 URL (선택) */
  datasetUrl?: string;
}

export interface UploadErrorResponse {
  error: string;
}
