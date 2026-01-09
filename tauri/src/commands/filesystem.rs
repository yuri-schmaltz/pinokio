//! Filesystem commands for Pinokio.
//! Provides file/directory operations via Tauri commands.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
}

/// List directory contents.
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| format!("Read dir failed: {}", e))?;

    let mut files = Vec::new();
    for entry in entries.flatten() {
        let metadata = entry.metadata().ok();
        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size = if is_dir {
            None
        } else {
            metadata.map(|m| m.len())
        };

        if let Some(name) = entry.file_name().to_str() {
            files.push(FileEntry {
                name: name.to_string(),
                path: entry.path().to_string_lossy().to_string(),
                is_dir,
                size,
            });
        }
    }
    Ok(files)
}

/// Read file contents as string.
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Read file failed: {}", e))
}

/// Write string to file.
#[tauri::command]
pub fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| format!("Write file failed: {}", e))
}

/// Check if path exists.
#[tauri::command]
pub fn path_exists(path: String) -> bool {
    PathBuf::from(path).exists()
}

/// Get home directory.
#[tauri::command]
pub fn get_home_dir() -> Option<String> {
    dirs::home_dir().map(|p| p.to_string_lossy().to_string())
}

/// Create directory recursively.
#[tauri::command]
pub fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Create dir failed: {}", e))
}

/// Remove file or directory.
#[tauri::command]
pub fn remove_path(path: String, recursive: bool) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if p.is_dir() {
        if recursive {
            fs::remove_dir_all(&path).map_err(|e| format!("Remove dir failed: {}", e))
        } else {
            fs::remove_dir(&path).map_err(|e| format!("Remove dir failed: {}", e))
        }
    } else {
        fs::remove_file(&path).map_err(|e| format!("Remove file failed: {}", e))
    }
}
