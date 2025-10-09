import vstores from "vstores";
import pkg from "../../package.json";

type StorageType = {
  test: string;
  loginInfo: { currentUser: any; isLogin: boolean };
};

export const storage = vstores.create<StorageType>({
  formatKey: (v: string) => {
    return pkg.name + v;
  },
});
