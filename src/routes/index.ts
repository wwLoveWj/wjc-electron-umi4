import { menuRoutes } from "./menuRoutes";

const routes: API.MenuRoutesType[] = [
  {
    path: "/exception",
    layout: false,
    routes: [
      {
        key: "404",
        path: "/exception/404",
        component: "./exception/404",
      },
      {
        key: "403",
        path: "/exception/403",
        component: "./exception/403",
      },
    ],
  },
  {
    path: "/login",
    component: "@/pages/login",
    layout: false, // 不使用默认布局
  },
  {
    key: "view-image",
    title: "图片查看",
    path: "/album/view-image",
    component: "./screenshot/ViewImage",
    hidden: true,
    layout: false,
  },
  {
    key: "screenshot",
    title: "截图",
    path: "/album/screenshot",
    component: "./screenshot",
    hidden: true,
    layout: false,
  },
  {
    key: "music-player",
    title: "音乐播放",
    path: "/music/player",
    component: "./music/components/player",
    layout: false,
    // hidden: true, //隐藏该菜单项，主要是详情、新增、编辑页
  },
  {
    path: "/",
    component: "@/layouts/SecurityLayout", // 主页加载layout公共组件
    layout: false,
    routes: [
      {
        path: "/",
        exact: true,
        hidden: true,
        redirect: "/home",
      },
      ...menuRoutes,
    ],
  },
  {
    path: "*",
    component: "./exception/404",
    redirect: "/exception/404",
    layout: false,
  },
];
export default routes;
