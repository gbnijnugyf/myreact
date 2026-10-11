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