// 3.TimeTools.js
/**
 * 对应官方：scheduler.production.js 中的 unstable_now 和 优先级超时计算
 * 
 * 问题：怎么知道一个人到底有多急？
 * 解决方案：给每个人一个"憋尿计时器"！
 */

// （1）获取当前时间  -- 对应官方：unstable_now
// 在官方的react包中，是通过export getCurrentTime as unstable_now的
export function unstable_now() {
  // 如果浏览器有 performance API，就用它（更精确）
  if (typeof performance === 'object' && typeof performance.now === 'function') {
    return performance.now();
  }

  // 否则用 Date（兼容老浏览器）
  const date = Date;
  return date.now();
}


// （2）根据优先级计算超时时间   -- 对应官方unstable_scheduleCallback中 switch (priorityLevel)部分
export function getTimeoutByPriority(priorityLevel) {
  /**
   * ImmediatePriority     - 领导         想上就上，永不过期！
   * UserBlockingPriority  - 急尿员工     250ms后就要拉裤子里了
   * NormalPriority        - 普通员工     5秒后就要拉裤子里了
   * LowPriority           - 摸鱼员工     10秒后就要拉裤子里了
   * IdlePriority          - 佛系员工     基本上能忍到天荒地老
   * 
   */
  switch (priorityLevel) {
    case 1:
      return -1;
    case 2:
      return 250;
    case 3:
      return 5000;
    case 4:
      return 10000;
    case 5:
      return 1073741823;
    default:
      return 5000;
  }
}