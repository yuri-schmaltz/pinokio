//! Process Manager for Pinokio.
//! Handles environment management (Conda/Python) and monitoring.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub status: String,
    pub cpu_usage: f32,
    pub mem_usage: u64,
}

pub struct ProcessManagerState {
    pub processes: Arc<Mutex<HashMap<u32, ProcessInfo>>>,
}

/// Get a list of all managed processes.
#[tauri::command]
pub fn get_processes(state: State<ProcessManagerState>) -> Vec<ProcessInfo> {
    let processes = state.processes.lock().unwrap();
    processes.values().cloned().collect()
}

/// Detect if Conda is installed and return its path.
#[tauri::command]
pub fn detect_conda() -> Result<String, String> {
    #[cfg(unix)]
    {
        let output = std::process::Command::new("which")
            .arg("conda")
            .output()
            .map_err(|e| format!("Conda detect failed: {}", e))?;
        
        if output.status.success() {
            return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
    }
    
    // Check common paths if which fails
    let common_paths = vec![
        "~/anaconda3/bin/conda",
        "~/miniconda3/bin/conda",
        "/usr/local/bin/conda",
        "/opt/anaconda3/bin/conda",
    ];
    
    for path in common_paths {
        let expanded = path.replace("~", &dirs::home_dir().unwrap_or_default().to_string_lossy());
        if std::path::Path::new(&expanded).exists() {
            return Ok(expanded);
        }
    }

    Err("Conda not found".to_string())
}

/// Get system resource usage (Global).
#[tauri::command]
pub fn get_system_resources() -> Result<HashMap<String, f64>, String> {
    let mut resources = HashMap::new();
    
    // In a real implementation, we would use 'sysinfo' crate.
    // For now, return mock data to demonstrate the IPC.
    resources.insert("cpu_total".to_string(), 12.5);
    resources.insert("mem_used_gb".to_string(), 4.2);
    resources.insert("mem_total_gb".to_string(), 16.0);
    
    Ok(resources)
}
