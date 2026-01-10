class Game {
    static WaterLevel = 0;
    constructor() {
        this.camera = new Camera();
        this.player = new Player();
        this.particleSystem = new ParticleSystem();
        this.clouds = BackgroundObject.CreateDefaultObjects(Cloud);
        this.powerups = BackgroundObject.CreateDefaultObjects(Powerup, 1);
        this.fish = [];
        this.waterStreaks = [];
        this.miniGame = new LaunchMiniGame();
        this.timeFinished = 0;
        this.finishDuration = 100;
        this.depth = 0;
        this.shouldFade = true;
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
    UpdateBelowWaterObject(deltaTime, ObjType, arr) {
        if (this.player.position.y < Game.WaterLevel) {
            return [];
        }

        if (arr.length == 0) {
            arr = BackgroundObject.CreateDefaultObjects(ObjType, 0.5, true);
        }

        for (let i = 0; i < arr.length; i++) {
            if (arr[i].Update(this.player.position, deltaTime)) {
                continue;
            }
            arr[i] = BackgroundObject.CreateObject(this.player.position, this.player.velocity, ObjType);
        }

        return arr;
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
    UpdateFinishSequence(deltaTime) {
        this.timeFinished += deltaTime;
    }
    DrawFinishSequence(ctx, scale) {
        let maxFontSize = 55;
        let fontSize = this.timeFinished;
        if (fontSize > maxFontSize) {
            fontSize = maxFontSize;
        }
        ctx.fillStyle = WHITE;
        ctx.font = `${fontSize * scale}px Roboto`;
        ctx.fillText(this.depth + "m", (WIDTH / 2 - fontSize) * scale, (HEIGHT / 2 - 100) * scale);
    }
    Update(deltaTime, input) {
        this.player.Update(deltaTime, input.mouse, this.camera, this.particleSystem, this.miniGame.launchVelocity);
        this.depth = Math.round(this.player.position.y * 0.1);
        this.camera.Update(this.player, deltaTime);
        this.particleSystem.Update(deltaTime);
        this.UpdateClouds(deltaTime);
        this.fish = this.UpdateBelowWaterObject(deltaTime, Fish, this.fish);
        this.waterStreaks = this.UpdateBelowWaterObject(deltaTime, WaterStreak, this.waterStreaks);
        this.UpdatePowerups(deltaTime);
        if (!this.player.launched) {
            if (this.miniGame.Update(input.mouse, deltaTime)) {
                this.player.launched = true;
            }
        }
        if (this.player.finished) this.UpdateFinishSequence(deltaTime);
        return this.timeFinished >= this.finishDuration;
    }
    Draw(ctx, img, scale) {
        ctx.translate(-this.camera.position.x * scale, -this.camera.position.y * scale);

        for (let cloud of this.clouds) {
            cloud.Draw(ctx, scale);
        }
        for (let fish of this.fish) {
            fish.Draw(ctx, scale, img.fish);
        }
        for (let streak of this.waterStreaks) {
            streak.Draw(ctx, scale);
        }
        for (let powerup of this.powerups) {
            powerup.Draw(ctx, scale, img.powerup);
        }
        ctx.fillStyle = WHITE;
        ctx.fillRect((this.player.position.x - WIDTH / 2) * scale, Game.WaterLevel * scale, WIDTH * 2 * scale, 10 * scale);

        this.particleSystem.Draw(ctx, scale);

        this.player.Draw(ctx, img.player, scale);


    }
    DrawUI(ctx, scale) {
        ctx.fillStyle = WHITE;
        ctx.font = `${32 * scale}px Roboto`;
        ctx.fillText(`DEPTH: ${this.depth}m`, 15 * scale, 40 * scale);

        if (!this.player.launched) this.miniGame.Draw(ctx, scale);
        if (this.player.finished) this.DrawFinishSequence(ctx, scale);

    }
}

class Camera {
    constructor() {
        this.lockDistance = 10;
        this.locked = false;
        this.focusSpeed = 0.3;
        this.position = { x: -100, y: -700 };
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
        this.launcherOffset = {x: 100, y: -150};
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
                let yVelocity = Math.floor(Math.random() * -5) - 8;
                let y = Game.WaterLevel + Math.floor(Math.random() * 10) + 50;
                particles.CreateParticle(this.position.x + x * radius / 2, y, x / 2, yVelocity, radius, 100, 0.2);
            }
            this.splashes++;
        }

        this.tick += deltaTime * 2;
        if (this.tick >= this.entranceVelocityY - this.velocity.y) {
            let xvel = (Math.floor(Math.random() * 6) - 3);
            particles.CreateParticle(this.position.x + this.scale.x / 2, this.position.y, xvel, -5, 5, 100);
            this.tick = 0;
        }

    }
    GetPower() {
        this.velocity.y -= this.PowerupAmount;
    }
    LaunchSpin(deltaTime, launchVelocity) {
        this.launchAngle -= 0.1 * launchVelocity * deltaTime;

        this.rotation = this.launchAngle - Math.PI / 2;

        this.position.x = Math.cos(this.launchAngle) * 100 + this.launcherOffset.x;
        this.position.y = Math.sin(this.launchAngle) * 100 + this.launcherOffset.y;

        let speedBoost = 4;
        this.velocity.x = (this.position.x - this.lastPosition.x) * speedBoost;
        this.velocity.y = (this.position.y - this.lastPosition.y) * speedBoost;
        this.lastPosition = { x: this.position.x, y: this.position.y };

    }
    DrawLauncher(ctx, scale) {
        ctx.fillStyle = WHITE;
        ctx.strokeStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo((this.launcherOffset.x + this.scale.x / 2)*scale, (Game.WaterLevel)*scale);
        ctx.lineTo((this.launcherOffset.x + this.scale.x / 2)*scale, (this.launcherOffset.y + this.scale.y / 2)*scale);
        ctx.lineTo((this.position.x + this.scale.x / 2) * scale, (this.position.y + this.scale.y / 2) * scale);
        ctx.stroke();
        ctx.closePath();
    }
    Update(deltaTime, mouse, camera, particles, launchVelocity) {
        if (!this.finished && this.launched) {
            this.PointAtMouse(mouse, deltaTime, camera);
            this.UpdateMovement(deltaTime);
            this.UpdateParticles(particles, deltaTime);
        }
        if (!this.launched) {
            this.LaunchSpin(deltaTime, launchVelocity);
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

class LaunchMiniGame {
    constructor() {
        this.bounds = { x: 50, y: 400, width: 50, height: 300 };
        this.radius = 25;
        this.goalY = Math.floor(Math.random() * (this.bounds.height - this.radius)) + this.bounds.y + this.radius;
        this.playerY = this.bounds.y + this.bounds.height / 2;
        this.playerMoveSpeed = 3;
        this.playerDirection = 1;
        this.launchVelocity = 0.3;
    }
    Update(mouse, deltaTime) {
        this.playerY += this.playerMoveSpeed * this.playerDirection * deltaTime;
        if (this.playerY + this.radius > this.bounds.y + this.bounds.height) this.playerDirection = -1;
        if (this.playerY - this.radius < this.bounds.y ) this.playerDirection = 1;

        if (mouse.down && mouse.canTrigger) {
            if ((this.playerY - this.goalY) * (this.playerY - this.goalY) <= this.radius*2 * this.radius*2) {
                this.playerDirection = 1;
                this.playerMoveSpeed++;
                this.launchVelocity+=0.3;
                this.goalY = Math.floor(Math.random() * (this.bounds.height - this.radius)) + this.bounds.y + this.radius;
            } else {
                return true;
            }
            mouse.canTrigger = false;
        }

        return false
    }
    Draw(ctx, scale) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.bounds.x * scale, this.bounds.y * scale, this.bounds.width * scale, this.bounds.height * scale);

        ctx.beginPath();
        ctx.arc((this.bounds.x + this.radius) * scale, this.goalY * scale, this.radius * scale, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc((this.bounds.x + this.radius) * scale, this.playerY * scale, this.radius * scale, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    }
}