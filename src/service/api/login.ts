import request from "../request";

interface LoginInfoType {
  token: string;
  username: string;
  email: string;
  loginName: string;
  loginPath: string;
  menuList: string[];
}
export const registerUserAPI = (params: {
  password: string;
  email: string;
  name: string;
}): Promise<any> => {
  return request.post<null>("/api/auth/register", params);
};
export const loginUserAPI = (params: { password: string; email: string }) => {
  return request.post<LoginInfoType>("/api/auth/login", params);
};
