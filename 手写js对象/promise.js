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

    #runOne(callback, resolve, reject) {
        if (callback && typeof callback === 'function') {
            try {
                const result = callback(this.#result)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        }
        else {
            const settled = this.#state === FULLFILLED ? resolve : reject
            settled(this.#result)
        }
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
    resolve(111)
})

promise.then(123132123123, (err) => {
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