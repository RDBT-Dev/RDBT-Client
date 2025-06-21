let { Rotations, MathUtils } = global.export

class powderRotations {
  constructor() {
    this.rotate = false
    this.phase = 0
    this.fullRotation = 2 * Math.PI
    this.amplitude = {
      yaw: 20.0,
      pitch: 10.0,
    }
    this.center = {
      yaw: 0.0,
      pitch: 10.0,
      amplitudeYaw: 20.0,
      amplitudePitch: 10.0,
      ms: 500,
    }
    this.centers = []
    this.startPhase = Date.now()
    this.smoothedToStart = false
    this.clockWise = true
    this.index = 0
    this.easers = [this.ease3, this.ease2, this.ease1]
    this.easer = this.easers[0]
    this.random = {
      delay: 300,
      pitch: 0,
      yaw: 0,
    }
    this.previousYaw = 0.0
    this.previousPitch = 0.0
    register("renderWorld", () => {
      if (!this.rotate) return

      if (this.distanceToCenter(this.center.yaw, this.center.pitch + this.center.amplitudePitch) > 2.0 && !this.smoothedToStart) {
        if (!Rotations.rotate) Rotations.rotateToAngles(this.center.yaw, this.center.pitch + this.center.amplitudePitch)
        return
      } else {
        if (!this.smoothedToStart) {
          this.startPhase = Date.now()
          this.previousYaw = this.center.yaw
          this.previousPitch = this.center.pitch + this.center.amplitudePitch
        }
        this.smoothedToStart = true
        if (Rotations.rotate) Rotations.stopRotate()
      }

      if (this.phase >= this.fullRotation || this.phase <= -this.fullRotation) {
        this.index = this.index === 0 ? 1 : 0
        this.center = this.centers[this.index]
        this.phase = 0
        this.startPhase = Date.now()
        this.easer = this.easers[Math.floor(Math.random() * 3)]
        this.random = {
          delay: Math.random() * 300,
          pitch: Math.random() * 3,
          yaw: Math.random() * 3,
        }
      }

      this.phase = (this.clockWise ? -1 : 1) * this.easer((Date.now() - this.startPhase) / (this.center.ms + this.random.delay)) * 2 * Math.PI

      let pitch = Math.cos(this.phase) * this.center.amplitudePitch + this.center.pitch + this.random.pitch
      let yaw = Math.sin(this.phase) * this.center.amplitudeYaw + this.center.yaw + this.random.yaw
      const appliedSense = Rotations.applySensitivity({
        yaw: Player.getPlayer().field_70177_z + yaw - this.previousYaw,
        pitch: Player.getPlayer().field_70125_A + pitch - this.previousPitch,
      })
      Player.getPlayer().field_70177_z = appliedSense.yaw
      Player.getPlayer().field_70125_A = appliedSense.pitch
      this.previousYaw = yaw
      this.previousPitch = pitch
    })

    register("command", x => {
      if (!this.rotate) this.start(parseInt(x.toString()))
      else this.stop()
    }).setName("circle")

    register("worldUnload", () => {
      this.rotate = false
    })
  }

  start(yaw) {
    this.rotate = true
    this.setCenters(yaw, 10.0, 35.0, 10.0, 500, yaw, 0.0, 35.0, 20.0, 600)
    this.center = this.centers[0]
    this.startPhase = Date.now()
    this.smoothedToStart = false
    this.index = 0
  }

  stop() {
    this.rotate = false
  }

  distanceToCenter(yaw, pitch) {
    return Math.abs(Player.getPlayer().field_70177_z - this.getOptimalYaw(yaw)) + Math.abs(Player.getPlayer().field_70125_A - pitch)
  }

  getOptimalYaw(yaw) {
    let playerYaw = Player.getPlayer().field_70177_z
    if (Math.abs(playerYaw - yaw) < 180) return yaw
    let adjustYaw = playerYaw < yaw ? -360 : 360
    for (let i = 1; i <= 10000; i++) {
      let newYaw = yaw + i * adjustYaw
      if (Math.abs(playerYaw - newYaw) < 180) return newYaw
    }
    return null
  }

  trimPhase() {
    this.phase -= this.fullRotation
  }

  setCenters(yaw1, pitch1, amplitudeYaw1, amplitudePitch1, ms1, yaw2, pitch2, amplitudeYaw2, amplitudePitch2, ms2) {
    this.centers = [
      {
        yaw: yaw1,
        pitch: pitch1,
        amplitudeYaw: amplitudeYaw1,
        amplitudePitch: amplitudePitch1,
        ms: ms1,
      },
      {
        yaw: yaw2,
        pitch: pitch2,
        amplitudeYaw: amplitudeYaw2,
        amplitudePitch: amplitudePitch2,
        ms: ms2,
      },
    ]
  }

  ease1(t) {
    return 1.0 * Math.pow(1 - t, 2) * t + 2.0 * (1 - t) * Math.pow(t, 2) + Math.pow(t, 3)
  }

  ease2(t) {
    return 1.63 * Math.pow(1 - t, 2) * t + 2.27 * (1 - t) * Math.pow(t, 2) + Math.pow(t, 3)
  }

  ease3(t) {
    return 1.3 * Math.pow(1 - t, 2) * t + 1.7 * (1 - t) * Math.pow(t, 2) + Math.pow(t, 3)
  }
}

global.export.PowderRotations = new powderRotations()
