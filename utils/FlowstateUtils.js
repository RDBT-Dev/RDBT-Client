let { chat } = global.export

class FlowstateUtilsClass {
  constructor() {
    this.countdown = 0
    this.flowstateBlocksBroken = 0

    let blockx = 0
    let blocky = 0
    let blockz = 0
    register("HitBlock", block => {
      if (block.type.name != "Bedrock") {
        blockx = block.x
        blocky = block.y
        blockz = block.z
      } else {
        blockx = blocky = blockz = 0
      }
    })

    register("PacketReceived", packet => {
      if (
        Player.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.enchantments &&
        "ultimate_flowstate" in Player.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.enchantments &&
        packet.func_179827_b().func_177958_n() == blockx &&
        packet.func_179827_b().func_177956_o() == blocky &&
        packet.func_179827_b().func_177952_p() == blockz &&
        (packet.func_180728_a() == "minecraft:air" || packet.func_180728_a() == "minecraft:bedrock")
      ) {
        this.countdown = 10
        this.flowstateBlocksBroken += 1
        if (this.flowstateBlocksBroken % 100 == 0) {
          chat.debugMessage("Current Flowstate: " + this.flowstateBlocksBroken)
        }
      }
    }).setFilteredClass(net.minecraft.network.play.server.S23PacketBlockChange)

    register("step", () => {
      if (this.countdown === 0) {
        if (this.flowstateBlocksBroken > 100) {
          chat.debugMessage(`Flowstate lost at ${this.flowstateBlocksBroken} blocks`)
        }
        this.flowstateBlocksBroken = 0
      }
      
      if (this.countdown > 0) this.countdown--
    }).setFps(1)
  }

  CurrentFlowstate() {
    return Math.min(600, this.flowstateBlocksBroken * 3)
  }
}

global.export.FlowstateUtils = new FlowstateUtilsClass()
