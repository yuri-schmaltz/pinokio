//! Pinokio Tauri Application
//! AI-first application launcher built with Rust.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent, Manager};
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
