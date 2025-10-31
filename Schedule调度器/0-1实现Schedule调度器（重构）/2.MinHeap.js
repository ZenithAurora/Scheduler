// 2.MinHeap.js

/**
 * 🚽 React调度器最小堆实现 
 * 对应官方：scheduler.production.js 中的 push, pop, peek, compare 函数
 * 
 * 【想象一下】
 *    100万个人要上厕所，怎么快速找到最急的那个人？  -- 排序！
 *
 *    傻福方案：sort() → O(n log n)     还没排完，就拉裤子里了！
 *    聪明方案：最小堆 → O(log n)       快速找到最急的人！
 */

/**
 *  tip: 最小堆就是个二叉树，用数组存
 * （1）compare  - 决定谁更急
 * （2）push     - 加新元素
 * （3）pop      - 弹出堆顶元素
 * （4）peek     - 瞄一眼堆顶元素
 */


// （1） 决定谁更急  -- 对应官方：compare
function compare(a, b) {
  // 先按过期时间排序，过期时间相同的按ID排序 
  // 两个人都说"我急！"，那就看谁先说的（ID小的先来）
  const diff = a.sortIndex - b.sortIndex;
  return diff === 0 ? a.id - b.id : diff;
}


// （2）插入任务     -- 对应官方：push
export function push(heap, node) {
  const index = heap.length;
  heap.push(node);  // 新任务来了，先放到数组末尾，然后向上调整（上浮）

  // 向上调整（上浮）
  let currentIndex = index;
  while (currentIndex > 0) {
    const parentIndex = Math.floor((currentIndex - 1) / 2); // 找父节点
    const parent = heap[parentIndex];

    if (compare(parent, node) > 0) {
      // 交换位置
      [heap[parentIndex], heap[currentIndex]] = [heap[currentIndex], heap[parentIndex]];
      currentIndex = parentIndex;
    } else {
      break; // 位置合适，不用再调整了
    }
  }
}


// （3）瞄一眼堆顶元素  -- 对应官方：peek 函数
export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

// （4）弹出堆顶元素    -- 对应官方：pop 函数  
export function pop(heap) {
  if (heap.length === 0) return null;

  /**
   * 思路：
   *  1.访问堆顶元素
   *  2.弹出最后一个元素
   *  3.如果最后一个元素不是堆顶元素，就把最后一个元素放到堆顶
   *  4.向下调整（下沉）
   */

  const first = heap[0];
  const last = heap.pop();

  if (last !== first) {
    heap[0] = last; // 把最后一个人放到第一个位置

    // 向下调整（下沉）- 新来的要找到合适位置
    let index = 0;
    const length = heap.length;

    while (index < length) {
      const leftIndex = 2 * index + 1; // 左孩子
      const rightIndex = leftIndex + 1; // 右孩子
      let smallestIndex = index; // 假设当前是最急的

      // 找左孩子和右孩子中更急的那个
      if (leftIndex < length && compare(heap[leftIndex], heap[smallestIndex]) < 0) {
        smallestIndex = leftIndex;
      }

      if (rightIndex < length && compare(heap[rightIndex], heap[smallestIndex]) < 0) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex !== index) {
        // 交换位置 - 你不够急，往后稍稍！
        [heap[index], heap[smallestIndex]] = [heap[smallestIndex], heap[index]];
        index = smallestIndex;
      } else {
        break; // 位置合适，不用再调整了
      }
    }
  }

  return first;
}





console.log('测试最小堆：想象一下厕所排队...');
const toiletQueue = [];
push(toiletQueue, { sortIndex: 5, id: 1, name: "普通" });
push(toiletQueue, { sortIndex: 3, id: 2, name: "急尿" });
push(toiletQueue, { sortIndex: 8, id: 3, name: "摸鱼" });
push(toiletQueue, { sortIndex: 1, id: 4, name: "董事长" });


console.log('瞄一眼堆顶顶元素:', peek(toiletQueue), '上厕所');
pop(toiletQueue); // 董事长上完
console.log('瞄一眼堆顶元素:', peek(toiletQueue), '上厕所');
pop(toiletQueue); // 急尿员工B 上
console.log('瞄一眼堆顶元素:', peek(toiletQueue), '上厕所');
pop(toiletQueue); // 普通员工A 上
console.log('瞄一眼堆顶元素:', peek(toiletQueue), '上厕所');
pop(toiletQueue); // 摸鱼员工C 上
console.log('瞄一眼堆顶元素:', peek(toiletQueue), '上厕所');


