const { contextBridge, ipcRenderer } = require('electron')
console.log("init preloads.js")

// //cd_dir
// ipcMain.on('cd_dir', (event, { name }) => {
//   model.cd_dir(name)
// });
// //get_path_list
// ipcMain.handle('get_path_list', (event, { dir }) => {
//   return model.get_path_list()
// });
// //get_folder_list
// ipcMain.handle('get_folder_list', (event, { dir }) => {
//   return model.get_folder_list(dir)
// });
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: ipcRenderer,
  onCommandOutput: (callback) => {
    ipcRenderer.on('command-output', (event, output) => {
      callback(output);
    });
  },
  onCommandExit: (callback) => {
    ipcRenderer.on('command-exit', (event, exitCode) => {
      callback(exitCode);
    });
  },
  executeCommand: (command, cwd) => {
    ipcRenderer.invoke('execute-command', { command, cwd });
  },
  executeGPT: (data:string) => {
    return ipcRenderer.invoke('execute-gpt',{input:data});
  },
  updateValues: (values) => {
    ipcRenderer.send('update-values', { values });
  },
  changeDir: (name) => {
    ipcRenderer.send('changeDir', { name });
  },
  getPathList: () => {
    return ipcRenderer.invoke('get_path_list',{});
  },
  getFolderList: (dir) => {
    return ipcRenderer.invoke('get_folder_list',{ dir });
  }

})

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}
const encoding = document.characterSet;
console.log(`渲染进程的字符编码是 ${encoding}`);
/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
