// 8.PerformWorkUntilDeadline.js
/**
 * 🚀 任务执行器 - 实现时间切片的工作调度
 *    对应官方：scheduler.production.js 中的 performWorkUntilDeadline
 * 
 * 核心功能：
 * 1. 执行工作循环直到截止时间（时间切片机制）
 * 2. 智能安排下一轮工作调度
 * 3. 异常处理和状态恢复
 * 
 * 设计理念：通过MessageChannel实现真正的异步调度，避免阻塞主线程
 */

/**
 * 【想象一下】：餐厅经理如何安排厨师轮班工作？
 * 
 * performWorkUntilDeadline（单次轮班）：
 *   - 经理："厨师们，开始这一轮5分钟的工作！"
 *   - 厨师：按优先级做菜，5分钟到了就休息
 *   - 如果还有订单没做完：安排下一轮工作
 *   - 如果出错了：重新安排工作，不能因为一个菜做坏了就停业
 * 
 * schedulePerformWorkUntilDeadline（安排下一轮）：
 *   - 经理："5分钟后继续下一轮工作！"
 *   - 使用MessageChannel：就像用对讲机通知，零延迟
 *   - 降级方案：就像用电话通知，稍微有点延迟
 * 
 * 简单说：经理安排厨师轮班工作，每轮5分钟，保证餐厅持续运营
 */

import { unstable_now as getCurrentTime } from './03.TimeTools.js';
import { flushWork } from './07.WorkLoop.js';
import { setDeadline } from './05.ShouldYieldToHost.js';
import { SCHEDULER_STATE } from './04.SchedulerState.js';


// （1）执行工作直到截止时间 - 对应官方：performWorkUntilDeadline
export function performWorkUntilDeadline() {

  //  如果正在执行工作循环，就直接返回
  if (SCHEDULER_STATE.isPerformingWork) return;

  // 设置当前监督时段的截止时间
  setDeadline();

  // 标记开始工作
  SCHEDULER_STATE.isPerformingWork = true;

  // 记录开始时间
  const startTime = getCurrentTime();

  // 记录当前循环结束后，是否还有任务？
  let hasMoreWork = true

  try {
    // 使用flushWork开始执行工作循环
    hasMoreWork = flushWork(startTime)
  } finally {
    // 如果还有任务没有执行完，那等下一轮循环调度
    if (hasMoreWork) schedulePerformWorkUntilDeadline();
    else SCHEDULER_STATE.isHostCallbackScheduled = false;
    SCHEDULER_STATE.isPerformingWork = false;     // 标记工作结束
  }
}



// （2）安排下一轮工作 - 对应官方：schedulePerformWorkUntilDeadline
/**
 * 
 * 官方源码实现方式：
 * - 浏览器环境：使用 MessageChannel 实现真正的异步调度
 * - Node.js环境：使用 setImmediate 或 process.nextTick
 * - 降级方案：使用 setTimeout
 * 
 * 设计目标：确保调度是真正的异步，不阻塞当前执行栈
 * 
 * 至此，你应该恍然大明白：噢噢噢！暂停原来是通过把未完成得任务包装成宏任务延后执行得！
 */
export function schedulePerformWorkUntilDeadline() {

  //  如果已经安排工作循环，那就直接返回
  if (SCHEDULER_STATE.isHostCallbackScheduled) return;

  // 标记已安排工作循环
  SCHEDULER_STATE.isHostCallbackScheduled = true;

  /**
   * 🎯 实现真正的异步调度
   * 
   * 为什么不用 setTimeout(0)？
   * - setTimeout 有最小延迟限制（通常4ms）
   * - setTimeout 会受到浏览器节流影响
   * - MessageChannel 提供真正的零延迟异步调度
   * 
   * 降级策略：
   * 1. 优先使用 MessageChannel（现代浏览器）
   * 2. 降级使用 setImmediate（Node.js）
   * 3. 最后使用 setTimeout（兼容性方案）
   */
  // 如果当前环境支持 MessageChannel，就使用它
  if (typeof MessageChannel !== 'undefined') {
    // 使用 MessageChannel 实现真正的异步调度
    const channel = new MessageChannel();
    channel.port1.onmessage = performWorkUntilDeadline;
    channel.port2.postMessage(null);
  } else {
    // 降级方案：使用 setTimeout
    setTimeout(performWorkUntilDeadline, 0);
  }
}
