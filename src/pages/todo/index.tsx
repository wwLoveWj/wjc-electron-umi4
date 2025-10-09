import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  List,
  Tag,
  Space,
  DatePicker,
  Modal,
  notification,
  Statistic,
  Divider,
} from "antd";
import type { DatePickerProps, GetProps } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { TextArea } = Input;

interface TodoTask {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  email?: string;
  jobId?: string;
  createdAt: Date;
}

const TodoNotification: React.FC = () => {
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 加载本地存储的任务
    const savedTasks = localStorage.getItem("todoTasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    // 初始化音频
    audioRef.current = new Audio(
      "data:audio/wav;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAABAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAABQTEFNRTMuMTAwBKkAAAAAAAAAADUgJAO8QQAABAAACXHF1LZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQxAAAAAAAAAAAAAAAAAAAAAAA"
    );

    // 监听 Electron 通知
    if (window.electronAPI) {
      window.electronAPI.onTaskNotification((event, task) => {
        showNotification(task);
        playAlarm();
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("task-notification");
      }
    };
  }, []);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const showNotification = (task: TodoTask) => {
    notification.success({
      message: "待办事项提醒",
      description: `任务 "${task.title}" 时间到了！`,
      duration: 0,
      btn: (
        <Button type="primary" onClick={() => notification.destroy()}>
          知道了
        </Button>
      ),
    });
  };

  const saveTasks = (newTasks: TodoTask[]) => {
    setTasks(newTasks);
    localStorage.setItem("todoTasks", JSON.stringify(newTasks));
  };

  const addTask = async (values: any) => {
    setLoading(true);
    try {
      const task: TodoTask = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description,
        scheduledTime: values.scheduledTime,
        email: values.email,
        createdAt: new Date(),
      };

      if (window.electronAPI) {
        const jobId = await window.electronAPI.scheduleTask(task);
        task.jobId = jobId;
      }

      const newTasks = [...tasks, task];
      saveTasks(newTasks);
      form.resetFields();

      notification.success({
        message: "任务添加成功",
        description: `任务将在 ${new Date(values.scheduledTime).toLocaleString()} 提醒`,
      });
    } catch (error) {
      notification.error({
        message: "添加失败",
        description: "无法创建定时任务",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.jobId && window.electronAPI) {
        await window.electronAPI.cancelTask(task.jobId);
      }

      const newTasks = tasks.filter((t) => t.id !== taskId);
      saveTasks(newTasks);

      notification.success({
        message: "任务已取消",
      });
    } catch (error) {
      notification.error({
        message: "取消失败",
      });
    }
  };

  const getTimeRemaining = (scheduledTime: string) => {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledTime).getTime();
    return Math.max(0, scheduled - now);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const CountdownDisplay = ({ scheduledTime }: { scheduledTime: string }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(scheduledTime));

    useEffect(() => {
      const timer = setInterval(() => {
        const remaining = getTimeRemaining(scheduledTime);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [scheduledTime]);

    if (timeLeft <= 0) {
      return <Tag color="red">已过期</Tag>;
    }

    return (
      <Statistic
        value={timeLeft}
        formatter={(value) => formatTime(value as number)}
        prefix={<ClockCircleOutlined />}
        valueStyle={{ fontSize: "14px" }}
      />
    );
  };

  const onOk = (
    value: DatePickerProps["value"] | RangePickerProps["value"]
  ) => {
    console.log("onOk: ", value);
  };

  // 禁用今天以前的时间，包括时分秒
  const disabledDateTime = (current: Dayjs) => {
    // 如果日期是今天之前，完全禁用
    if (current && current < dayjs().startOf("day")) {
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }

    // 如果是今天，禁用已经过去的时间
    if (current && current.isSame(dayjs(), "day")) {
      const now = dayjs();
      return {
        disabledHours: () => {
          const hours = [];
          for (let i = 0; i < now.hour(); i++) {
            hours.push(i);
          }
          return hours;
        },
        disabledMinutes: (selectedHour: number) => {
          if (selectedHour === now.hour()) {
            const minutes = [];
            for (let i = 0; i < now.minute(); i++) {
              minutes.push(i);
            }
            return minutes;
          }
          return [];
        },
        disabledSeconds: (selectedHour: number, selectedMinute: number) => {
          if (selectedHour === now.hour() && selectedMinute === now.minute()) {
            const seconds = [];
            for (let i = 0; i < now.second(); i++) {
              seconds.push(i);
            }
            return seconds;
          }
          return [];
        },
      };
    }

    return {};
  };

  // 禁用今天之前的日期
  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf("day");
  };
  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <Card title="待办通知管理" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={addTask}>
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: "请输入任务标题" }]}
          >
            <Input placeholder="输入任务标题" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <TextArea placeholder="输入任务描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item
            name="scheduledTime"
            label="提醒时间"
            rules={[{ required: true, message: "请选择提醒时间" }]}
          >
            {/* <Input type="datetime-local" /> */}
            <DatePicker
              showTime
              style={{ width: "100%" }}
              onChange={(value, dateString) => {
                console.log("Selected Time: ", value);
                console.log("Formatted Selected Time: ", dateString);
              }}
              disabledDate={disabledDate}
              disabledTime={disabledDateTime}
              format="YYYY-MM-DD HH:mm:ss"
              onOk={onOk}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱提醒（可选）"
            rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="输入接收提醒的邮箱" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              添加定时任务
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={`待办任务列表 (${tasks.length})`}>
        <List
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => cancelTask(task.id)}
                >
                  取消
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{task.title}</span>
                    <CountdownDisplay scheduledTime={task.scheduledTime} />
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <div>{task.description}</div>
                    <Space>
                      <Tag icon={<ClockCircleOutlined />}>
                        {new Date(task.scheduledTime).toLocaleString()}
                      </Tag>
                      {task.email && (
                        <Tag icon={<MailOutlined />} color="blue">
                          {task.email}
                        </Tag>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: "暂无待办任务" }}
        />
      </Card>
    </div>
  );
};

export default TodoNotification;
