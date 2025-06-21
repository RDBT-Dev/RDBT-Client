let {  chat, InventoryUtils } = global.export
let configFolder = "RdbtConfigV4"
let keybindFile = "keybinds.json"

// Constants for keybind descriptions and locations
const KEYBIND_DESCRIPTIONS = {
  GEMSTONE: { description: "Gemstone Macro", location: "Rdbt Client v4 - Mining", shortname: "gemstone" },
  ORE: { description: "Ore Macro", location: "Rdbt Client v4 - Mining", shortname: "ore" },
  MINING_BOT: { description: "Mining Bot", location: "Rdbt Client v4 - Mining", shortname: "miningbot" },
  COMMISSION: { description: "Commission Macro", location: "Rdbt Client v4 - Mining", shortname: "comms" },
  SCATHA: { description: "Scatha Macro", location: "Rdbt Client v4 - Mining", shortname: "scatha" },
  EXCAVATOR: { description: "Excavator Macro", location: "Rdbt Client v4 - Mining", shortname: "excavator" },
  NUKER: { description: "Nuker", location: "Rdbt Client v4 - Mining", shortname: "nuker" },
  //POWDERNUKER: { description: "Powder Nuker", location: "Rdbt Client v4 - Mining", shortname: "powder" },
  HOPPITY: { description: "Hoppity Macro", location: "Rdbt Client v4 - Misc", shortname: "hoppity" },
  LOBBY_HOPPER: { description: "Lobby Hopper", location: "Rdbt Client v4 - Misc", shortname: "lobbyhop" },
  GHOST_BLOCKS: { description: "Ghost Blocks", location: "Rdbt Client v4 - Misc", shortname: "ghostblocks" },
  ROUTE_WALKER: { description: "Route Walker", location: "Rdbt Client v4 - Misc", shortname: "routewalker" },
  ETHERWARP: { description: "Etherwarper", location: "Rdbt Client v4 - Misc", shortname: "etherwarper" },
  FREECAM: { description: "Freecam", location: "Rdbt Client v4 - Render", shortname: "freecam" },
  CANCEL_RESPONSE: { description: "Cancel Response", location: "Rdbt Client v4 - Failsafes", keycode: Keyboard.KEY_F },
  FISHINGXPCHEESE: { description: "Fishing XP Cheese", location: "Rdbt Client v4 - Misc", shortname: "fish" },
  GLACITE: { description: "Glacite Commission Macro", location: "Rdbt Client v4 - Mining", shortname: "glacite" },
  //TUNNEL: { description: "Tunnel Miner", location: "Rdbt Client v4 - Mining", shortname: "tunnel" },
}

let Keys = Object.values(KEYBIND_DESCRIPTIONS)

function getKeys() {
  let config = FileLib.read(configFolder, keybindFile)
  return JSON.parse(config)
}

let Keybinds = []
function makeKeyBind(Description, KeyCode, Location) {
  Keybinds.push(new KeyBind(Description, KeyCode, Location))
}

function saveKeybinds(config) {
  let string = JSON.stringify(config, null, 2)
  FileLib.write(configFolder, keybindFile, string)
}

// Checks if the keybind is already in the config and creates the keybind by pushing it to a public Keybinds Array
let config = getKeys()
let newConfig = config
Keys.forEach(key => {
  let found = false
  for (let i = 0; i < config.length; i++) {
    if (key.description === config[i].description && key.location === config[i].location) {
      makeKeyBind(key.description, config[i].keycode ?? key.keycode ?? Keyboard.KEY_NONE, key.location)
      found = true
      break
    }
  }
  if (!found) {
    newConfig.push({ description: key.description, keycode: 0, location: key.location })
    makeKeyBind(key.description, 0, key.location)
  }
})

saveKeybinds(newConfig)

function updateKeys() {
  let newConfig = []
  Keybinds.forEach(Keybind => {
    newConfig.push({ description: Keybind.getDescription(), keycode: Keybind.getKeyCode(), location: Keybind.getCategory() })
  })
  saveKeybinds(newConfig)
}

register("step", () => {
  updateKeys()
}).setDelay(120)

let keybinds = []
let modules = []
/**
 * Returns the keybind given by name and location
 * @param {String} Description
 * @param {String} Location
 * @returns {KeyBind}
 */
global.settingSelection.getKeyBind = (Description, Location, module) => {
  for (let i = 0; i < Keybinds.length; i++) {
    let Keybind = Keybinds[i]
    if (Keybind.getDescription() === Description && Keybind.getCategory() === Location) {
      if (module) modules.push(module)
      keybinds.push(Keybind)
      UpdateBinds(Keybind)
      return Keybind
    }
  }
}

const safe_module_url = "https://gist.githubusercontent.com/rdbtCVS/abea81fae691ce5a07924d2bb3e85ff9/raw"

let safe_modules = []

const update_safe_modules = (callback = () => {}) => {
  try {
    safe_modules = JSON.parse(FileLib.getUrlContent(safe_module_url))
    callback()
  } catch (error) {
    console.warn(error)
  }
}
update_safe_modules()

register("step", () => {
  update_safe_modules(() => {})
}).setDelay(120)

function ToggleModule(name) {
  modules.forEach(module => {
    if (module.ModuleName === name) {
      module.toggle()
    }
  })
}

function UpdateBinds(keybind) {
  keybind.registerKeyPress(() => {
    ToggleModule(keybind.getDescription())
  })
}

// Command to toggle module by shortname or description
register("command", moduleName => {
  if (!moduleName) {
    const modulesByCategory = {}

    Keys.forEach(k => {
      if (!modulesByCategory[k.location]) {
        modulesByCategory[k.location] = []
      }

      const shortNameInfo = k.shortname ? ` (${k.shortname})` : ""
      modulesByCategory[k.location].push({
        name: k.description,
        shortname: k.shortname || k.description,
        displayText: `  §b${k.description}§r${shortNameInfo}`,
      })
    })

    ChatLib.chat("§6§lAvailable Modules:§r")

    Object.keys(modulesByCategory)
      .sort()
      .forEach(category => {
        ChatLib.chat(`\n§9§l${category}:§r`)

        modulesByCategory[category].forEach(module => {
          new TextComponent(module.displayText).setClick("run_command", `/togglemodule ${module.shortname}`).setHoverValue(`§eClick to toggle §b${module.name}`).chat()
        })
        ChatLib.chat("")
      })

    return
  }
  
  const input = moduleName.toLowerCase().replace(/ /g, "")

  // shortname
  let key = Keys.find(k => k.shortname && k.shortname.toLowerCase() === input)

  // description
  if (!key) {
    key = Keys.find(k => k.description && k.description.toLowerCase() === input)
  }

  // partial matching, includes description
  if (!key) {
    key = Keys.find(k => k.description && k.description.toLowerCase().includes(input))
  }

  if (key) {
    ToggleModule(key.description)
    InventoryUtils.closeInv()
  } else {
    global.export.chat.message("§cModule not found. Use /togglemodule to see available modules.")
  }
}).setName("togglemodule")
