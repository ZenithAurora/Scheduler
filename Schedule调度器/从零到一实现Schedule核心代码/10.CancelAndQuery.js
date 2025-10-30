// 9b.CancelAndQuery.js
/**
 * 想象：
 * - 取消预约："管理员，我不上了！"
 * - 查询状态："现在是什么情况？"
 */

import { currentPriorityLevel } from './4.ScheduleState.js';

// （1）取消任务 - 对应官方 unstable_cancelCallback
/**
 * 想象：有人预约了上厕所但突然不想上了
 * "管理员，把我的预约取消吧！"
 * 
 * 设计原理：简单标记任务为"已取消"
 * 工作循环会自动跳过这些任务
 * 
 * 官方源码精髓：不立即删除，避免破坏堆结构
 */
export function unstable_cancelCallback(task) {
  task.callback = null;
}

// （2）获取当前优先级 - 对应官方 unstable_getCurrentPriorityLevel  
/**
 * 想象：有人问"管理员，现在是什么紧急状态？"
 * "管理员："现在是董事长级别的高优先级"
 * 
 * 用途：让任务知道当前执行环境的紧急程度
 * 比如：根据当前紧急程度决定执行逻辑
 */
export function unstable_getCurrentPriorityLevel() {
  return currentPriorityLevel;
}