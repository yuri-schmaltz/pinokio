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

fn main() {
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

            // Spawn Pinokio Backend
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                let script_path = "../node_modules/pinokiod/script/index.js";
                // Try to find the script in common locations if relative path fails (dev vs prod)
                // specific for dev environment as requested
                
                let mut cmd = Command::new("node");
                cmd.arg(script_path);
                cmd.stdout(Stdio::piped());
                cmd.stderr(Stdio::piped());

                match cmd.spawn() {
                    Ok(mut child) => {
                        let stdout = child.stdout.take().expect("Failed to open stdout");
                        let stderr = child.stderr.take().expect("Failed to open stderr");
                        
                        let window_handle = app_handle.clone();
                        let window_handle_err = app_handle.clone();

                        // Stream stdout
                        tokio::spawn(async move {
                            let reader = BufReader::new(stdout);
                            let mut lines = reader.lines();
                            while let Ok(Some(line)) = lines.next_line().await {
                                println!("[PINOKIO] {}", line); // Log to terminal
                                if let Some(window) = window_handle.get_window("main") {
                                    let _ = window.emit("terminal:stdout", &line);
                                    if line.contains("Server listening on port") {
                                         let _ = window.emit("terminal:stdout", "Server ready, launching...");
                                         // Small delay to ensure server is fully ready to accept connections
                                         tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
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
                                eprintln!("[PINOKIO ERR] {}", line);
                                if let Some(window) = window_handle_err.get_window("main") {
                                    let _ = window.emit("terminal:stderr", &line);
                                }
                            }
                        });
                    }
                    Err(e) => {
                         eprintln!("Failed to spawn node process: {}", e);
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
