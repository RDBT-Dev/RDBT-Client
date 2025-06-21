let powderTracker = {
  startTime: Date.now(),
  startAmount: 0,
  currentAmount: 0,
  gained: 0,
  isTracking: false,
}

register("command", () => {
  powderTracker.isTracking = !powderTracker.isTracking
  powderTracker.startTime = Date.now()
  powderTracker.startAmount = 0
  powderTracker.currentAmount = 0
  powderTracker.gained = 0
  ChatLib.chat("§b[Powder Tracker] " + (powderTracker.isTracking ? "§aEnabled" : "§cDisabled"))
}).setName("powdertracker")

register("step", () => {
  if (!powderTracker.isTracking) return
  let tabItems = TabList.getNames()
  tabItems.forEach(item => {
    if (item?.removeFormatting().startsWith(" Mithril:")) {
      const powderText = item.removeFormatting().replace(" Mithril:", "").trim()
      const powderAmount = parseInt(powderText.replace(/,/g, ""))

      if (!isNaN(powderAmount)) {
        if (powderTracker.startAmount === 0) {
          powderTracker.startAmount = powderAmount
          powderTracker.currentAmount = powderAmount
          ChatLib.chat("§b[Powder Tracker] §eInitial Mithril powder: §a" + powderAmount.toLocaleString())
        } else if (powderAmount > powderTracker.currentAmount) {
          const gained = powderAmount - powderTracker.currentAmount
          powderTracker.gained += gained
          powderTracker.currentAmount = powderAmount

          const timeElapsed = (Date.now() - powderTracker.startTime) / 3600000 // hours
          const hourlyRate = timeElapsed > 0 ? powderTracker.gained / timeElapsed : 0

          ChatLib.chat("§b[Powder Tracker] §e+" + gained + " Mithril powder §7(" + hourlyRate.toFixed(0) + "/hr)")
        } else if (powderAmount !== powderTracker.currentAmount) {
          powderTracker.currentAmount = powderAmount
        }
      }
    }
  })
}).setDelay(15)
