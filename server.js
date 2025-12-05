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

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join a canvas room
    socket.on('join-room', (room) => {
      socket.join(room)
      console.log(`${socket.id} joined room: ${room}`)
    })

    // Leave a canvas room
    socket.on('leave-room', (room) => {
      socket.leave(room)
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
    console.log(`> Socket.IO ready with rooms support`)
  })
})
