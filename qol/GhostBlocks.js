let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { BP, S23PacketBlockChange, RaytraceUtils } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Ghost Blocks",
    "Extras",
    [new SettingToggle("Not removable", false), new SettingSelector("Ghost block type", 0, ["On press", "On hold", "On right click with stonk", "God mode"])],
    ["Creates air blocks across your crosshair"],
  ),
)
class GhostBlocks {
  constructor() {
    let ModuleName = "Ghost Blocks"

    /*
        List from fork private
    */
    const whitelist = ["minecraft:air", "minecraft:chest", "minecraft:trapped_chest", "minecraft:lever", "minecraft:hopper", "minecraft:skull"]
    let ghostedBlocks = []

    function ghostBlock(block) {
      if (block.getClass() === Block) {
        if (!whitelist.includes(block.type.getRegistryName())) {
          let pos = new BP(block.getX(), block.getY(), block.getZ())
          World.getWorld().func_175698_g(pos)
          ghostedBlocks.push(pos)
        }
      }
    }

    let Keybind = getKeyBind("Ghost Blocks", "Rdbt Client v4 - Misc")

    /*
        On press && God mode
    */
    Keybind.registerKeyPress(() => {
      if (ModuleManager.getSetting(ModuleName, "Ghost block type") === "On press") {
        ghostBlock(Player.lookingAt())
      }
    })

    /*
        on hold
    */
    Keybind.registerKeyDown(() => {
      if (ModuleManager.getSetting(ModuleName, "Ghost block type") === "On hold") {
        ghostBlock(Player.lookingAt())
      }
      if (ModuleManager.getSetting(ModuleName, "Ghost block type") === "God mode") {
        let Blocks = RaytraceUtils.rayTracePlayerBlocks(200)
        for (let i = 0; i < Blocks.length; i++) {
          let block = Blocks[i]
          ghostBlock(World.getBlockAt(block[0], block[1], block[2]))
        }
      }
    })

    // TODO look into because it looks a bit shit

    /*
        On right click with stonk
    */
    register("clicked", (x, y, b, d) => {
      if (ModuleManager.getSetting(ModuleName, "Ghost block type") === "On right click with stonk" && b === 1.0 && d === true && Player.getHeldItem()?.getName()?.toString()?.toLocaleLowerCase()?.includes("stonk")) {
        ghostBlock(Player.lookingAt())
      }
    })

    register("packetReceived", (Packet, Event) => {
      if (ghostedBlocks.toString().includes(Packet.func_179827_b().toString()) && ModuleManager.getSetting(ModuleName, "Not removeable")) {
        cancel(Event)
      }
    }).setFilteredClasses([S23PacketBlockChange])

    register("worldUnload", () => {
      ghostedBlocks = []
    })
  }
}

new GhostBlocks()
