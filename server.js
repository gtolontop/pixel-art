const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handle)

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // Track users per room
  const roomUsers = new Map() // room -> Map<socketId, userData>

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join a canvas room
    socket.on('join-room', (data) => {
      const { room, user } = typeof data === 'string' ? { room: data, user: null } : data
      socket.join(room)
      socket.currentRoom = room

      // Track user in room
      if (!roomUsers.has(room)) {
        roomUsers.set(room, new Map())
      }
      if (user) {
        roomUsers.get(room).set(socket.id, { ...user, odId: socket.id })
        // Notify others
        socket.to(room).emit('user-joined', { odId: socket.id, ...user })
        // Send current users to new user
        const users = Array.from(roomUsers.get(room).values())
        socket.emit('users-list', users)
      }

      console.log(`${socket.id} joined room: ${room}`)
    })

    // Leave a canvas room
    socket.on('leave-room', (room) => {
      socket.leave(room)
      if (roomUsers.has(room)) {
        roomUsers.get(room).delete(socket.id)
        socket.to(room).emit('user-left', socket.id)
      }
      console.log(`${socket.id} left room: ${room}`)
    })

    // Pixel placed - broadcast to room only
    socket.on('pixel', (data) => {
      const { room, pixel } = data
      socket.to(room).emit('pixel', pixel)
    })

    // Batch of pixels - broadcast to room only
    socket.on('pixels', (data) => {
      const { room, pixels } = data
      socket.to(room).emit('pixels', pixels)
    })

    // Cursor position - broadcast to room
    socket.on('cursor', (data) => {
      const { room, cursor } = data
      socket.to(room).emit('cursor', { odId: socket.id, ...cursor })
    })

    // Chat message - broadcast to room
    socket.on('chat', (data) => {
      const { room, message } = data
      socket.to(room).emit('chat', { odId: socket.id, ...message, timestamp: Date.now() })
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      // Remove from all rooms
      if (socket.currentRoom && roomUsers.has(socket.currentRoom)) {
        roomUsers.get(socket.currentRoom).delete(socket.id)
        socket.to(socket.currentRoom).emit('user-left', socket.id)
      }
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
    console.log(`> Socket.IO ready with rooms support`)
  })
})
