import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws-events'

let stompClient = null

export const getStompClient = () => {
  if (stompClient) {
    return stompClient
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_BASE_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => {
      // debug logs suppressed in production
    },
  })

  return stompClient
}

export const subscribeToEventAttendance = (eventId, onAttendanceReceived, onError) => {
  if (!eventId) return () => {}

  const client = getStompClient()
  let subscription = null

  const doSubscribe = () => {
    if (subscription) return
    subscription = client.subscribe(`/topic/events/${eventId}/attendance`, (message) => {
      try {
        const payload = JSON.parse(message.body)
        if (typeof onAttendanceReceived === 'function') {
          onAttendanceReceived(payload)
        }
      } catch (err) {
        console.error('Error parsing attendance WebSocket message:', err)
      }
    })
  }

  if (client.connected) {
    doSubscribe()
  } else {
    const prevOnConnect = client.onConnect
    client.onConnect = (frame) => {
      if (prevOnConnect) prevOnConnect(frame)
      doSubscribe()
    }
    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame.headers?.['message'])
      if (typeof onError === 'function') onError(frame)
    }
    client.activate()
  }

  return () => {
    if (subscription) {
      try {
        subscription.unsubscribe()
      } catch (e) {}
    }
  }
}
