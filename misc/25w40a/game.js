/**
 * Fold-and-Cut Theorem Game - WebGL Implementation
 * Implements the mathematical theorem that any shape with straight edges
 * can be created by folding flat paper and making a single straight cut.
 */

// Use Decimal.js for high-precision arithmetic
const Decimal = window.Decimal;
Decimal.set({ precision: 100, rounding: Decimal.ROUND_HALF_UP });

const SCALE = new Decimal(1000000); // Much higher precision

// ============================================================================
// GEOMETRY UTILITIES with Decimal.js for precision
// ============================================================================

class GeometryUtils {
    static pointSideOfLine(point, line) {
        const [l1, l2] = line;
        const px = new Decimal(point[0]);
        const py = new Decimal(point[1]);
        const l1x = new Decimal(l1[0]);
        const l1y = new Decimal(l1[1]);
        const l2x = new Decimal(l2[0]);
        const l2y = new Decimal(l2[1]);

        // Cross product: (p.x - l1.x) * (l2.y - l1.y) - (p.y - l1.y) * (l2.x - l1.x)
        const cross = px.minus(l1x).times(l2y.minus(l1y))
            .minus(py.minus(l1y).times(l2x.minus(l1x)));

        const tolerance = SCALE.dividedBy(100);

        if (cross.abs().lessThanOrEqualTo(tolerance)) {
            return 0; // On line
        } else if (cross.greaterThan(0)) {
            return 1; // Left side
        } else {
            return -1; // Right side
        }
    }

    static reflectPoint(point, line) {
        const [l1, l2] = line;
        const px = new Decimal(point[0]);
        const py = new Decimal(point[1]);
        const l1x = new Decimal(l1[0]);
        const l1y = new Decimal(l1[1]);
        const l2x = new Decimal(l2[0]);
        const l2y = new Decimal(l2[1]);

        // Line direction vector
        const dx = l2x.minus(l1x);
        const dy = l2y.minus(l1y);

        // Normal vector (perpendicular)
        const nx = dy.negated();
        const ny = dx;

        // Vector from line point to target point
        const vx = px.minus(l1x);
        const vy = py.minus(l1y);

        // Dot product: v · n
        const dot = vx.times(nx).plus(vy.times(ny));

        // Length squared of normal
        const nLenSq = nx.times(nx).plus(ny.times(ny));

        // Reflected point: p' = p - 2 * (dot / n_len_sq) * n
        const factor = dot.times(2).dividedBy(nLenSq);
        const rx = px.minus(factor.times(nx));
        const ry = py.minus(factor.times(ny));

        return [rx.toNumber(), ry.toNumber()];
    }

    static reflectPolygon(polygon, line) {
        return polygon.map(p => this.reflectPoint(p, line));
    }

    static lineSegmentIntersection(seg1, seg2) {
        const x1 = new Decimal(seg1[0][0]);
        const y1 = new Decimal(seg1[0][1]);
        const x2 = new Decimal(seg1[1][0]);
        const y2 = new Decimal(seg1[1][1]);
        const x3 = new Decimal(seg2[0][0]);
        const y3 = new Decimal(seg2[0][1]);
        const x4 = new Decimal(seg2[1][0]);
        const y4 = new Decimal(seg2[1][1]);

        const denom = x1.minus(x2).times(y3.minus(y4)).minus(y1.minus(y2).times(x3.minus(x4)));

        if (denom.abs().lessThan(new Decimal(1))) {
            return null; // Parallel or coincident
        }

        const t = x1.minus(x3).times(y3.minus(y4)).minus(y1.minus(y3).times(x3.minus(x4))).dividedBy(denom);
        const u = x1.minus(x2).times(y1.minus(y3)).minus(y1.minus(y2).times(x1.minus(x3))).dividedBy(denom).negated();

        if (t.greaterThanOrEqualTo(0) && t.lessThanOrEqualTo(1) && u.greaterThanOrEqualTo(0) && u.lessThanOrEqualTo(1)) {
            const ix = x1.plus(t.times(x2.minus(x1)));
            const iy = y1.plus(t.times(y2.minus(y1)));
            return [ix.toNumber(), iy.toNumber()];
        }

        return null;
    }

    static lineIntersectsPolygon(line, polygon) {
        const intersections = [];
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const edge = [polygon[i], polygon[(i + 1) % n]];
            const intersection = this.lineSegmentIntersection(line, edge);

            if (intersection) {
                // Check for duplicates
                const isDuplicate = intersections.some(existing => {
                    const dx = new Decimal(existing[0]).minus(intersection[0]).abs();
                    const dy = new Decimal(existing[1]).minus(intersection[1]).abs();
                    const tolerance = SCALE.dividedBy(1000);
                    return dx.lessThan(tolerance) && dy.lessThan(tolerance);
                });

                if (!isDuplicate) {
                    intersections.push(intersection);
                }
            }
        }

        return intersections;
    }

    static splitPolygonByLine(polygon, line) {
        const leftPoly = [];
        const rightPoly = [];
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const current = polygon[i];
            const next = polygon[(i + 1) % n];

            const currentSide = this.pointSideOfLine(current, line);
            const nextSide = this.pointSideOfLine(next, line);

            // Add current point to appropriate side(s)
            if (currentSide >= 0) {
                leftPoly.push([...current]);
            }
            if (currentSide <= 0) {
                rightPoly.push([...current]);
            }

            // Check if edge crosses the line
            if (currentSide * nextSide < 0) {
                const edge = [current, next];
                const intersection = this.lineSegmentIntersection(line, edge);

                if (intersection) {
                    leftPoly.push([...intersection]);
                    rightPoly.push([...intersection]);
                }
            }
        }

        const cleanLeft = this.removeConsecutiveDuplicates(leftPoly);
        const cleanRight = this.removeConsecutiveDuplicates(rightPoly);

        return [
            cleanLeft.length >= 3 ? cleanLeft : [],
            cleanRight.length >= 3 ? cleanRight : []
        ];
    }

    static distanceSq(p1, p2) {
        const dx = new Decimal(p1[0]).minus(p2[0]);
        const dy = new Decimal(p1[1]).minus(p2[1]);
        return dx.times(dx).plus(dy.times(dy));
    }

    static removeConsecutiveDuplicates(polygon) {
        if (!polygon || polygon.length === 0) return [];

        const result = [polygon[0]];
        const toleranceSq = SCALE.dividedBy(1000).pow(2);

        for (let i = 1; i < polygon.length; i++) {
            if (this.distanceSq(polygon[i], result[result.length - 1]).greaterThan(toleranceSq)) {
                result.push(polygon[i]);
            }
        }

        // Check if first and last are duplicates
        if (result.length > 1 && this.distanceSq(result[0], result[result.length - 1]).lessThanOrEqualTo(toleranceSq)) {
            result.pop();
        }

        return result;
    }

    static polygonCentroid(polygon) {
        if (!polygon || polygon.length < 3) {
            return [0, 0];
        }

        let area = new Decimal(0);
        let cx = new Decimal(0);
        let cy = new Decimal(0);

        const n = polygon.length;
        for (let i = 0; i < n; i++) {
            const x0 = new Decimal(polygon[i][0]);
            const y0 = new Decimal(polygon[i][1]);
            const x1 = new Decimal(polygon[(i + 1) % n][0]);
            const y1 = new Decimal(polygon[(i + 1) % n][1]);

            const cross = x0.times(y1).minus(x1.times(y0));
            area = area.plus(cross);
            cx = cx.plus(x0.plus(x1).times(cross));
            cy = cy.plus(y0.plus(y1).times(cross));
        }

        if (area.abs().lessThan(new Decimal('0.0000000001'))) {
            // Degenerate polygon, use simple average
            let sumX = new Decimal(0);
            let sumY = new Decimal(0);
            polygon.forEach(p => {
                sumX = sumX.plus(p[0]);
                sumY = sumY.plus(p[1]);
            });
            return [
                sumX.dividedBy(polygon.length).toNumber(),
                sumY.dividedBy(polygon.length).toNumber()
            ];
        }

        area = area.dividedBy(2);
        cx = cx.dividedBy(area.times(6));
        cy = cy.dividedBy(area.times(6));

        return [cx.toNumber(), cy.toNumber()];
    }

    static normalizePolygon(polygon) {
        if (!polygon || polygon.length < 3) {
            return polygon;
        }

        // Find point with minimum x (and minimum y if tie)
        let startIdx = 0;
        for (let i = 1; i < polygon.length; i++) {
            if (polygon[i][0] < polygon[startIdx][0] ||
                (polygon[i][0] === polygon[startIdx][0] && polygon[i][1] < polygon[startIdx][1])) {
                startIdx = i;
            }
        }

        // Rotate to start with minimum point
        const normalized = [...polygon.slice(startIdx), ...polygon.slice(0, startIdx)];

        // Also check reverse orientation
        const normalizedRev = [polygon[startIdx], ...polygon.slice(startIdx + 1).reverse(), ...polygon.slice(0, startIdx).reverse()];

        // Return the one that's lexicographically smaller
        for (let i = 0; i < normalized.length; i++) {
            if (normalized[i][0] < normalizedRev[i][0]) return normalized;
            if (normalized[i][0] > normalizedRev[i][0]) return normalizedRev;
            if (normalized[i][1] < normalizedRev[i][1]) return normalized;
            if (normalized[i][1] > normalizedRev[i][1]) return normalizedRev;
        }

        return normalized;
    }
}

// ============================================================================
// WEBGL RENDERER
// ============================================================================

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', {
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: false
        });

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        this.initShaders();
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    initShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            uniform vec2 u_resolution;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            uniform vec4 u_color;

            void main() {
                gl_FragColor = u_color;
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.createProgram(vertexShader, fragmentShader);

        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');

        this.positionBuffer = this.gl.createBuffer();
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawPolygon(points, fillColor, strokeColor, strokeWidth = 2) {
        if (points.length < 3) return;

        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);

        // Draw fill
        if (fillColor) {
            const vertices = this.triangulatePolygon(points);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

            this.gl.enableVertexAttribArray(this.positionAttributeLocation);
            this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.uniform4fv(this.colorUniformLocation, fillColor);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
        }

        // Draw stroke
        if (strokeColor) {
            this.drawPolyline([...points, points[0]], strokeColor, strokeWidth);
        }
    }

    drawLine(p1, p2, color, width = 2) {
        this.drawPolyline([p1, p2], color, width);
    }

    drawPolyline(points, color, width) {
        if (points.length < 2) return;

        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);

        // Convert color string to rgba array
        let colorArray;
        if (typeof color === 'string') {
            colorArray = this.colorStringToArray(color);
        } else {
            colorArray = color;
        }

        // Draw line segments as thick quads
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const vertices = this.lineToQuad(p1, p2, width);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

            this.gl.enableVertexAttribArray(this.positionAttributeLocation);
            this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.uniform4fv(this.colorUniformLocation, colorArray);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

    lineToQuad(p1, p2, width) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return [];

        const nx = -dy / len * width / 2;
        const ny = dx / len * width / 2;

        return [
            p1[0] + nx, p1[1] + ny,
            p1[0] - nx, p1[1] - ny,
            p2[0] + nx, p2[1] + ny,
            p2[0] - nx, p2[1] - ny,
            p2[0] + nx, p2[1] + ny,
            p1[0] - nx, p1[1] - ny
        ];
    }

    colorStringToArray(colorStr) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = colorStr;
        const color = ctx.fillStyle;

        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16) / 255;
            const g = parseInt(color.substr(3, 2), 16) / 255;
            const b = parseInt(color.substr(5, 2), 16) / 255;
            return [r, g, b, 1.0];
        }

        return [0, 0, 0, 1.0];
    }

    triangulatePolygon(points) {
        // Simple ear clipping triangulation
        const vertices = [];
        const remaining = points.map(p => [...p]);

        while (remaining.length > 3) {
            let earFound = false;

            for (let i = 0; i < remaining.length; i++) {
                const prev = remaining[(i - 1 + remaining.length) % remaining.length];
                const curr = remaining[i];
                const next = remaining[(i + 1) % remaining.length];

                if (this.isEar(prev, curr, next, remaining)) {
                    vertices.push(prev[0], prev[1], curr[0], curr[1], next[0], next[1]);
                    remaining.splice(i, 1);
                    earFound = true;
                    break;
                }
            }

            if (!earFound) break;
        }

        if (remaining.length === 3) {
            vertices.push(
                remaining[0][0], remaining[0][1],
                remaining[1][0], remaining[1][1],
                remaining[2][0], remaining[2][1]
            );
        }

        return vertices;
    }

    isEar(prev, curr, next, polygon) {
        // Check if triangle is counter-clockwise
        const cross = (curr[0] - prev[0]) * (next[1] - prev[1]) - (curr[1] - prev[1]) * (next[0] - prev[0]);
        if (cross <= 0) return false;

        // Check if any other point is inside the triangle
        for (const point of polygon) {
            if (point === prev || point === curr || point === next) continue;
            if (this.pointInTriangle(point, prev, curr, next)) return false;
        }

        return true;
    }

    pointInTriangle(p, a, b, c) {
        const sign = (p1, p2, p3) => {
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
        };

        const d1 = sign(p, a, b);
        const d2 = sign(p, b, c);
        const d3 = sign(p, c, a);

        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

        return !(hasNeg && hasPos);
    }
}

// ============================================================================
// FOLD AND CUT GAME
// ============================================================================

class FoldAndCutGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new WebGLRenderer(canvas);

        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;

        this.mode = 'fold';
        this.layers = [];
        this.currentLine = null;
        this.lineStart = null;
        this.isUnfolded = false;

        this.setupEventListeners();
        this.reset();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onCanvasMotion.bind(this));

        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
            });
        });

        document.getElementById('executeBtn').addEventListener('click', () => this.execute());
        document.getElementById('unfoldBtn').addEventListener('click', () => this.executeUnfold());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    toInternal(canvasX, canvasY) {
        const x = new Decimal(canvasX).times(SCALE);
        const y = new Decimal(canvasY).times(SCALE);
        return [x.toNumber(), y.toNumber()];
    }

    toCanvas(internalPoint) {
        const x = new Decimal(internalPoint[0]).dividedBy(SCALE);
        const y = new Decimal(internalPoint[1]).dividedBy(SCALE);
        return [x.toNumber(), y.toNumber()];
    }

    reset() {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const size = 200;

        const initialSquare = [
            this.toInternal(centerX - size / 2, centerY - size / 2),
            this.toInternal(centerX + size / 2, centerY - size / 2),
            this.toInternal(centerX + size / 2, centerY + size / 2),
            this.toInternal(centerX - size / 2, centerY + size / 2)
        ];

        this.layers = [{
            polygon: initialSquare,
            transforms: []
        }];

        this.currentLine = null;
        this.lineStart = null;
        this.isUnfolded = false;
        this.render();
    }

    onCanvasClick(event) {
        if (this.isUnfolded) {
            alert('Please reset before making new folds or cuts');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const point = this.toInternal(x, y);

        if (this.lineStart === null) {
            this.lineStart = point;
        } else {
            this.currentLine = [this.lineStart, point];
            this.lineStart = null;
            this.render();
        }
    }

    onCanvasMotion(event) {
        if (this.lineStart !== null && !this.isUnfolded) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const point = this.toInternal(x, y);
            this.currentLine = [this.lineStart, point];
            this.render();
        }
    }

    execute() {
        if (this.mode === 'fold') {
            this.executeFold();
        } else if (this.mode === 'cut') {
            this.executeCut();
        }
    }

    executeFold() {
        if (this.isUnfolded) {
            alert('Please reset before making new folds');
            return;
        }

        if (this.currentLine === null) {
            alert('Please draw a fold line first');
            return;
        }

        const valid = this.validateLineForFold(this.currentLine);
        if (!valid) {
            alert('Fold line must intersect paper at exactly 2 points');
            return;
        }

        const newLayers = [];
        for (const layer of this.layers) {
            const folded = this.foldLayer(layer, this.currentLine);
            newLayers.push(...folded);
        }

        this.layers = newLayers;
        this.currentLine = null;
        this.lineStart = null;
        this.render();
    }

    executeCut() {
        if (this.isUnfolded) {
            alert('Please reset before making new cuts');
            return;
        }

        if (this.currentLine === null) {
            alert('Please draw a cut line first');
            return;
        }

        const valid = this.validateLineForCut(this.currentLine);
        if (!valid) {
            alert('Cut line must intersect paper at exactly 2 points');
            return;
        }

        const newLayers = [];
        for (const layer of this.layers) {
            const cutResult = this.cutLayer(layer, this.currentLine);
            if (cutResult !== null) {
                newLayers.push(cutResult);
            }
        }

        this.layers = newLayers;
        this.currentLine = null;
        this.lineStart = null;

        if (this.layers.length === 0) {
            alert('All paper has been cut away!');
            this.reset();
        } else {
            this.render();
        }
    }

    executeUnfold() {
        if (this.isUnfolded) {
            alert('Already unfolded');
            return;
        }

        this.isUnfolded = true;
        this.render();
    }

    validateLineForFold(line) {
        for (const layer of this.layers) {
            const intersections = GeometryUtils.lineIntersectsPolygon(line, layer.polygon);
            if (intersections.length !== 2) {
                return false;
            }
        }
        return true;
    }

    validateLineForCut(line) {
        let allIntersections = [];
        for (const layer of this.layers) {
            const intersections = GeometryUtils.lineIntersectsPolygon(line, layer.polygon);
            allIntersections.push(...intersections);
        }
        return allIntersections.length >= 2;
    }

    foldLayer(layer, foldLine) {
        const polygon = layer.polygon;
        const [left, right] = GeometryUtils.splitPolygonByLine(polygon, foldLine);

        if (!left || left.length < 3 || !right || right.length < 3) {
            return [layer];
        }

        const centroid = GeometryUtils.polygonCentroid(polygon);
        const leftCentroid = GeometryUtils.polygonCentroid(left);
        const rightCentroid = GeometryUtils.polygonCentroid(right);

        const leftDist = GeometryUtils.distanceSq(leftCentroid, centroid);
        const rightDist = GeometryUtils.distanceSq(rightCentroid, centroid);

        const results = [];

        // The side FURTHER from centroid gets folded (reflected)
        if (leftDist.greaterThan(rightDist)) {
            // Left is further - it folds over onto right
            // Right stays stationary
            results.push({
                polygon: right,
                transforms: [...layer.transforms]
            });
            // Left gets reflected
            const reflected = GeometryUtils.reflectPolygon(left, foldLine);
            results.push({
                polygon: reflected,
                transforms: [...layer.transforms, foldLine]
            });
        } else {
            // Right is further - it folds over onto left
            // Left stays stationary
            results.push({
                polygon: left,
                transforms: [...layer.transforms]
            });
            // Right gets reflected
            const reflected = GeometryUtils.reflectPolygon(right, foldLine);
            results.push({
                polygon: reflected,
                transforms: [...layer.transforms, foldLine]
            });
        }

        return results;
    }

    cutLayer(layer, cutLine) {
        const polygon = layer.polygon;
        const [left, right] = GeometryUtils.splitPolygonByLine(polygon, cutLine);

        const centroid = GeometryUtils.polygonCentroid(polygon);

        // Keep the side CLOSER to centroid
        if (left && left.length >= 3 && right && right.length >= 3) {
            const leftCentroid = GeometryUtils.polygonCentroid(left);
            const rightCentroid = GeometryUtils.polygonCentroid(right);

            const leftDist = GeometryUtils.distanceSq(leftCentroid, centroid);
            const rightDist = GeometryUtils.distanceSq(rightCentroid, centroid);

            if (leftDist.lessThan(rightDist)) {
                return { polygon: left, transforms: [...layer.transforms] };
            } else {
                return { polygon: right, transforms: [...layer.transforms] };
            }
        } else if (left && left.length >= 3) {
            return { polygon: left, transforms: [...layer.transforms] };
        } else if (right && right.length >= 3) {
            return { polygon: right, transforms: [...layer.transforms] };
        }

        return null;
    }

    render() {
        this.renderer.clear();

        if (this.isUnfolded) {
            this.renderUnfolded();
        } else {
            this.renderFolded();
        }
    }

    renderFolded() {
        for (const layer of this.layers) {
            const canvasPoints = layer.polygon.map(p => this.toCanvas(p));
            this.renderer.drawPolygon(
                canvasPoints,
                [0.68, 0.85, 0.9, 1.0], // lightblue
                'black',
                2
            );
        }

        if (this.currentLine !== null) {
            const [p1, p2] = this.currentLine;
            const c1 = this.toCanvas(p1);
            const c2 = this.toCanvas(p2);

            let isValid = false;
            if (this.mode === 'fold') {
                isValid = this.validateLineForFold(this.currentLine);
            } else {
                isValid = this.validateLineForCut(this.currentLine);
            }

            const color = isValid ? 'green' : 'red';
            this.renderer.drawLine(c1, c2, color, 3);
        }
    }

    renderUnfolded() {
        const seenPolygons = new Set();

        for (const layer of this.layers) {
            let polygon = layer.polygon.map(p => [...p]);

            // Unfold by applying transforms in reverse
            for (let i = layer.transforms.length - 1; i >= 0; i--) {
                polygon = GeometryUtils.reflectPolygon(polygon, layer.transforms[i]);
            }

            const normalized = GeometryUtils.normalizePolygon(polygon);
            const polyKey = JSON.stringify(normalized);

            if (!seenPolygons.has(polyKey)) {
                seenPolygons.add(polyKey);
                const canvasPoints = polygon.map(p => this.toCanvas(p));
                this.renderer.drawPolygon(
                    canvasPoints,
                    [1.0, 1.0, 0.8, 1.0], // lightyellow
                    'black',
                    2
                );
            }
        }
    }
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    new FoldAndCutGame(canvas);
});