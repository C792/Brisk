// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusty_ytdl::Video;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

const CONFIG_PATH: &str = "./config/current.json";
const DATA_PATH: &str = "./config/data.json";

#[tauri::command]
async fn init() -> String {
    // Create config file if it doesn't exist with default values
    if !std::path::Path::new("./config").exists() {
        std::fs::create_dir("./config").unwrap();
    }
    if !std::path::Path::new(DATA_PATH).exists() {
        let default = r#"{
    "songcount": 1,
    "songs": [

    ],
    "playlists": [
        {
            "title": "Default",
            "songs": [
                0
            ]
        }
    ]
}"#;
        std::fs::write(DATA_PATH, default).unwrap();
    }
    if !std::path::Path::new("./audio").exists() {
        std::fs::create_dir("./audio").unwrap();
        download("https://www.youtube.com/watch?v=QDUv_8Dw-Mw".to_string(), "Tada".to_string()).await;
    }

    if !std::path::Path::new(CONFIG_PATH).exists() {
        let default = r#"{
    "playlistidx": 0,
    "songidx": 0,
    "loop": 0,
    "shuffle": 0,
    "timestamp": "00:00"
}"#;
        std::fs::write(CONFIG_PATH, default).unwrap();
    }
    println!("Initialized");
    // print current path
    println!("Current path: {}", std::env::current_dir().unwrap().display());
    return std::env::current_dir().unwrap().display().to_string();
}


#[tauri::command]
fn save(key: String, data: String) -> Result<(), String> {
// fn autosave(key: String, data: String) {
    let mut map = match std::fs::read_to_string(CONFIG_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    map.insert(key, serde_json::Value::String(data));
    let json = serde_json::to_string_pretty(&map).unwrap();
    let res = std::fs::write(CONFIG_PATH, json).map_err(|e| e.to_string());
    return res;
}

#[tauri::command]
fn save_song(title: String, src: String, link: String, volume: f32) {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let songs = map["songs"].as_array_mut().unwrap();
    songs.push(serde_json::json!({
        "title": title,
        "src": src,
        "link": link,
        "volume": volume
    }));
    let songcount = songs.len();
    map.insert("songcount".to_string(), songcount.into());
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn get_songs() -> String {
    let map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let songs = map["songs"].as_array().unwrap();
    let mut song_titles = Vec::new();
    for song in songs {
        let title = song["title"].as_str().unwrap();
        song_titles.push(title);
    }
    let song_titles = song_titles.join("@].$/");
    return song_titles;
}

fn get_songcount() -> usize {
    let map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let songcount = map["songcount"].as_u64().unwrap();
    return songcount as usize;
}

#[tauri::command]
fn get_playlist() -> String {
    let map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array().unwrap();
    let mut playlist_titles = Vec::new();
    for playlist in playlists {
        let title = playlist["title"].as_str().unwrap();
        playlist_titles.push(title);
    }
    let playlist_titles = playlist_titles.join("@].$/");
    return playlist_titles;
}


#[tauri::command]
fn save_playlist_init() {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array_mut().unwrap();
    let playlist = playlists[0].as_object_mut().unwrap();
    let songs = playlist["songs"].as_array_mut().unwrap();
    let songcount = get_songcount();
    songs.push(songcount.into());
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn add_playlist(song_idx: usize, title: String) {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array_mut().unwrap();
    playlists.push(serde_json::json!({
        "title": title,
        "songs": [song_idx]
    }));
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn delete_playlist(playlist_idx: usize) {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array_mut().unwrap();
    playlists.remove(playlist_idx);
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn playlist_append(playlist_idx: usize, song_idx: usize) {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array_mut().unwrap();
    let playlist = playlists[playlist_idx].as_object_mut().unwrap();
    let songs = playlist["songs"].as_array_mut().unwrap();
    songs.push(song_idx.into());
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn playlist_pop(plidx: usize, sidx: usize) {
    let mut map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array_mut().unwrap();
    let playlist = playlists[plidx].as_object_mut().unwrap();
    let songs = playlist["songs"].as_array_mut().unwrap();
    songs.remove(sidx);
    let json = serde_json::to_string_pretty(&map).unwrap();
    std::fs::write(DATA_PATH, json).unwrap();
}

#[tauri::command]
fn plsongs(plidx: usize) -> String {
    let map = match std::fs::read_to_string(DATA_PATH) {
        Ok(file) => serde_json::from_str(&file).unwrap(),
        Err(_) => serde_json::Map::new(),
    };
    let playlists = map["playlists"].as_array().unwrap();
    let playlist = playlists[plidx].as_object().unwrap();
    let songs = playlist["songs"].as_array().unwrap();
    let mut song_titles = Vec::new();
    for song in songs {
        let title = song.as_u64().unwrap();
        song_titles.push(title.to_string());
    }
    let ret = song_titles.join("@].$/");
    return ret;
}

#[tauri::command]
fn readcurrent() -> Result<String, String> {
    return std::fs::read_to_string(CONFIG_PATH).map_err(|e| e.to_string());
}

#[tauri::command]
fn readdata() -> Result<String, String> {
    return std::fs::read_to_string(DATA_PATH).map_err(|e| e.to_string());
}

#[tauri::command]
async fn download(url_video: String, title: String) -> String {
    let video = Video::new(url_video.clone()).unwrap();
    // check title and if none, use video title
    let mut ctitle = title.clone();
    if title == "" {
        ctitle = video.get_info().await.unwrap().video_details.title;
    }
    let path = std::path::Path::new("./audio/").join(ctitle.clone() + ".mp3");
    video.download(path.clone()).await.unwrap();
    let abs = std::env::current_dir().unwrap().display().to_string().replace("\\","/") + "/audio/" + &ctitle + ".mp3";
    println!("Downloading to {:?}", abs.clone());
    save_song(ctitle.clone(), abs.clone(), url_video.clone(), 1.0);
    return abs.clone();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![init, save, readcurrent, readdata, download, save_song, get_songs, save_playlist_init, add_playlist, get_playlist, delete_playlist, playlist_append, plsongs, playlist_pop])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
