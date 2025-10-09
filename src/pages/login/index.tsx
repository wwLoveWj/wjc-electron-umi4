import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Switch,
  Divider,
  Space,
  Typography,
  Layout,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GithubOutlined,
  WechatOutlined,
  AlipayOutlined,
  GoogleOutlined,
} from "@ant-design/icons";
import { useModel, history } from "umi";
import qs from "qs";
import styles from "./style.less";
import { useRequest } from "ahooks";
import { loginUserAPI } from "@/service/api/login";
import { storage } from "@/utils/storage";

const { Title, Text, Link } = Typography;
const { Header, Content } = Layout;

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { initialState, setInitialState } = useModel("@@initialState");

  // 处理登录接口
  const { loading, run } = useRequest(loginUserAPI, {
    manual: true,
    onSuccess: async (res) => {
      // 存储token以及login信息
      // await setToken(res?.token);
      // storage.set("login-info", res);
      localStorage.setItem("yyds", res?.accessToken);
      // 语音提示用户登录成功
      // const utterThis = new window.SpeechSynthesisUtterance(
      //   "恭喜你登录成功" + res?.username + "欢迎回来！"
      // );
      // window.speechSynthesis.speak(utterThis);
      // notification.success({
      //   message: '登录成功',
      //   description: `${res?.data?.loginName}，欢迎回来`,
      //   duration: 5,
      // });
      message.success("登录成功！");
      // // 模拟登录成功
      // const userInfo = {
      //   name: values.username,
      //   avatar:
      //     "https://api.dicebear.com/7.x/avataaars/svg?seed=" + values.username,
      //   role: "user",
      // };
      // 更新全局状态
      await setInitialState({
        ...initialState,
        currentUser: res?.user,
        isLogin: true,
      });
      storage.set("loginInfo", {
        currentUser: res?.user,
        isLogin: true,
      });
      // 跳转到首页或来源页面
      const search = history.location.search;
      const query = qs.parse(search?.split("?")[1]);
      const redirect = query.redirect || "/";
      history.push(redirect);
    },
  });

  // 第三方登录
  const handleSocialLogin = (type: string) => {
    message.info(`即将跳转到${type}登录`);
    // 这里实现第三方登录逻辑
  };

  // 注册新账号
  const handleRegister = () => {
    history.push("/register");
  };

  // 忘记密码
  const handleForgotPassword = () => {
    history.push("/forgot-password");
  };

  return (
    <Layout
      className={`${styles.loginLayout} ${isDarkMode ? styles.dark : styles.light}`}
    >
      <Header className={styles.header}>
        <div className={styles.logo}>
          <img
            src={require("@/assets/yay.jpg")}
            alt="Logo"
            className={styles.logoImg}
          />
          <span className={styles.logoText}>企业管理系统</span>
        </div>
        <Space>
          <Text>暗黑模式</Text>
          <Switch
            checked={isDarkMode}
            onChange={setIsDarkMode}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </Space>
      </Header>

      <Content className={styles.loginContent}>
        <div className={styles.background}>
          <div className={styles.backgroundShape1}></div>
          <div className={styles.backgroundShape2}></div>
          <div className={styles.backgroundShape3}></div>
        </div>

        <Card className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <Title level={2} className={styles.welcomeText}>
              欢迎回来
            </Title>
            <Text type="secondary" className={styles.subTitle}>
              请输入您的账号和密码登录系统
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={run}
            autoComplete="off"
            size="large"
            className={styles.loginForm}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "请输入用户名!" },
                { min: 3, message: "用户名至少3个字符!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名/邮箱/手机号"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "请输入密码!" },
                { min: 6, message: "密码至少6个字符!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                className={styles.input}
              />
            </Form.Item>

            <div className={styles.rememberForgot}>
              <Space>
                <Switch
                  size="small"
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
                <span>记住我</span>
              </Space>
              <Link onClick={handleForgotPassword}>忘记密码?</Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className={styles.loginButton}
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>或使用以下方式登录</Divider>

          <div className={styles.socialLogin}>
            <Space size="large">
              <Button
                shape="circle"
                icon={<GithubOutlined />}
                size="large"
                onClick={() => handleSocialLogin("GitHub")}
                className={styles.socialButton}
              />
              <Button
                shape="circle"
                icon={<WechatOutlined />}
                size="large"
                onClick={() => handleSocialLogin("微信")}
                className={styles.socialButton}
              />
              <Button
                shape="circle"
                icon={<AlipayOutlined />}
                size="large"
                onClick={() => handleSocialLogin("支付宝")}
                className={styles.socialButton}
              />
              <Button
                shape="circle"
                icon={<GoogleOutlined />}
                size="large"
                onClick={() => handleSocialLogin("Google")}
                className={styles.socialButton}
              />
            </Space>
          </div>

          <div className={styles.registerSection}>
            <Text type="secondary">
              <span>还没有账号? </span>
              <Link onClick={handleRegister}>立即注册</Link>
            </Text>
          </div>
        </Card>

        <div className={styles.footer}>
          <Text type="secondary">
            <span>© 2024 企业管理系统. 保留所有权利.</span>
            <Link href="/privacy" style={{ marginLeft: 8 }}>
              隐私政策
            </Link>
            <Link href="/terms" style={{ marginLeft: 8 }}>
              服务条款
            </Link>
          </Text>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;
