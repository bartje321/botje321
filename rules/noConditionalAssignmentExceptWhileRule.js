"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const tsutils_1 = require("tsutils");
const ts = require("typescript");
const Lint = require("tslint");
class Rule extends Lint.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithFunction(sourceFile, walk);
    }
}
exports.Rule = Rule;
Rule.metadata = {
    ruleName: "no-conditional-assignment-except-while",
    description: "Disallows any type of assignment in conditionals.",
    descriptionDetails: "This applies to ``for`, `if`, and `while` statements and conditional (ternary) expressions.",
    rationale: Lint.Utils.dedent `
            Assignments in conditionals are often typos:
            for example \`if (var1 = var2)\` instead of \`if (var1 == var2)\`.
            They also can be an indicator of overly clever code which decreases maintainability.`,
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: [true],
    type: "functionality",
    typescriptOnly: false,
};
Rule.FAILURE_STRING = "Assignments in conditional expressions are forbidden";
function walk(ctx) {
    let checking = 0;
    return ts.forEachChild(ctx.sourceFile, cb);
    function cb(node) {
        const kind = node.kind;
        if (!tsutils_1.isNodeKind(kind)) {
            return;
        }
        switch (kind) {
            case ts.SyntaxKind.ConditionalExpression:
                check(node.condition);
                cb(node.whenTrue);
                cb(node.whenFalse);
                return;
            case ts.SyntaxKind.IfStatement:
                check(node.expression);
                cb(node.thenStatement);
                maybeCallback(cb, node.elseStatement);
                return;
            case ts.SyntaxKind.ForStatement:
                maybeCallback(cb, node.initializer);
                maybeCallback(check, node.condition);
                maybeCallback(cb, node.incrementor);
                cb(node.statement);
                return;
        }
        if (checking !== 0) {
            switch (kind) {
                case ts.SyntaxKind.BinaryExpression:
                    if (tsutils_1.isAssignmentKind(node.operatorToken.kind)) {
                        ctx.addFailureAtNode(node, Rule.FAILURE_STRING);
                    }
                    cb(node.left);
                    cb(node.right);
                    return;
                case ts.SyntaxKind.ParenthesizedExpression:
                case ts.SyntaxKind.NonNullExpression:
                case ts.SyntaxKind.AsExpression:
                case ts.SyntaxKind.TypeAssertionExpression:
                    return cb(node.expression);
                case ts.SyntaxKind.PrefixUnaryExpression:
                    return cb(node.operand);
                default:
                    return noCheck(node);
            }
        }
        return ts.forEachChild(node, cb);
    }
    function check(node) {
        ++checking;
        cb(node);
        --checking;
    }
    function noCheck(node) {
        const old = checking;
        checking = 0;
        ts.forEachChild(node, cb);
        checking = old;
    }
}
function maybeCallback(cb, node) {
    if (node !== undefined) {
        cb(node);
    }
}
