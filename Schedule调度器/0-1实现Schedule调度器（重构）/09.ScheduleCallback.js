// 9.ScheduleCallback.js
/**
 * 核心调度API - 安排任务   --- 对应官方：unstable_scheduleCallback
 * 
 * 想象：有人来到厕所管理处窗口说"我要上厕所！"
 * 管理员："好的，告诉我你有多急？想什么时候上？"
 * 
 * 作用：
 *    将回调函数封装成一个任务对象
 *    根据开始时间，看看进入延时队列还是立即队列
 *    
 *    （1）延时队列加入一个任务后，设置一个闹钟，表示多久之后我来检查延时队列
 *    （2）将任务加到任务队列后， 如果当前没有工作循环，那么就启动循环
 */

import { unstable_now as getCurrentTime, getTimeoutByPriority } from './03.TimeTools.js';
import { push, peek } from './02.MinHeap.js';
import { SCHEDULER_STATE } from './04.SchedulerState.js';
import { schedulePerformWorkUntilDeadline } from './08.PerformWorkUntilDeadline.js';
import { handleTimeout, requestHostTimeout, cancelHostTimeout } from './06.AdvanceTimers.js';


// 任务调度
export function unstable_scheduleCallback(priorityLevel, callback, options) {
  /**
   * 参数说明：
   * priorityLevel - 你有多急？（1=救命，5=佛系）
   * callback - 任务函数
   * options - 额外要求（比如：我10分钟后再上）
   * 
   * options长啥样呢？
   *      options：{
   *        delay: 1000,
   *        // 其他可选参数...
   *      }
   * 
   * 设计原理：根据紧急程度和开始时间，智能安排到不同队列
   */

  // 计算时间 - 你什么时候想上厕所？
  const currentTime = getCurrentTime();

  let startTime = currentTime; // 默认：现在就想上！

  // 如果有延迟要求，就安排到未来
  if (typeof options === 'object' && options !== null && typeof options.delay === 'number' && options.delay > 0) {
    startTime = currentTime + options.delay;
  }

  // 计算憋尿极限时间 - 根据优先级确定能忍多久
  const timeout = getTimeoutByPriority(priorityLevel);
  const expirationTime = startTime + timeout;

  // 将callback组装成任务对象
  const newTask = createTaskObject(priorityLevel, callback, startTime, expirationTime);

  // 将这个任务分配到预约队列或立即队列
  if (startTime > currentTime) handleDelayedTask(newTask, startTime, currentTime);
  else handleImmediateTask(newTask, expirationTime);


  return newTask;
}


// （1）将回调函数封装成一个任务对象
function createTaskObject(priorityLevel, callback, startTime, expirationTime) {
  const newTask = {
    id: SCHEDULER_STATE.taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1, // 临时值，后面会根据情况设置
  };
  return newTask;
}

// （2）把一个立即执行的任务加入任务队列
function handleImmediateTask(newTask, expirationTime) {
  newTask.sortIndex = expirationTime;
  push(SCHEDULER_STATE.taskQueue, newTask);

  // 如果没有安排任务循环，并且当前工作循环也没有在进行中，那么就立刻启动一个工作循环
  if (!SCHEDULER_STATE.isHostCallbackScheduled && !SCHEDULER_STATE.isPerformingWork) {
    SCHEDULER_STATE.isHostCallbackScheduled = true;
    schedulePerformWorkUntilDeadline();
  }
}

//（3）把一个延时执行的任务加入延时队列
function handleDelayedTask(newTask, startTime, currentTime) {
  newTask.sortIndex = startTime;
  push(SCHEDULER_STATE.timerQueue, newTask);

  // 放入一个任务，就得计算一下，下次啥时候来检查延时队列
  if (peek(SCHEDULER_STATE.taskQueue) === null && newTask === peek(SCHEDULER_STATE.timerQueue)) {
    // 如果你已经安排了延迟任务检查（你之前已经设置了一个闹钟了），由于新任务进来了，你得重新设置闹钟，所以久得取消了
    if (SCHEDULER_STATE.isHostTimeoutScheduled) cancelHostTimeout();
    // 闹钟设置好了
    else SCHEDULER_STATE.isHostTimeoutScheduled = true;

    // 计算一下，下一次应该啥时候来检查延时队列呢？
    const delay = startTime - currentTime;
    requestHostTimeout(handleTimeout, delay);
  }
}