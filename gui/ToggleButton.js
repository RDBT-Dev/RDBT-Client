let { GuiUtils } = global.export

global.export.ToggleButton = class {
  constructor(name, value, onClick, parent, font) {
    this.name = name
    this.value = value
    this.parent = parent
    this.x = 100
    this.y = 100
    this.width = 100
    this.height = 14

    this.font = font

    this.colours = {
      text: -1,
      accent: -1,
      buttonBackground: -1,
      mouseOver: new java.awt.Color(31 / 255, 35 / 255, 41 / 255, 0.5),
    }

    this.mouseOver = false

    this.onClick = onClick
  }

  Draw(x, y, MouseX, MouseY) {
    if (this.colours.text === -1) return

    this.x = x
    this.y = y

    this.CheckMouseOver(MouseX, MouseY)

    this.font.drawString(this.name, this.x + 13, this.y, this.colours.text)
    if (this.mouseOver) GuiUtils.DropShadow(15, this.x, this.y, 9, 9, 0.5, 5)

    GuiUtils.DrawRoundedRect(this.value ? this.colours.accent : this.colours.buttonBackground, this.x, this.y, 9, 9, 3)
    if (this.mouseOver) GuiUtils.DrawRoundedRect(this.colours.mouseOver, this.x, this.y, 9, 9, 3)
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
  }

  MouseUp() {}
  KeyPress(char, keycode) {}
  Click() {
    if (this.mouseOver) {
      this.value = !this.value
      this.onClick(this.parent, this.name, this.value)
    }
  }
}
