const CameraSystem = {
    update(camera, target, canvas) {
        const center = target.getCenter();
        const mass = target.getMass();

        // --- Zoom Dinámico Inverso (Premium) ---
        // Pequeño = 0.85 zoom. Grande = 0.45 zoom.
        const targetZoom = Math.max(0.45, 0.85 - (mass / 25000));
        camera.zoom += (targetZoom - camera.zoom) * 0.04; // Interpolación suave de zoom

        // Cálculo de posición centrada con el zoom actual
        let desiredX = center.x - (window.innerWidth / 2) / camera.zoom;
        let desiredY = center.y - (window.innerHeight / 2) / camera.zoom;

        // --- MÓDULO DE BORDES: Prevención de visión fuera del mapa ---
        const worldWidth = window.World ? window.World.width : 5000;
        const worldHeight = window.World ? window.World.height : 5000;
        const viewW = window.innerWidth / camera.zoom;
        const viewH = window.innerHeight / camera.zoom;

        if (viewW < worldWidth) {
            desiredX = Math.max(0, Math.min(desiredX, worldWidth - viewW));
        } else {
            desiredX = (worldWidth - viewW) / 2;
        }

        if (viewH < worldHeight) {
            desiredY = Math.max(0, Math.min(desiredY, worldHeight - viewH));
        } else {
            desiredY = (worldHeight - viewH) / 2;
        }

        // Interpolación LERP para la cámara (Seguimiento cinematográfico)
        camera.x += (desiredX - camera.x) * 0.1;
        camera.y += (desiredY - camera.y) * 0.1;
    }
};
