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
        // Phase 1: Water depth gradient (light blue at top to deep blue at bottom)
        const gradientSteps = 50;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            // From light turquoise to deep ocean blue
            const color = this.interpolateColor(0x40E0D0, 0x003366, ratio);
            const stepHeight = Math.ceil(this.height / gradientSteps) + 1;
            this.graphics.fillStyle(color, 1);
            this.graphics.fillRect(0, i * (this.height / gradientSteps), this.width, stepHeight);
        }

        // Phase 2: Sunlight rays filtering through water
        const rayCount = 5;
        for (let i = 0; i < rayCount; i++) {
            const rayX = 150 + i * 200;
            const rayWidth = 60 + Math.sin(i) * 20;
            const rayAngle = -0.3 + Math.sin(i * 0.5) * 0.1;

            // Create light ray with gradient opacity
            for (let y = 0; y < this.height; y += 10) {
                const opacity = 0.08 * (1 - y / this.height);
                this.graphics.fillStyle(0xFFFFE0, opacity);
                const xOffset = y * Math.tan(rayAngle);
                this.graphics.fillRect(rayX + xOffset, y, rayWidth, 10);
            }
        }


        // Phase 3: Kelp forest (multiple layers for depth)
        this.drawKelpForest();



        // Phase 6: Jellyfish
        this.drawJellyfish();

        // Phase 7: Ocean floor
        this.drawOceanFloor();

        // Phase 8: Bubble streams
        this.drawBubbleStreams();


        // Phase 9: Floating sea turtle (mid-ground)
        this.drawSeaTurtle(600, 350);

    }

    drawKelpForest() {
        // Draw multiple kelp strands - some reaching the surface
        const kelpPositions = [
            { x: 80, layer: 0.25, height: 550, sway: 0.5, type: 'wavy' },
            { x: 150, layer: 0.4, height: 720, sway: 0.3, type: 'straight' },  // Reaches surface
            { x: 220, layer: 0.35, height: 500, sway: 0.6, type: 'wavy' },
            { x: 300, layer: 0.3, height: 750, sway: 0.4, type: 'straight' },  // Reaches surface
            { x: 680, layer: 0.3, height: 520, sway: 0.45, type: 'wavy' },
            { x: 780, layer: 0.45, height: 770, sway: 0.35, type: 'straight' }, // Reaches surface
            { x: 880, layer: 0.35, height: 590, sway: 0.5, type: 'wavy' },
            { x: 950, layer: 0.25, height: 740, sway: 0.6, type: 'straight' }   // Reaches surface
        ];

        kelpPositions.forEach(kelp => {
            if (kelp.type === 'wavy') {
                this.drawWavyKelpStrand(kelp.x, this.height - 50, kelp.height, kelp.layer, kelp.sway);
            } else {
                this.drawStraightKelpStrand(kelp.x, this.height - 50, kelp.height, kelp.layer, kelp.sway);
            }
        });
    }

    drawWavyKelpStrand(x, baseY, height, opacity, swayFactor) {
        // Draw wavy kelp like in reference - continuous flowing shape
        const segments = 25;
        const segmentHeight = height / segments;
        
        // Draw main wavy stem
        this.graphics.lineStyle(12, 0x2D5016, opacity);
        this.graphics.beginPath();
        this.graphics.moveTo(x, baseY);
        
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const y = baseY - i * segmentHeight;
            const sway = Math.sin(i * 0.2) * (20 + i * 0.5) * swayFactor;
            points.push({x: x + sway, y: y});
            this.graphics.lineTo(x + sway, y);
        }
        this.graphics.strokePath();
        
        // Add flowing leaves along the stem
        for (let i = 2; i < points.length - 2; i++) {
            if (i % 3 === 0) {
                const point = points[i];
                const leafLength = 40 - i * 0.8;
                const leafAngle = Math.sin(i * 0.5) * 0.5;
                
                // Multiple leaves on each side for fullness
                for (let side = -1; side <= 1; side += 2) {
                    this.graphics.fillStyle(0x3A6624, opacity * 0.7);
                    // Main leaf
                    this.graphics.fillTriangle(
                        point.x, point.y,
                        point.x + leafLength * side, point.y - 10,
                        point.x + leafLength * 0.8 * side, point.y + 10
                    );
                    // Secondary smaller leaf
                    this.graphics.fillStyle(0x4A7634, opacity * 0.5);
                    this.graphics.fillTriangle(
                        point.x, point.y - 5,
                        point.x + leafLength * 0.6 * side, point.y - 12,
                        point.x + leafLength * 0.5 * side, point.y + 5
                    );
                }
            }
        }
    }

    drawStraightKelpStrand(x, baseY, height, opacity, swayFactor) {
        // Draw straighter kelp with regular leaves pattern
        const segments = 20;
        const segmentHeight = height / segments;
        
        // Main stem with slight sway
        for (let i = 0; i < segments; i++) {
            const y = baseY - i * segmentHeight;
            const sway = Math.sin(i * 0.15) * 5 * swayFactor;
            const width = 15 - i * 0.3;
            
            this.graphics.fillStyle(0x2D5016, opacity);
            this.graphics.fillRect(x + sway - width/2, y - segmentHeight, width, segmentHeight);
        }
        
        // Regular pattern of leaves
        for (let i = 1; i < segments; i += 2) {
            const y = baseY - i * segmentHeight;
            const sway = Math.sin(i * 0.15) * 5 * swayFactor;
            
            // Alternating left and right leaves
            const side = (i % 4 === 1) ? -1 : 1;
            const leafBase = x + sway;
            const leafLength = 35 - i * 0.8;
            
            // Main blade
            this.graphics.fillStyle(0x3A6624, opacity * 0.8);
            this.graphics.fillTriangle(
                leafBase, y,
                leafBase + leafLength * side, y - 8,
                leafBase + leafLength * 0.9 * side, y + 8
            );
            
            // Add detail leaves
            this.graphics.fillStyle(0x4A7634, opacity * 0.6);
            this.graphics.fillTriangle(
                leafBase, y - 10,
                leafBase + leafLength * 0.7 * side, y - 15,
                leafBase + leafLength * 0.6 * side, y - 5
            );
            this.graphics.fillTriangle(
                leafBase, y + 10,
                leafBase + leafLength * 0.7 * side, y + 5,
                leafBase + leafLength * 0.6 * side, y + 15
            );
        }
    }


    drawJellyfish() {
        // Draw ethereal jellyfish
        this.drawSingleJellyfish(400, 250, 25, 0.3);
        this.drawSingleJellyfish(800, 180, 20, 0.25);
        this.drawSingleJellyfish(200, 400, 30, 0.35);
        // Additional jellyfish in bottom right
        this.drawSingleJellyfish(850, 500, 22, 0.28);
    }

    drawSingleJellyfish(x, y, size, opacity) {
        // Bell/dome
        this.graphics.fillStyle(0xFFB6C1, opacity);
        this.graphics.fillEllipse(x, y, size, size * 0.7);

        // Inner glow layers for translucency
        this.graphics.fillStyle(0xFFFFFF, opacity * 0.4);
        this.graphics.fillEllipse(x, y - size * 0.2, size * 0.6, size * 0.4);
        this.graphics.fillStyle(0xFFE0F0, opacity * 0.3);
        this.graphics.fillEllipse(x, y, size * 0.8, size * 0.5);

        // Connected flowing tentacles
        for (let i = 0; i < 8; i++) {
            const tentacleX = x - size * 0.7 + (size * 0.175) * i;
            const tentacleLength = size * 2 + Math.sin(i) * size * 0.5;
            
            // Draw thicker tentacle base that tapers
            this.graphics.lineStyle(3, 0xFFB6C1, opacity * 0.5);
            this.graphics.beginPath();
            this.graphics.moveTo(tentacleX, y + size * 0.35);
            
            // Create smooth flowing tentacle
            for (let j = 0; j <= 8; j++) {
                const progress = j / 8;
                const ty = y + size * 0.35 + progress * tentacleLength;
                const wave = Math.sin(progress * Math.PI * 2 + i * 0.5) * (8 - j * 0.5);
                const tx = tentacleX + wave;
                
                // Taper the tentacle
                const thickness = 3 * (1 - progress * 0.7);
                this.graphics.lineStyle(thickness, 0xFFB6C1, opacity * 0.5 * (1 - progress * 0.3));
                
                if (j > 0) {
                    this.graphics.lineTo(tx, ty);
                }
            }
            this.graphics.strokePath();
            
            // Add inner glow to tentacles
            this.graphics.lineStyle(1, 0xFFFFFF, opacity * 0.2);
            this.graphics.beginPath();
            this.graphics.moveTo(tentacleX, y + size * 0.35);
            for (let j = 0; j <= 4; j++) {
                const progress = j / 4;
                const ty = y + size * 0.35 + progress * tentacleLength * 0.5;
                const wave = Math.sin(progress * Math.PI * 2 + i * 0.5) * 4;
                this.graphics.lineTo(tentacleX + wave, ty);
            }
            this.graphics.strokePath();
        }
    }

    drawOceanFloor() {
        // Sandy ocean floor
        this.graphics.fillStyle(0xC2B280, 0.6);
        this.graphics.fillRect(0, this.height - 50, this.width, 50);

        // Sand ripples
        this.graphics.lineStyle(1, 0x8B7355, 0.4);
        for (let x = 0; x < this.width; x += 30) {
            this.graphics.beginPath();
            this.graphics.moveTo(x, this.height - 45);
            this.graphics.lineTo(x + 15, this.height - 40);
            this.graphics.lineTo(x + 30, this.height - 45);
            this.graphics.strokePath();
        }

        // Multiple starfish (original + duplicates)
        this.drawStarfish(250, this.height - 60, 15, 0.6);
        this.drawStarfish(720, this.height - 65, 12, 0.5);
        // Additional starfish
        this.drawStarfish(120, this.height - 58, 14, 0.55);
        this.drawStarfish(380, this.height - 62, 11, 0.5);
        this.drawStarfish(550, this.height - 56, 13, 0.6);
        this.drawStarfish(850, this.height - 63, 10, 0.45);

        // Prominent sunken anchor (tilted on sand)
        this.drawAnchor(480, this.height - 60, 0.7);
    }

    drawStarfish(x, y, size, opacity) {
        this.graphics.fillStyle(0xFF6347, opacity);

        // Draw 5-pointed star
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const nextAngle = (Math.PI * 2 / 5) * (i + 1) - Math.PI / 2;

            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            const x2 = x + Math.cos(angle + Math.PI / 5) * (size * 0.4);
            const y2 = y + Math.sin(angle + Math.PI / 5) * (size * 0.4);

            this.graphics.fillTriangle(x, y, x1, y1, x2, y2);
        }

        // Center dot
        this.graphics.fillStyle(0xFFFFFF, opacity * 0.5);
        this.graphics.fillCircle(x, y, size * 0.2);
    }


    drawAnchor(x, y, opacity) {
        // Tilted anchor lying on sand - draw as if rotated 30 degrees
        this.graphics.fillStyle(0x2C3E50, opacity);
        
        // Main shaft (tilted to the right)
        this.graphics.beginPath();
        this.graphics.moveTo(x - 20, y);
        this.graphics.lineTo(x + 25, y - 35);
        this.graphics.lineTo(x + 30, y - 32);
        this.graphics.lineTo(x - 15, y + 3);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Top ring
        this.graphics.lineStyle(3, 0x2C3E50, opacity);
        this.graphics.strokeCircle(x + 30, y - 38, 8);
        this.graphics.fillStyle(0x40E0D0, 0.2);
        this.graphics.fillCircle(x + 30, y - 38, 5);

        // Left arm (adjusted for tilt)
        this.graphics.fillStyle(0x2C3E50, opacity);
        this.graphics.beginPath();
        this.graphics.moveTo(x - 20, y);
        this.graphics.lineTo(x - 35, y - 5);
        this.graphics.lineTo(x - 40, y - 10);
        this.graphics.lineTo(x - 35, y - 12);
        this.graphics.lineTo(x - 30, y - 8);
        this.graphics.lineTo(x - 18, y - 5);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Left fluke
        this.graphics.fillTriangle(x - 40, y - 10, x - 48, y - 12, x - 38, y - 5);
        
        // Right arm (adjusted for tilt)
        this.graphics.beginPath();
        this.graphics.moveTo(x - 15, y + 2);
        this.graphics.lineTo(x - 5, y - 8);
        this.graphics.lineTo(x - 2, y - 15);
        this.graphics.lineTo(x + 3, y - 14);
        this.graphics.lineTo(x + 2, y - 9);
        this.graphics.lineTo(x - 10, y - 3);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Right fluke
        this.graphics.fillTriangle(x - 2, y - 15, x + 3, y - 20, x + 5, y - 12);

        // Crossbar (tilted)
        this.graphics.beginPath();
        this.graphics.moveTo(x - 5, y - 15);
        this.graphics.lineTo(x + 10, y - 25);
        this.graphics.lineTo(x + 12, y - 22);
        this.graphics.lineTo(x - 3, y - 12);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Rust/aging effect
        this.graphics.fillStyle(0x8B4513, opacity * 0.3);
        this.graphics.fillCircle(x + 5, y - 20, 4);
        this.graphics.fillCircle(x - 30, y - 5, 3);
        this.graphics.fillCircle(x + 20, y - 30, 3);
        
        // Sand partially burying the anchor
        this.graphics.fillStyle(0xC2B280, opacity * 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(x - 50, y + 5);
        this.graphics.lineTo(x + 40, y + 5);
        this.graphics.lineTo(x + 35, y);
        this.graphics.lineTo(x - 45, y);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // More sand mounds
        this.graphics.fillEllipse(x - 15, y + 2, 25, 8);
        this.graphics.fillEllipse(x + 10, y + 1, 20, 6);
    }

    drawBubbleStreams() {
        // Rising bubble columns - more spread out to avoid overlap
        const streams = [
            { x: 150, baseY: this.height - 50, height: 350, bubbleCount: 10 },
            { x: 450, baseY: this.height - 65, height: 280, bubbleCount: 8 },
            { x: 750, baseY: this.height - 55, height: 320, bubbleCount: 9 }
        ];

        streams.forEach(stream => {
            // Create more organized bubble pattern
            for (let i = 0; i < stream.bubbleCount; i++) {
                // Distribute bubbles more evenly along height
                const heightProgress = i / stream.bubbleCount;
                const baseHeight = heightProgress * stream.height;
                const randomOffset = Math.random() * 30 - 15;
                const y = stream.baseY - baseHeight - randomOffset;
                
                // Gentle sway
                const x = stream.x + Math.sin(heightProgress * Math.PI * 2) * 8;
                const size = Math.random() * 3 + 2;
                const opacity = 0.25 - heightProgress * 0.15;

                this.graphics.fillStyle(0xE0FFFF, opacity);
                this.graphics.fillCircle(x, y, size);

                // Highlight on bubble
                this.graphics.fillStyle(0xFFFFFF, opacity * 0.5);
                this.graphics.fillCircle(x - size * 0.3, y - size * 0.3, size * 0.3);
                
                // Add smaller companion bubbles occasionally
                if (i % 3 === 0) {
                    const companionX = x + Math.random() * 10 - 5;
                    const companionY = y + Math.random() * 10 - 5;
                    this.graphics.fillStyle(0xE0FFFF, opacity * 0.7);
                    this.graphics.fillCircle(companionX, companionY, size * 0.5);
                }
            }
        });
    }

    drawSeaTurtle(x, y) {
        const opacity = 0.4;

        // Main shell body (filled, no dark outline)
        this.graphics.fillStyle(0x556B2F, opacity);
        this.graphics.fillEllipse(x, y, 45, 35);

        // Shell pattern - scutes (plates)
        this.graphics.fillStyle(0x6B8E23, opacity * 0.8);
        // Central scutes
        this.graphics.fillRect(x - 8, y - 20, 16, 15);
        this.graphics.fillRect(x - 8, y - 5, 16, 15);
        this.graphics.fillRect(x - 8, y + 10, 16, 12);
        
        // Side scutes
        this.graphics.fillStyle(0x4A5A1F, opacity * 0.7);
        this.graphics.fillRect(x - 25, y - 15, 15, 12);
        this.graphics.fillRect(x + 10, y - 15, 15, 12);
        this.graphics.fillRect(x - 25, y + 3, 15, 12);
        this.graphics.fillRect(x + 10, y + 3, 15, 12);
        
        // Scute borders
        this.graphics.lineStyle(1, 0x2A3A0F, opacity * 0.5);
        this.graphics.strokeRect(x - 8, y - 20, 16, 15);
        this.graphics.strokeRect(x - 8, y - 5, 16, 15);
        this.graphics.strokeRect(x - 8, y + 10, 16, 12);
        this.graphics.strokeRect(x - 25, y - 15, 15, 12);
        this.graphics.strokeRect(x + 10, y - 15, 15, 12);
        this.graphics.strokeRect(x - 25, y + 3, 15, 12);
        this.graphics.strokeRect(x + 10, y + 3, 15, 12);

        // Head (connected to shell)
        this.graphics.fillStyle(0x6B8E23, opacity);
        this.graphics.fillEllipse(x + 38, y - 3, 15, 12);
        // Neck connection
        this.graphics.fillRect(x + 25, y - 8, 20, 10);

        // Front flippers (connected to body)
        this.graphics.fillStyle(0x556B2F, opacity);
        // Top front flipper
        this.graphics.beginPath();
        this.graphics.moveTo(x + 15, y - 18);
        this.graphics.lineTo(x + 45, y - 30);
        this.graphics.lineTo(x + 50, y - 25);
        this.graphics.lineTo(x + 35, y - 10);
        this.graphics.lineTo(x + 20, y - 12);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Bottom front flipper
        this.graphics.beginPath();
        this.graphics.moveTo(x + 15, y + 18);
        this.graphics.lineTo(x + 45, y + 30);
        this.graphics.lineTo(x + 50, y + 25);
        this.graphics.lineTo(x + 35, y + 10);
        this.graphics.lineTo(x + 20, y + 12);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Back flippers (connected to body)
        // Top back flipper
        this.graphics.beginPath();
        this.graphics.moveTo(x - 25, y - 12);
        this.graphics.lineTo(x - 40, y - 18);
        this.graphics.lineTo(x - 42, y - 12);
        this.graphics.lineTo(x - 30, y - 5);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // Bottom back flipper
        this.graphics.beginPath();
        this.graphics.moveTo(x - 25, y + 12);
        this.graphics.lineTo(x - 40, y + 18);
        this.graphics.lineTo(x - 42, y + 12);
        this.graphics.lineTo(x - 30, y + 5);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Eyes
        this.graphics.fillStyle(0x000000, opacity);
        this.graphics.fillCircle(x + 42, y - 5, 2);
        this.graphics.fillStyle(0xFFFFFF, opacity * 0.5);
        this.graphics.fillCircle(x + 43, y - 6, 1);
    }

    drawHarborTheme() {
        // Industrial ocean/water background (full width)
        this.graphics.fillStyle(0x3A5F6F, 0.4);
        this.graphics.fillRect(0, 200, this.width, this.height - 240);

        // Larger cargo ship in far background (more detailed)
        // Ship upper hull (dark grey)
        this.graphics.fillStyle(0x404040, 0.3);
        this.graphics.fillRect(400, 250, 280, 25);
        // Ship lower hull (red/rust colored)
        this.graphics.fillStyle(0x8B4040, 0.3);
        this.graphics.fillRect(400, 275, 280, 15);

        // White superstructure/bridge at stern (right side)
        this.graphics.fillStyle(0xE0E0E0, 0.3);
        this.graphics.fillRect(620, 220, 50, 30);
        this.graphics.fillRect(630, 210, 30, 10);
        this.graphics.fillRect(635, 200, 20, 10);

        // Bridge windows
        this.graphics.fillStyle(0x404040, 0.3);
        this.graphics.fillRect(625, 225, 8, 5);
        this.graphics.fillRect(635, 225, 8, 5);
        this.graphics.fillRect(645, 225, 8, 5);
        this.graphics.fillRect(655, 225, 8, 5);

        // Smokestacks on bridge
        this.graphics.fillStyle(0x505050, 0.3);
        this.graphics.fillRect(640, 195, 4, 5);
        this.graphics.fillRect(646, 195, 4, 5);

        // Container stacks on deck (subtle grey tones)
        this.graphics.fillStyle(0x606060, 0.25);
        this.graphics.fillRect(420, 240, 40, 10);
        this.graphics.fillRect(470, 240, 40, 10);
        this.graphics.fillRect(520, 240, 40, 10);
        this.graphics.fillRect(570, 240, 40, 10);
        this.graphics.fillRect(450, 230, 40, 10);
        this.graphics.fillRect(500, 230, 40, 10);
        this.graphics.fillRect(550, 230, 40, 10);

        // Deck railing line
        this.graphics.lineStyle(1, 0x808080, 0.2);
        this.graphics.lineBetween(400, 250, 680, 250);

        // Smaller cargo ship (side profile, mid-distance)
        // Ship upper hull (dark grey)
        this.graphics.fillStyle(0x404040, 0.4);
        this.graphics.fillRect(750, 240, 160, 20);
        // Ship lower hull (red/rust colored)
        this.graphics.fillStyle(0x8B4040, 0.4);
        this.graphics.fillRect(750, 260, 160, 10);

        // White bridge/superstructure at stern
        this.graphics.fillStyle(0xE0E0E0, 0.4);
        this.graphics.fillRect(860, 215, 40, 25);
        this.graphics.fillRect(870, 205, 20, 10);

        // Bridge windows
        this.graphics.fillStyle(0x404040, 0.4);
        this.graphics.fillRect(865, 220, 6, 4);
        this.graphics.fillRect(873, 220, 6, 4);
        this.graphics.fillRect(881, 220, 6, 4);
        this.graphics.fillRect(889, 220, 6, 4);

        // Smokestack
        this.graphics.fillStyle(0x505050, 0.4);
        this.graphics.fillRect(877, 200, 3, 5);
        this.graphics.fillRect(882, 200, 3, 5);

        // Container stacks (subtle)
        this.graphics.fillStyle(0x606060, 0.3);
        this.graphics.fillRect(760, 232, 30, 8);
        this.graphics.fillRect(795, 232, 30, 8);
        this.graphics.fillRect(830, 232, 25, 8);
        this.graphics.fillRect(780, 224, 30, 8);
        this.graphics.fillRect(815, 224, 30, 8);

        // Deck railing
        this.graphics.lineStyle(1, 0x808080, 0.25);
        this.graphics.lineBetween(750, 240, 910, 240);

        // Background crane (far distance)
        const bgCraneX = 800;
        const bgCraneBase = this.height - 50;

        // Background crane base
        this.graphics.fillStyle(0x505050, 0.4);
        this.graphics.fillRect(bgCraneX - 12, bgCraneBase - 8, 30, 8);

        // Background crane tower
        this.graphics.lineStyle(2, 0xFFD700, 0.4);
        this.graphics.lineBetween(bgCraneX - 6, bgCraneBase - 8, bgCraneX - 4, bgCraneBase - 180);
        this.graphics.lineBetween(bgCraneX + 6, bgCraneBase - 8, bgCraneX + 4, bgCraneBase - 180);
        // Cross bracing
        this.graphics.lineStyle(1, 0xFFD700, 0.3);
        for (let y = 0; y < 160; y += 25) {
            this.graphics.lineBetween(bgCraneX - 6 + y/80, bgCraneBase - 8 - y, bgCraneX + 6 - y/80, bgCraneBase - 8 - y);
        }

        // Background crane cabin
        this.graphics.fillStyle(0x4682B4, 0.4);
        this.graphics.fillRect(bgCraneX - 10, bgCraneBase - 195, 20, 18);

        // Background crane jib
        this.graphics.lineStyle(2, 0xFFD700, 0.4);
        this.graphics.lineBetween(bgCraneX, bgCraneBase - 180, bgCraneX + 100, bgCraneBase - 165);

        // Background crane cable
        this.graphics.lineStyle(1, 0x000000, 0.3);
        this.graphics.lineBetween(bgCraneX + 100, bgCraneBase - 165, bgCraneX + 100, bgCraneBase - 80);

        // Main Harbor Crane (with reduced opacity)
        const craneX = 100;
        const craneBase = this.height - 50;

        // Crane base/foundation
        this.graphics.fillStyle(0x505050, 0.7);
        this.graphics.fillRect(craneX - 15, craneBase - 10, 40, 10);

        // Crane tower (lattice structure)
        this.graphics.lineStyle(3, 0xFFD700, 0.7);
        // Main vertical posts
        this.graphics.lineBetween(craneX - 8, craneBase - 10, craneX - 5, craneBase - 250);
        this.graphics.lineBetween(craneX + 8, craneBase - 10, craneX + 5, craneBase - 250);
        // Cross bracing
        this.graphics.lineStyle(1, 0xFFD700, 0.6);
        for (let y = 0; y < 200; y += 20) {
            this.graphics.lineBetween(craneX - 8 + y/100, craneBase - 10 - y, craneX + 8 - y/100, craneBase - 10 - y);
            if (y % 40 === 0) {
                this.graphics.lineBetween(craneX - 8 + y/100, craneBase - 10 - y, craneX + 8 - y/100, craneBase - 30 - y);
                this.graphics.lineBetween(craneX + 8 - y/100, craneBase - 10 - y, craneX - 8 + y/100, craneBase - 30 - y);
            }
        }

        // Operator cabin
        this.graphics.fillStyle(0x4682B4, 0.7);
        this.graphics.fillRect(craneX - 15, craneBase - 270, 30, 25);
        // Cabin window
        this.graphics.fillStyle(0x87CEEB, 0.7);
        this.graphics.fillRect(craneX - 12, craneBase - 267, 24, 15);

        // Jib/boom arm
        this.graphics.lineStyle(3, 0xFFD700, 0.7);
        this.graphics.lineBetween(craneX, craneBase - 250, craneX + 150, craneBase - 230);
        // Jib support structure
        this.graphics.lineStyle(1, 0xFFD700, 0.6);
        for (let x = 0; x < 150; x += 15) {
            this.graphics.lineBetween(craneX + x, craneBase - 250 + x/7.5, craneX + x, craneBase - 235 + x/7.5);
        }

        // Counterweight
        this.graphics.fillStyle(0x606060, 0.7);
        this.graphics.fillRect(craneX - 40, craneBase - 260, 25, 30);

        // Cable and hook
        this.graphics.lineStyle(2, 0x000000, 0.6);
        this.graphics.lineBetween(craneX + 150, craneBase - 230, craneX + 150, craneBase - 100);
        // Hook
        this.graphics.lineStyle(3, 0x808080, 0.7);
        this.graphics.beginPath();
        this.graphics.arc(craneX + 150, craneBase - 95, 8, 0, Math.PI);
        this.graphics.strokePath();

        // Detailed shipping containers with corrugation (more subtle)
        const drawContainer = (x, y, width, height, color, label) => {
            // Main container body - reduced opacity
            this.graphics.fillStyle(color, 0.6);
            this.graphics.fillRect(x, y, width, height);

            // Corrugation (vertical lines) - very subtle
            this.graphics.lineStyle(1, 0x000000, 0.1);
            for (let i = x + 4; i < x + width; i += 6) {
                this.graphics.lineBetween(i, y + 2, i, y + height - 2);
            }

            // Container doors
            this.graphics.fillStyle(0x000000, 0.1);
            this.graphics.fillRect(x + width - 15, y + 5, 12, height - 10);

            // Door handles/locks
            this.graphics.fillStyle(0xC0C0C0, 0.6);
            this.graphics.fillCircle(x + width - 9, y + height/2, 2);

            // Shipping label/number
            this.graphics.fillStyle(0xFFFFFF, 0.5);
            this.graphics.fillRect(x + 5, y + 5, 30, 10);

            // Top and bottom rails
            this.graphics.fillStyle(0x000000, 0.2);
            this.graphics.fillRect(x, y, width, 3);
            this.graphics.fillRect(x, y + height - 3, width, 3);

            // Corner posts
            this.graphics.fillStyle(0x000000, 0.25);
            this.graphics.fillRect(x, y, 3, height);
            this.graphics.fillRect(x + width - 3, y, 3, height);
        };

        // Stack of containers (more realistic placement)
        drawContainer(280, this.height - 80, 100, 40, 0xCC0000, "MAERSK");
        drawContainer(385, this.height - 80, 100, 40, 0x0066CC, "COSCO");
        drawContainer(490, this.height - 80, 100, 40, 0x00CC00, "EVERGREEN");

        // Second layer
        drawContainer(330, this.height - 120, 100, 40, 0xFFCC00, "MSC");
        drawContainer(435, this.height - 120, 100, 40, 0xFF6600, "APL");

        // Third layer
        drawContainer(380, this.height - 160, 100, 40, 0x9932CC, "ONE");

        // Seagulls (pixel-art style based on reference images)
        // First seagull at x:300, y:120 (the one user likes)
        this.graphics.fillStyle(0xFFFFFF, 0.7); // White body
        this.graphics.fillRect(295, 120, 10, 4); // Body
        // Left wing
        this.graphics.fillRect(285, 118, 10, 3);
        this.graphics.fillRect(280, 117, 5, 2);
        // Right wing
        this.graphics.fillRect(305, 118, 10, 3);
        this.graphics.fillRect(315, 117, 5, 2);
        // Wing tips (dark)
        this.graphics.fillStyle(0x404040, 0.7);
        this.graphics.fillRect(278, 116, 3, 2);
        this.graphics.fillRect(319, 116, 3, 2);
        // Beak
        this.graphics.fillStyle(0xFFD700, 0.7);
        this.graphics.fillRect(293, 121, 2, 1);

        // Second similar seagull at x:350, y:130 (more transparent, forming triangle)
        this.graphics.fillStyle(0xFFFFFF, 0.5); // More transparent
        this.graphics.fillRect(345, 130, 10, 4); // Body
        // Left wing
        this.graphics.fillRect(335, 128, 10, 3);
        this.graphics.fillRect(330, 127, 5, 2);
        // Right wing
        this.graphics.fillRect(355, 128, 10, 3);
        this.graphics.fillRect(365, 127, 5, 2);
        // Wing tips (dark)
        this.graphics.fillStyle(0x404040, 0.5);
        this.graphics.fillRect(328, 126, 3, 2);
        this.graphics.fillRect(369, 126, 3, 2);
        // Beak
        this.graphics.fillStyle(0xFFD700, 0.5);
        this.graphics.fillRect(343, 131, 2, 1);

        // Third similar seagull at x:250, y:130 (even more transparent)
        this.graphics.fillStyle(0xFFFFFF, 0.45); // Even more transparent
        this.graphics.fillRect(245, 130, 10, 4); // Body
        // Left wing
        this.graphics.fillRect(235, 128, 10, 3);
        this.graphics.fillRect(230, 127, 5, 2);
        // Right wing
        this.graphics.fillRect(255, 128, 10, 3);
        this.graphics.fillRect(265, 127, 5, 2);
        // Wing tips (dark)
        this.graphics.fillStyle(0x404040, 0.45);
        this.graphics.fillRect(228, 126, 3, 2);
        this.graphics.fillRect(269, 126, 3, 2);
        // Beak
        this.graphics.fillStyle(0xFFD700, 0.45);
        this.graphics.fillRect(243, 131, 2, 1);

        // Rightmost seagull at x:750, y:140 (with clearer, more spread wings)
        this.graphics.fillStyle(0xFFFFFF, 0.65);
        this.graphics.fillRect(746, 140, 12, 4); // Slightly larger body
        // Left wing - more extended and visible
        this.graphics.fillRect(730, 138, 16, 4);
        this.graphics.fillRect(720, 137, 10, 3);
        this.graphics.fillRect(714, 136, 6, 2);
        // Right wing - more extended and visible
        this.graphics.fillRect(758, 138, 16, 4);
        this.graphics.fillRect(774, 137, 10, 3);
        this.graphics.fillRect(784, 136, 6, 2);
        // Wing tips (dark) - more prominent
        this.graphics.fillStyle(0x404040, 0.65);
        this.graphics.fillRect(710, 135, 5, 3);
        this.graphics.fillRect(789, 135, 5, 3);
        // Beak
        this.graphics.fillStyle(0xFFD700, 0.65);
        this.graphics.fillRect(744, 141, 2, 1);

        // Dock with texture
        this.graphics.fillStyle(0x8B7355, 1);
        this.graphics.fillRect(0, this.height - 40, this.width, 40);

        // Dock planks
        this.graphics.lineStyle(1, 0x6B5D46, 0.5);
        for (let x = 0; x < this.width; x += 30) {
            this.graphics.lineBetween(x, this.height - 40, x, this.height);
        }

        // Simple industrial water (no decorative elements)
        this.graphics.fillStyle(0x4682B4, 0.3);
        this.graphics.fillRect(0, this.height - 40, this.width, 40);
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