/**
 * 全局事件总线，用于全局事件的发布与订阅
 * 用法：
 * mittBus.on('event', callback)
 * mittBus.emit('event', data)
 */
import { EventEmitter } from "events";
//2.创建事件总线
const mittBus = new EventEmitter();
export default mittBus;
