class Particle {
    constructor(x, y, xVelocity, yVelocity, radius, duration, gravity) {
        this.ExpandSpeed = 5;

        this.position = { x: x, y: y };
        this.velocity = { x: xVelocity, y: yVelocity };
        this.radius = radius;
        this.duration = duration;
        this.gravity = gravity;
        this.tick = 0;
        this.radiusOffset = this.radius;
    }
    UpdateMovement(deltaTime) {
        this.position.x += (this.velocity.x + Math.sin(this.tick * 0.1) * this.velocity.x / 2) * deltaTime;
        this.position.y += (this.velocity.y) * deltaTime;
        this.velocity.y += this.gravity * deltaTime;
    }
    Update(deltaTime) {

        this.tick += deltaTime;
        if (this.tick >= this.duration) {
            this.radiusOffset += deltaTime * this.ExpandSpeed;
            if (this.radiusOffset >= this.radius) {
                return false;
            }
        } else {
            if (this.radiusOffset > 0) {
                this.radiusOffset -= deltaTime * this.ExpandSpeed;
            }
        }

        this.UpdateMovement(deltaTime);

        return true;
    }
    Draw(ctx, scale) {
        ctx.strokeStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.position.x * scale, this.position.y * scale, (this.radius - this.radiusOffset) * scale, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    Update(deltaTime) {

        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].Update(deltaTime)) {
                continue;
            }
            this.particles.splice(i, 1);
        }

    }
    Draw(ctx, scale) {
        for (let particle of this.particles) {
            particle.Draw(ctx, scale);
        }
    }
    CreateParticle(x, y, xVelocity, yVelocity, radius, duration, gravity = 0) {
        this.particles.push(new Particle(x, y, xVelocity, yVelocity, radius, duration, gravity));
    }
}