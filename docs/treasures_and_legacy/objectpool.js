class ObjectPool {
  constructor() {
    this.MAX_OBJECTS = 10000; // Set reasonable upper bound
    this.objects = new Uint32Array(this.MAX_OBJECTS); // Stores object references
    this.activeCount = 0;
  }

  add(obj) {
    if (this.activeCount < this.MAX_OBJECTS) {
      this.objects[this.activeCount++] = obj;
      return true;
    }
    return false;
  }

  remove(index) {
    // Fast swap-and-pop
    this.objects[index] = this.objects[--this.activeCount];
    this.objects[this.activeCount] = 0; // Clear reference
  }

  removeBatch(indices) {
    // Sort indices descending for safe removal
    indices.sort((a,b) => b - a).forEach(i => this.remove(i));
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.activeCount; i++) {
      yield this.objects[i];
    }
  }
}