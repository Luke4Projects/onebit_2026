class Game {
    static WaterLevel = 0;
    constructor() {
        this.camera = new Camera();
        this.player = new Player();
        this.particleSystem = new ParticleSystem();
        this.clouds = BackgroundObject.CreateDefaultObjects(Cloud);
        this.powerups = BackgroundObject.CreateDefaultObjects(Powerup, 1);
        this.fish = [];
    }
    UpdateClouds(deltaTime) {
        for (let i = 0; i < this.clouds.length; i++) {
            if (this.clouds[i].Update(this.player.position, deltaTime)) {
                continue;
            }
            let newCloud = BackgroundObject.CreateObject(this.player.position, this.player.velocity, Cloud);
            if (newCloud == null) {
                this.clouds.splice(i, 1);
                continue;
            }
            this.clouds[i] = newCloud;
        }
    }
    UpdateFish(deltaTime) {

        if (this.player.position.y < Game.WaterLevel) {
            return;
        }

        if (this.fish.length == 0) {
            this.fish = BackgroundObject.CreateDefaultObjects(Fish, 0.5, true);
        }

        for (let i = 0; i < this.fish.length; i++) {
            if (this.fish[i].Update(this.player.position, deltaTime)) {
                continue;
            }
            this.fish[i] = BackgroundObject.CreateObject(this.player.position, this.player.velocity, Fish);
        }

    }
    UpdatePowerups(deltaTime) {
        for (let i = 0; i < this.powerups.length; i++) {
            if (this.powerups[i].Update(this.player.position, deltaTime)) {
                if (this.powerups[i].IsCollidingWithPlayer(this.player)) {
                    this.player.GetPower();
                    this.powerups.splice(i, 1);
                }
                continue;
            }
            let powerup = BackgroundObject.CreateObject(this.player.position, this.player.velocity, Powerup);
            if (powerup == null || this.player.velocity.y > 0) {
                this.powerups.splice(i, 1);
                continue;
            }
            this.powerups[i] = powerup;
        }
    }
    Update(deltaTime, input) {
        this.player.Update(deltaTime, input.mouse, this.camera, this.particleSystem);
        this.camera.Update(this.player, deltaTime);
        this.particleSystem.Update(deltaTime);
        this.UpdateClouds(deltaTime);
        this.UpdateFish(deltaTime);
        this.UpdatePowerups(deltaTime);
    }
    Draw(ctx, img, scale) {
        ctx.translate(-this.camera.position.x * scale, -this.camera.position.y * scale);

        this.player.Draw(ctx, img.player, scale);
        for (let cloud of this.clouds) {
            cloud.Draw(ctx, scale);
        }
        for (let fish of this.fish) {
            fish.Draw(ctx, scale, img.fish);
        }
        for (let powerup of this.powerups) {
            powerup.Draw(ctx, scale, img.powerup);
        }
        ctx.fillStyle = WHITE;
        ctx.fillRect((this.player.position.x - WIDTH / 2) * scale, Game.WaterLevel * scale, WIDTH * 2 * scale, 10 * scale);

        this.particleSystem.Draw(ctx, scale);

    }
    DrawUI(ctx, scale) {
        ctx.fillStyle = WHITE;
        ctx.font = `${32 * scale}px Roboto`;
        ctx.fillText("DEPTH: ", 15 * scale, 40 * scale);
    }
}

class Camera {
    constructor() {
        this.lockDistance = 10;
        this.locked = false;
        this.focusSpeed = 0.3;
        this.position = { x: -100, y: -500 };
    }
    Update(player, deltaTime) {
        this.desiredPosition = {
            x: player.position.x - WIDTH / 2 + player.scale.x / 2,
            y: player.position.y - HEIGHT / 2 + player.scale.y / 2
        };
        if (this.locked) {
            this.position.x = this.desiredPosition.x
            this.position.y = this.desiredPosition.y;
        } else {
            if (!player.launched) {
                return;
            }
            this.position.x += (this.desiredPosition.x - this.position.x) * this.focusSpeed * deltaTime;
            this.position.y += (this.desiredPosition.y - this.position.y) * this.focusSpeed * deltaTime;
            if (DistanceSquared(this.desiredPosition, this.position) <= this.lockDistance * this.lockDistance) {
                //this.locked = true;
            }
        }
    }
}

class Player {
    constructor() {
        this.Gravity = 0.2;
        this.SpeedChange = 0.05;
        this.WaterResistance = 0.4;
        this.PowerupAmount = 10;
        this.launcherOffset = -150;
        this.scale = { x: 76, y: 36 };

        this.position = { x: 0.0, y: 0.0 };
        this.velocity = { x: 3.0, y: -60.0 };
        this.rotation = 0.0;
        this.splashes = 0;
        this.entranceVelocityY = 0;
        this.tick = 0;
        this.finished = false;
        this.launched = false;
        this.launchAngle = 0;
        this.launchVelocity = 0;
        this.lastPosition = { x: 0, y: 0 };
    }
    PointAtMouse(mouse, deltaTime, camera) {
        let distance = { x: mouse.x + camera.position.x - this.position.x, y: mouse.y + camera.position.y - this.position.y };
        this.rotation = Math.atan2(distance.y, distance.x);

        this.velocity.x += this.SpeedChange * Math.cos(this.rotation) * deltaTime;
        this.velocity.y += this.SpeedChange * Math.sin(this.rotation) * deltaTime;
    }
    UpdateMovement(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.y += this.Gravity * deltaTime;
        if (this.position.y >= Game.WaterLevel) {
            this.velocity.x += this.WaterResistance * (this.velocity.x > 0 ? -1 : 1);
            this.velocity.y -= this.WaterResistance * deltaTime;
            if (this.velocity.y <= 0) {
                this.finished = true;
            }
        }
    }
    UpdateParticles(particles, deltaTime) {

        if (this.position.y < Game.WaterLevel) {
            this.entranceVelocityY = this.velocity.y;
            this.tick = this.entranceVelocityY;
            return;
        }

        let maxSplashes = 3;
        if (this.splashes < maxSplashes) {
            for (let x = -10; x < 10; x++) {
                let radius = 5;
                let yVelocity = Math.floor(Math.random() * -3) - 5;
                let y = Game.WaterLevel + Math.floor(Math.random() * 10) + 50;
                particles.CreateParticle(this.position.x + x * radius / 2, y, x / 2, yVelocity, radius, 100);
            }
            this.splashes++;
        }

        this.tick += deltaTime * 2;
        if (this.tick >= this.entranceVelocityY - this.velocity.y) {
            let xvel = (Math.floor(Math.random() * 6) - 3);
            particles.CreateParticle(this.position.x, this.position.y, xvel, -5, 5, 100);
            this.tick = 0;
        }

    }
    GetPower() {
        this.velocity.y -= this.PowerupAmount;
    }
    LaunchSpin(deltaTime, mouse) {
        this.launchAngle -= 0.1 * deltaTime;
        this.launchVelocity += 0.002 * deltaTime;

        this.rotation = this.launchAngle * this.launchVelocity - Math.PI / 2;

        this.position.x = Math.cos(this.launchAngle * this.launchVelocity) * 100;
        this.position.y = Math.sin(this.launchAngle * this.launchVelocity) * 100 + this.launcherOffset;

        this.velocity.x = (this.position.x - this.lastPosition.x) * 2;
        this.velocity.y = (this.position.y - this.lastPosition.y) * 2;
        this.lastPosition = { x: this.position.x, y: this.position.y };

        if (mouse.down) {
            this.launched = true;
        }
    }
    DrawLauncher(ctx, scale) {
        ctx.fillStyle = WHITE;
        ctx.strokeStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo(this.scale.x / 2, this.launcherOffset + this.scale.y / 2);
        ctx.lineTo((this.position.x + this.scale.x / 2) * scale, (this.position.y + this.scale.y / 2) * scale);
        ctx.stroke();
        ctx.closePath();
    }
    Update(deltaTime, mouse, camera, particles) {
        if (!this.finished && this.launched) {
            this.PointAtMouse(mouse, deltaTime, camera);
            this.UpdateMovement(deltaTime);
            this.UpdateParticles(particles, deltaTime);
        }
        if (!this.launched) {
            this.LaunchSpin(deltaTime, mouse);
        }
    }
    Draw(ctx, img, scale) {
        if (!this.launched) {
            this.DrawLauncher(ctx, scale);
        }
        ctx.save();
        ctx.translate((this.position.x + this.scale.x / 2) * scale, (this.position.y + this.scale.y / 2) * scale);
        ctx.rotate(this.rotation);
        ctx.drawImage(img, -this.scale.x / 2 * scale, -this.scale.y / 2 * scale, this.scale.x * scale, this.scale.y * scale);
        ctx.restore();
    }
}

class Powerup extends BackgroundObject {
    constructor(x, y) {
        super(x, y, 45, 48);
    }
    Draw(ctx, scale, image) {
        ctx.drawImage(image, this.position.x * scale, this.position.y * scale, this.scale.x * scale, this.scale.y * scale);
    }
    IsCollidingWithPlayer(player) {
        let ppos = player.position;
        let size = Math.max(player.scale.x, player.scale.y);
        if (ppos.x + size > this.position.x && ppos.x < this.position.x + this.scale.x && ppos.y + size > this.position.y && ppos.y < this.position.y + this.scale.y) {
            return true;
        }
        return false;
    }
}