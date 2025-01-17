export const jsonLocalStorage = {
    get(key, defaultValue, version) {
        try {
            const value = JSON.parse(localStorage.getItem(key))
            if (typeof value !== 'object' || value === null || value.version !== version)
                throw 'version has been updated'
            return value.data
        } catch {
            jsonLocalStorage.set(key, defaultValue, version)
            return defaultValue
        }
    },
    set(key, data, version) {
        localStorage.setItem(key, JSON.stringify({ version, data }))
    }
}
