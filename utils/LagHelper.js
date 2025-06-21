let { TimeHelper } = global.export

class LagHelper {
  constructor() {
    this.lagTimer = new TimeHelper()
    this.LAG_THRESHOLD = 400

    register("packetReceived", () => this.lagTimer.reset()) // .setFilteredClass(net.minecraft.network.play.server.S03PacketTimeUpdate)
  }

  isLagging() {
    return this.lagTimer.hasReached(this.LAG_THRESHOLD)
  }
}

export default new LagHelper()
