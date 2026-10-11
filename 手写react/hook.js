let isMount = true;
let workInProgressHook = null;

const fiber = {
    stateNode: App,
    // class组件保存的是this.state
    // 数据结构为链表，按顺序保存hook数据
    memoizedState: null
}

// 实现useState
function useState(initialState) {
    // 获取当前对应hook
    let hook;

    if (isMount) {
        // 首次fiber节点中memoizedState为null
        hook = {
            memoizedState: initialState,
            next: null,
            queue: {
                pending: null
            }
        }
        if (!fiber.memoizedState) {
            fiber.memoizedState = hook;
        } else {
            // 可能存在多个useState --> 赋值next，形成链表
            workInProgressHook.next = hook
        }
        workInProgressHook = hook
    } else {
        // update时已有链表
        hook = workInProgressHook;
        workInProgressHook = workInProgressHook.next
    }

    let baseState = hook.memoizedState

    if (hook.queue.pending) {
        let firstUpdate = hook.queue.pending.next

        do {
            const action = firstUpdate.action
            baseState = action(baseState)
            firstUpdate = firstUpdate.next
        } while (firstUpdate !== hook.queue.pending.next)

        hook.queue.pending = null

    }
    hook.memoizedState = baseState;
    return [baseState, dispatchAction.bind(null, hook.queue)]

}

function dispatchAction(queue, action) {
    // 区别与hook链表
    // 更新具有优先级（点击更新优先级高于请求数据后更新），因此react使用环状链表
    const update = {
        action,
        next: null
    }

    if (queue.pending === null) {
        update.next = update;
    } else {
        update.next = queue.pending.next
        queue.pending.next = update
    }
    queue.pending = update;// queue.pending 指向最后一个更新，queue.pending.next指向第一个

    schedule();
}


function schedule() {
    workInProgressHook = fiber.memoizedState // 每次update前需要将指针“复位”，指向链表头节点
    const app = fiber.stateNode(); //相当于触发组件render
    isMount = false;// 首次调用（mount）之后后续为update
    return app
}

function App() {
    const [num, updateNum] = useState(0);

    console.log('isMount?', isMount)
    console.log('num:', num)
    return {
        onClick() {
            // updateNum(num + 1)
            updateNum(num => num + 1)
        }
    }
}

window.app = schedule()

