// 1.Priorities.js - 

/**
 * React调度器优先级定义
 * 
 * 【想象一下】：
 *     你们公司就一个厕所，方圆几万公里找不到另外任何一个厕所了（你的内心：🌿哪个傻福设计的？）
 *    公司有100万个员工要上厕所 （内心os：完了，裤子不保了😱）
 *   此时领导（紧急任务）来了，你咋办？  （你：领导您请😁   内心：领导，我*@#称冯了个福）
 * 
 * Schedule同样，给每个任务分配了优先级，目的：让紧急任务先执行，避免页面卡死
 */


// 🎯 数字越小越紧急！
export const ImmediatePriority = 1;     // 最高优先级：需要立即执行的任务       救命！要拉裤子里了！
export const UserBlockingPriority = 2;  // 用户阻塞优先级：用户交互相关任务     快点，我憋不住了！
export const NormalPriority = 3;        // 普通优先级：常规更新任务            不急，但也要上
export const LowPriority = 4;           // 低优先级：可延迟执行的任务          等没人时候再去
export const IdlePriority = 5;          // 空闲优先级：在空闲时执行的任务      等下班再说
