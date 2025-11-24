// src-tauri/src/lib.rs
use tauri_plugin_sql; 

// FIX: Add this attribute
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build()) // <--- SQL
        .plugin(tauri_plugin_fs::init())                      // <--- FS
        .plugin(tauri_plugin_http::init())                    // <--- HTTP
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}