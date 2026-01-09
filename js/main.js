const WHITE = "#dfe0e8";
const BLACK = "#21181b";
const WIDTH = 1000;
const HEIGHT = 800;

class Main {
    constructor() {
        /** @type{HTMLCanvasElement} */
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.Update = this.Update.bind(this);
        this.input = new Input(this.canvas, this.ctx);
        this.img = {};
        this.deltaTime = 1.0;
        this.lastTimestamp = 1.0;
        this.game = new Game();
    }
    Init() {
        this.LoadImages();
        requestAnimationFrame(this.Update);
    }
    Update(timestamp) {
        this.UpdateGameLoop(timestamp);
        this.game.Update(this.deltaTime, this.input);
        this.Draw();
    }
    Draw() {
        this.ctx.fillStyle = BLACK;
        this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.game.Draw(this.ctx, this.img, this.input.scale);
        this.ctx.resetTransform();
        this.game.DrawUI(this.ctx, this.input.scale);
    }
    LoadImages() {
        this.img = {
            player: new Image(),
            fish: new Image(),
            powerup: new Image(),
        };
        this.img.player.src = "content/player.png";
        this.img.fish.src = "content/fish.png";
        this.img.powerup.src = "content/powerup.png";
    }
    UpdateGameLoop(timestamp) {
        requestAnimationFrame(this.Update);
        let perfectFrameTime = 1000/60;
        this.deltaTime = (timestamp - this.lastTimestamp) / perfectFrameTime;
        this.lastTimestamp = timestamp;
    }
}

class Input {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scale = 1;
        this.mouse = {
            x: 0,
            y: 0,
            down: false
        };

        this.OnResize = this.OnResize.bind(this);
        window.addEventListener("resize", this.OnResize);
        window.addEventListener("mousemove", (e) => {this.mouse.x = e.clientX/this.scale; this.mouse.y = e.clientY/this.scale});
        window.addEventListener("mousedown", (e) => {this.mouse.down = true});
        window.addEventListener("mouseup", (e) => {this.mouse.down = false});
        this.OnResize();

    }
    OnResize(e) {
        if(window.innerWidth >= window.innerHeight/0.8) {
            this.canvas.height = window.innerHeight*0.99;
            this.canvas.width = this.canvas.height/0.8;
        } else {
            this.canvas.width = window.innerWidth*0.99;
            this.canvas.height = this.canvas.width*0.8;
        }
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;
        this.ctx.imageSmoothingEnabled = false;
    }
}

document.body.onload = function() {
    const main = new Main();
    main.Init();
};