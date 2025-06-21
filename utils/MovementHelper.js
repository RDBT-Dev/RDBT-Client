let { KeyBinding, TimeHelper, mc, Utils } = global.export

class movementHelper {
  constructor() {
    this.cooldown = new TimeHelper()
  }

  setKey(key, down) {
    if (Client.isInGui() && !Client.isInChat()) return
    if (key === "a") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74370_x.func_151463_i(), down)
    }
    if (key === "d") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74366_z.func_151463_i(), down)
    }
    if (key === "s") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74368_y.func_151463_i(), down)
    }
    if (key === "w") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74351_w.func_151463_i(), down)
    }
    if (key === "space") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74314_A.func_151463_i(), down)
    }
    if (key === "shift") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74311_E.func_151463_i(), down)
    }
    if (key === "leftclick") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_74312_F.func_151463_i(), down)
    }
    if (key === "sprint") {
      KeyBinding.func_74510_a(mc.field_71474_y.field_151444_V.func_151463_i(), down)
    }
  }

  isKeyDown(key) {
    if (key === "a") {
      return mc.field_71474_y.field_74370_x.func_151470_d()
    }
    if (key === "d") {
      return mc.field_71474_y.field_74366_z.func_151470_d()
    }
    if (key === "s") {
      return mc.field_71474_y.field_74368_y.func_151470_d()
    }
    if (key === "w") {
      return mc.field_71474_y.field_74351_w.func_151470_d()
    }
    if (key === "space") {
      return mc.field_71474_y.field_74314_A.func_151470_d()
    }
    if (key === "shift") {
      return mc.field_71474_y.field_74311_E.func_151470_d()
    }
    if (key === "leftclick") {
      return mc.field_71474_y.field_74312_F.func_151470_d()
    }
    if (key === "sprint") {
      return mc.field_71474_y.field_151444_V.func_151470_d()
    }
  }

  setKeysBasedOnYaw(yaw, jump = true) {
    this.stopMovement()
    if (Client.isInGui() && !Client.isInChat()) return
    if (yaw >= -50.0 && yaw <= 50.0) {
      this.setKey("w", true)
    }
    if (yaw >= -135.5 && yaw <= -7.0) {
      this.setKey("a", true)
    }
    if (yaw >= 7.0 && yaw <= 135.5) {
      this.setKey("d", true)
    }
    if (yaw <= -135.5 || yaw >= 135.5) {
      this.setKey("s", true)
    }
    this.setKey("space", Math.abs(Player.getMotionX()) + Math.abs(Player.getMotionZ()) < 0.03 && this.cooldown.hasReached(250) && jump && Utils.playerIsCollided())
  }

  setKeysBasedOnYawTemp(yaw, jump = true) {
    this.stopMovement()
    if (Client.isInGui() && !Client.isInChat()) return
    if (yaw >= -50.0 && yaw <= 50.0) {
      this.setKey("w", true)
    }
    if (yaw >= -135.5 && yaw <= -40.0) {
      this.setKey("a", true)
    }
    if (yaw >= 40.0 && yaw <= 135.5) {
      this.setKey("d", true)
    }
    if (yaw <= -135.5 || yaw >= 135.5) {
      this.setKey("s", true)
    }
    this.setKey("space", Math.abs(Player.getMotionX()) + Math.abs(Player.getMotionZ()) < 0.02 && this.cooldown.hasReached(500) && jump && Utils.playerIsCollided())
  }

  setKeysForStraightLine(yaw, jump = true) {
    this.stopMovement()
    if (Client.isInGui() && !Client.isInChat()) return
    if (22.5 > yaw && yaw > -22.5) {
      // Forwards
      this.setKey("w", true)
    } else if (-22.5 > yaw && yaw > -67.5) {
      // Forwards+Right
      this.setKey("w", true)
      this.setKey("a", true)
    } else if (-67.5 > yaw && yaw > -112.5) {
      // Right
      this.setKey("a", true)
    } else if (-112.5 > yaw && yaw > -157.5) {
      // Backwards + Right
      this.setKey("a", true)
      this.setKey("s", true)
    } else if ((-157.5 > yaw && yaw > -180) || (180 > yaw && yaw > 157.5)) {
      // Backwards
      this.setKey("s", true)
    } else if (67.5 > yaw && yaw > 22.5) {
      // Forwards + Left
      this.setKey("w", true)
      this.setKey("d", true)
    } else if (112.5 > yaw && yaw > 67.5) {
      // Left
      this.setKey("d", true)
    } else if (157.5 > yaw && yaw > 112.5) {
      // Backwards+Left
      this.setKey("s", true)
      this.setKey("d", true)
    }
    this.setKey("space", Player.asPlayerMP().isInWater() || (Math.abs(Player.getMotionX()) + Math.abs(Player.getMotionZ()) < 0.02 && this.cooldown.hasReached(500) && jump && Utils.playerIsCollided()))
  }

  setCooldown() {
    this.cooldown.reset()
  }

  stopMovement() {
    this.setKey("a", false)
    this.setKey("s", false)
    this.setKey("d", false)
    this.setKey("w", false)
    this.setKey("space", false)
  }

  unpressKeys() {
    this.stopMovement()
    this.setKey("shift", false)
  }
}

global.export.MovementHelper = new movementHelper()
