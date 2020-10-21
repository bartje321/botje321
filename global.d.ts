/***/
declare interface Array<T> {
    /**
     * Check if an array contains an item.
     * @param {*} item The item to check.
     * @return {boolean} True if the array contains the item.
     */
    contains(item: T): boolean;

    /**
     * Check if an array contains an item by function.
     * @param {function} func The search function to check.
     * @return {boolean} True if the array contains the item.
     */
    containsFunc(func: (item: T) => boolean): boolean;

    /**
     * Adds an item to the array, if it doesn't exists.
     * @param {object} item The item to add.
     * @return {boolean} True if an item got added.
     */
    add(item: T): boolean;

    /**
     * Deletes an item from the array.
     * @param {object} item The item to remove.
     * @return {boolean} True if an item got removed.
     */
    remove(item: T): boolean;

    /**
     * Deletes an item from the array.
     * @param {function} func The search function to remove.
     * @return {boolean} True if an item got removed.
     */
    removeFunc(func: (item: T) => boolean): boolean;

    /**
     * Deletes all instances of an item from the array.
     * @param {object} item The item to remove.
     * @return {number} The number of deleted items.
     */
    removeAll(item: T): number;

    /**
     * Deletes all instances of an item from the array.
     * @param {function} func The search function to remove.
     * @return {number} The number of deleted items.
     */
    removeAllFunc(func: (item: T) => boolean): number;

    /**
     * Get the first element.
     * @return {*} The first element.
     */
    first(): T | undefined;

    /**
     * Get the last element.
     * @return {*} The last element.
     */
    last(): T | undefined;

    /**
     * Get a random item.
     * @return {T} A random item.
     */
    random(): T | undefined;

    /**
     * Get a new array with all defined values.
     * @return {T[]} The array with cleaned values.
     */
    getValues(): T[];

    /**
     * Clear the array.
     */
    clear(): void;

    /**
     * Destroy all sub elements if apply-able.
     */
    destroy(): void;
}

/***/
declare interface Destroyable {
    /**
     * Destroy the object.
     */
    destroy(): void;
}

/***/
declare type Enum = {[K: number]: string} | {[K: string]: number | string};
