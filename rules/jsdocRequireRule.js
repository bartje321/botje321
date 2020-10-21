"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsdocCommentsWalker = exports.Rule = void 0;
const Lint = require("tslint");
const ts = require("typescript");
class Rule extends Lint.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new JsdocCommentsWalker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
Rule.metadata = {
    ruleName: "jsdoc-require",
    description: "Requires JSDoc comments for class members, interfaces and functions.",
    rationale: "Making sure that all code elements are well documented improves code" +
        " readability. It also helps with JSDoc generation as well as transpilation" +
        " to compilers like Google's closure.",
    optionsDescription: Lint.Utils.dedent `
              Two arguments may be optionally provided:
            * \`"no-classes"\` excludes JSDoc comments on classes
            * \`"no-interfaces"\` excludes JSDoc comments on interfaces
            * \`"no-types"\` excludes JSDoc comments on types
            * \`"no-enums"\` excludes JSDoc comments on enums
            * \`"no-enum-members"\` excludes JSDoc comments on enum members
            * \`"no-methods"\` excludes JSDoc comments on interface specifications and class methods
            * \`"no-constructors"\` excludes JSDoc comments on class constructors
            * \`"no-properties"\` excludes JSDoc comments on class properties
            * \`"no-functions"\` excludes JSDoc comments on all functions
            * \`"no-protected"\` excludes JSDoc comments on protected elements
            * \`"no-private"\` excludes JSDoc comments on private elements
            * \`"no-private-properties"\` excludes private properties from enforcing JSDoc comments.`,
    options: {
        type: "array",
        items: {
            type: "string",
            enum: ["methods", "properties", "functions", "protected", "public", "no-private-properties"],
        },
        minLength: 0,
        maxLength: 6,
    },
    optionExamples: ["true", '[true, "methods", "protected"]'],
    type: "typescript",
    typescriptOnly: false,
};
Rule.FAILURE_STRING_FACTORY = (memberType, memberName) => {
    memberName = memberName == null ? "" : ` '${memberName}'`;
    return `Missing JSDoc element for ${memberType}${memberName}'`;
};
class JsdocCommentsWalker extends Lint.RuleWalker {
    visitClassDeclaration(node) {
        if (!this.hasOption("no-classes")) {
            this.validateJsDocComment(node);
        }
        super.visitClassDeclaration(node);
    }
    visitInterfaceDeclaration(node) {
        if (!this.hasOption("no-interfaces")) {
            this.validateJsDocComment(node);
        }
        super.visitInterfaceDeclaration(node);
    }
    visitTypeAliasDeclaration(node) {
        if (!this.hasOption("no-types")) {
            this.validateJsDocComment(node);
        }
        super.visitTypeAliasDeclaration(node);
    }
    visitEnumDeclaration(node) {
        if (!this.hasOption("no-enums")) {
            this.validateJsDocComment(node);
        }
        super.visitEnumDeclaration(node);
    }
    visitEnumMember(node) {
        if (!this.hasOption("no-enum-members")) {
            this.validateJsDocComment(node);
        }
        super.visitEnumMember(node);
    }
    visitConstructorDeclaration(node) {
        if (!this.hasOption("no-constructors")) {
            this.validateJsDocComment(node);
        }
        super.visitConstructorDeclaration(node);
    }
    visitMethodSignature(node) {
        if (!this.hasOption("no-methods")) {
            this.validateJsDocComment(node);
        }
        super.visitMethodSignature(node);
    }
    visitFunctionDeclaration(node) {
        if (!this.hasOption("no-functions")) {
            this.validateJsDocComment(node);
        }
        super.visitFunctionDeclaration(node);
    }
    visitMethodDeclaration(node) {
        if (!this.hasOption("no-methods")) {
            this.validateJsDocComment(node);
        }
        super.visitMethodDeclaration(node);
    }
    visitPropertyDeclaration(node) {
        if (!this.hasOption("no-properties")) {
            this.validateJsDocComment(node);
        }
        super.visitPropertyDeclaration(node);
    }
    validateJsDocComment(node) {
        const hasPrivateModifiers = Lint.hasModifier(node.modifiers, ts.SyntaxKind.PrivateKeyword);
        const hasProtectedModifiers = Lint.hasModifier(node.modifiers, ts.SyntaxKind.ProtectedKeyword);
        if ((this.hasOption("no-protected") && hasProtectedModifiers) ||
            (this.hasOption("no-private") && hasPrivateModifiers) ||
            (this.hasOption("no-private-properties") && hasPrivateModifiers &&
                node.kind === ts.SyntaxKind.PropertyDeclaration)) {
            return;
        }
        const comment = this.getJsDocCommentsFromText(node, this.getSourceFile().text);
        if (comment && comment.length) {
            return;
        }
        let memberType;
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                memberType = "class declaration";
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                memberType = "interface declaration";
                break;
            case ts.SyntaxKind.EnumDeclaration:
                memberType = "enum declaration";
                break;
            case ts.SyntaxKind.EnumMember:
                memberType = "enum member";
                break;
            case ts.SyntaxKind.TypeAliasDeclaration:
                memberType = "type declaration";
                break;
            case ts.SyntaxKind.MethodSignature:
                memberType = "method declaration";
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                memberType = "function declaration";
                break;
            case ts.SyntaxKind.MethodDeclaration:
                memberType = "class method";
                break;
            case ts.SyntaxKind.PropertyDeclaration:
                memberType = "class property";
                break;
            case ts.SyntaxKind.Constructor:
                memberType = "class constructor";
                break;
            default:
                memberType = "";
        }
        if (hasPrivateModifiers) {
            memberType = "private " + memberType;
        }
        if (hasProtectedModifiers) {
            memberType = "protected " + memberType;
        }
        let memberName = "Unknown";
        node.getChildren().forEach((n) => {
            if (n.kind === ts.SyntaxKind.Identifier) {
                memberName = n.getText();
            }
        });
        const failureString = Rule.FAILURE_STRING_FACTORY(memberType, memberName);
        this.addFailureAt(node.getStart(), node.getWidth(), failureString);
    }
    getJsDocCommentsFromText(node, text) {
        const commentRanges = (node.kind === ts.SyntaxKind.Parameter ||
            node.kind === ts.SyntaxKind.TypeParameter ||
            node.kind === ts.SyntaxKind.FunctionExpression ||
            node.kind === ts.SyntaxKind.ArrowFunction) ?
            (getCommentRanges(text, node.pos, false) || []).concat(getCommentRanges(text, node.pos, true) || []) :
            getCommentRanges(text, node.pos, false);
        return commentRanges ? commentRanges.filter(isJsDocComment) : [];
        function isJsDocComment(comment) {
            return text.charCodeAt(comment.pos + 1) === "*".charCodeAt(0) &&
                text.charCodeAt(comment.pos + 2) === "*".charCodeAt(0) &&
                text.charCodeAt(comment.pos + 3) !== "/".charCodeAt(0);
        }
        function isWhiteSpace(ch) {
            return isWhiteSpaceSingleLine(ch) || isLineBreak(ch);
        }
        function isWhiteSpaceSingleLine(ch) {
            return ch === 32 ||
                ch === 9 ||
                ch === 11 ||
                ch === 12 ||
                ch === 160 ||
                ch === 133 ||
                ch === 5760 ||
                ch >= 8192 && ch <= 8203 ||
                ch === 8239 ||
                ch === 8287 ||
                ch === 12288 ||
                ch === 65279;
        }
        function isLineBreak(ch) {
            return ch === 10 ||
                ch === 13 ||
                ch === 8232 ||
                ch === 8233;
        }
        function lastOrUndefined(array) {
            return array[array.length - 1];
        }
        function getCommentRanges(text, pos, trailing) {
            let result;
            let collecting = trailing || pos === 0;
            while (pos < text.length) {
                const ch = text.charCodeAt(pos);
                switch (ch) {
                    case 13:
                        if (text.charCodeAt(pos + 1) === 10) {
                            pos++;
                        }
                    case 10:
                        pos++;
                        if (trailing) {
                            return result;
                        }
                        collecting = true;
                        if (result && result.length) {
                            lastOrUndefined(result).hasTrailingNewLine = true;
                        }
                        continue;
                    case 9:
                    case 11:
                    case 12:
                    case 32:
                        pos++;
                        continue;
                    case 47:
                        const nextChar = text.charCodeAt(pos + 1);
                        let hasTrailingNewLine = false;
                        if (nextChar === 47 || nextChar === 42) {
                            const kind = nextChar === 47 ?
                                ts.SyntaxKind.SingleLineCommentTrivia :
                                ts.SyntaxKind.MultiLineCommentTrivia;
                            const startPos = pos;
                            pos += 2;
                            if (nextChar === 47) {
                                while (pos < text.length) {
                                    if (isLineBreak(text.charCodeAt(pos))) {
                                        hasTrailingNewLine = true;
                                        break;
                                    }
                                    pos++;
                                }
                            }
                            else {
                                while (pos < text.length) {
                                    if (text.charCodeAt(pos) === 42 && text.charCodeAt(pos + 1) === 47) {
                                        pos += 2;
                                        break;
                                    }
                                    pos++;
                                }
                            }
                            if (collecting) {
                                if (!result) {
                                    result = [];
                                }
                                result.push({
                                    pos: startPos,
                                    end: pos,
                                    hasTrailingNewLine: hasTrailingNewLine,
                                    kind: kind,
                                });
                            }
                            continue;
                        }
                        break;
                    default:
                        if (ch > 127 && (isWhiteSpace(ch))) {
                            if (result && result.length && isLineBreak(ch)) {
                                lastOrUndefined(result).hasTrailingNewLine = true;
                            }
                            pos++;
                            continue;
                        }
                        break;
                }
                return result;
            }
            return result;
        }
    }
}
exports.JsdocCommentsWalker = JsdocCommentsWalker;
