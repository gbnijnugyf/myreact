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
        console.log('state', this.#state, 'result', this.#result)
        this.#run()
    }

    #run() {
        if (this.#state === PENDING) return
        while (this.#handlers.length) {
            const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()
            if (this.#state === FULLFILLED) {
                if (onFulfilled && typeof onFulfilled === 'function') {
                    onFulfilled(this.#result)
                }
            } else {
                if (onRejected && typeof onRejected === 'function') {
                    onRejected(this.#result)
                }
            }
        }
    }
}

const promise = new MyPromise((resolve, reject) => {
    reject(2)
    resolve(1)
})

promise.then((res) => {
    console.log('res', res)
}, (err) => {
    console.log('err', err)
})