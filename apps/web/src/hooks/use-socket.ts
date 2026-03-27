'use client'

import { io } from 'socket.io-client'

import type { Socket } from 'socket.io-client'

let _socket: Socket | null = null

/**
 * Returns a singleton Socket.io connection authenticated with the current
 * access token. The JWT is passed in handshake.auth (never as a query param).
 */
export function getSocket(accessToken: string): Socket {
  if (_socket && _socket.connected) return _socket

  // Socket.io connects directly to the API (uses JWT token auth, not cookies).
  // Falls back to NEXT_PUBLIC_API_URL so local dev needs no extra config.
  const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  _socket = io(baseUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
    autoConnect: true,
  })

  return _socket
}

/** Disconnect and clear the singleton (call on logout). */
export function resetSocket() {
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }
}
