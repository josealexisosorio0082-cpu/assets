const GAME_VERSION = '0.1';

const CONFIG = {
    version: "1.8.0", // Versión actual del juego
    world: {
        width: 5000,
        height: 5000,
        gridSize: 80,
        majorGridSize: 400
    },

    mass: {
        divisor: 10
    },

    player: {
        startX: 2500,
        startY: 2500,
        startRadius: 30,
        defaultName: "Jugador",
        defaultSkin: "blue",
        minRadius: 30,
        speed: {
            min: 0.8,
            max: 2.5,
            factor: 12
        },
        split: {
            minRadius: 35,
            radiusRatio: 1 / Math.SQRT2,
            stretch: 0.15,
            cellOffsetRatio: 0.05,
            cellVisualRadiusRatio: 0.85,
            impulse: 14,
            cellStretch: 0.25,
            mergeTimer: 15,
            chance: 0.005
        },
        eject: {
            minRadius: 35,
            massLoss: 1.5,
            speed: 12,
            stretch: 0.08
        },
        movement: {
            deadZone: 10,
            strengthRange: 150,
            directionSmoothing: 0.14,
            accelerationMoving: 0.13,
            accelerationIdle: 0.2,
            stretchFactor: 0.045,
            stretchSmoothing: 0.1,
            visualRadiusSmoothing: 0.11
        },
        splitCell: {
            defaultStretch: 0.25,
            velocityDecay: 0.94,
            visualRadiusSmoothing: 0.16,
            stretchDecay: 0.075,
            mergePullMin: 2,
            mergePullMax: 8,
            mergePullFactor: 0.08,
            mergeMoveSmoothing: 0.12,
            mergeStretchMax: 0.22,
            mergeStretchDistance: 700,
            mergeStretchSmoothing: 0.12,
            mergeDistanceMin: 20,
            mergeDistanceRadiusRatio: 0.3,
            mergeRadiusGain: 0.8,
            mergeCompleteStretch: 0.18
        },
        skins: {
            blue: "#4a90e2",
            red: "#ff5555",
            green: "#33cc66",
            purple: "#aa55ff"
        }
    },

    food: {
        targetPellets: 420,
        radius: 4,
        ejectedRadius: 8,
        gridPadding: 0.15,
        gridJitter: 0.7,
        pulseSpeed: 0.045,
        ejectedPulseSpeed: 0.1,
        velocityDecay: 0.95,
        velocityStopThreshold: 0.1,
        pulseAmount: 0.45,
        ejectedPulseAmount: 0.7,
        shadowBlur: 4,
        ejectedShadowBlur: 9,
        colors: {
            normal: "#39d98a",
            ejected: "#ffad33"
        },
        absorption: {
            playerNormal: 0.5,
            playerEjected: 1.5,
            botNormal: 0.9,
            botEjected: 1.5
        }
    },

    bots: {
        initialPopulation: 20,
        targetPopulation: 24,
        minPopulation: 20,
        maxPopulation: 28,
        spawnMargin: 150,
        spawnPadding: 300,
        startRadius: 25,
        populationCheckInterval: 300,
        maxSpawnPerTick: 2,
        densityHighThreshold: 1.4,
        densityLowThreshold: 0.55,
        congestionDistance: 280,
        speed: {
            min: 0.7,
            max: 2.2,
            factor: 10
        },
        personality: {
            aggressionMin: 0.85,
            aggressionRange: 0.35,
            cautionMin: 0.9,
            cautionRange: 0.3,
            curiosityMin: 0.8,
            curiosityRange: 0.4
        },
        ai: {
            eatThreshold: 1.15,
            huntThreshold: 1.18,
            threatThreshold: 1.12,
            dangerRangeBase: 520,
            dangerRangeRadiusFactor: 3,
            huntRangeBase: 650,
            huntRangeRadiusFactor: 4,
            huntScoreMultiplier: 260,
            foodSearchRange: 850,
            foodValueNormal: 70,
            foodValueEjected: 220,
            foodDistancePenalty: 0.18,
            foodScoreJitter: 12,
            fleeDecisionMin: 24,
            fleeDecisionRange: 18,
            preyDecisionMin: 35,
            preyDecisionRange: 30,
            foodDecisionMin: 45,
            foodDecisionRange: 35,
            wanderDecisionTime: 30,
            wanderTimerMin: 50,
            wanderTimerRange: 100,
            wanderDistance: 300,
            fleeDistance: 650,
            wanderAngleJitter: 1.4,
            urgentFleeDecisionTime: 30,
            thinkTimerMin: 12,
            thinkTimerRange: 16,
            initialThinkTimerRange: 20,
            fleeTurnSpeed: 0.16,
            normalTurnSpeed: 0.075,
            fleeSpeedBoost: 1.08,
            lookSmoothing: 0.12,
            visualRadiusSmoothing: 0.12,
            stretchMax: 0.055,
            stretchSpeedFactor: 0.012,
            stretchSmoothing: 0.08,
            virusAvoidRadiusFactor: 0.95,
            virusSafeDistanceExtra: 130,
            virusAvoidForce: 2.4,
            borderMargin: 260,
            borderForce: 2,
            suffixMin: 10,
            suffixRange: 90
        },
        collision: {
            overlapFactor: 0.2,
            botAbsorptionGain: 0.3,
            playerAbsorptionGain: 0.4
        },
        eject: {
            minRadius: 35,
            massLoss: 1.5,
            speed: 12,
            chance: 0.008
        },
        split: {
            minRadius: 40,
            radiusRatio: 0.7,
            cellOffsetRatio: 0.6,
            impulse: 18,
            // Increased to match Agar.io's 30 s merge cooldown after split
            mergeTimer: 1800,
            chance: 0.005
        },
        render: {
            color: "#ff6666",
            stroke: "rgba(130, 25, 25, 0.28)",
            absorptionColor: "#ff7777"
        }
    },

    virus: {
        count: 20,
        radius: 50,
        fedToSplit: 7,
        splitImpulse: 12,
        velocityDecay: 0.98,
        velocityStopThreshold: 0.1,
        cooldown: 60,
        spikes: 24,
        spikeOuterRatio: 1.2,
        playerSplitMinRadius: 80,
        playerSplitRadiusRatio: 0.4,
        playerSplitOffset: 120,
        playerSplitImpulse: 40,
        playerRadiusAfterSplit: 0.6,
        playerMergeTimer: 1800,
        playerKnockback: 250,
        playerShrinkRadius: 0.75,
        botShrinkRadius: 0.55,
        botKnockback: 200,
        breathAmplitude: 0.03,
        breathSpeed: 0.02,
        fillColor: "#33cc33",
        strokeColor: "#22aa22",
        lineWidth: 4
    },

    camera: {
        zoomMin: 0.34,
        zoomMax: 1.05,
        zoomBase: 1.08,
        zoomRadiusReference: 30,
        zoomRadiusExponent: 0.24,
        zoomSmoothing: 0.018,
        zoomVelocityDecay: 0.82,
        positionSmoothing: 0.022,
        positionVelocityDecay: 0.78
    },

    visualEffects: {
        // Reduced max particles for better performance while keeping visual richness
        maxParticles: 100,
        timeStep: 0.035,
        particleMinRadius: 0.25,
        particleRadiusDecay: 0.985,
        absorptionRadiusDecay: 0.92,
        absorptionMinRadius: 0.4,
        absorptionMoveBase: 0.12,
        absorptionMoveEase: 0.28,
        // Slightly fewer burst particles for subtler feedback
        burstDefaultAmount: 3,
        burstDefaultPower: 2.2,
        burstLargeAmount: 6,
        burstSmallAmount: 4,
        burstLargePower: 3.5,
        burstSmallPower: 2.2,
        burstLargeRadiusThreshold: 5,
        splitParticleMin: 6,
        splitParticleMax: 12,
        splitParticleRadiusDivisor: 6,
        organicPoints: 24
    },

    visuals: {
        shadowBlur: 0, // Inhabilitado por defecto para rendimiento inicial
        renderBorders: true,
        gridOpacity: 0.04,
        glowEffect: false
    },

    leaderboard: {
        topLimit: 10,
        refreshInterval: 12,
        nameMaxLength: 15,
        panelWidth: 270,
        rowHeight: 22
    },

    hud: {
        version: "0.1",
        statsPanel: {
            x: 12,
            y: 12,
            width: 228,
            height: 190
        },
        minimap: {
            size: 180,
            margin: 20,
            botDotRadius: 2.5,
            playerDotRadius: 4
        }
    }
};

// Expose CONFIG as a global variable for the game scripts
window.CONFIG = CONFIG;