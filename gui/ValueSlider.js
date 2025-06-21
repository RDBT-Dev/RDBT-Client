let { GuiUtils, EditableString } = global.export

global.export.ValueSlider = class {
  constructor(name, min, max, value, onClick, parent, font, font_15) {
    this.name = name
    this.min = min
    this.max = max
    this.parent = parent
    this.value = value
    this.onClick = onClick

    this.font = font
    this.font_15 = font_15

    this.value_text = new EditableString(this.value.toString(), this.max.toString().length + 1, new RegExp(/[0-9]/), this.font)

    this.colours = {
      text: -1,
      accent: -1,
      box: -1,
      buttonBackground: -1,
      mouseOver: new java.awt.Color(31 / 255, 35 / 255, 41 / 255, 0.5),
    }

    this.mouseOver = false

    this.x = 100
    this.y = 100
    this.width = 100
    this.height = 20

    this.barwidth = this.width - 30

    this.percent = 0

    this.dragging = false

    this.prevwidth = -1
  }

  Draw(x, y, mx, my) {
    if (this.colours.text === -1) return

    this.x = x
    this.y = y

    this.font.drawString(this.name, x, y, this.colours.text)
    this.barwidth = this.width - 30

    this.CalculateValue(mx)

    this.value_text.colours.box = this.colours.box
    this.value_text.colours.text = this.colours.text

    this.font_15.drawString(`${this.min} - ${this.max}`, x + this.barwidth - 10 - this.font_15.getWidth(`${this.min} - ${this.max}`), y, this.colours.text)
    this.value_text.Draw(x + this.width - this.font.getWidth(this.value.toString()) - 6, y, mx, my)

    this.percent = (this.value - this.min) / (this.max - this.min)

    this.CheckMouseOver(mx, my)

    if (this.mouseOver) GuiUtils.DropShadow(10, this.x, this.y + 11, this.barwidth, 2.5, 0.5, 5)

    GuiUtils.DrawRoundedRect(this.colours.buttonBackground, x, y + 11, this.barwidth, 2.5, 2)

    if (this.mouseOver) GuiUtils.DrawRoundedRect(this.colours.mouseOver, x, y + 11, this.barwidth, 2.5, 2)

    if (this.prevwidth === -1) this.prevwidth = this.barwidth * this.percent

    let w = this.barwidth * this.percent
    let nw = (w + this.prevwidth) / 2

    if (Math.abs(nw - w) < 3) nw = w
    GuiUtils.DrawRoundedRect(this.colours.accent, x, y + 11, nw, 2.5, 2)

    this.prevwidth = nw
  }

  CalculateValue(MouseX) {
    if (!this.dragging) return

    let barLeft = this.x
    let barRight = this.x + this.barwidth

    let w = barRight - barLeft

    let x = MouseX - barLeft
    x = Math.max(0, x)
    x = Math.min(w, x)

    let v = x / w

    v = Math.round(v * (this.max - this.min) + this.min)

    this.value = v

    this.value_text.text = this.value.toString()
    this.value_text.charArray = this.value.toString().split("")
    this.value_text.value = this.value.toString()
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.barwidth && MouseY > this.y && MouseY < this.y + this.height
  }

  SaveValue() {
    this.value = parseInt(this.value_text.value)

    if (this.value > this.max) {
      this.value = this.max
    }
    if (this.value < this.min) {
      this.value = this.min
    }

    this.value_text.text = this.value.toString()
    this.value_text.charArray = this.value.toString().split("")
    this.value_text.value = this.value.toString()

    this.onClick(this.parent, this.name, this.value)
  }

  KeyPress(char, keycode) {
    this.value_text.KeyPress(char, keycode)

    if (keycode === 28) this.SaveValue()
  }

  Click(btn) {
    let e = this.value_text.editing
    this.value_text.Click(btn)

    if (e && !this.value_text.editing) this.SaveValue()

    if (this.mouseOver) this.dragging = true
  }

  MouseUp() {
    if (this.dragging) {
      this.onClick(this.parent, this.name, this.value)
    }
    this.dragging = false
  }
}
