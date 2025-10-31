// 4. SchedulerState.js
/**
 * 调度器全局状态管理中心   
 *    -- 对应官方：scheduler.production.js 开头的变量定义
 * 
 * 核心职责：统一管理调度器运行过程中的所有重要状态
 * 设计理念：集中管理，避免状态分散导致的逻辑混乱
 * 
 * 
 * SCHEDULER_STATE 全局状态管理对象
 */

// ==================== 状态对象 ====================
export const SCHEDULER_STATE = {
  // 队列管理         tips:这俩在其他地方也可能被称为：任务池
  taskQueue: [],     // 立即执行任务队列
  timerQueue: [],    // 延迟执行任务队列

  // 任务管理
  taskIdCounter: 1,          // 任务ID计数器
  currentTask: null,        // 当前正在执行的任务对象
  currentPriorityLevel: 3, // 当前调度器优先级

  // 调度状态标志
  isPerformingWork: false,         // 是否正在执行工作循环
  isHostCallbackScheduled: false,  // 是否已安排工作循环调度
  isHostTimeoutScheduled: false,   // 是否已安排延迟任务检查

  // 时间管理
  deadline: 0,         // 当前时间片的截止时间
  startTime: -1,       // 当前工作循环的开始时间
  needsPaint: false,   // 是否需要浏览器重绘
  taskTimeoutID: -1,   // 延迟任务检查定时器的ID

  // 时间切片配置
  /* 
   *   （你的内心：完了完了，时间切片，听起来好牛逼啊，肯定又是什么我学不会的复杂算法吧...学你m🤬）
   *   💡别慌！ <<世界就是个巨大的草台班子，代码都是屎山堆出来的！>>
   *   
   *   所谓时间切片，其实就是：  拉一会儿 → 出来透口气 → 再进去拉一会儿
   *   
   *   实现方法巨简单：规定每个人最多在厕所里待多久
   * 
   * 为什么是5ms？
   * 这是无数程序员用血泪总结出来的经验值：
   * 
   * （1）太短：刚脱裤子就要出来，效率太低（像便秘一样难受）
   * （2）太长：后面排队的人要骂娘了（用户：这破网页卡成狗了！）
   * 
   * 设计目标：在保证流畅性的前提下，最大化任务执行效率
   */
  frameInterval: 5  // 时间切片的时间间隔（单位：毫秒）
};
