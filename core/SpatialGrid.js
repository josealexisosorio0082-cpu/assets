/**
 * SpatialGrid.js
 * Optimización de búsqueda espacial mediante rejilla (Grid-based partitioning).
 * Reduce la complejidad de colisiones de O(N^2) a O(N).
 */
const SpatialGrid = {
    grid: {},
    cellSize: 200, // Tamaño de cada celda de la rejilla
    width: 5000,
    height: 5000,

    init(w, h, size = 200) {
        this.width = w;
        this.height = h;
        this.cellSize = size;
        this.clear();
    },

    clear() {
        this.grid = {};
    },

    // Obtener la clave de la celda para una posición
    getKey(x, y) {
        const gx = Math.floor(x / this.cellSize);
        const gy = Math.floor(y / this.cellSize);
        return `${gx},${gy}`;
    },

    // Insertar una entidad en la rejilla
    insert(entity) {
        if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;

        // Una entidad puede ocupar varias celdas si es grande
        const r = entity.radius || 5;
        const xStart = Math.max(0, Math.floor((entity.x - r) / this.cellSize));
        const xEnd = Math.floor((entity.x + r) / this.cellSize);
        const yStart = Math.max(0, Math.floor((entity.y - r) / this.cellSize));
        const yEnd = Math.floor((entity.y + r) / this.cellSize);

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const key = `${x},${y}`;
                if (!this.grid[key]) this.grid[key] = [];
                this.grid[key].push(entity);
            }
        }
    },

    // Consultar entidades en un área circular
    query(cx, cy, radius) {
        const results = new Set(); // Usar Set para evitar duplicados si la entidad está en varias celdas

        const xStart = Math.max(0, Math.floor((cx - radius) / this.cellSize));
        const xEnd = Math.floor((cx + radius) / this.cellSize);
        const yStart = Math.max(0, Math.floor((cy - radius) / this.cellSize));
        const yEnd = Math.floor((cy + radius) / this.cellSize);

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const key = `${x},${y}`;
                const cell = this.grid[key];
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        results.add(cell[i]);
                    }
                }
            }
        }
        return Array.from(results);
    }
};

window.SpatialGrid = SpatialGrid;
