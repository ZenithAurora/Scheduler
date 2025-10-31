// 7.WorkLoop.js
/**
 * 调度器核心工作循环实现  调度器的任务执行引擎，对应官方源码中的 flushWork 和 workLoop 函数
 * 
 * 核心功能：
 * 1. flushWork - 工作循环的入口包装器，负责状态管理和异常安全
 * 2. workLoop - 实际的任务执行循环，实现优先级调度和时间切片
 * 
 * 想象一下：你是一个餐厅经理，负责安排厨师做菜
 * 
 * flushWork（准备工作）：
 *   - 就像经理先检查厨房状态，确保没有重复安排
 *   - 记录当前优先级（比如现在是午餐高峰期还是闲时）
 *   - 保证无论厨师做菜成功还是失败，厨房都能恢复整洁
 * 
 * workLoop（实际做菜循环）：
 *   - 经理开始叫号：VIP订单 → 普通订单 → 预约订单
 *   - 每个厨师最多做5分钟就要休息一下（时间切片）
 *   - 如果VIP客人来了，普通订单要暂停让位（优先级调度）
 *   - 厨师做完一道菜就检查有没有新订单（advanceTimers）
 * 
 * 简单说：flushWork是"准备工作"，workLoop是"实际干活"
 */



import { peek, pop } from './2.MinHeap.js';
import { unstable_now as getCurrentTime } from './3.TimeTools.js';
import { SCHEDULER_STATE } from './4.SchedulerState.js';
import { shouldYieldToHost } from './5.ShouldYieldToHost.js';
import { advanceTimers, handleTimeout, requestHostTimeout, cancelHostTimeout } from './6.AdvanceTimers.js';


// （1）调度器工作循环入口函数
export function flushWork(initialTime) {
  /**
   * 作用：
   * 1.重置调度状态，防止重复调度
   * 2.记录当前优先级，确保工作完成后能正确恢复
   * 3.使用try-finally保证无论工作是否成功，状态都能正确清理
   */
  // 重置调度状态，防止重复调度
  SCHEDULER_STATE.isHostCallbackScheduled = false;

  // 如果已经安排了延迟任务检查，就取消它
  if (SCHEDULER_STATE.isHostTimeoutScheduled) {
    SCHEDULER_STATE.isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  // 标记正在执行工作循环中....
  SCHEDULER_STATE.isPerformingWork = true;

  // 保存当前优先级
  const previousPriorityLevel = SCHEDULER_STATE.currentPriorityLevel;

  try {
    // 工作循环开始！
    return workLoop(initialTime);
  }
  finally {
    // 清理当前任务引用 - 当前任务已完成或暂停
    SCHEDULER_STATE.currentTask = null;
    // 恢复原始优先级
    SCHEDULER_STATE.currentPriorityLevel = previousPriorityLevel;
    // 标记 工作循环已完成 
    SCHEDULER_STATE.isPerformingWork = false;
  }
}



// （2）工作循环 --- 任务执行的核心逻辑
function workLoop(initialTime) {
  let currentTime = initialTime;

  // （1）如果定时器队列有任务要到时间了，那就抓到任务队列中来
  advanceTimers(currentTime);

  // （2）瞄一眼任务队列的第一个任务
  const currentTask = peek(SCHEDULER_STATE.taskQueue);

  // 开始叫号循环！
  while (currentTask !== null) {

    // 如果任务的截至日期还没到，或者必须归还浏览器执行权了，那么就再等一会
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) break;

    // 如果你实在憋不住了，并且浏览器可以使用，那么你就去使用厕所吧
    const currentCallback = currentTask.callback;
    if (typeof currentCallback === 'function') {
      currentTask.callback = null;
      SCHEDULER_STATE.currentPriorityLevel = currentTask.priorityLevel;

      // 执行任务，看这个人是不是"便秘"（执行完是不是又返回了新的回调函数）
      const didTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = currentCallback(didTimeout);
      currentTime = getCurrentTime();

      // 如果返回了新的函数  -- 这个人"便秘"了！还没拉完，下次继续
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
        /**
         * 为什么要检查 currentTask === peek(taskQueue)？
         * 
         * 想象一下这个场景：
         *  当前任务执行中：张三正在上厕所（currentTask 是张三）
         *  执行过程中：李四突然插队（优先级更高的任务被加入队列）
         *  任务完成时：张三上完厕所了，但此时队列的第一个已经不是张三了
         * 
         * 如果你不检查，你以为没有新的任务进来直接把第一个给删除了，你猜李四会对你说什么😃
         * （李四：我******尔冯了个福，你删错人了）
         */
        if (currentTask === peek(SCHEDULER_STATE.taskQueue)) {
          pop(SCHEDULER_STATE.taskQueue);
        }
      }

      advanceTimers(currentTime); // 执行完一个任务，就去检查预约队列
    }

    /**
     * 当前任务的callback根本就不是一个函数，那还执行啥，删除删除！
     * 
     * 想象一下：
     *   你等了半天，你以为你想拉💩
     *   终于你拿到厕所的使用权了，结果发现，你并不是想拉💩，你憋了半天，只是一个屁💭
     */
    else {
      pop(SCHEDULER_STATE.taskQueue);
    }

    // 瞄一眼任务队列的第一个任务
    currentTask = peek(SCHEDULER_STATE.taskQueue);
  }


  /**
   * 这里你会不会有疑问：while循环下去的条件就是currentTask不为空，为啥跳出循环了，还要判断一下呢？
   * 
   * 这是因为，如果任务在执行过程中，shouldYieldToHost()为true，说明 是应该交出浏览器的执行权了这才导致的循环结束
   * 
   * 于是，需要告诉调用者此次WorkLoop执行完后，是否还有任务
   */
  if (currentTask !== null) return true;
  else {
    // 瞄一眼预约队列
    const firstTimerTask = peek(SCHEDULER_STATE.timerQueue);
    if (firstTimerTask !== null) {
      // 设置下一次检查预约的时间
      const timeoutTime = firstTimerTask.startTime - currentTime;
      requestHostTimeout(handleTimeout, timeoutTime);
    }
    return false;
  }
}