// 11.PriorityControl.js - 优先级控制
// 这个文件就是身份临时变更系统！

import { currentPriorityLevel } from './4.ScheduleState.js';


// （1）用指定优先级运行 - 对应官方 unstable_runWithPriority
/**
 * 🎭 临时提高身份API
 * 
 * 想象：普通顾客说"我有急事！让我当一回VIP！"
 * 服务员：好的，临时给您VIP待遇！
 * 办完事又恢复原来的身份
 */
export function unstable_runWithPriority(priorityLevel, eventHandler) {
  const previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}


// （4）插个队 - 对应官方 unstable_next
/**
 * 想象：领导进厕所只是为了洗个手："这事不急，就按普通员工处理"
 * 服务员：好的，给您临时降级处理
 */
export function unstable_next(eventHandler) {
  let priorityLevel;

  // 智能降级：高紧急程度 → 普通
  switch (currentPriorityLevel) {
    case 1: // ImmediatePriority
    case 2: // UserBlockingPriority  
    case 3: // NormalPriority
      priorityLevel = 3; // 降级到普通
      break;
    default:
      priorityLevel = currentPriorityLevel;
  }

  // 先记录下当前的紧急程度
  const previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    // 这里表明，恢复领导得高优先级，毕竟我们说过，只是临时降级嘛
    // 如果不恢复会怎么样？
    // 领导：我#@*冯，我只是临时降级处理，别真的给我降薪降职呀？ 这公司可是我开的！
    currentPriorityLevel = previousPriorityLevel;
  }
}
