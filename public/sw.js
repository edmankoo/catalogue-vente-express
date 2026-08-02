self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
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
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const productId = event.notification.data.productId
  const url = `/produit/${productId}`

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(productId)) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
