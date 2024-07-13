import { fs, path, event } from "@tauri-apps/api";
import { platform } from "@tauri-apps/api/os";
import { ReadSaveFile } from "./LoadSaveFile";

let selectedFile = null;

/**
 * Called on page init when running within tauri
 */
export async function init() {
  document.querySelectorAll(".hide-tauri").forEach((e) => e.remove());

  await initListeners();
  await initTauriSavelist();
}

async function initListeners() {
  let timeout;
  
  event.listen("file-event", (event) => {
    if (event.payload.type.modify && event.payload.paths[0] == selectedFile) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      timeout = setTimeout(() => {
        readSelectedFile();
      }, 100);
    }
  });
}

async function initTauriSavelist() {
  const savelistContainer = document.getElementById("tauri-savelist-container");
  const savelist = document.getElementById("tauri-savelist");

  savelistContainer.classList.remove("hidden");
  savelist.addEventListener("change", onSaveSelected);

  const saveDirectory = await platformSaveDirectory();

  // await invoke("watch_file", { path: saveDirectory });
  event.emit("watch-path", { path: saveDirectory });
  const saveFiles = (await fs.readDir(saveDirectory)).filter((f) =>
    f.name.endsWith(".dat")
  );

  saveFiles.forEach(({ path, name }) => {
    const option = document.createElement("option");
    option.value = path;
    option.innerText = name;
    savelist.appendChild(option);
  });
}

async function onSaveSelected(e) {
  selectedFile = e.target.value;

  await readSelectedFile();
}

async function readSelectedFile() {
  const contents = await fs.readBinaryFile(selectedFile);

  ReadSaveFile(contents);
}

async function platformSaveDirectory() {
  switch (await platform()) {
    case "win32":
      return await path.resolve(
        await path.dataDir(),
        "..",
        "LocalLow",
        "Team Cherry",
        "Hollow Knight"
      );

    case "linux":
      return await path.resolve(
        await path.configDir(),
        "unity3d",
        "Team Cherry",
        "Hollow Knight"
      );

    case "darwin":
      return await path.resolve(
        await path.dataDir(),
        "unity.Team Cherry.Hollow Knight"
      );
  }
}
