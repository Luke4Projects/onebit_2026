class BackgroundObject {
    static CreationDistance = 1000;
    static MaxDistanceFromPlayer = 1500;
    static BelowWater = false;
    constructor(x, y, width, height) {
        this.position = { x: x, y: y };
        this.scale = { x: width, y: height };
        this.FadeSpeed = 0.1;
        this.alpha = 0.0;
    }
    Update(playerPos, deltaTime) {
        if (this.alpha < 1) {
            this.alpha += this.FadeSpeed * deltaTime;
        }

        let distanceFromPlayer = (this.position.x - playerPos.x) * (this.position.x - playerPos.x) + (this.position.y - playerPos.y) * (this.position.y - playerPos.y);
        if (distanceFromPlayer > BackgroundObject.MaxDistanceFromPlayer * BackgroundObject.MaxDistanceFromPlayer) {
            return false;
        }
        return true;
    }
    Draw(ctx, scale) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = WHITE;
        ctx.fillRect(this.position.x * scale, this.position.y * scale, this.scale.x * scale, this.scale.y * scale);
        ctx.restore();
    }
    static CreateObject(playerPos, playerVelocity, ObjType) {
        let angle = Math.random() * Math.PI * (playerVelocity.y <= 0 ? -1 : 1);
        let y = playerPos.y + Math.sin(angle) * this.CreationDistance;
        if (!ObjType.BelowWater && y > Game.WaterLevel && playerVelocity.y > 0) {
            return null;
        }
        return new ObjType(playerPos.x + Math.cos(angle) * this.CreationDistance, y);
    }
    static CreateDefaultObjects(ObjType, distanceApart = 0.5, down = false) {
        let arr = [];
        let offset = down ? 1 : -1;
        for (let i = 0; i < Math.PI; i += distanceApart) {
            arr.push(new ObjType(Math.cos(i) * this.CreationDistance, (Math.sin(i) * this.CreationDistance + HEIGHT / 2) * offset));
        }
        return arr;
    }
}

class Cloud extends BackgroundObject {
    constructor(x, y) {
        super(x, y, Math.floor(Math.random() * 400) + 250, Math.floor(Math.random() * 200) + 50);
    }
}

class Fish extends BackgroundObject {
    static BelowWater = true;
    constructor(x, y) {
        let newWidth = Math.floor(Math.random() * 30) + 40
        super(x, y, newWidth, newWidth * 0.64);
        this.rotation = Math.random() * (Math.PI / 2);
    }
    Draw(ctx, scale, img) {
        ctx.save();
        ctx.translate((this.position.x + this.scale.x) * scale, (this.position.y + this.scale.y) * scale)
        ctx.rotate(this.rotation);
        ctx.fillStyle = WHITE;
        ctx.drawImage(img, this.scale.x / 2 * scale, this.scale.y / 2 * scale, this.scale.x * scale, this.scale.y * scale);
        ctx.restore();
    }
} 

class WaterStreak extends BackgroundObject {
    static BelowWater = true;
    constructor(x, y) {
        let width = Math.floor(Math.random() * 50) - 25;
        let height = Math.floor(Math.random() * 50) + 20;
        super(x, y, width, height);
    }
    Draw(ctx, scale) {
        ctx.strokeStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo(this.position.x*scale, this.position.y*scale);
        ctx.lineTo( (this.position.x + this.scale.x)*scale, (this.position.y+this.scale.y)*scale );
        ctx.stroke();
        ctx.closePath();
    }
}