//! Pinokio Tauri Application
//! AI-first application launcher built with Rust.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use std::process::Stdio;
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent, Manager, GlobalShortcutManager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use commands::process_manager::{ProcessManagerState, ProcessInfo};

fn log_to_file(msg: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;
    let _ = std::fs::create_dir_all("/tmp");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open("/tmp/pinokio_debug.log") {
         let _ = writeln!(file, "{}", msg);
    }
}

fn kill_zombies() {
    log_to_file("[CLEANUP] Checking for zombie processes on port 42000...");
    
    // 1. Force kill anything on port 42000
    // We use "sh -c" to leverage shell pipes for lsof | xargs
    let output_port = std::process::Command::new("sh")
        .arg("-c")
        .arg("lsof -t -i:42000 | xargs -r kill -9")
        .output();

    match output_port {
        Ok(o) => {
            log_to_file(&format!("[CLEANUP] Port 42000 sweep complete. Success: {}", o.status.success()));
        },
        Err(e) => {
            log_to_file(&format!("[CLEANUP] Warning: Failed to sweep port 42000: {}", e));
        }
    }

    // 2. Force kill orphaned pinokiod scripts
    log_to_file("[CLEANUP] Sweeping for orphaned pinokiod scripts...");
    let output_pkill = std::process::Command::new("pkill")
        .arg("-f")
        .arg("pinokiod/script/index.js")
        .output();
        
    match output_pkill {
         Ok(o) => {
             // pkill returns exit code 1 if nothing matched (which is good), so we don't assume only Success=true is good.
             log_to_file(&format!("[CLEANUP] Orphan sweep complete. (Exit code: {:?})", o.status.code()));
         },
         Err(e) => {
             log_to_file(&format!("[CLEANUP] Warning: Failed to sweep orphans: {}", e));
         }
    }
}

fn main() {
    log_to_file("----------------------------------------");
    log_to_file("Pinokio Starting...");

    // Auto-Cleanup: Kill zombies before doing anything else
    kill_zombies();

    // System tray menu
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    let process_state = ProcessManagerState {
        processes: Arc::new(Mutex::new(HashMap::new())),
    };

    tauri::Builder::default()
        .manage(process_state)
        .system_tray(system_tray)
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let handle = app.handle();
            let mut shortcut_manager = handle.global_shortcut_manager();
            
            // Register global shortcut to toggle window
            let _ = shortcut_manager.register("CmdOrCtrl+Shift+P", move || {
                if let Some(window) = handle.get_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            });

            // Check for updates
            let updater_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                log_to_file("[UPDATER] Checking for updates...");
                match updater_handle.updater().check().await {
                    Ok(update) => {
                        if update.is_update_available() {
                            log_to_file("[UPDATER] Update available! Downloading and installing...");
                            if let Err(e) = update.download_and_install().await {
                                log_to_file(&format!("[UPDATER] Failed to update: {}", e));
                            } else {
                                log_to_file("[UPDATER] Update installed. Restarting application...");
                                updater_handle.restart();
                            }
                        } else {
                            log_to_file("[UPDATER] No updates available.");
                        }
                    }
                    Err(e) => {
                        log_to_file(&format!("[UPDATER] Failed to check for updates: {}", e));
                    }
                }
            });

            // Spawn Pinokio Backend
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                log_to_file("Attempting to spawn backend...");
                
                // Diagnostic: Try to resolve with "node_modules" prefix and log paths
                // We changed the resource to "node_modules_vendor" in tauri.conf.json
                let resource_path = "node_modules_vendor/pinokiod/script/index.js";

                let script_path_buf = app_handle
                    .path_resolver()
                    .resolve_resource(resource_path)
                    .unwrap_or_else(|| {
                         let msg = "[PINOKIO DIAG] Failed to resolve primary resource path, trying fallback...";
                         log_to_file(msg);
                         println!("{}", msg);
                         // If the vendor link failed, maybe it's flattened? 
                         // But we expect it to be "node_modules_vendor"
                         app_handle.path_resolver().resolve_resource("node_modules/pinokiod/script/index.js")
                            .expect("failed to resolve resource (fallback)")
                    });
                
                let script_path = script_path_buf.to_string_lossy().to_string();
                let msg = format!("[PINOKIO DIAG] Resolved script path: {}", script_path);
                log_to_file(&msg);
                println!("{}", msg);

                // DIAGNOSTIC: List files around the target
                log_to_file("[PINOKIO DIAG] Listing parent directory of script:");
                if let Some(parent) = std::path::Path::new(&script_path).parent() {
                     let output = std::process::Command::new("ls")
                        .arg("-la")
                        .arg(parent)
                        .output();
                     if let Ok(o) = output {
                         log_to_file(&format!("ls parent: {:?}", String::from_utf8_lossy(&o.stdout)));
                     }
                        
                     log_to_file("[PINOKIO DIAG] Listing node_modules directory:");
                     if let Some(gradparent) = parent.parent() { // pinokiod
                         if let Some(greatgrandparent) = gradparent.parent() { // node_modules
                             let output = std::process::Command::new("ls")
                                .arg("-la")
                                .arg(greatgrandparent)
                                .output();
                             if let Ok(o) = output {
                                 log_to_file(&format!("ls node_modules: {:?}", String::from_utf8_lossy(&o.stdout)));
                             }
                                
                             // Also list root of mount if possible
                             if let Some(root) = greatgrandparent.parent() {
                                  let output = std::process::Command::new("ls")
                                    .arg("-la")
                                    .arg(root)
                                    .output();
                                 if let Ok(o) = output {
                                     log_to_file(&format!("ls root: {:?}", String::from_utf8_lossy(&o.stdout)));
                                 }
                             }
                         }
                     }
                }

                
                let mut cmd = Command::new("node");
                cmd.arg(&script_path);

                // Performance Optimization (v5.3.11)
                // 1. Increase threadpool for blocking I/O (Filesystem, Crypto, Zlib)
                cmd.env("UV_THREADPOOL_SIZE", "128"); 
                // 2. Allow more RAM for Node.js to reduce GC pauses (4GB)
                cmd.env("NODE_OPTIONS", "--max-old-space-size=4096");
                
                // Fix for bundled environment: Set NODE_PATH to node_modules_vendor
                if let Some(script_dir) = script_path_buf.parent() {
                    if let Some(pkg_dir) = script_dir.parent() {
                        if let Some(vendor_dir) = pkg_dir.parent() {
                             let vendor_path = vendor_dir.to_string_lossy().to_string();
                             log_to_file(&format!("[PINOKIO FIX] Setting NODE_PATH to: {}", vendor_path));
                             cmd.env("NODE_PATH", vendor_path);
                        }
                    }
                }

                cmd.stdout(Stdio::piped());
                cmd.stderr(Stdio::piped());

                match cmd.spawn() {
                    Ok(mut child) => {
                        log_to_file("Node process spawned successfully.");
                        let stdout = child.stdout.take().expect("Failed to open stdout");
                        let stderr = child.stderr.take().expect("Failed to open stderr");
                        
                        let window_handle = app_handle.clone();
                        let window_handle_err = app_handle.clone();

                        // Stream stdout
                        tokio::spawn(async move {
                            let reader = BufReader::new(stdout);
                            let mut lines = reader.lines();
                            while let Ok(Some(line)) = lines.next_line().await {
                                log_to_file(&format!("[NODE STDOUT] {}", line));
                                println!("[PINOKIO] {}", line); // Log to terminal
                                if let Some(window) = window_handle.get_window("main") {
                                    let _ = window.emit("terminal:stdout", &line);
                                    if line.contains("Server listening on port") {
                                         let _ = window.emit("terminal:stdout", "Server ready, launching...");
                                         // Small delay to ensure server is fully ready to accept connections
                                         tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
                                         log_to_file("Server ready, redirecting...");
                                         let _ = window.eval("window.location.replace('http://localhost:42000')");
                                    }
                                }
                            }
                        });

                        // Stream stderr
                        tokio::spawn(async move {
                            let reader = BufReader::new(stderr);
                            let mut lines = reader.lines();
                            while let Ok(Some(line)) = lines.next_line().await {
                                log_to_file(&format!("[NODE STDERR] {}", line));
                                eprintln!("[PINOKIO ERR] {}", line);
                                if let Some(window) = window_handle_err.get_window("main") {
                                    let _ = window.emit("terminal:stderr", &line);
                                }
                            }
                        });
                    }
                    Err(e) => {
                         let msg = format!("Failed to spawn node process: {}", e);
                         log_to_file(&msg);
                         eprintln!("{}", msg);
                         if let Some(window) = app_handle.get_window("main") {
                             let _ = window.emit("terminal:stderr", &format!("Failed to spawn backend: {}", e));
                         }
                    }
                }
            });
            
            Ok(())
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            // Terminal commands
            commands::run_command,
            commands::kill_process,
            // Filesystem commands
            commands::list_directory,
            commands::read_file,
            commands::write_file,
            commands::path_exists,
            commands::get_home_dir,
            commands::create_dir,
            commands::remove_path,
            // Process manager commands
            commands::process_manager::get_processes,
            commands::process_manager::detect_conda,
            commands::process_manager::get_system_resources,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
