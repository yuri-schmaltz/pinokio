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
    use sysinfo::System;
    let mut sys = System::new_all();
    sys.refresh_all();

    let mut resources = HashMap::new();
    
    resources.insert("cpu_total".to_string(), sys.global_cpu_info().cpu_usage() as f64);
    
    let used_mem = sys.used_memory() as f64 / 1024.0 / 1024.0 / 1024.0; // GB
    let total_mem = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0; // GB
    
    resources.insert("mem_used_gb".to_string(), used_mem);
    resources.insert("mem_total_gb".to_string(), total_mem);
    
    Ok(resources)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_info_serialization() {
        let info = ProcessInfo {
            pid: 1234,
            name: "test_process".to_string(),
            status: "running".to_string(),
            cpu_usage: 1.5,
            mem_usage: 1024,
        };
        let json = serde_json::to_string(&info).expect("Failed to serialize ProcessInfo");
        assert!(json.contains("1234"));
        assert!(json.contains("test_process"));
        assert!(json.contains("running"));
    }

    #[test]
    fn test_process_manager_thread_safety() {
        let state = ProcessManagerState {
            processes: Arc::new(Mutex::new(HashMap::new())),
        };
        
        // Simulate thread sharing
        let process_lock = state.processes.clone();
        let handle = std::thread::spawn(move || {
            let mut guard = process_lock.lock().unwrap();
            guard.insert(1, ProcessInfo {
                pid: 1,
                name: "init".to_string(),
                status: "sleeping".to_string(),
                cpu_usage: 0.0,
                mem_usage: 0,
            });
        });
        
        handle.join().unwrap();
        
        let guard = state.processes.lock().unwrap();
        assert!(guard.contains_key(&1));
    }

    #[test]
    fn test_detect_conda_smoke() {
        // This test ensures the function doesn't panic regardless of the environment.
        let result = detect_conda();
        match result {
            Ok(path) => {
                println!("Allowed: Conda found at {}", path);
                assert!(!path.is_empty());
            },
            Err(e) => {
                println!("Allowed: Conda not found ({})", e);
                assert!(!e.is_empty());
            }
        }
    }
}
