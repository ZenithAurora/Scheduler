// 13.WrapCallback.js - 包装回调函数
/**
 * 想象：给回调函数穿上"优先级马甲"
 * 不管在哪调用，都保持创建时的优先级
 * 
 * 设计原理：用闭包记住创建时的优先级上下文
 * 
 * 用途：确保回调函数行为一致
 */

import { currentPriorityLevel } from './4.ScheduleState.js';


// 包装回调函数，以创建时候的优先级执行  -- 对应官方：unstable_wrapCallback
export function unstable_wrapCallback(callback) {
  // 记下当前全局环境中的优先级   比方是  3
  // parentPriorityLevel =  3
  const parentPriorityLevel = currentPriorityLevel;

  // 返回出去的这个函数，可能在其他优先级环境下运行，比方5
  return function () {
    // previousPriorityLevel = 5
    // 这里的currentPriorityLevel 是 指的调用时的优先级，不是创建时的优先级
    const previousPriorityLevel = currentPriorityLevel;
    // 这里，把当前优先级调整到创建时的优先级，确保行为一致
    currentPriorityLevel = parentPriorityLevel;

    try {
      return callback.apply(this, arguments);
    } finally {
      // 最后，恢复调用时的优先级，不影响其他任务
      currentPriorityLevel = previousPriorityLevel;
    }
  };
}




/**
 * ===============================================
 * Problems without using wrapCallback
 * ===============================================
 */

/**
 * 问题场景1：用户点击处理（不用wrapCallback）
 * 
 * 用户点击是高优先级（2），但异步回调会丢失优先级
 */
function demonstrateWrapCallbackProblem() {
  // 用户点击是高优先级（2）
  unstable_runWithPriority(2, function handleUserClick() {
    console.log("Click handling, priority:", currentPriorityLevel); // 2

    // ❌ 错误方法：直接传递函数，没有包装！
    setTimeout(function updateUI() {
      // 问题：优先级变成了3（默认）！
      console.log("UI update, priority:", currentPriorityLevel); // 3 ← 优先级丢失！
      // 用户会感觉界面响应更慢！
    }, 1000);

    // ✅ 正确方法：使用wrapCallback包装回调函数
    const updateWithIdentity = unstable_wrapCallback(function updateWithPriority() {
      console.log("UI update, priority:", currentPriorityLevel); // 2 ← 优先级保持一致！
    });
    setTimeout(updateWithIdentity, 1000);
  });
}

/**
 * 问题场景2：Promise链中的优先级丢失
 */
function demonstratePromiseChainProblem() {
  unstable_runWithPriority(2, function highPriorityTask() {
    console.log("Task start, priority:", currentPriorityLevel); // 2

    // ❌ 错误方法：直接传递回调函数，没有包装！
    fetch('/api/data').then(function processData() {
      console.log("Data processing, priority:", currentPriorityLevel); // 3 ← 丢失了优先级！    
    });

    // ✅ 正确方法：使用wrapCallback包装回调函数
    const processWithIdentity = unstable_wrapCallback(function processWithPriority() {
      console.log("Data processing, priority:", currentPriorityLevel); // 2 ← 优先级保持一致！
    });
    fetch('/api/data').then(processWithIdentity);
  });
}

/**
 * 问题场景3：事件监听器中的优先级问题
 * 
 * 事件监听器绑定是高优先级（2），但事件触发时的回调会丢失优先级
 */
function demonstrateEventListenerProblem() {
  unstable_runWithPriority(2, function setupListener() {
    console.log("Setup listener, priority:", currentPriorityLevel); // 2

    // ❌ 错误方法：直接绑定事件处理函数，没有包装！
    document.addEventListener('custom-event', function handleEvent() {
      console.log("Event handling, priority:", currentPriorityLevel); // 3 ← 丢失了优先级！  事件触发时的优先级是3，不是2
    });

    // ✅ 正确方法：使用wrapCallback包装事件处理函数
    const handleWithIdentity = unstable_wrapCallback(function handleWithPriority() {
      console.log("Event handling, priority:", currentPriorityLevel); // 2 ← 优先级保持一致！
    });
    document.addEventListener('custom-event', handleWithIdentity);
  });
}

