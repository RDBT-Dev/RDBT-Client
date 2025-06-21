let { GuiUtils } = global.export

global.export.EditableString = class {
  constructor(value, max, filter = new RegExp(/[a-zA-Z0-9_ -]/), font, dropShadow = true) {
    this.value = value
    this.dropShadow = dropShadow
    this.max = max
    this.filter = filter
    this.charArray = value.split("")

    this.editing = false

    this.mouseOver = false
    this.font = font
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0

    this.text = value
    this.index = value.length

    this.colours = {
      box: -1,
      text: -1,
    }

    this.customIndex = false
  }

  Draw(x, y, MouseX, MouseY) {
    if (this.colours.text === -1) return
    this.x = x
    this.y = y

    this.height = this.font.getHeight("AAAAAAAA") + 4
    this.width = this.font.getWidth(this.charArray.join("")) + 6

    this.CheckMouseOver(MouseX, MouseY)

    if (this.editing || this.mouseOver) {
      if (this.dropShadow) GuiUtils.DropShadow(10, x, y, this.width, this.height, 0.5, 7)
      y -= 1
    }
    GuiUtils.DrawRoundedRect(this.colours.box, x, y, this.width, this.height, 5)
    this.font.drawString(this.charArray.join(""), x + 3, y + 2, this.colours.text)

    if (this.editing) {
      if (Date.now() % 900 < 450) GuiUtils.DrawRoundedRect(this.colours.text, x + this.font.getWidth(this.text.substring(0, this.index)) + 0.1, y + 1, 1, this.height - 2, 1)
    }
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
  }

  Click(btn) {
    if (!this.editing && btn === 1 && this.mouseOver) {
      this.value = ""
      this.charArray = []
      this.text = ""
    }
    this.editing = this.mouseOver
    if (!this.editing) this.Save()
  }

  Save() {
    if (!this.text?.length) {
      this.text = "0"
      this.charArray = ["0"]
    }
    this.value = this.text
  }

  KeyPress(char, keycode) {
    if (!this.editing) return
    if (this.filter.test(char)) {
      if (this.text.length < this.max) {
        this.charArray.splice(this.index, 0, char)
        this.index++
      }
    } else {
      switch (keycode) {
        case 14:
          //backspace
          this.charArray.splice(this.index - 1, 1)
          this.index--

          break
        case 203:
          //left arrow
          this.customIndex = true

          if (this.index > 0) {
            this.index--
          }
          break
        case 205:
          //right arrow
          this.customIndex = true

          if (this.index < this.text.length) {
            this.index++
          }
          break
        case 28:
          //return
          this.editing = false
          this.Save()
          break
      }
    }
    this.text = this.charArray.join("")

    if (this.index === this.text.length) {
      this.customIndex = false
    }
    if (this.text.length === 0) {
      this.customIndex = false
    }
    if (!this.customIndex) this.index = this.text.length
  }
}
