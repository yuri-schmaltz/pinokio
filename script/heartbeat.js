const net = require('net')

async function checkPort(port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const timer = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, timeoutMs)
    socket
      .once('connect', () => {
        clearTimeout(timer)
        socket.destroy()
        resolve(true)
      })
      .once('error', () => {
        clearTimeout(timer)
        resolve(false)
      })
      .connect(port, '127.0.0.1')
  })
}

module.exports = { checkPort }
