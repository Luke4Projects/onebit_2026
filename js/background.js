class BackgroundObject {
    static CreationDistance = 1000;
    static MaxDistanceFromPlayer = 1500;
    constructor(x, y, width, height) {    
        this.position = {x: x, y: y};
        this.scale = {x: width, y: height};
    }
    Update(playerPos) {
        let distanceFromPlayer = (this.position.x-playerPos.x)*(this.position.x-playerPos.x) + (this.position.y-playerPos.y)*(this.position.y-playerPos.y);
        if( distanceFromPlayer  > BackgroundObject.MaxDistanceFromPlayer*BackgroundObject.MaxDistanceFromPlayer) {
            return false;
        }
        return true;
    }
    Draw(ctx, scale) {
        ctx.fillStyle = WHITE;
        ctx.fillRect(this.position.x*scale, this.position.y*scale, this.scale.x*scale, this.scale.y*scale);
    }
    static CreateObject(playerPos, playerVelocity, ObjType) {
        let angle = Math.random() * Math.PI*2;
        let y = playerPos.y + Math.sin(angle)*this.CreationDistance;
        if(ObjType != Fish && y > Game.WaterLevel && playerVelocity.y > 0) {
            return null;
        }
        return new ObjType(playerPos.x + Math.cos(angle)*this.CreationDistance, y);
    }
    static CreateDefaultObjects(ObjType) {
        let arr = [];
        for(let i = 0; i < Math.PI*2; i+=0.5) {
            arr.push(new ObjType(Math.cos(i)*this.CreationDistance, Math.sin(i)*this.CreationDistance));
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
    constructor(x, y) {
        let newWidth = Math.floor(Math.random() * 30) + 40
        super(x, y, newWidth, newWidth*0.64);
        this.rotation = Math.random() * (Math.PI / 2);
    }
    Draw(ctx, scale, img) {
        ctx.save();
        ctx.translate((this.position.x + this.scale.x) * scale, (this.position.y + this.scale.y) * scale)
        ctx.rotate(this.rotation);
        ctx.fillStyle = WHITE;
        ctx.drawImage(img, this.scale.x/2*scale, this.scale.y/2*scale, this.scale.x*scale, this.scale.y*scale);
        ctx.restore();
    }
}