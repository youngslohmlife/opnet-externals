"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathVisitor = void 0;
const base_js_1 = require("./base.js");
const index_js_1 = require("./index.js");
class PathVisitor extends base_js_1.BaseVisitor {
    currentPath = [];
    _visit(node) {
        this.currentPath.push(node);
        super._visit(node);
        this.currentPath.pop();
    }
    get currentNode() {
        return this.currentPath[this.currentPath.length - 1];
    }
    get currentParent() {
        if (this.currentPath.length == 1)
            return this.currentNode;
        return this.currentPath[this.currentPath.length - 2];
    }
    get currentParentPath() {
        return this.currentPath.slice(0, this.currentPath.length - 1);
    }
    get currentGrandParentPath() {
        return this.currentPath.length < 3
            ? []
            : this.currentPath.slice(0, this.currentPath.length - 2);
    }
    cloneCurrentNode() {
        return index_js_1.utils.cloneNode(this.currentNode);
    }
    replaceCurrentNode(node) {
        Object.getOwnPropertyNames(this.currentParent).forEach((name) => {
            //@ts-ignore
            const prop = this.currentParent[name];
            if (prop == this.currentNode) {
                //@ts-ignore
                this.currentParent[name] = node;
            }
        });
    }
}
exports.PathVisitor = PathVisitor;
