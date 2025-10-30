// 9e.PaintUtils.js - 绘制工具函数
/**
 * 这个文件是
 *    1. 请求绘制
 *    2. 帧率控制
 */

import { frameInterval, needsPaint } from './4.ScheduleState'


// （1）请求重新绘制  - 对应官方 unstable_requestPaint
export function unstable_requestPaint() {
  needsPaint = true;
}


// （2）动态调整时间切片长度  - 对应官方 unstable_forceFrameRate
//  官方限制：0-125fps（太快了也受不了）
export function unstable_forceFrameRate(fps) {
  if (fps < 0 || fps > 125) {
    // Using console['error'] to evade Babel and ESLint
    console['error'](
      'forceFrameRate takes a positive int between 0 and 125, ' +
      'forcing frame rates higher than 125 fps is not supported',
    );
    return;
  }
  if (fps > 0) frameInterval = Math.floor(1000 / fps);
  // 默认 5ms
  else frameInterval = 5;

}