// 14.ScheduleProduction.js
/**
 * 把前面所有API收集起来，整体导出
 * 对应官方 scheduler.production.js 的导出部分
 */
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority
} from './1.Priorities.js'
import { unstable_now } from './3.TimeTools.js';
import { shouldYieldToHost } from './5.ShouldYieldToHost.js';
import { unstable_scheduleCallback } from './9.ScheduleCallback.js'
import { unstable_cancelCallback, unstable_getCurrentPriorityLevel } from './10.CancelAndQuery.js';
import { unstable_runWithPriority, unstable_next } from './11.PriorityControl.js';
import { unstable_requestPaint, unstable_forceFrameRate } from './12.PaintUtils.js';
import { unstable_wrapCallback } from './13.WrapCallback.js';


// 与官方命名对其
export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  LowPriority as unstable_LowPriority,
  IdlePriority as unstable_IdlePriority,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_getCurrentPriorityLevel,
  unstable_runWithPriority,
  unstable_next,
  unstable_requestPaint,
  unstable_forceFrameRate,
  unstable_wrapCallback,
  shouldYieldToHost as unstable_shouldYield,
  unstable_now
};