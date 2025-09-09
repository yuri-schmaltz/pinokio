const Store = require('electron-store');
const packagejson = require("./package.json")
const store = new Store();
module.exports = {
  newsfeed: (gitRemote) => {
    return `https://pinokiocomputer.github.io/home/item?uri=${gitRemote}&display=feed`
  },
  profile: (gitRemote) => {
    return `https://pinokiocomputer.github.io/home/item?uri=${gitRemote}&display=profile`
  },
  site: "https://pinokiocomputer.github.io/home",
  discover_dark: "/discover?theme=dark",
  discover_light: "/discover?theme=light",
  portal: "https://pinokiocomputer.github.io/home/portal",
  docs: "https://pinokiocomputer.github.io/program.pinokio.computer",
  install: "https://pinokiocomputer.github.io/program.pinokio.computer/#/?id=install",
  agent: "electron",
  version: packagejson.version,
  store
}
