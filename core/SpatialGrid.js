/**
 * SpatialGrid.js
 * Optimización de búsqueda espacial mediante rejilla (Grid-based partitioning).
 * Versión 2.0: Optimización extrema con índices numéricos y queryId.
 */
const SpatialGrid = {
    grid: [],
    cellSize: 200,
    width: 5000,
    height: 5000,
    cols: 0,
    rows: 0,
    _lastQueryId: 0,

    init(w, h, size = 200) {
        this.width = w;
        this.height = h;
        this.cellSize = size;
        this.cols = Math.ceil(w / size);
        this.rows = Math.ceil(h / size);
        this.grid = new Array(this.cols * this.rows);
        for (let i = 0; i < this.grid.length; i++) this.grid[i] = [];
        this._lastQueryId = 0;
    },

    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }
    },

    getIndex(x, y) {
        const gx = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
        const gy = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
        return gy * this.cols + gx;
    },

    insert(entity) {
        if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;

        const r = entity.radius || 5;
        const xStart = Math.max(0, Math.floor((entity.x - r) / this.cellSize));
        const xEnd = Math.min(this.cols - 1, Math.floor((entity.x + r) / this.cellSize));
        const yStart = Math.max(0, Math.floor((entity.y - r) / this.cellSize));
        const yEnd = Math.min(this.rows - 1, Math.floor((entity.y + r) / this.cellSize));

        // Inyectar queryId si no existe para evitar duplicados en consultas sin usar Set
        if (entity._qId === undefined) entity._qId = 0;

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const idx = y * this.cols + x;
                this.grid[idx].push(entity);
            }
        }
    },

    query(cx, cy, radius) {
        const results = [];
        this._lastQueryId++;
        const qId = this._lastQueryId;

        const xStart = Math.max(0, Math.floor((cx - radius) / this.cellSize));
        const xEnd = Math.min(this.cols - 1, Math.floor((cx + radius) / this.cellSize));
        const yStart = Math.max(0, Math.floor((cy - radius) / this.cellSize));
        const yEnd = Math.min(this.rows - 1, Math.floor((cy + radius) / this.cellSize));

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                const idx = y * this.cols + x;
                const cell = this.grid[idx];
                for (let i = 0; i < cell.length; i++) {
                    const ent = cell[i];
                    if (ent._qId !== qId) {
                        ent._qId = qId;
                        results.push(ent);
                    }
                }
            }
        }
        return results;
    }
};


window.SpatialGrid = SpatialGrid;
