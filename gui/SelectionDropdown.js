let { GuiUtils } = global.export

class Btn {
  constructor(value, onClick, parent) {
    this.value = value
    this.onClick = onClick
    this.parent = parent

    this.x = 0
    this.y = 0

    this.width = 0
    this.height = 0

    this.mouseOver = false
  }

  Draw(x, y, width, height, MouseX, MouseY) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.CheckMouseOver(MouseX, MouseY)

    if (this.mouseOver) {
      this.y -= 1
      GuiUtils.DropShadow(10, this.x, this.y + 1, this.width, this.height, 0.5, 7)
    }

    GuiUtils.DrawRoundedRect(this.parent.colours.panel, this.x, this.y, this.width, this.height, 5)
    if (this.parent.options[this.parent.value] === this.value) GuiUtils.DrawRoundedRect(this.parent.colours.mouseOver, this.x, this.y, this.width, this.height, 5)

    this.parent.font.drawString(this.value, this.x + 3, this.y + 1, this.parent.colours.text)
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
  }

  Click() {
    if (this.mouseOver) {
      this.onClick(this.value)
    }
  }
}

global.export.SelectionDropdown = class {
  constructor(name, value, options, collapsed, onClick, parent, font) {
    this.name = name
    this.value = value

    this.options = options
    this.collapsed = collapsed
    this.onClick = onClick
    this.parent = parent

    this.font = font

    this.colours = {
      text: -1,
      panel: -1,
      background: -1,
      mouseOver: new java.awt.Color(31 / 255, 35 / 255, 41 / 255, 0.5),
    }

    this.x = 100
    this.y = 100
    this.width = this.font.getWidth(this.options[this.value]) + 6
    this.height = 30

    this.open = false

    this.mouseOver = false

    this.buttons = []

    this.panel = {
      x: 100,
      y: 100,
      width: 180,
      height: 100,
    }

    this.options.forEach(opt => {
      this.buttons.push(
        new Btn(
          opt,
          v => {
            this.value = this.options.indexOf(v)
            this.onClick(this.parent, this.name, this.value)
            this.open = false
          },
          this,
        ),
      )
    })
    this.mainwidth = 10
  }

  Draw(x, y, MouseX, MouseY) {
    if (this.colours.text === -1) return

    this.x = x
    this.y = y
    this.mainwidth = this.width
    this.width = this.font.getWidth(this.options[this.value]) + 6

    this.CheckMouseOver(MouseX, MouseY)
    if (!this.open) {
      this.font.drawString(this.name, this.x, this.y, this.colours.text)
      if (this.mouseOver) {
        GuiUtils.DropShadow(15, this.x, this.y + 10, this.width, 10, 0.5, 7)
      }
      GuiUtils.DrawRoundedRect(this.colours.background, this.x, this.y + 10, this.width, 10, 5)
      this.font.drawString(this.options[this.value], this.x + 3, this.y + 11, this.colours.text)

      this.height = 30
      return
    }
    this.height = this.panel.height + 15
    GuiUtils.DropShadow(15, this.x, this.y, this.panel.width, this.panel.height, 0.5, 7)
    GuiUtils.DrawRoundedRect(this.colours.panel, this.x, this.y, this.panel.width, this.panel.height, 7)

    this.font.drawString(this.name, this.x + 5, this.y + 3, this.colours.text)

    GuiUtils.DrawRoundedRect(this.colours.background, this.x + 5, this.y + 8 + this.font.getHeight(this.name), this.panel.width - 10, this.panel.height - 18, 5)

    let w = (this.panel.width - 25) / 2
    let ox = 0
    let oy = 11 + this.font.getHeight(this.name)
    this.buttons.forEach((btn, i) => {
      btn.Draw(this.x + 10 + ox, this.y + oy, w, 10, MouseX, MouseY)

      if (i % 2 === 0) {
        ox += w + 2.5
      } else {
        ox -= w + 2.5
        oy += 13
      }
    })
  }
  MouseUp() {}
  CheckMouseOver(MouseX, MouseY) {
    if (!this.open) this.mouseOver = MouseX > this.x && MouseX < this.x + this.mainwidth && MouseY > this.y && MouseY < this.y + this.height
    else this.mouseOver = MouseX > this.x && MouseX < this.x + this.panel.width && MouseY > this.y && MouseY < this.y + this.panel.height
  }

  Click() {
    if (this.mouseOver && !this.open) {
      this.open = true

      this.panel.width = 180
      this.panel.height = 13 + (this.font.getHeight(this.name) + Math.ceil(this.options.length / 2) * 13)
    } else if (this.open && this.mouseOver) {
      this.buttons.forEach(btn => {
        btn.Click()
      })
    } else if (this.open && !this.mouseOver) {
      this.open = false
    }
  }

  KeyPress(char, keycode) {}
}
