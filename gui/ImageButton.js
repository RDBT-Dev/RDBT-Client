global.export.ImageButton = class {
  constructor(image, onClick) {
    this.image = image

    this.x = 100
    this.y = 100
    this.width = 100
    this.height = 14

    this.colours = {
      accent: -1,
    }

    this.mouseOver = false

    this.onClick = onClick
  }

  Draw(x, y, size, MouseX, MouseY) {
    if (this.colours.accent === -1) return
    this.x = x
    this.y = y

    this.width = size
    this.height = size

    this.CheckMouseOver(MouseX, MouseY)

    let c = this.colours.accent

    let r, g, b
    r = c.getRed() / 255
    g = c.getGreen() / 255
    b = c.getBlue() / 255

    Renderer.colorize(r, g, b)

    if (this.mouseOver) {
      this.image.draw(this.x - 1.5, this.y - 1.5, this.width + 3, this.height + 3)
    } else this.image.draw(this.x, this.y, this.width, this.height)
  }

  CheckMouseOver(MouseX, MouseY) {
    this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
  }

  Click() {
    if (this.mouseOver) {
      this.onClick()
      this.mouseOver = false
    }
  }
}
