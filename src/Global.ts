(() => {
    // Fool the typescript compiler.
    require("source-map-support").install();
    require("reflect-metadata");
})();

const findDefined = (v: any) => v !== undefined;
const calculateLength = (v: any) => {
    let index = v.length - 1;
    while (index >= 0 && v[index] === undefined) {
        index--;
    }
    v.length = index + 1;
};

Array.prototype.contains = function(item) {
    return this.indexOf(item) !== -1;
};

Array.prototype.add = function(item) {
    if (this.indexOf(item) !== -1) {
        return false;
    }
    this.push(item);
    return true;
};

Array.prototype.remove = function(item) {
    const index = this.indexOf(item);
    if (index !== -1) {
        this.splice(index, 1);
        calculateLength(this);
        return true;
    }
    return false;
};

Array.prototype.removeFunc = function(func) {
    return this.remove(this.find(func));
};

Array.prototype.removeAll = function(item) {
    let count = 0;
    let index;
    while ((index = this.indexOf(item)) !== -1) {
        this.splice(index, 1);
        count++;
    }
    return count;
};

Array.prototype.removeAllFunc = function(func) {
    return this.removeAll(this.find(func));
};

Array.prototype.first = function() {
    if (!this.length) {
        return undefined;
    }
    if (this[0] !== undefined) {
        return this[0];
    }
    return this.find(findDefined);
};

Array.prototype.last = function() {
    if (!this.length) {
        return undefined;
    }
    if (this[this.length - 1] !== undefined) {
        return this[this.length - 1];
    }
    let index = this.length - 1;
    while (index >= 0 && this[index] === undefined) {
        index--;
    }
    return index >= 0 ? this[index] : undefined;
};

Array.prototype.random = function() {
    const values = this.getValues();
    if (!values.length) {
        return undefined;
    }
    return values[Math.floor(Math.random() * values.length)];
};


Array.prototype.getValues = function() {
    return this.filter(findDefined);
};

Array.prototype.clear = function() {
    this.length = 0;
};

Array.prototype.destroy = function() {
    const items = this.getValues();
    for (const item of items) {
        if (typeof item.destroy === "function") {
            item.destroy();
        }
    }
    this.length = 0;
};
