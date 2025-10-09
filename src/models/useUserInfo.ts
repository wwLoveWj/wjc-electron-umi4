import { verify } from "@/service/api/index";
import { toLoginPage } from "@/utils";
import { useRequest } from "ahooks";

// 获取用户信息
const useUserInfo = () => {
  // const { data } = useRequest(async () => {
  //   try {
  //     const res = await verify();
  //     return res;
  //   } catch (e) {
  //     toLoginPage();
  //   }
  // });
  // return {
  //   userInfo: data ?? {},
  // };
};

export default useUserInfo;
