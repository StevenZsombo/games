class OptimizedRecolor { //thank you deepseek
    constructor(width, height) {
        this.width = width
        this.height = height
        this.regions = new Map()
    }
    // One-time setup
    _addRegion(name, indices) {
        const runs = this._indicesToRuns(indices)
        const pixelCount = indices.length
        const runCount = runs.length
        if (runCount < pixelCount / 50) {
            this.regions.set(name, {
                type: 'runs',
                data: this._runsToFlat(runs)
            })
        } else {
            this.regions.set(name, {
                type: 'indices',
                data: new Uint32Array(indices)
            })
        }
    }
    // Frequent call - optimized for speed
    _recolor(name, imageData, r, g, b, a = 255) {
        const region = this.regions.get(name)
        if (!region) return
        const data = imageData.data
        if (region.type === 'runs') {
            // Process runs (fast, cache-friendly)
            const runs = region.data
            for (let i = 0; i < runs.length; i += 2) {
                const start = runs[i]
                const end = runs[i + 1]
                // Manual loop unrolling for extra speed
                let idx = start
                while (idx <= end) {
                    data[idx] = r
                    data[idx + 1] = g
                    data[idx + 2] = b
                    data[idx + 3] = a
                    idx += 4
                    // Process second pixel if within run
                    if (idx <= end) {
                        data[idx] = r
                        data[idx + 1] = g
                        data[idx + 2] = b
                        data[idx + 3] = a
                        idx += 4
                    }
                }
            }
        } else {
            // Direct indices (fastest for fragmented)
            const indices = region.data
            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i]
                data[idx] = r
                data[idx + 1] = g
                data[idx + 2] = b
                data[idx + 3] = a
            }
        }
    }
    _indicesToRuns(indices) {
        if (indices.length === 0) return []
        const runs = []
        let start = indices[0]
        let prev = indices[0]
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] === prev + 4) {
                prev = indices[i]
            } else {
                runs.push([start, prev])
                start = indices[i]
                prev = indices[i]
            }
        }
        runs.push([start, prev])
        return runs
    }

    _runsToFlat(runs) {
        const flat = new Uint32Array(runs.length * 2)
        for (let i = 0; i < runs.length; i++) {
            flat[i * 2] = runs[i][0]
            flat[i * 2 + 1] = runs[i][1]
        }
        return flat
    }
    _floodFillFindIndicesScanline(imageDataObj, startX, startY) {
        startX = Math.round(startX)
        startY = Math.round(startY)

        const { width, height, data } = imageDataObj
        const startIdx = (startY * width + startX) * 4

        const targetR = data[startIdx]
        const targetG = data[startIdx + 1]
        const targetB = data[startIdx + 2]
        const targetA = data[startIdx + 3]

        // Use let instead of const for arrays that need to grow
        let indices = new Uint32Array(1024) // Start with 1K, grow as needed
        let count = 0

        const stack = new Uint32Array(width * height * 2)
        let stackPtr = 0
        stack[stackPtr++] = startX
        stack[stackPtr++] = startY

        const visited = new Uint8Array(width * height)

        while (stackPtr > 0) {
            const py = stack[--stackPtr]
            const px = stack[--stackPtr]

            if (py < 0 || py >= height) continue

            // Find left edge
            let left = px
            while (left >= 0) {
                const pos = py * width + left
                if (visited[pos]) break

                const idx = pos * 4
                if (data[idx] !== targetR || data[idx + 1] !== targetG ||
                    data[idx + 2] !== targetB || data[idx + 3] !== targetA) break
                left--
            }
            left++

            // Find right edge
            let right = px
            while (right < width) {
                const pos = py * width + right
                if (visited[pos]) break

                const idx = pos * 4
                if (data[idx] !== targetR || data[idx + 1] !== targetG ||
                    data[idx + 2] !== targetB || data[idx + 3] !== targetA) break
                right++
            }
            right--

            if (left > right) continue

            // Mark and store the entire run
            for (let x = left; x <= right; x++) {
                const pos = py * width + x
                visited[pos] = 1

                const idx = pos * 4

                // Grow array if needed
                if (count >= indices.length) {
                    const newIndices = new Uint32Array(indices.length * 2)
                    newIndices.set(indices)
                    indices = newIndices  // Now this works because indices is let
                }

                indices[count++] = idx
            }

            // Check above row
            if (py > 0) {
                let spanStart = -1
                for (let x = left; x <= right; x++) {
                    const pos = (py - 1) * width + x
                    if (!visited[pos]) {
                        const idx = pos * 4
                        if (data[idx] === targetR && data[idx + 1] === targetG &&
                            data[idx + 2] === targetB && data[idx + 3] === targetA) {
                            if (spanStart === -1) spanStart = x
                        } else {
                            if (spanStart !== -1) {
                                stack[stackPtr++] = spanStart
                                stack[stackPtr++] = py - 1
                                spanStart = -1
                            }
                        }
                    } else {
                        if (spanStart !== -1) {
                            stack[stackPtr++] = spanStart
                            stack[stackPtr++] = py - 1
                            spanStart = -1
                        }
                    }
                }
                if (spanStart !== -1) {
                    stack[stackPtr++] = spanStart
                    stack[stackPtr++] = py - 1
                }
            }

            // Check below row
            if (py < height - 1) {
                let spanStart = -1
                for (let x = left; x <= right; x++) {
                    const pos = (py + 1) * width + x
                    if (!visited[pos]) {
                        const idx = pos * 4
                        if (data[idx] === targetR && data[idx + 1] === targetG &&
                            data[idx + 2] === targetB && data[idx + 3] === targetA) {
                            if (spanStart === -1) spanStart = x
                        } else {
                            if (spanStart !== -1) {
                                stack[stackPtr++] = spanStart
                                stack[stackPtr++] = py + 1
                                spanStart = -1
                            }
                        }
                    } else {
                        if (spanStart !== -1) {
                            stack[stackPtr++] = spanStart
                            stack[stackPtr++] = py + 1
                            spanStart = -1
                        }
                    }
                }
                if (spanStart !== -1) {
                    stack[stackPtr++] = spanStart
                    stack[stackPtr++] = py + 1
                }
            }
        }

        // Return only the used portion
        return indices.slice(0, count)
    }
}

class Mapster extends OptimizedRecolor {
    /**
     * @param {Array<Array<number,number,number>>>} colors - RGB, used for filling
     * @param {string} imageSourceName 
     * @param {Territory[]} territories 
     * @param {number} x 
     * @param {number} y 
     * @param {function(number):void} update 
     * @param {Object} [options] - Optional parameters
     * @param {number} [options.fillScale=1] - Fill scale factor
     */
    constructor(colors, imageSourceName, x, y, territories, update,
        { fillScale = 1, } = {}) {
        super()
        this.colors = colors
        this.length = territories.length
        this.cached = Array(this.length).fill(null)
        this.current = Array(this.length).fill(null)

        /**@type {HTMLCanvasElement} */
        this.canvas = document.createElement("canvas")
        this.canvas.style.imageRendering = "pixelated" //maybe?
        /**@type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext("2d")
        this.ctx.imageSmoothingEnabled = false
        this.x = x
        this.y = y
        this.fillScale = fillScale

        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.src = imageSourceName
        img.onload = () => {
            this.height = img.height / fillScale
            this.width = img.width / fillScale

            this.canvas.width = this.width
            this.canvas.height = this.height
            this.ctx.drawImage(img, 0, 0, this.width, this.height)
            this.imageData = this.ctx.getImageData(0, 0, this.width, this.height)
            this.data = this.imageData.data

            this._addRegion("bg", this._floodFillFindIndicesScanline(this.imageData, 1, 1))
            this.changeBgColor = (r, g, b, a = 255) => {
                this._recolor("bg", this.imageData, r, g, b, a)//does not work for some reason
                this.ctx.putImageData(this.imageData, 0, 0)
            }
            this.changeBgColor(0, 0, 0, 0)

            territories.forEach(t => {
                const [bX, bY] = this.rectToCoord(t.button)
                const found = this._floodFillFindIndicesScanline(this.imageData, bX, bY)
                this._addRegion(
                    t.id,
                    found
                )
            })

            this.update = update

        }
        this.img = img


    }

    draw(screen) {
        this.redrawWithCache()
        screen.drawImage(this.canvas, this.x, this.y, this.width * this.fillScale, this.height * this.fillScale)
    }



    redrawWithCache() {
        const { length, cached, current } = this
        for (let i = 0; i < length; i++) {
            if (cached[i] !== current[i]) this.redrawProvince(i, current[i])
            cached[i] = current[i]
        }
    }

    redrawProvince(provinceIndex, colorIndex) {
        // this.fillDepr(this.indices[provinceIndex], this.colors[colorIndex])
        if (colorIndex == null) return
        this._recolor(provinceIndex, this.imageData, ...this.colors[colorIndex])
        this.ctx.putImageData(this.imageData, 0, 0)
    }

    reset() {
        this.cached.fill(null)
    }


    posToCoord(x, y) { //always integer
        return [x - this.x, y - this.y].map(u => u / this.fillScale).map(Math.round)
    }
    rectToCoord(rect) {
        return this.posToCoord(rect.centerX, rect.centerY)
    }




}

/**@type {Mapster} */
var mapster






