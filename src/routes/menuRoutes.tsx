import {
  HomeOutlined,
  RocketOutlined,
  CameraOutlined,
  PictureOutlined,
} from "@ant-design/icons";

export const menuRoutes: API.MenuRoutesType[] = [
  /**
   * 菜单的配置项，用于动态渲染：
   *  key: 唯一标志
   *  title: 菜单项值（国际化已开启）
   *  path：用于路由跳转
   *  component：组件所在路径，从pages路径下开始
   *  icon：菜单图标
   *  hidden: 是否隐藏该菜单项
   *  routes：子级菜单项
   */
  {
    key: "home",
    title: "首页",
    path: "/home",
    // hidden: true,
    icon: HomeOutlined,
    component: "./home",
    // routes: [
    //   {
    //     key: "home",
    //     title: "router.home",
    //     path: "/home",
    //     component: "./home/index",
    //   },
    //   {
    //     key: "detail",
    //     title: "router.home.detail",
    //     path: "/home/detail",
    //     component: "./home/Detail",
    //     hidden: true, //隐藏该菜单项，主要是详情、新增、编辑页
    //   },
    // ],
  },
  {
    key: "upload",
    title: "文件管理",
    path: "/upload",
    // hidden: true,
    icon: RocketOutlined,
    component: "./upload",
  },
  {
    key: "upload",
    title: "大文件管理",
    path: "/upload/big",
    // hidden: true,
    icon: RocketOutlined,
    component: "./upload/bigFileUpload",
  },
  {
    key: "todo",
    title: "待办管理",
    path: "/todo",
    // hidden: true,
    icon: RocketOutlined,
    component: "./todo",
  },
  {
    key: "music",
    title: "音乐管理",
    path: "/music",
    // hidden: true,
    icon: RocketOutlined,

    routes: [
      {
        key: "music",
        title: "音乐管理",
        path: "/music",
        component: "./music",
      },
      {
        key: "music-player",
        title: "音乐播放",
        path: "/music/player",
        component: "./music/components/player",
        layout: false,
        // hidden: true, //隐藏该菜单项，主要是详情、新增、编辑页
      },
    ],
  },
];
