let { File, chat } = global.export

let configName = "RdbtConfigV4"
function existsFile(configName, FileName) {
  return FileLib.exists(configName, FileName)
}

function deleteFile(configName, FileName) {
  FileLib.delete(configName, FileName)
}

function fileBroken(configName, FileName) {
  let config = FileLib.read(configName, FileName)
  if (FileName === "responseMessages.txt") {
    return 
  }
  try {
    JSON.parse(config)
  } catch (error) {
    chat.message("Replaced corrupted file: " + FileName)
    deleteFile(configName, FileName)
    return true
  }
  return false
}

function makeDir(Name) {
  let dir = new File("./config/ChatTriggers/modules/" + configName, Name)
  dir.mkdir()
}

function makeFile(Path, Content) {
  FileLib.append(configName, Path, Content)
}

// Makes the base folder
if (!existsFile("./config/ChatTriggers/modules", configName)) {
  let dir = new File("./config/ChatTriggers/modules/", configName)
  dir.mkdir()
}

let Files = [
  // Base Files
  {
    path: "rdbtconfig.json",
    FileType: "file",
    Content: [],
  },
  {
    path: "keybinds.json",
    FileType: "file",
    Content: [],
  },
  {
    path: "dev.json",
    FileType: "file",
    Content: [],
  },
  {
    path: "webhook.json",
    FileType: "file",
    Content: [],
  },
  {
    path: "responseMessages.txt",
    FileType: "text",
    Content: [
      "???",
      "bro wtf",
      "what",
      "rly",
      "hmmmm",
      "bro",
      "?",
      "hello??",
      "lol",
      "nice bro",
      "...",
      "omg",
      "pls",
      "lmfao",
      "idiot",
      "wtf",
      "really",
      "bruh"
    ],
  },

  // Routes

  {
    path: "gemstoneroutes",
    FileType: "dir",
  },
  { path: "gemstoneroutes/custom1.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom2.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom3.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom4.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom5.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom6.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom7.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom8.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom9.txt", FileType: "file", Content: [] },
  { path: "gemstoneroutes/custom10.txt", FileType: "file", Content: [] },

  {
    path: "routewalkerroutes",
    FileType: "dir",
  },
  { path: "routewalkerroutes/custom1.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom2.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom3.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom4.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom5.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom6.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom7.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom8.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom9.txt", FileType: "file", Content: [] },
  { path: "routewalkerroutes/custom10.txt", FileType: "file", Content: [] },

  {
    path: "tunnelroutes",
    FileType: "dir",
  },
  { path: "tunnelroutes/custom1.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom2.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom3.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom4.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom5.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom6.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom7.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom8.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom9.txt", FileType: "file", Content: [] },
  { path: "tunnelroutes/custom10.txt", FileType: "file", Content: [] },

  {
    path: "oreroutes",
    FileType: "dir",
  },
  { path: "oreroutes/custom1.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom2.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom3.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom4.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom5.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom6.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom7.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom8.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom9.txt", FileType: "file", Content: [] },
  { path: "oreroutes/custom10.txt", FileType: "file", Content: [] },

  {
    path: "etherwarperoutes",
    FileType: "dir",
  },
  { path: "etherwarperoutes/custom1.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom2.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom3.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom4.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom5.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom6.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom7.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom8.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom9.txt", FileType: "file", Content: [] },
  { path: "etherwarperoutes/custom10.txt", FileType: "file", Content: [] },

  // Mining Speed
  {path: "miningspeed.json", FileType: "file", Content: {}},

  // GUI Config

  { path: "themes", FileType: "dir" },
  {
    path: "themes/sapphire.json",
    FileType: "file",
    Content: { name: "Sapphire", author: "Farlow", colours: { panel: -15526631, box: -15724013, background: -15987185, selection: -14736599, logo: -12394251, text: -1, accent: -12394251, buttonBackground: -15066080 } },
  },
  {
    path: "themes/amber.json",
    FileType: "file",
    Content: { name: "Amber", author: "Farlow", colours: { panel: -14935012, box: -15132391, background: -15066598, selection: -8289919, logo: -1, text: -1, accent: -23782, buttonBackground: -15066080 } },
  },
  {
    path: "themes/ruby.json",
    FileType: "file",
    Content: { name: "Ruby", author: "Farlow", colours: { panel: -15526631, box: -15724013, background: -15987185, selection: -14736599, logo: -1291694, text: -1, accent: -1291694, buttonBackground: -15066080 } },
  },
  {
    path: "themes/opal.json",
    FileType: "file",
    Content: { name: "Opal", author: "Farlow", colours: { panel: -15526631, box: -15724013, background: -15987185, selection: -14736599, logo: -1, text: -1, accent: -1, buttonBackground: -15066080 } },
  },
  {
    path: "themes/gunmetal-azure.json",
    FileType: "file",
    Content: { name: "Gunmetal Azure", author: "Farlow", colours: { panel: -14075835, box: -14338751, background: -14603208, selection: -14736599, logo: -6627841, text: -6630180, accent: -10718998, buttonBackground: -15066080 } },
  },
  {
    path: "themes/classic.json",
    FileType: "file",
    Content: { name: "Classic", author: "Farlow", colours: { panel: 3223857, box: 2302755, background: 2302755, selection: 986895, logo: 16379097, text: -1, accent: 4366591, buttonBackground: 986895 } },
  },
  {
    path: "themes/CatppucinMocha.json",
    FileType: "file",
    Content: { name: "CatppucinMocha", author: "Lechatoki", colours: { panel: -14803411, box: -14803411, background: -14803411, selection: -4539407, logo: -3747595, text: -4931842, accent: -7558418, buttonBackground: -9209452 } },
  },
  {
    path: "themes/MochaContrast.json",
    FileType: "file",
    Content: { name: "Mocha Contrast", author: "Rdbt", colours: { panel: -14803411, box: -15132378, background: -15132378, selection: -3484929, logo: -1, text: -1, accent: -4408065, buttonBackground: -12630427 } },
  },

  {
    path: "theme.json",
    FileType: "file",
    Content: { name: "Sapphire", author: "Farlow", colours: { panel: -15526631, box: -15724013, background: -15987185, selection: -14736599, logo: -12394251, text: -1, accent: -12394251, buttonBackground: -15066080 } },
  },
  {
    path: "guiconfig.json",
    FileType: "file",
    Content: {
      editor: { themes: { customPos: true, x: 0.5583333333333333, y: 0.3227722772277228 }, editor: { customPos: true, x: 0.1114583333333334, y: 0.3 } },
      main: { customPos: true, x: 0.1907291666666667, y: 0.11089108910891089 },
      hud: {},
    },
  },
]

// Handles all the extra files
Files.forEach(FileData => {
  if (!existsFile(configName, FileData.path) || fileBroken(configName, FileData.path)) {
    if (FileData.FileType === "file") {
      makeFile(FileData.path, JSON.stringify(FileData.Content, null, 2))
    }
    if (FileData.FileType === "text") {
      makeFile(FileData.path, FileData.Content.join("\n"))
    }
    if (FileData.FileType === "dir") {
      makeDir(FileData.path)
    }
  }
})
