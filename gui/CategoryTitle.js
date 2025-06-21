let { GuiUtils } = global.export

global.export.CategoryTitle = class {
  constructor(ID, onClick, font_20, font_20_5) {
    this.ID = ID
    this.font = font_20
    this.font_bold = font_20_5

    this.colours = {
      text: -1,
      accent: -1,
    }

    this.height = 0
    this.x = 0
    this.y = 0

    this.onClick = onClick
    this.selected = false

    this.interractTimestamp = 0

    this.mouseOver = false
  }

  Draw(x, y, h, MouseX, MouseY) {
    if (this.colours.text === -1) return
    this.x = x
    this.y = y
    this.height = h
    this.width = h
    this.currentMouseX = MouseX
    this.currentMouseY = MouseY

    this.CheckMouseOver(MouseX, MouseY)

    // if (this.selected) {
    //  let barWidth = Math.min(this.Ease((Date.now() - this.interractTimestamp) / 250) * this.GetWidth(), this.GetWidth())
    //   GuiUtils.DrawRoundedRect(this.colours.accent, this.x + this.GetWidth() / 2 - barWidth / 2, this.y + this.height - 1, barWidth, 1, 1)
    //  } else {
    //    let barWidth = this.GetWidth() - Math.min(this.Ease((Date.now() - this.interractTimestamp) / 250) * this.GetWidth(), this.GetWidth())
    //   GuiUtils.DrawRoundedRect(this.colours.accent, this.x + this.GetWidth() / 2 - barWidth / 2, this.y + this.height - 1, barWidth, 1, 1)
    //   }

    const font = this.mouseOver ? this.font_bold : this.font
    const textColor = this.selected ? this.colours.accent : this.colours.text
    const centeredX = this.x + h / 2 - font.getWidth(this.ID) / 2
    font.drawString(this.ID, centeredX, this.y + this.height / 2 - font.getHeight(this.ID) / 2, textColor)
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.GetWidth() && MouseY > this.y && MouseY < this.y + this.height
  }

  Click(btn) {
    const textActualWidth = this.font.getWidth(this.ID)
    const textActualHeight = this.font.getHeight(this.ID)

    const textDrawX = this.x + this.width / 2 - textActualWidth / 2
    const textDrawY = this.y + this.height / 2 - textActualHeight / 2

    if (this.currentMouseX >= textDrawX && this.currentMouseX <= textDrawX + textActualWidth && this.currentMouseY >= textDrawY && this.currentMouseY <= textDrawY + textActualHeight && btn === 0) {
      this.interractTimestamp = Date.now()
      this.onClick()
    }
  }

  GetWidth() {
    return this.font.getWidth(this.ID) + 20
  }
  GetHeight() {
    return this.font.getHeight(this.ID) + 1
  }
  GetID() {
    return this.ID
  }

  Ease(t) {
    return t * (((1 - t) * t) ** 2) + t ** 3;
  }
}
