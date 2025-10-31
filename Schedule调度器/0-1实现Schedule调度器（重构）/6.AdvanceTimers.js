// 6.AdvanceTimers.js
/**
 *  任务推进 --对应官方：scheduler.production.js 中的 advanceTimers 和 handleTimeout
 * 
 * 问题：有人预约10分钟后上厕所，怎么知道10分钟到了？
 * 解决方案：定时检查预约列表！
 * 
 * 官方源码的精髓：
 *   - 用最小堆管理延迟任务（timerQueue）
 *   - 定期把到期的延迟任务移到执行队列（taskQueue）  advanceTimers
 *   - 智能设置下一次检查时间，避免不必要的检查       handleTimeout
 */
import { unstable_now as getCurrentTime } from './3.TimeTools.js';
import { peek, pop, push } from './2.MinHeap.js';
import { SCHEDULER_STATE } from './4.SchedulerState.js';
import { schedulePerformWorkUntilDeadline } from './8.PerformWorkUntilDeadline.js';



// （1）任务推进
// 作用：检查预约队列，有哪些人到时间了，到时间了就从预约队列移到等待队列
export function advanceTimers(currentTime) {
  // 瞄一眼延时队列中的  堆顶元素（最早到期的任务）
  let timerTask = peek(SCHEDULER_STATE.timerQueue);

  while (timerTask !== null) {
    // 有人取消了 - 这个人说 "我 *了，憋死算了，不上了🤬"
    if (timerTask.callback === null) pop(SCHEDULER_STATE.timerQueue);
    else if (timerTask.startTime <= currentTime) {
      // 快要到时间了！从预约队列移到等待队列
      pop(SCHEDULER_STATE.timerQueue);
      timerTask.sortIndex = timerTask.expirationTime;
      push(SCHEDULER_STATE.taskQueue, timerTask);
    }
    else return;// 堆顶元素都还没到时间，后面的也不用看了（因为最小堆是按时间排序的）

    // 继续看下一个堆顶元素
    timerTask = peek(SCHEDULER_STATE.timerQueue);
  }
}

// （2） 设置延迟检查定时器 - 对应官方：requestHostTimeout
//  作用：安排一个定时器，在指定延迟后检查延迟任务是否到期
export function requestHostTimeout(callback, delay) {
  // 不管三七二十一，一上来就先把上一个定时器清除了，管你有没有
  cancelHostTimeout();

  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime()); // 将当前时间传递给回调函数
  }, delay);
}

// （3）取消超时定时器 - 对应官方：cancelHostTimeout
// 作用：清理之前设置的超时定时器，防止多个定时器冲突
export function cancelHostTimeout() {
  /**
   * 🚫 取消超时定时器
   * 
   * 作用：清理之前设置的超时定时器，防止多个定时器冲突
   * 场景：
   * - 当调度器开始实际工作时，需要取消之前的超时检查
   * - 当有更高优先级任务插入时，需要重新安排调度
   * 
   * 设计原理：
   * 1. 如果定时器存在且有效，清除它
   * 2. 重置定时器ID为-1，表示没有活跃的定时器
   */
  if (SCHEDULER_STATE.taskTimeoutID !== -1) {
    clearTimeout(SCHEDULER_STATE.taskTimeoutID);
    SCHEDULER_STATE.taskTimeoutID = -1;
  }
}


// （4） 调度延时任务并预定下一次检查得时间 - 对应官方：handleTimeout
// 作用：1.延时任务到期了就移到任务队列  2.有任务了就启动工作循环  3.没有任务了就设置下一次检查时间
/**
 * 这个函数名字自我感觉取得很差劲，因为你根本不知道这个函数是干啥得，追问了ds
 * 它说可以换一个名字 -- checkAndScheduleNext（检查并安排下一次）
 * 
 * 【可以想象一个场景】：
 * 新病人预约 → 护士记录到预约本（timerQueue）
 *     ↓  
 * 护士设置闹钟：2小时后检查（requestHostTimeout）
 *     ↓
 * 【2小时后】闹钟响了！
 *     ↓
 * 护士开始工作（checkAndScheduleNext）：
      1. 检查预约本，把到期的移到候诊区（advanceTimers）
      2. 发现候诊区有病人 → 叫医生看病（启动工作循环）
      3. 发现候诊区没病人 → 设置4小时后的闹钟
 */
export function handleTimeout(currentTime) {
  // 这里的currentTime就是在requestHostTimeout中传递的当前时间

  // 1. 当前延迟检查已完成，清除标志
  SCHEDULER_STATE.isHostTimeoutScheduled = false;

  // 2. 推进定时器，检查是否有延迟任务到期
  advanceTimers(currentTime);

  // 3. 如果还没有安排工作循环
  if (!SCHEDULER_STATE.isHostCallbackScheduled) {

    // （1）如果任务队列有任务：安排工作循环
    if (peek(SCHEDULER_STATE.taskQueue) !== null) {
      SCHEDULER_STATE.isHostCallbackScheduled = true;  // 已经安排了工作循环来了哈！
      schedulePerformWorkUntilDeadline() // 启动工作循环
      // 如果是按照代码文件顺序来看的，看到这里可能会懵，没关系，先不管这个工作循环具体做了啥，因为代码实在后面才实现，等后面再回头来看这里就行
    }

    // （2）没有任务了，那就设置下一次检查时间
    else {
      const firstTimerTask = peek(SCHEDULER_STATE.timerQueue);
      if (firstTimerTask !== null) {
        const nextDelayTime = firstTimerTask.startTime - currentTime;
        // 安排下一次延迟任务检查（智能调度，避免不必要的轮询）
        requestHostTimeout(handleTimeout, nextDelayTime);
      }
    }
  }
}