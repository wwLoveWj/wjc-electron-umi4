import request from "../request";
// 删除文件
export const deleteFileAPI = (filePath: string) => {
  return request.delete<{ success: boolean; message: string }>(
    "/api/upload/file",
    {
      filePath,
    }
  );
};

// 获取文件列表
export const getFilesAPI = (
  page: number = 1,
  limit: number = 20,
  fileType: string = ""
) => {
  return request.get("/api/upload/files", {
    params: { page, limit, fileType },
  });
};
