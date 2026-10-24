const FULLFILLED = 'fulfilled'
const REJECTED = 'rejected'
const PENDING = 'pending'


class MyPromise {
    #state = PENDING
    #result = undefined
    #handlers = []
    constructor(executor) {
        // executor是一个任务，启动promise执行

        const resolve = (value) => {
            this.#changeState(FULLFILLED, value)
        }
        const reject = (reason) => {
            this.#changeState(REJECTED, reason)
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }

    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            this.#handlers.push({
                onFulfilled,
                onRejected,
                resolve,
                reject
            })
            this.#run()
        })
    }

    #changeState(state, result) {
        if (this.#state !== PENDING) return
        this.#state = state
        this.#result = result
        // console.log('state', this.#state, 'result', this.#result)
        this.#run()
    }

    #isPromiseLike(obj) {
        // promise A+规范中规定，thenable对象是指具有then方法的对象
        return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
    }

    #runMicroTask(func) {
        queueMicrotask(func)
        // 或区分node、浏览器环境，分别使用process.nextTick(func)或MutationObserver(func)
        // if (typeof process === 'object' && typeof process.nextTick === 'function') {
        //     process.nextTick(func)
        // } else if (typeof MutationObserver === 'function') {
        //     const observer = new MutationObserver(func)
        //     const textNode = document.createTextNode('')
        //     observer.observe(textNode, { characterData: true })
        //     textNode.data = '1'
        // }
    }

    #runOne(callback, resolve, reject) {
        this.#runMicroTask(() => {
            if (callback && typeof callback === 'function') {
                try {
                    const result = callback(this.#result)
                    if (this.#isPromiseLike(result)) {
                        result.then(resolve, reject)

                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            }
            else {
                const settled = this.#state === FULLFILLED ? resolve : reject
                settled(this.#result)
            }

        })
    }

    #run() {
        if (this.#state === PENDING) return
        while (this.#handlers.length) {
            const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()
            if (this.#state === FULLFILLED) {
                this.#runOne(onFulfilled, resolve, reject)
            } else {
                this.#runOne(onRejected, resolve, reject)
            }
        }
    }
}

const promise = new MyPromise((resolve, reject) => {
    // reject(2)
    // 使用setTimeout模拟异步操作
    setTimeout(() => {
        resolve(1)
    }, 1000)
    // resolve(111)
})

promise.then((res) => {
    console.log('res', res)
    return 123
}, (err) => {
    console.log('err', err)
}).then((res) => {
    console.log('res', res)
},
    (err) => {
        console.log('err', err)
    }
)
// promise.then((res) => {
//     console.log('res', res)
//     throw 321
// }, (err) => {
//     console.log('err', err)
// }).then((res) => {
//     console.log('res', res)
// }, (err) => {
//     console.log('err', err)
// })