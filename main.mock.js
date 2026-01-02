const { app, BrowserWindow } = require('electron')
const path = require('path')
app.on('ready', () => {
  const win = new BrowserWindow({ show: false })
  win.loadURL('about:blank')
})
