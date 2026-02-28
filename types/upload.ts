export interface UploadResponse {
  savedFrames: number;
  /** 프레임 이미지 URL 또는 data URL 목록 (선택) */
  frames?: string[];
}

export interface UploadErrorResponse {
  error: string;
}
