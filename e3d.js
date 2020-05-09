
// Basic E3D values
let E3D = Object.freeze({
	nil: Symbol("nil"),
	ctx: Symbol("context"),
	render: Object.freeze({
		IMAGE: Symbol("Image"),
		VECTOR: Symbol("Vector"),
		TEXT: Symbol("Text")
	}),
	secure: Symbol("safe"),
	skybox: Object.freeze({
		VOID: Symbol("Void")
	}),
	createImage: function(path=null) {
		const img = new Image()
		img.style.imageRendering = "pixelated"
		img.src = path
		return Object.freeze(img)
	},
	graphics: Object.freeze({
		fullCircle: Object.freeze({
			0: -720,
			1: 720,
			negative: -720,
			positive: 720,
			"-": -720,
			"+": 720,
			positiveX: [360],
			positiveZ: [0],
			negativeX: [-360],
			negativeZ: [719,720,-720,-719]
		})
	})
})

// Add a subtract method to arrays to get rid of specific elements
Array.prototype.subtract = function(value=E3D.nil) {
	const arr = []
	for(const e of this) {
		let v = this.pop()
		if(v !== value) arr.push(v)
	}
	for(const e of arr.reverse()) {
		this.push(e)
	}
	return this
}

// Create an E3D scene
let Scene = function(canvas=E3D.nil) {
	if(canvas === E3D.nil) {
		return null
	}
	const elements = []
	const mouseRequests = []
	const keyRequests = []
	let elementCount = 0
	const screen = canvas.getContext("2d")
	const Literal = Object.seal({
		[E3D.ctx]: screen,
		game_active: false,
		facing: 0,
		facingY: 0,
		x: 0,
		y: 0,
		z: 0,
		max_facingY: 50,
		min_facingY: -50,
		jumping: false,
		airtime: 0.5,
		jump_height: 50,
		light: 100,
		render_positive_and_negativeX: true,
		controls: Object.seal({
			walk_forward: "w",
			walk_left: "a",
			walk_backward: "s",
			walk_right: "d",
			jump: " "
		}),
		confirm_active: true,
		darken_canvas_with_low_light: true,
		camera_speed: 0.225,
		fill: function(x=0,y=0,w=0,h=0) {
			if(Literal.game_active || !Literal.confirm_active) {
				if(w < 0) {
					x += w
					w = Math.abs(w)
				}
				if(h < 0) {
					y += h
					h = Math.abs(h)
				}
				screen.fillRect(x,y,w,h)
				return true
			}
			return false
		},
		write: function(text="",x=0,y=0,size=10,font="arial") {
			const s = screen
			s.font = (font+" "+size+"px")
			s.fillText(text,x,y)
		},
		skycolor: function(color=E3D.nil) {
			const s = screen
			if(color === E3D.nil) {
				return canvas.style.backgroundColor
			}
			canvas.style.backgroundColor = color
			return color
		},
		color: function(color=E3D.nil) {
			const s = screen
			if(color === E3D.nil) {
				return s.fillStyle
			}
			s.fillStyle = color
			return color
		},
		draw: function(image=E3D.nil,x=0,y=0,w=0,h=0) {
			const s = screen
			if(Literal.game_active || !Literal.confirm_active) {
				try {
					if(w <= 0 || h <= 0) {
						s.drawImage(image,x,y)
					} else {
						s.drawImage(image,x,y,w,h)
					}
					return true
				} catch {
					return false
				}
				return true
			}
			return false
		},
		clear: function() {
			if(Literal.game_active || !Literal.confirm_active) {
				screen.clearRect(
					0,
					0,
					window.screen.availWidth,
					window.screen.availHeight
				)
				return true
			}
			return false
		},
		elements: function() {
			return [...elements]
		},
		addElement: function(type=E3D.VECTOR,settings=null) {
			elementCount++
			if(!(Object.values(E3D.render)).includes(type)) {
				type = E3D.render.VECTOR
			}
			if(settings === null || typeof settings !== "object") settings = {
				width: 0,
				height: 0,
				color: "white",
				image: null,
				x: 0,
				y: 0,
				static: false,
				achored: false,
				text: "",
				font: "arial",
				size: 10
			}
			elements.push(Object.freeze({
				id: elementCount,
				type: type,
				getSettings: function(user=null) {
					if(user === E3D.secure) {
						return settings
					}
					return null
				}
			}))
			return settings
		},
		removeElement: function(element=null) {
			const c = [...elements]
			if(c === elements.subtract(element)) {
				return false
			}
			return true
		},
		removeAll: function() {
			for(const e of elements) {
				elements.pop()
			}
		},
		focus: function() {
			try {
				canvas.focus()
				canvas.requestPointerLock()
				Literal.game_active = true
				return true
			} catch {
				return false
			}
		},
		exit: function() {
			try {
				Literal.game_active = false
				canvas.exitPointerLock()
				canvas.blur()
				return true
			} catch {
				return false
			}
		},
		render: function() {
			if(Literal.game_active || !Literal.confirm_active) {
				Literal.clear()
				for(const element of elements) {
					const cfg = element.getSettings(E3D.secure)
					screen.fillStyle = cfg["color"]
					if(element.type === E3D.render.VECTOR) {
						let anchor = Boolean(cfg.anchored)
						let static = Boolean(cfg.static)
						Literal.fill(
							(cfg.x-(static ? 0 : Literal.x))-(anchor ? 0 : Literal.facing),
							(cfg.y+Literal.y)+Literal.facingY,
							cfg.width,
							cfg.height
						)
					}
					if(element.type === E3D.render.IMAGE) {
						let anchor = Boolean(cfg.anchored)
						let static = Boolean(cfg.static)
						Literal.draw(
							cfg.image,
							(cfg.x-(static ? 0 : Literal.x))-(anchor ? 0 : Literal.facing),
							(cfg.y+Literal.y)+Literal.facingY,
							cfg.width,
							cfg.height
						)
					}
					if(element.type === E3D.render.TEXT) {
						let anchor = Boolean(cfg.anchor)
						let static = Boolean(cfg.static)
						Literal.write(
							cfg.text,
							(cfg.x-(static ? 0 : Literal.x))-(anchor ? 0 : Literal.facing),
							(cfg.y+Literal.y)+Literal.facingY,
							cfg.size,
							cfg.font
						)
					}
				}
				return true
			}
			return false
		},
		completeRequests: function() {
			if(Literal.game_active || !Literal.confirm_active) {
				const requests = [...mouseRequests,...keyRequests]
				for(const r of requests) {
					if(r.type === "mousemove") {
						let camera_speed = Literal.camera_speed
						if(Literal.facing >= 720) Literal.facing = -719
						if(Literal.facing <= -720) Literal.facing = 719
						if(Literal.facingY >= Literal.max_facingY) {
							Literal.facingY = Literal.max_facingY
						}
						if(Literal.facingY <= Literal.min_facingY) {
							Literal.facingY = Literal.min_facingY
						}
						Literal.facing += (r.movementX*camera_speed)
						Literal.facingY += (r.movementY*camera_speed)
						if(Literal.facing >= 720) Literal.facing = -719
						if(Literal.facing <= -720) Literal.facing = 719
						if(Literal.facingY >= Literal.max_facingY) {
							Literal.facingY = Literal.max_facingY
						}
						if(Literal.facingY <= Literal.min_facingY) {
							Literal.facingY = Literal.min_facingY
						}
						mouseRequests.subtract(r)
					}
					if(r.type === "keydown") {
						if(r.key === Literal.controls.walk_forward) {
							//
						}
						if(r.key === Literal.controls.walk_backward) {
							//
						}
						if(r.key === Literal.controls.walk_left) {
							//
						}
						if(r.key === Literal.controls.walk_right) {
							//
						}
						if(r.key === Literal.controls.jump) {
							Literal.jumping = true
							while(Literal.y < Literal.y+Literal.jump_height) {
								Literal.y += (Literal.jump_height/9)
							}
							setTimeout(function() {
								while(Literal.y < Literal.y-Literal.jump_height) {
									Literal.y -= (Literal.jump_height/9)
								}
								Literal.jumping = false
							},Literal.airtime*1000)
						}
						keyRequests.subtract(r)
					}
					if(r.type === "keypress") {
						keyRequests.subtract(r)
					}
					if(r.type === "keyup") {
						keyRequests.subtract(r)
					}
					requests.subtract(r)
				}
				return true
			}
			return false
		},
		execute: function() {
			if(Literal.game_active || !Literal.confirm_active) {
				Literal.render()
				Literal.completeRequests()
			}
		}
	})
	canvas.style.imageRendering = "pixelated"
	canvas.imageSmoothingEnabled = false
	screen.imageSmoothingEnabled = false
	screen.mozImageSmoothingEnabled = false
	screen.webkitImageSmoothingEnabled = false
	canvas.tabIndex = 0
	canvas.style.background = "#000000"
	canvas.style.backgroundColor = "#000000"
	canvas.onkeydown = function(event=null) {
		if(event && Literal.game_active) {
			keyRequests.push(event)
			return true
		}
		return false
	}
	canvas.onmousemove = canvas.onclick = canvas.oncontextmenu = function(event=null) {
		if(document.pointerLockElement !== canvas || document.pointerLockElement === null) {
			Literal.game_active = false
			canvas.blur()
		}
		if(event && Literal.game_active) {
			mouseRequests.push(event)
			return true
		}
		return false
	}
	canvas.onpointerlockchange = function() {
		if(document.pointerLockElement !== canvas || document.pointerLockElement === null) {
			Literal.game_active = false
			canvas.blur()
		}
	}
	canvas.onfocus = function() {
		canvas.requestPointerLock()
		Literal.game_active = true
	}
	canvas.onblur = function() {
		try {
			canvas.exitPointerLock()
		} catch {}
		Literal.game_active = false
	}
	return Literal
}
