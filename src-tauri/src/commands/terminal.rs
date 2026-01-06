//! Terminal command execution for Pinokio.
//! Provides async process spawning with streaming output.

use std::process::Stdio;
use tauri::Window;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

/// Execute a command with streaming stdout/stderr to the frontend.
#[tauri::command]
pub async fn run_command(
    window: Window,
    cmd: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<i32, String> {
    let mut command = Command::new(&cmd);
    command.args(&args);

    if let Some(dir) = cwd {
        command.current_dir(dir);
    }

    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    // Stream stdout
    if let Some(stdout) = child.stdout.take() {
        let window_clone = window.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = window_clone.emit("terminal:stdout", &line);
            }
        });
    }

    // Stream stderr
    if let Some(stderr) = child.stderr.take() {
        let window_clone = window.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = window_clone.emit("terminal:stderr", &line);
            }
        });
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Wait failed: {}", e))?;

    Ok(status.code().unwrap_or(-1))
}

/// Kill a running process by PID.
#[tauri::command]
pub fn kill_process(pid: u32) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::process::Command as StdCommand;
        StdCommand::new("kill")
            .args(["-9", &pid.to_string()])
            .status()
            .map_err(|e| format!("Kill failed: {}", e))?;
    }
    Ok(())
}
