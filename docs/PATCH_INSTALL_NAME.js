// Patch para melhorar validação de nome de instalação
// Este arquivo corrige o problema de nomes com espaços e caracteres especiais

const installname = async (url, name, options) => {
  if (url.startsWith("http")) {
    let urlChunks = new URL(url).pathname.split("/")
    let defaultName = urlChunks[urlChunks.length-1]
    if (!defaultName.endsWith(".git")) {
      defaultName = defaultName + ".git"
    }
    
    // Remove .git do nome padrão
    defaultName = defaultName.replace(/\.git$/, '')
    
    let result = await Swal.fire({
      title: 'Save as',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Name">
        <div id="name-hint" style="margin-top: 10px; font-size: 12px; color: #666;"></div>
      `,
      focusConfirm: false,
      confirmButtonText: 'Download',
      allowOutsideClick: false,
      showLoaderOnConfirm: true,
      didOpen: () => {
        let input = Swal.getPopup().querySelector('#swal-input1')
        let hint = Swal.getPopup().querySelector('#name-hint')
        
        if (name) {
          input.value = name
        } else {
          input.value = defaultName;
        }
        
        // Mostrar preview do nome sanitizado
        const showHint = () => {
          const rawName = input.value.trim()
          if (!rawName) {
            hint.textContent = ''
            return
          }
          
          // Sanitizar nome
          const sanitized = rawName
            .replace(/[^a-zA-Z0-9_\- ]/g, '') // Remove caracteres inválidos
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-') // Remove hífens duplicados
            .replace(/^-|-$/g, '') // Remove hífens no início/fim
            .toLowerCase()
          
          if (sanitized !== rawName) {
            hint.textContent = `Will be saved as: ${sanitized}`
            hint.style.color = '#0ea5e9'
          } else {
            hint.textContent = ''
          }
        }
        
        input.addEventListener("input", showHint)
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            Swal.clickConfirm()
          }
        })
        
        showHint()
      },
      preConfirm: async () => {
        const rawName = (Swal.getPopup().querySelector("#swal-input1").value || "").trim()
        
        if (!rawName) {
          Swal.showValidationMessage("Name is required")
          return false
        }
        
        // Sanitizar nome para criar nome de pasta válido
        const folderName = rawName
          .replace(/[^a-zA-Z0-9_\- ]/g, '') // Remove caracteres inválidos
          .replace(/\s+/g, '-') // Substitui espaços por hífens
          .replace(/-+/g, '-') // Remove hífens duplicados
          .replace(/^-|-$/g, '') // Remove hífens no início/fim
          .toLowerCase()
        
        if (!folderName) {
          Swal.showValidationMessage("Invalid name. Use letters, numbers, spaces, hyphens or underscores.")
          return false
        }
        
        const validationError = validateInstallFolderName(folderName)
        if (validationError) {
          Swal.showValidationMessage(validationError)
          return false
        }
        
        try {
          const exists = await checkInstallDestinationExists(folderName, options)
          if (exists) {
            Swal.showValidationMessage(`Folder "${folderName}" already exists. Choose a different name.`)
            return false
          }
        } catch (error) {
          Swal.showValidationMessage(error && error.message ? error.message : "Could not check destination folder")
          return false
        }
        
        return folderName
      }
    })
    
    return result.value
  } else {
    return null
  }
}

// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Copie este código
// 2. Substitua o conteúdo de: backend/node_modules/pinokiod/server/public/install.js
// 3. Mantenha o restante do arquivo (funções validateInstallFolderName, checkInstallDestinationExists, install)
// 4. Reinicie o Pinokio

console.log("✅ Patch instalado: Validação de nome melhorada com sanitização automática")
