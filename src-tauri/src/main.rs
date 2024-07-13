// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use notify::{Event, Watcher};
use notify_debouncer_full::new_debouncer;
use serde::{self, Deserialize};
use serde_json;
use std::{
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::Manager;

#[derive(Debug, Deserialize)]
struct WatchPathPayload {
    path: PathBuf,
}

fn main() {
    let app = tauri::Builder::default()
        .setup(move |_app| Ok(()))
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    let handle = app.handle();
    let mut watcher = Arc::new(Mutex::new(
        notify::recommended_watcher(move |res| match res {
            Ok(event) => {
                println!("file event {:?}", event);
                handle.emit_all::<Event>("file-event", event).unwrap();
            }
            Err(e) => println!("watch error: {:?}", e),
        })
        .unwrap(),
    ));

    app.listen_global("watch-path", move |event| {
        let payload = event.payload().unwrap();
        let payload =
            serde_json::from_str::<WatchPathPayload>(payload).expect("Unable to decode payload");

        println!("payload: {:?}", payload);
        println!("watching {:?}", payload.path);

        watcher
            .lock()
            .unwrap()
            .watch(&payload.path, notify::RecursiveMode::Recursive)
            .unwrap();
    });

    app.run(|_app_handle, event| {});
}
