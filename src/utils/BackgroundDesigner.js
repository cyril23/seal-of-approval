export default class BackgroundDesigner {
    constructor(graphics, width, height) {
        this.graphics = graphics;
        this.width = width;
        this.height = height;
    }

    drawBeachTheme() {
        // Sun removed - will be added as separate sprite in GameScene for display-once behavior

        // Draw three distinct palm trees: small, tall, medium (left to right)
        // Tree 1 (LEFT): Small but visible
        this.drawPalmTree(150, this.height - 50, {
            scale: 0.8,
            bendRight: false,
            segments: 7,  // Was 4, now 7 (added 3)
            trunkBaseWidth: 26,
            trunkTopWidth: 20,
            frondStyle: 'wide',
            frondCount: 14
        });

        // Tree 2 (CENTER): Very tall and slender
        this.drawPalmTree(400, this.height - 50, {
            scale: 1.1,
            bendRight: true,
            segments: 13,  // Was 10, now 13 (added 3)
            trunkBaseWidth: 22,
            trunkTopWidth: 14,
            frondStyle: 'wide',  // Use same style as others
            frondCount: 12
        });

        // Tree 3 (RIGHT): Medium height
        this.drawPalmTree(650, this.height - 50, {
            scale: 0.9,
            bendRight: false,
            segments: 10,  // Was 7, now 10 (added 3)
            trunkBaseWidth: 24,
            trunkTopWidth: 17,
            frondStyle: 'wide',  // Use same style
            frondCount: 13
        });

        // Wave pattern
        this.graphics.lineStyle(2, 0x4682B4, 0.5);
        for (let y = this.height - 60; y < this.height; y += 15) {
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            for (let x = 0; x < this.width; x += 30) {
                this.graphics.lineTo(x, y + Math.sin(x * 0.1) * 5);
            }
            this.graphics.strokePath();
        }
    }

    drawPalmTree(x, groundY, options = {}) {
        // Extract options with defaults
        const scale = options.scale || 1.0;
        const bendRight = options.bendRight || false;
        const segmentCount = options.segments || 7;
        const baseTrunkWidth = options.trunkBaseWidth || 22;
        const topTrunkWidth = options.trunkTopWidth || 16;
        const frondStyle = options.frondStyle || 'balanced';
        const frondCount = options.frondCount || 10;

        const segmentHeight = 25 * scale;
        const trunkHeight = segmentHeight * segmentCount;
        const trunkBaseWidth = baseTrunkWidth * scale;
        const trunkTopWidth = topTrunkWidth * scale;

        // Calculate bend offset for natural curve
        const bendDirection = bendRight ? 1 : -1;
        const maxBend = 15 * scale * bendDirection;

        // Track the actual top position
        let actualTopX = x;
        let actualTopY = groundY;

        // Draw trunk segments with coconut palm texture
        for (let i = 0; i < segmentCount; i++) {
            const segmentY = groundY - (i * segmentHeight);
            const segmentBend = (maxBend * (i / segmentCount)) * Math.sin(i * 0.4);
            const segmentX = x + segmentBend;

            // Update the actual top position for the last segment
            if (i === segmentCount - 1) {
                actualTopX = segmentX;
                actualTopY = segmentY - segmentHeight + 5 * scale;
            }

            // Trunk tapers from bottom to top
            const widthRatio = i / segmentCount;
            const currentWidth = trunkBaseWidth - (trunkBaseWidth - trunkTopWidth) * widthRatio;

            // Trunk segment colors - darker at bottom, lighter at top
            const brownDark = 0x6B4423;
            const brownMid = 0x8B4513;
            const brownLight = 0x9B6633;
            const ratio = i / segmentCount;

            // Main segment with gradient
            const segmentColor = this.interpolateColor(brownDark, brownMid, ratio);
            this.graphics.fillStyle(segmentColor, 1);
            this.graphics.fillRect(
                segmentX - currentWidth/2,
                segmentY - segmentHeight,
                currentWidth,
                segmentHeight
            );

            // Add inverted triangle patterns for coconut bark texture
            this.graphics.fillStyle(0x5C4033, 0.7);

            // Draw V-shaped grooves
            const grooveCount = 3;
            for (let g = 0; g < grooveCount; g++) {
                const grooveY = segmentY - segmentHeight + (segmentHeight / grooveCount) * g + 5 * scale;
                const grooveWidth = currentWidth * 0.3;

                // Left side of V
                this.graphics.fillTriangle(
                    segmentX - currentWidth/2 + 3 * scale, grooveY,
                    segmentX - grooveWidth/2, grooveY + 4 * scale,
                    segmentX - currentWidth/2 + 5 * scale, grooveY + 4 * scale
                );

                // Right side of V
                this.graphics.fillTriangle(
                    segmentX + currentWidth/2 - 3 * scale, grooveY,
                    segmentX + grooveWidth/2, grooveY + 4 * scale,
                    segmentX + currentWidth/2 - 5 * scale, grooveY + 4 * scale
                );
            }

            // Dark edges for 3D effect
            this.graphics.fillStyle(0x4A3018, 0.6);
            this.graphics.fillRect(
                segmentX - currentWidth/2,
                segmentY - segmentHeight,
                2 * scale,
                segmentHeight
            );
            this.graphics.fillRect(
                segmentX + currentWidth/2 - 2 * scale,
                segmentY - segmentHeight,
                2 * scale,
                segmentHeight
            );

            // Horizontal ring line between segments
            this.graphics.fillStyle(0x3E2815, 0.8);
            this.graphics.fillRect(
                segmentX - currentWidth/2,
                segmentY - 2 * scale,
                currentWidth,
                2 * scale
            );
        }

        // Use the actual top position for fronds (calculated from last segment)
        // This ensures fronds are always connected to the trunk regardless of bend

        // Draw palm fronds (leaves) with style variations
        this.drawPalmFronds(actualTopX, actualTopY, scale, frondStyle, frondCount);
    }

    drawPalmFronds(centerX, centerY, scale, style = 'balanced', count = 10) {
        // Define frond patterns based on style
        let fronds = [];

        if (style === 'wide') {
            // Wide spreading fronds for short tree
            const angleSpread = 2.8;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const angle = -angleSpread + (angleSpread * 2) * t;
                const length = 0.85 + Math.sin(t * Math.PI) * 0.2;
                const droop = 0.3 + Math.abs(angle) * 0.15;
                fronds.push({ angle, length, droop });
            }
        } else if (style === 'drooping') {
            // Long drooping fronds for tall tree
            const angleSpread = 2.0;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const angle = -angleSpread + (angleSpread * 2) * t;
                const length = 1.0 + Math.sin(t * Math.PI) * 0.1;
                const droop = 0.5 + Math.abs(angle) * 0.2;
                fronds.push({ angle, length, droop });
            }
        } else {
            // Balanced fronds for medium tree
            const angleSpread = 2.3;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1);
                const angle = -angleSpread + (angleSpread * 2) * t;
                const length = 0.9 + Math.sin(t * Math.PI) * 0.15;
                const droop = 0.4 + Math.abs(angle) * 0.1;
                fronds.push({ angle, length, droop });
            }
        }

        // Adjust base length based on style
        const baseLengthMultiplier = style === 'drooping' ? 85 : style === 'wide' ? 70 : 75;
        const baseLength = baseLengthMultiplier * scale;

        // Draw each frond
        fronds.forEach((frond, index) => {
            const frondLength = baseLength * frond.length;
            const angle = frond.angle;
            const droop = frond.droop;

            // Calculate end position with droop
            const frondEndX = centerX + Math.cos(angle) * frondLength;
            const frondEndY = centerY + Math.sin(angle) * frondLength + (frondLength * droop);

            // Draw frond as a series of connected segments
            const segments = 10;
            const points = [];

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;

                // Create natural curve
                const curveOffset = Math.sin(t * Math.PI) * 8 * scale * (1 - Math.abs(angle) / 2.5);
                const x = centerX + (frondEndX - centerX) * t;
                const y = centerY + (frondEndY - centerY) * t - curveOffset;

                points.push({x, y});
            }

            // Draw the frond spine with gradient thickness
            for (let j = 1; j < points.length; j++) {
                const thickness = (3 - (j / points.length) * 1.5) * scale;
                this.graphics.lineStyle(thickness, 0x2D5016, 1);
                this.graphics.lineBetween(
                    points[j-1].x, points[j-1].y,
                    points[j].x, points[j].y
                );
            }

            // Draw detailed leaves
            this.drawDetailedFrondLeaves(points, angle, scale);
        });
    }

    drawDetailedFrondLeaves(points, baseAngle, scale) {
        // Draw much denser, fuller palm frond leaves
        const baseLeafLength = 30 * scale;

        // Draw leaves along entire frond
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const t = i / (points.length - 1);

            // Don't skip any leaves for fuller appearance

            // Draw multiple layers of leaves for density
            for (let layer = 0; layer < 2; layer++) {
                // Draw leaves on both sides
                for (let side = -1; side <= 1; side += 2) {
                    // Leaf properties vary by position
                    const leafLength = baseLeafLength * (1 - t * 0.5);
                    const layerOffset = layer * 0.15;
                    const leafAngle = baseAngle + (Math.PI / 3.5) * side * (0.6 + t * 0.4) + layerOffset * side;

                    // Create dense jagged palm leaf effect with many small triangles
                    const leafSegments = 5; // More segments for fuller look
                    for (let seg = 0; seg < leafSegments; seg++) {
                        const segT = seg / leafSegments;
                        const segLength = leafLength * (1 - segT * 0.3);

                        // Vary the green colors for natural look
                        const greenShades = [0x228B22, 0x2E7D32, 0x1B5E20, 0x2E8B57];
                        const greenShade = greenShades[(seg + layer) % greenShades.length];
                        const opacity = 0.9 - layer * 0.1 - segT * 0.15;
                        this.graphics.fillStyle(greenShade, opacity);

                        // Offset each segment slightly for feathery appearance
                        const randomOffset = (Math.sin(i * 7 + seg * 3) * 0.1);
                        const baseX = point.x + Math.cos(leafAngle) * (segLength * segT * 0.25);
                        const baseY = point.y + Math.sin(leafAngle) * (segLength * segT * 0.25);

                        // Create longer, thinner leaf segments
                        const tipX = baseX + Math.cos(leafAngle + 0.05 * side + randomOffset) * (segLength * 0.6);
                        const tipY = baseY + Math.sin(leafAngle + 0.05 * side + randomOffset) * (segLength * 0.6);

                        const midX = baseX + Math.cos(leafAngle - 0.05 * side) * (segLength * 0.3);
                        const midY = baseY + Math.sin(leafAngle - 0.05 * side) * (segLength * 0.3);

                        // Draw triangular leaf segment
                        this.graphics.fillTriangle(
                            baseX, baseY,
                            tipX, tipY,
                            midX, midY
                        );

                        // Add extra small leaves between main ones for density
                        if (seg < leafSegments - 1 && layer === 0) {
                            const extraAngle = leafAngle + 0.1 * side;
                            const extraLength = segLength * 0.4;
                            const extraX = baseX + Math.cos(extraAngle) * extraLength;
                            const extraY = baseY + Math.sin(extraAngle) * extraLength;

                            this.graphics.fillStyle(0x388E3C, 0.7);
                            this.graphics.fillTriangle(
                                baseX, baseY,
                                extraX, extraY,
                                baseX + Math.cos(extraAngle - 0.2 * side) * extraLength * 0.5,
                                baseY + Math.sin(extraAngle - 0.2 * side) * extraLength * 0.5
                            );
                        }
                    }
                }
            }
        }
    }

    interpolateColor(color1, color2, ratio) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;
        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.floor(r1 + (r2 - r1) * ratio);
        const g = Math.floor(g1 + (g2 - g1) * ratio);
        const b = Math.floor(b1 + (b2 - b1) * ratio);

        return (r << 16) | (g << 8) | b;
    }

    drawCityTheme() {
        // Phase 1: Sky gradient background (dark to light blue) - smooth gradient
        const gradientSteps = 100; // Increased from 10 to 100 for smooth gradient
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const color = this.interpolateColor(0x0A1929, 0x2E5266, ratio);
            const stepHeight = Math.ceil(this.height / gradientSteps) + 1; // Add 1px overlap to prevent gaps
            this.graphics.fillStyle(color, 1);
            this.graphics.fillRect(0, i * (this.height / gradientSteps), this.width, stepHeight);
        }

        // Stars removed - will be added as animated sprites in GameScene that repeat across level

        // Phase 1: Background layer buildings (distant, low opacity)
        this.graphics.fillStyle(0x2A2A2A, 0.35);
        // Building between first and second main buildings
        this.graphics.fillRect(100, this.height - 520, 70, 470);
        // Building between third and fourth main buildings
        this.graphics.fillRect(380, this.height - 500, 85, 450);
        // Building between fifth and sixth main buildings
        this.graphics.fillRect(680, this.height - 510, 75, 460);
        // Extra background building on far left
        this.graphics.fillRect(10, this.height - 480, 60, 430);

        // Mid-layer building (3rd building at 50% opacity)
        this.graphics.fillStyle(0x3A3A3A, 0.5);
        this.graphics.fillRect(300, this.height - 350, 90, 300);

        // Main buildings silhouettes (foreground layer)
        this.graphics.fillStyle(0x4A4A4A, 0.8);
        this.graphics.fillRect(50, this.height - 300, 80, 250);
        this.graphics.fillRect(150, this.height - 400, 100, 350);
        // Skip 3rd building (already drawn as mid-layer)
        this.graphics.fillRect(450, this.height - 450, 120, 400);
        this.graphics.fillRect(600, this.height - 320, 100, 270);
        this.graphics.fillRect(750, this.height - 380, 80, 330);

        // Phase 3: Building antennas on tallest buildings (longer, no red lights)
        const buildingData = [
            {x: 50, y: this.height - 300, width: 80, height: 250},
            {x: 150, y: this.height - 400, width: 100, height: 350},
            {x: 300, y: this.height - 350, width: 90, height: 300}, // Mid-layer building
            {x: 450, y: this.height - 450, width: 120, height: 400},
            {x: 600, y: this.height - 320, width: 100, height: 270},
            {x: 750, y: this.height - 380, width: 80, height: 330}
        ];

        // Add antennas to buildings with height >= 350 (indices 1, 3)
        const tallBuildings = [1, 3];
        tallBuildings.forEach(index => {
            const building = buildingData[index];
            const antennaX = building.x + building.width / 2;
            const antennaBottom = building.y;
            const antennaHeight = 50; // Increased from 25 to 50px

            // Main antenna pole
            this.graphics.fillStyle(0x333333, 1);
            this.graphics.fillRect(antennaX - 1, antennaBottom - antennaHeight, 2, antennaHeight);

            // Multiple horizontal crossbars for taller antenna
            this.graphics.fillRect(antennaX - 8, antennaBottom - antennaHeight + 10, 16, 1);
            this.graphics.fillRect(antennaX - 6, antennaBottom - antennaHeight + 20, 12, 1);
            this.graphics.fillRect(antennaX - 4, antennaBottom - antennaHeight + 30, 8, 1);
            this.graphics.fillRect(antennaX - 3, antennaBottom - antennaHeight + 40, 6, 1);
        });

        // Red warning lights removed per user request

        // Mid-layer building windows (50% opacity)
        const midBuildingX = 300;
        const midBuildingY = this.height - 350;
        for (let w = 0; w < 3; w++) {
            for (let h = 0; h < 8; h++) {
                const windowY = midBuildingY + 20 + h * 35;
                if (windowY < this.height - 100 && Math.random() > 0.3) {
                    const rand = Math.random();
                    let windowColor;

                    if (rand < 0.7) {
                        windowColor = 0xFFFF99; // Yellow
                    } else if (rand < 0.9) {
                        windowColor = 0x1A1A1A; // Dark gray
                    } else {
                        windowColor = 0x4A4A4A; // Light gray (replaced blue)
                    }

                    this.graphics.fillStyle(windowColor, 0.5); // 50% opacity for mid-layer
                    this.graphics.fillRect(midBuildingX + 10 + w * 25, windowY, 15, 20);
                }
            }
        }

        // Phase 3: Windows with variety (70% yellow, 20% dark gray, 10% light gray - no blue)
        const foregroundBuildings = [0, 1, 3, 4, 5]; // Skip index 2 (mid-layer building)
        foregroundBuildings.forEach(index => {
            const bx = [50, 150, 300, 450, 600, 750][index];
            const by = [this.height - 300, this.height - 400, this.height - 350,
                       this.height - 450, this.height - 320, this.height - 380][index];
            for (let w = 0; w < 3; w++) {
                for (let h = 0; h < 8; h++) {
                    const windowY = by + 20 + h * 35;
                    // Only draw windows if they're not too close to ground
                    if (windowY < this.height - 100 && Math.random() > 0.3) {
                        // Determine window type
                        const rand = Math.random();
                        let windowColor, windowOpacity;

                        if (rand < 0.7) {
                            // 70% - Yellow lit windows
                            windowColor = 0xFFFF99;
                            windowOpacity = 0.7;
                        } else if (rand < 0.9) {
                            // 20% - Dark gray windows (unoccupied)
                            windowColor = 0x1A1A1A;
                            windowOpacity = 0.8;
                        } else {
                            // 10% - Light gray windows (replaced blue TV glow)
                            windowColor = 0x4A4A4A;
                            windowOpacity = 0.6;
                        }

                        this.graphics.fillStyle(windowColor, windowOpacity);
                        this.graphics.fillRect(bx + 10 + w * 25, windowY, 15, 20);
                    }
                }
            }
        });

        // Phase 1: Ground fog effect (gradient from bottom)
        const fogHeight = 150;
        const fogSteps = 10;
        for (let i = 0; i < fogSteps; i++) {
            const ratio = 1 - (i / fogSteps);
            const opacity = 0.25 * ratio; // 25% opacity at bottom
            const stepHeight = fogHeight / fogSteps;
            this.graphics.fillStyle(0x888888, opacity);
            this.graphics.fillRect(0, this.height - (i + 1) * stepHeight, this.width, stepHeight);
        }
    }

    drawOceanTheme() {
        // Waves
        this.graphics.lineStyle(3, 0x2E86AB, 0.6);
        for (let y = 200; y < this.height - 100; y += 40) {
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            for (let x = 0; x < this.width; x += 20) {
                this.graphics.lineTo(x, y + Math.sin(x * 0.05 + y * 0.1) * 10);
            }
            this.graphics.strokePath();
        }

        // Distant ship
        this.graphics.fillStyle(0x333333, 0.7);
        this.graphics.fillRect(this.width - 300, 180, 60, 20);
        this.graphics.fillTriangle(this.width - 300, 180, this.width - 300, 160, this.width - 280, 180);
        this.graphics.fillRect(this.width - 280, 160, 5, 20);
        this.graphics.fillRect(this.width - 260, 150, 5, 30);

        // Hawks
        this.graphics.lineStyle(2, 0xFFFFFF, 0.8);
        const hawks = [[200, 100], [350, 80], [500, 120], [650, 90]];
        hawks.forEach(([x, y]) => {
            this.graphics.beginPath();
            this.graphics.arc(x - 10, y, 10, 0, Math.PI * 0.5);
            this.graphics.strokePath();
            this.graphics.beginPath();
            this.graphics.arc(x + 10, y, 10, Math.PI * 0.5, Math.PI);
            this.graphics.strokePath();
        });
    }

    drawHarborTheme() {
        // Cranes
        this.graphics.fillStyle(0xFF6600, 0.8);
        this.graphics.fillRect(100, this.height - 250, 10, 200);
        this.graphics.fillRect(100, this.height - 250, 80, 10);
        this.graphics.lineStyle(2, 0xFF6600, 0.8);
        this.graphics.lineBetween(100, this.height - 240, 170, this.height - 200);
        this.graphics.lineBetween(170, this.height - 250, 170, this.height - 200);

        // Containers
        this.graphics.fillStyle(0xCC0000, 0.9);
        this.graphics.fillRect(300, this.height - 80, 100, 40);
        this.graphics.fillStyle(0x0066CC, 0.9);
        this.graphics.fillRect(410, this.height - 80, 100, 40);
        this.graphics.fillStyle(0x00CC00, 0.9);
        this.graphics.fillRect(520, this.height - 80, 100, 40);
        this.graphics.fillStyle(0xFFCC00, 0.9);
        this.graphics.fillRect(355, this.height - 120, 100, 40);

        // Dock
        this.graphics.fillStyle(0x8B7355, 1);
        this.graphics.fillRect(0, this.height - 40, this.width, 40);

        // Water reflections
        this.graphics.lineStyle(1, 0x4A90E2, 0.4);
        for (let x = 0; x < this.width; x += 40) {
            this.graphics.lineBetween(x, this.height - 40, x + 20, this.height - 30);
        }
    }

    drawArcticTheme() {
        // Aurora borealis effect
        const auroraColors = [0x00FF00, 0x00FFFF, 0xFF00FF];
        for (let i = 0; i < 3; i++) {
            this.graphics.fillStyle(auroraColors[i], 0.15);
            this.graphics.beginPath();
            this.graphics.moveTo(0, 50 + i * 30);
            for (let x = 0; x <= this.width; x += 20) {
                const y = 80 + i * 40 + Math.sin(x * 0.01) * 30;
                this.graphics.lineTo(x, y);
            }
            this.graphics.lineTo(this.width, 0);
            this.graphics.lineTo(0, 0);
            this.graphics.closePath();
            this.graphics.fillPath();
        }

        // Floating icebergs
        this.graphics.fillStyle(0xCCE5FF, 0.9);
        this.graphics.fillTriangle(150, this.height - 150, 100, this.height - 80, 200, this.height - 80);
        this.graphics.fillTriangle(500, this.height - 120, 450, this.height - 60, 550, this.height - 60);
        this.graphics.fillTriangle(800, this.height - 140, 750, this.height - 70, 850, this.height - 70);

        // Iceberg shading
        this.graphics.fillStyle(0xA8D5E2, 0.6);
        this.graphics.fillTriangle(150, this.height - 150, 150, this.height - 80, 200, this.height - 80);
        this.graphics.fillTriangle(500, this.height - 120, 500, this.height - 60, 550, this.height - 60);
        this.graphics.fillTriangle(800, this.height - 140, 800, this.height - 70, 850, this.height - 70);

        // Snow particles (static for background)
        this.graphics.fillStyle(0xFFFFFF, 0.8);
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 2 + 1;
            this.graphics.fillCircle(x, y, size);
        }

        // Distant mountains
        this.graphics.fillStyle(0x9AC0CD, 0.5);
        this.graphics.fillTriangle(0, this.height - 50, 200, this.height - 300, 400, this.height - 50);
        this.graphics.fillTriangle(300, this.height - 50, 500, this.height - 250, 700, this.height - 50);
        this.graphics.fillTriangle(600, this.height - 50, 800, this.height - 280, 1000, this.height - 50);

        // Ice sheet at bottom
        this.graphics.fillStyle(0xE6F3FF, 1);
        this.graphics.fillRect(0, this.height - 50, this.width, 50);

        // Ice cracks
        this.graphics.lineStyle(1, 0x8AC4D0, 0.5);
        for (let i = 0; i < 5; i++) {
            const startX = Math.random() * this.width;
            this.graphics.beginPath();
            this.graphics.moveTo(startX, this.height - 50);
            this.graphics.lineTo(startX + Math.random() * 100 - 50, this.height - 25);
            this.graphics.lineTo(startX + Math.random() * 100 - 50, this.height);
            this.graphics.strokePath();
        }
    }
}