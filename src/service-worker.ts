/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

precacheAndRoute(self.__WB_MANIFEST || [])

addEventListener('push', ((event: any) => {
  if (!event.data) return

  const data = event.data.json()
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `product-${data.productId}`,
    data: {
      productId: data.productId,
      url: `/produit/${data.productId}`,
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
}) as EventListener)

addEventListener('notificationclick', ((event: any) => {
  event.notification.close()
  const productId = event.notification.data.productId
  const url = `/produit/${productId}`

  event.waitUntil(
    (self.clients as any).matchAll({ type: 'window' }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(productId)) {
          return client.focus()
        }
      }
      return (self.clients as any).openWindow(url)
    })
  )
}) as EventListener)
