var World = {
    width: window.CONFIG ? window.CONFIG.world.width : 5000,
    height: window.CONFIG ? window.CONFIG.world.height : 5000,
    gridSize: 70,

    render(ctx, camera) {
        const visuals = (window.CONFIG && window.CONFIG.visuals) ? window.CONFIG.visuals : { gridOpacity: 0.05 };

        // Área de juego blanca
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-camera.x, -camera.y, this.width, this.height);

        // Rejilla Dinámica
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 0, 0, ${visuals.gridOpacity})`;
        ctx.lineWidth = visuals.gridOpacity > 0.1 ? 1.5 : 0.8;

        const viewW = window.innerWidth / camera.zoom;
        const viewH = window.innerHeight / camera.zoom;

        const startX = Math.max(0, Math.floor(camera.x / this.gridSize) * this.gridSize);
        const startY = Math.max(0, Math.floor(camera.y / this.gridSize) * this.gridSize);
        const endX = Math.min(this.width, camera.x + viewW + this.gridSize);
        const endY = Math.min(this.height, camera.y + viewH + this.gridSize);

        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.moveTo(x - camera.x, -camera.y);
            ctx.lineTo(x - camera.x, this.height - camera.y);
        }
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.moveTo(-camera.x, y - camera.y);
            ctx.lineTo(this.width - camera.x, y - camera.y);
        }
        ctx.stroke();

        // Borde
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 6;
        ctx.strokeRect(-camera.x, -camera.y, this.width, this.height);
    }
};

window.World = World;
