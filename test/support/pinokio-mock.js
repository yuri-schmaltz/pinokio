class MockKernel {
  constructor(port, homedir) {
    this.port = port || 42000
    this.homedir = homedir || process.cwd()
    this.colors = {}
    this.theme = 'light'
    this.shell = { reset: () => {} }
  }
  path(p) {
    return require('path').join(this.homedir, p)
  }
  kill() {}
}

class PinokioMock {
  constructor() {
    this.port = process.env.PINOKIO_PORT ? Number(process.env.PINOKIO_PORT) : 42000
    this.kernel = new MockKernel(this.port, process.env.PINOKIO_HOME || process.cwd())
    this.colors = {}
    this.theme = 'light'
  }
  async running(port) {
    const occupied = process.env.PINOKIO_PORT_IN_USE === '1'
    return occupied && port === this.port
  }
  async start(opts = {}) {
    if (typeof opts.onrefresh === 'function') {
      opts.onrefresh({ theme: this.theme, colors: this.colors })
    }
    return true
  }
}

module.exports = PinokioMock
