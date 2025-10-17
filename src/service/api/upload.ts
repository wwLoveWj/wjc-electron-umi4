import request from "../request";

export interface CheckFileParams {
  fileHash: string;
  fileName: string;
  fileSize: number;
}

export interface CheckFileResult {
  exists: boolean;
  uploadedChunks?: number[];
  url?: string;
}

export interface UploadChunkParams {
  chunk: Blob;
  fileHash: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
}

export interface MergeChunksParams {
  fileHash: string;
  fileName: string;
  totalChunks: number;
}

export async function checkFile(params: CheckFileParams) {
  return request.post<CheckFileResult>("/api/bigFile/check-file", params);
}

export async function uploadChunk(formData: FormData) {
  // const formData = new FormData();
  // formData.append("chunk", params.chunk);
  // formData.append("fileHash", params.fileHash);
  // formData.append("chunkIndex", params.chunkIndex.toString());
  // formData.append("totalChunks", params.totalChunks.toString());
  // formData.append("fileName", params.fileName);

  //   const response = await fetch("/api/bigFile/upload-chunk", {
  //     method: "POST",
  //     body: formData,
  //   });
  //     return response.json();
  return request.upload("/api/bigFile/upload-chunk", formData).promise;
}

export async function mergeChunks(params: MergeChunksParams): Promise<any> {
  return request.post("/api/bigFile/merge-chunks", params);
}

export async function getUploadProgress(fileHash: string) {
  return request.get<{ uploadedChunks: number[] }>(
    `/api/bigFile/upload-progress/${fileHash}`
  );
}
