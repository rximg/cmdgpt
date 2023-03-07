import { createApp } from 'vue'
// import "./style.css"
import App from './App.vue'
// import './samples/node-api'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

const app = createApp(App)
  .use(Antd)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
