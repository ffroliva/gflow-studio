use rusqlite::Connection;
use serde::Serialize;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize)]
struct AssetDto {
    id: String,
    profile_name: String,
    flow_project_id: Option<String>,
    flow_media_id: String,
    kind: String,
    status: String,
    model: Option<String>,
    aspect_ratio: Option<String>,
    width: Option<i32>,
    height: Option<i32>,
    duration_seconds: Option<f64>,
    seed: Option<i64>,
    created_at: String,
    metadata_json: Option<String>,
}

#[derive(Serialize)]
struct CharacterDto {
    id: String,
    profile_name: String,
    flow_project_id: String,
    flow_character_id: String,
    display_name: String,
    voice: Option<String>,
    personality: Option<String>,
    thumbnail_media_id: Option<String>,
    created_at: String,
}

#[tauri::command]
fn fetch_assets(db_path: String) -> Result<Vec<AssetDto>, String> {
    let path = Path::new(&db_path);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let conn = Connection::open_with_flags(
        path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_URI,
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, profile_name, flow_project_id, flow_media_id, kind, status, model, \
             aspect_ratio, width, height, duration_seconds, seed, created_at, metadata_json \
             FROM assets ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AssetDto {
                id: row.get(0)?,
                profile_name: row.get(1)?,
                flow_project_id: row.get(2)?,
                flow_media_id: row.get(3)?,
                kind: row.get(4)?,
                status: row.get(5)?,
                model: row.get(6)?,
                aspect_ratio: row.get(7)?,
                width: row.get(8)?,
                height: row.get(9)?,
                duration_seconds: row.get(10)?,
                seed: row.get(11)?,
                created_at: row.get(12)?,
                metadata_json: row.get(13)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut assets = Vec::new();
    for row in rows {
        if let Ok(asset) = row {
            assets.push(asset);
        }
    }

    Ok(assets)
}

#[tauri::command]
fn fetch_characters(db_path: String) -> Result<Vec<CharacterDto>, String> {
    let path = Path::new(&db_path);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let conn = Connection::open_with_flags(
        path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_URI,
    )
    .map_err(|e| e.to_string())?;

    let table_exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='characters')",
            [],
            |r| r.get(0),
        )
        .unwrap_or(false);

    if !table_exists {
        return Ok(Vec::new());
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, profile_name, flow_project_id, flow_character_id, display_name, \
             voice, personality, thumbnail_media_id, created_at FROM characters ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(CharacterDto {
                id: row.get(0)?,
                profile_name: row.get(1)?,
                flow_project_id: row.get(2)?,
                flow_character_id: row.get(3)?,
                display_name: row.get(4)?,
                voice: row.get(5)?,
                personality: row.get(6)?,
                thumbnail_media_id: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut characters = Vec::new();
    for row in rows {
        if let Ok(char_dto) = row {
            characters.push(char_dto);
        }
    }

    Ok(characters)
}

#[tauri::command]
async fn get_daemon_status(base_url: String) -> Result<String, String> {
    let addr_str = base_url
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split('/')
        .next()
        .unwrap_or("127.0.0.1:8000");

    let addr = if !addr_str.contains(':') {
        format!("{}:80", addr_str)
    } else {
        addr_str.to_string()
    };

    match tokio::time::timeout(
        std::time::Duration::from_millis(1500),
        tokio::net::TcpStream::connect(&addr),
    )
    .await
    {
        Ok(Ok(_)) => Ok("online".to_string()),
        _ => Ok("offline".to_string()),
    }
}

#[tauri::command]
fn resolve_default_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let mut path = app.path().local_data_dir().map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    {
        path.push("ffroliva");
        path.push("gflow-cli");
    }
    #[cfg(not(target_os = "windows"))]
    {
        path.push("gflow-cli");
    }
    path.push("gflow.db");
    Ok(path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_assets,
            fetch_characters,
            get_daemon_status,
            resolve_default_db_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
