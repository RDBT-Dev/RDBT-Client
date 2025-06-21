class serverPlayer {
  constructor() {
    this.x = 0
    this.y = 0
    this.z = 0
    this.yaw = 0
    this.pitch = 0
    this.onGround = true
    register("packetSent", packet => {
      let className = packet.class.getSimpleName()
      if (className === "C04PacketPlayerPosition") {
        // x y z
        this.x = packet.func_149464_c()
        this.y = packet.func_149467_d()
        this.z = packet.func_149472_e()
        this.onGround = packet.func_149465_i()
      } else if (className === "C05PacketPlayerLook") {
        // yaw pitch
        this.pitch = packet.func_149470_h()
        this.yaw = packet.func_149462_g()
        this.onGround = packet.func_149465_i()
      } else if (className === "C06PacketPlayerPosLook") {
        // x y z yaw pitch
        this.x = packet.func_149464_c()
        this.y = packet.func_149467_d()
        this.z = packet.func_149472_e()
        this.pitch = packet.func_149470_h()
        this.yaw = packet.func_149462_g()
        this.onGround = packet.func_149465_i()
      }
    }).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer.class)
  }

  getX() {
    return this.x
  }

  getY() {
    return this.y
  }

  getZ() {
    return this.z
  }

  getYaw() {
    return this.yaw
  }

  getPitch() {
    return this.pitch
  }

  isOnGround() {
    return this.onGround
  }
}

global.export.ServerPlayer = new serverPlayer()
