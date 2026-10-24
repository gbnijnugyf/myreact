const FULLFILLED = 'fulfilled'
const REJECTED = 'rejected'
const PENDING = 'pending'


class MyPromise {
    #state = PENDING
    #result = undefined
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
            if (this.#state === FULLFILLED) { }
            else if (this.#state === REJECTED) { }
        })
    }

    #changeState(state, result) {
        if (this.#state !== PENDING) return
        this.#state = state
        this.#result = result
        console.log('state', this.#state, 'result', this.#result)
    }
}

const promise = new MyPromise((resolve, reject) => {
    reject(2)
    resolve(1)
})