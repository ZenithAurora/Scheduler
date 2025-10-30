// 5.ShouldYieldToHost.js
/**
 * 对应官方：scheduler.production.js 中的 shouldYieldToHost
 * 
 * 核心问题：怎么知道一个人是不是占着茅坑不拉屎？
 * 解决方案：设置厕所使用时间限制！
 * 
 * 思考：
 *   （1）为什么是5毫秒？
 *   （2）什么时候该让人滚出来？
 */

import { unstable_now as getCurrentTime } from './3.TimeTools.js';
import { needsPaint, frameInterval, deadline } from './4.ScheduleState.js';

// （1）设置下一个人的厕所使用截止时间  -- 你到 9：50就得出来
export function setDeadline() {
  deadline = getCurrentTime() + frameInterval;
}


// （2）让出主线程
export function shouldYieldToHost() {
  /**
   * 什么情况下需要让出主线程？
   * （1）当前时间超过了截止时间
   * （2）需要重绘
   */

  /**
   * （1）现在都 9：51了   你的截至时间是 9：50 所以你得交出厕所
   * （2）页面需要重绘，你也得交出使用权
   * if(needsPaint) return true
   * else if(getCurrentTime() >= deadline) return true
   * else return false
   */

  return getCurrentTime() >= deadline || needsPaint; // 简写
}

