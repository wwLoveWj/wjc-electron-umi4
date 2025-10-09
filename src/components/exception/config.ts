import E403 from './assets/err_403.svg';
import E404 from './assets/err_404.svg';
import E500 from './assets/err_500.svg';

const config = {
  403: {
    img: E403,
    title: '403',
    desc: '抱歉，你无权访问该页面'
  },
  404: {
    img: E404,
    title: '404',
    desc: '抱歉，你访问的页面不存在'
  },
  500: {
    img: E500,
    title: '500',
    desc: '抱歉，服务器出错了'
  }
};

export default config;
