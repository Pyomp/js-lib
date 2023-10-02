const LOCALSTORAGE_KEY = 'appVersion'

export async function initCaches(serviceWorkerUrl = './serviceWorker.js') {
    if (!self.caches) return
    try {
        const version = await (await fetch(`./version.txt`)).text()

        if (version.length === 0) throw new Error('version.txt empty')

        const lastVersion = localStorage.getItem(LOCALSTORAGE_KEY)

        if (lastVersion !== version) {
            const keys = await caches.keys()

            await Promise.all(keys.map((key) => caches.delete(key)))

            if (navigator.serviceWorker) {
                const serviceWorkerRegistrations = await navigator.serviceWorker.getRegistrations()
                await Promise.all(serviceWorkerRegistrations
                    .map((swRegistration) => swRegistration.unregister())
                )
            }

            console.log('Cache cleared.')

            localStorage.setItem(LOCALSTORAGE_KEY, version)
        }

        await _initServiceWorker(serviceWorkerUrl)

    } catch (error) {
        console.warn(error)
    }
}

async function _initServiceWorker(url = './serviceWorker.js', scope = '/') {
    if (!navigator.serviceWorker) return

    const register = await navigator.serviceWorker.register(url, { type: 'module' })

    if (register.active) {
        console.log('Service Worker active')
        return
    } else {
        console.log('Service Worker installing...')
    }

    for (let checkActiveTry = 0; checkActiveTry < 20; checkActiveTry++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (register.active) {
            console.log('Service Worker active')
            return
        }
    }

    console.log('Service Worker failed to install')
}
