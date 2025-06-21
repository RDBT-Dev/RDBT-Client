let { GuiUtils } = global.export

global.export.ModuleButton = class {
  constructor(ID, onClick, font_15, font_15_5, font_19, font_19_5, onRightClick) {
    this.ID = ID

    this.font_15 = font_15
    this.font_15_5 = font_15_5
    this.font = font_19
    this.font_19 = font_19
    this.font_19_5 = font_19_5
    this.font_bold = font_19_5

    this.colours = {
      text: -1,
      accent: -1,
    }

    this.width = 0
    this.x = 0
    this.y = 0

    this.mouseOver = false

    this.selected = false

    this.interractTimestamp = 0

    this.onClick = onClick
    this.onRightClick =
      onRightClick ||
      (() => {
        ChatLib.command(`togglemodule ${this.ID}`, true)
      })
  }

  Draw(x, y, w, MouseX, MouseY) {
    if (this.colours.text === -1) return

    if (this.font_19_5.getWidth(this.ID) > w - 20) {
      this.font_bold = this.font_15_5

      this.font = this.font_15
    } else {
      this.font_bold = this.font_19_5

      this.font = this.font_19
    }

    this.x = x
    this.y = y
    this.width = w

    this.CheckMouseOver(MouseX, MouseY)
    let font = this.mouseOver ? this.font_bold : this.font

    const color = this.selected ? this.colours.accent : this.colours.text
    font.drawString(this.ID, this.x + this.width / 2 - font.getWidth(this.ID) / 2, this.y + this.GetHeight() / 2 - font.getHeight(this.ID) / 2, color)

    let h = this.GetHeight() - 5

    if (this.selected) {
      let barWidth = Math.min(this.Ease((Date.now() - this.interractTimestamp) / 250) * h, h)
      GuiUtils.DrawRoundedRect(this.colours.accent, this.x + this.width - 1, this.y + this.GetHeight() / 2 - barWidth / 2, 1, barWidth, 1)
    } else {
      let barWidth = h - Math.min(this.Ease((Date.now() - this.interractTimestamp) / 250) * h, h)
      GuiUtils.DrawRoundedRect(this.colours.accent, this.x + this.width - 1, this.y + this.GetHeight() / 2 - barWidth / 2, 1, barWidth, 1)
    }
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.GetHeight()
  }

  GetHeight() {
    return 20
  }

  Click(btn) {
    if (this.mouseOver) {
      if (btn === 0 && !this.selected) {
        // Left click
        this.interractTimestamp = Date.now()
        this.onClick()
        this.selected = true
      } else if (btn === 1) {
        // Right click
        this.onRightClick()
      }
    }
  }

  Ease(t) {
    return t * (((1 - t) * t) ** 2) + t ** 3;
  }

  GetID() {
    return this.ID
  }
}
