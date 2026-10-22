// 一、回顾

/*
// jsx写法，使用react
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById("root")
ReactDOM.render(element, container)
*/

// 基于上述代码去掉React代码，使用纯JavaScript
// （即实现react封装的方法）

/*
// Babel： 标签内代码替换为调用createElement
const element = React.createElement(
    "h1",
    { title: "foo" },
    "hello"
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
*/

/*
// 将调用createElement调用替换为调用返回值
const element = {
    type: "h1",
    props: {
        title: "foo",
        children: "Hello" // 可能包含其他元素，树结构
    }
    // 还有更多属性，先关注这两个
}
const container = document.getElementById("root")
ReactDOM.render(element, container)
*/

/*
// 接下来替换render
const element = {
    type: "h1",
    props: {
        title: "foo",
        children: "Hello" // 可能包含其他元素，树结构
    }
    // 还有更多属性，先关注这两个
}
const container = document.getElementById("root")
//ReactDOM.render(element, container)

const node = document.createElement(element.type)
node['title'] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children

node.appendChild(text)
container.appendChild(node)
*/

// 二、正式开始实现最小react

/*
// 仍然使用一个示例开始
const element = (
    <div id="foo">
        <a>bar</a>
        <b />
    </div>
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
*/

// 编写createElement：jsx转为js
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === 'object' ?
                    child : createTextElement(child)
            )
        }
    }
}
// 非对象数据
function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [] // 实际react中不会创建空数组，此处简化
        }
    }
}

// 创建Didact代替“React”
const Didact = {
    createElement,
    render
}

// 让babel 使用Didacnt进行jsx编译
/* @jsx Didact.createElement */
const element = (
    <div id="foo">
        <a>bar</a>
        <b />
    </div>
)
const container = document.getElementById("root")
Didact.render(element, container)

/*
// 实现render，先仅实现将元素添加到DOM中
function render(element, container) {
    const dom = element.type === "TEXT_ELEMENT" ?
        document.createTextNode("") :
        document.createElement(element.type)

    const isProperty = key => key !== "children"
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = element.props[name]
        })

    // 对子节点递归操作
    element.props.children.forEach(child => {
        render(child, dom)
    });

    container.appendChild(dom)
}
*/


// 上述render递归调用渲染的方式存在问题，一旦开始渲染就无法停止会阻塞主线程
// 重构 -- 拆成小单元，使用requestIdleCallback
let nextUnitOfWork = null
let wipRoot = null // 进行中的工作根节点
let currentRoot = null // 上一次被提交到DOM的fiber树（或说是当前DOM对应的current）


function commitRoot() {
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber) {
    // 递归将节点添加到dom
    if (!fiber) {
        return
    }
    const domParent = fiber.parent.dom
    domParent.appendChild(fiber.dom)
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }

    // 一旦完成所有工作（通过没有下一个工作单元判断）
    // 就将整个fiber树提交到dom
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    // 目前react使用了调度器包而非requestIdleCallback
    // 但概念上一致
    requestIdleCallback(workLoop)
}


// function performUnitOfWork(fiber) {
//     if (!fiber.dom) {
//         fiber.dom = createDom(fiber)
//     }

//     // if (fiber.parent) {
//     //     fiber.parent.dom.appendChild(fiber.dom)
//     // }
//     // 由于浏览器可能在渲染整个树之前中断我们操作
//     // 因此上述操作会导致用户看到界面不完整，因此移除, 
//     // 转而关注wiproot（进行中的工作根节点）

//     const elements = fiber.props.children
//     let index = 0
//     let prevSibling = null

//     while (index < elements.length) {
//         const element = elements[index]

//         const newFiber = {
//             type: element.type,
//             props: element.props,
//             parent: fiber,
//             dom: null
//         }

//         if (index === 0) {
//             // 第一个孩子是孩子
//             fiber.child = newFiber
//         } else {
//             // 第二个及之后孩子是前一个孩子的兄弟
//             prevSibling.prevSibling = newFiber
//         }

//         prevSibling = newFiber
//         index++
//     }

//     // 返回下一个工作单元
//     // 先看有无孩子
//     if (fiber.child) {
//         return fiber.child
//     }
//     let nextFiber = fiber
//     // 再看有无兄弟、以及叔叔等
//     while (nextFiber) {
//         if (nextFiber.sibling) {
//             return nextFiber.sibling
//         }
//         nextFiber = nextFiber.parent
//     }

// }

function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ?
        document.createTextNode("") :
        document.createElement(fiber.type)

    const isProperty = key => key !== "children"
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => dom[name] = fiber.props[name])

    return dom
}
// 重构render
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
}


// 目前为止只将元素添加到DOM中，但没有更新、删除
// 需要将render函数返回的元素与上次提交到DOM的fiber树进行比较
// 因此需要在完成提交之后保留fiber树的引用 —— currentRoot

// 同时为fiber节点添加alternate属性，用于指向旧fiber

// 提取上述performUnitOfWork部分代码到reconcileChildren
// 在reconcileChildren中结合旧fiber和新元素

/*
// 从performUnitOfWork抽取的样子
function reconcileChildren(fiber, elements) {
    let index = 0
    let prevSibling = null

    while (index < elements.length) {
        const element = elements[index]

        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        }

        if (index === 0) {
            // 第一个孩子是孩子
            fiber.child = newFiber
        } else {
            // 第二个及之后孩子是前一个孩子的兄弟
            prevSibling.prevSibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}
*/

// 结合旧fiber
function reconcileChildren(wipFiber, elements) {
    let index = 0
    // 取出旧fiber第一个子节点
    let oldFiber = wipRoot.alternate && wipRoot.alternate.child
    let prevSibling = null

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null
        // const newFiber = {
        //     type: element.type,
        //     props: element.props,
        //     parent: fiber,
        //     dom: null
        // }

        const sameType =
            oldFiber && element && oldFiber.type === element.type

        if (sameType) {
            // 同一类型，保留DOM节点，用新属性更新
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
            }
        }
        if (element && !sameType) {
            // 类型不同，且存在新元素（element不为空），新增DOM节点
        }
        if (oldFiber && !sameType) {
            // 类型不同，且存在旧元素（oldFiber不为空），移除旧节点
        }


        if (index === 0) {
            // 第一个孩子是孩子
            wipFiber.child = newFiber
        } else {
            // 第二个及之后孩子是前一个孩子的兄弟
            prevSibling.prevSibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}


function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }
    // 由于浏览器可能在渲染整个树之前中断我们操作
    // 因此上述操作会导致用户看到界面不完整，因此移除, 
    // 转而关注wiproot（进行中的工作根节点）

    const elements = fiber.props.children
    reconcileChildren(fiber, elements)

    // 返回下一个工作单元
    // 先看有无孩子
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    // 再看有无兄弟、以及叔叔等
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }

}

