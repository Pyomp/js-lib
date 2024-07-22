export const jsonLocalStorage = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key))
        } catch {
            return
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    }
}
