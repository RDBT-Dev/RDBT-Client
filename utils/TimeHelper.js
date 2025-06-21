class timeHelper {
  constructor() {
    this.StartTime = Date.now()

    this.isPaused = false
    this.pauseTime = null

    this.randomTime = 0
  }

  hasReached(Time) {
    if (Date.now() - this.StartTime > Time) {
      return true
    }
    return false
  }

  setHasReached() {
    this.StartTime = 0
  }

  reset() {
    this.StartTime = Date.now()
    this.isPaused = false
    this.pauseTime = null
  }

  getTime() {
    return this.StartTime
  }

  setTime(Time) {
    this.StartTime = Time
  }

  getTimePassed() {
    const currentTime = Date.now()

    let dt = currentTime - this.StartTime
    if (this.isPaused) dt += currentTime - this.pauseTime

    return dt
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true
      this.pauseTime = Date.now()
    }
  }

  unpause() {
    if (this.isPaused) {
      this.isPaused = false

      this.StartTime += Date.now() - this.pauseTime
      this.pauseTime = null
    }
  }

  setRandomReached(min, max) {
    this.randomTime = max - Math.round(Math.random() * min)
  }

  reachedRandom() {
    return Date.now() - this.StartTime > this.randomTime
  }
}
global.export.TimeHelper = timeHelper
