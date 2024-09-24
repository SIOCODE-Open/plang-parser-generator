const TOP_LEVEL_ELEMENTS = [
    {
        type: "block",
        name: "dashboard_block",
        keyword: "dashboard",
        content: [
            {
                type: "property",
                name: "title",
                keyword: "title",
            },
            {
                type: "property",
                name: "message",
                keyword: "message",
            },
            {
                type: "declaration",
                name: "pre_action",
                keyword: "pre action",
                postkeyword: "goes to",
            },
            {
                type: "declaration",
                name: "post_action",
                keyword: "post action",
                postkeyword: "goes to",
            },
            {
                type: "block",
                name: "stat_widget",
                keyword: "stat widget",
                content: [],
            },
            {
                type: "block",
                name: "message_widget",
                keyword: "msg widget",
                content: [],
            },
            {
                type: "block",
                name: "list_widget",
                keyword: "list widget",
                content: [
                    {
                        type: "property",
                        name: "item",
                        keyword: "item",
                    },
                ],
            },
        ],
    },
    {
        type: "block",
        name: "list_page_block",
        keyword: "list_page",
        content: [
            {
                type: "property",
                name: "title",
                keyword: "title",
            },
            {
                type: "property",
                name: "message",
                keyword: "message",
            },
            {
                type: "typed-declaration",
                name: "column",
                keyword: "column",
                postkeyword: "example",
            },
            {
                type: "declaration",
                name: "pre_action",
                keyword: "pre action",
                postkeyword: "goes to",
            },
            {
                type: "declaration",
                name: "post_action",
                keyword: "post action",
                postkeyword: "goes to",
            },
            {
                type: "declaration",
                name: "item_action",
                keyword: "item action",
                postkeyword: "goes to",
            },
        ],
    },
    {
        type: "block",
        name: "edit_page_block",
        keyword: "edit_page",
        content: [
            {
                type: "property",
                name: "title",
                keyword: "title",
            },
            {
                type: "property",
                name: "message",
                keyword: "message",
            },
            {
                type: "typed-declaration",
                name: "field",
                keyword: "field",
                postkeyword: "example",
            },
            {
                type: "declaration",
                name: "pre_action",
                keyword: "pre action",
                postkeyword: "goes to",
            },
            {
                type: "declaration",
                name: "post_action",
                keyword: "post action",
                postkeyword: "goes to",
            },
        ],
    },
];

// Helper functions
function extractWithinBrackets(text, startIndex, openChar, closeChar) {
    let content = "";
    let bracketCount = 0;
    let foundStart = false;

    for (let i = startIndex; i < text.length; i++) {
        let char = text[i];
        if (!foundStart) {
            if (char === openChar) {
                foundStart = true;
                bracketCount++;
            }
        } else {
            content += char;
            if (char === openChar) bracketCount++;
            if (char === closeChar) bracketCount--;
            if (bracketCount === 0) {
                return {
                    content: content.substring(0, content.length - 1).trim(),
                    endIndex: i,
                };
            }
        }
    }
    return null; // No matching closing bracket found
}

function parse(inputText, topLevelElements = TOP_LEVEL_ELEMENTS) {
    // There are 4 fundamental structures to parse:
    // type: block
    //   The general syntax of blocks is:
    //     KEYWORD NAME [ ANNOTATION ] < GENERIC > ( ARGUMENTS ) { CONTENT }
    //   KEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   NAME is a single word, or some words. It may also contain '.', '-', '_' or '#'.
    //   ANNOTATION is part of a block, surrounded by '[' and ']'. It is arbitrary text between the block characters.
    //   GENERIC is part of a block, surrounded by '<' and '>'. It is arbitrary text between the block characters.
    //   ARGUMENTS is part of a block, surrounded by '(' and ')'. It is arbitrary text between the block characters.
    //   CONTENT is part of a block, surrounded by '{' and '}'. It is arbitrary text between the block characters.
    // type: property
    //   The general syntax of properties is:
    //     KEYWORD VALUE
    //   KEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   VALUE is any text, up to the end of the line.
    // type: typed-declaration
    //   The general syntax of typed-declarations is:
    //     KEYWORD NAME [ ANNOTATION ] < GENERIC > ( ARGUMENTS ) : TYPE POSTKEYWORD POST
    //   KEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   NAME is a single word, or some words. It may also contain '.', '-', '_' or '#'.
    //   ANNOTATION is part of a typed-declaration, surrounded by '[' and ']'. It is arbitrary text between the block characters.
    //   GENERIC is part of a typed-declaration, surrounded by '<' and '>'. It is arbitrary text between the block characters.
    //   ARGUMENTS is part of a typed-declaration, surrounded by '(' and ')'. It is arbitrary text between the block characters.
    //   TYPE is a single word, or some words. The list of valid types is known and fixed.
    //   POSTKEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   POST is any text, up to the end of the line.
    // type: declaration
    //   The general syntax of declarations is:
    //     KEYWORD NAME [ ANNOTATION ] < GENERIC > ( ARGUMENTS ) POSTKEYWORD POST
    //   KEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   NAME is a single word, or some words. It may also contain '.', '-', '_' or '#'.
    //   ANNOTATION is part of a declaration, surrounded by '[' and ']'. It is arbitrary text between the block characters.
    //   GENERIC is part of a declaration, surrounded by '<' and '>'. It is arbitrary text between the block characters.
    //   ARGUMENTS is part of a declaration, surrounded by '(' and ')'. It is arbitrary text between the block characters.
    //   POSTKEYWORD is always a single word, or some words. The list of valid keywords is known and fixed.
    //   POST is any text, up to the end of the line.
    // Comments: Line comments are supported. Any line beginning with '//' is considered a comment. The element starting after one or more comments receives the comment, so it is available for parsing.

    // The parser works like this:
    //   We have a comment buffer, which is [] by default.
    //   We have a context (stack), which is created from the top-level elements by default
    //   We are looking for the first line, that matches a regex in the current context
    //   Based on the keyword, we decide on the exact type of structure to parse
    //   In case of blocks ...
    //     We create a new context from the block, and push it to the stack
    //     We parse the annotation (if any) ...
    //       We look for the first '[' character
    //       We start counting '[' and ']' characters, to find the end of the annotation
    //       We set ANNOTATION to the trimmed text between the '[' and ']' characters
    //     We parse the generic (if any) ...
    //       We look for the first '<' character
    //       We start counting '<' and '>' characters, to find the end of the generic
    //       We set GENERIC to the trimmed text between the '<' and '>' characters
    //     We parse the arguments (if any) ...
    //       We look for the first '(' character
    //       We start counting '(' and ')' characters, to find the end of the arguments
    //       We set ARGUMENTS to the trimmed text between the '(' and ')' characters
    //     We parse the content (if any) ...
    //       We look for the first '{' character
    //       We start counting '{' and '}' characters, to find the end of the content
    //       We set CONTENT to the trimmed text between the '{' and '}' characters
    //     We pop the context from the stack
    //   In case of properties ...
    //     We parse the value ...
    //       We set VALUE to the trimmed text after the keyword
    //   In case of typed-declarations ...
    //     We parse the annotation (if any) ...
    //       We look for the first '[' character
    //       We start counting '[' and ']' characters, to find the end of the annotation
    //       We set ANNOTATION to the trimmed text between the '[' and ']' characters
    //     We parse the generic (if any) ...
    //       We look for the first '<' character
    //       We start counting '<' and '>' characters, to find the end of the generic
    //       We set GENERIC to the trimmed text between the '<' and '>' characters
    //     We parse the arguments (if any) ...
    //       We look for the first '(' character
    //       We start counting '(' and ')' characters, to find the end of the arguments
    //       We set ARGUMENTS to the trimmed text between the '(' and ')' characters
    //     We parse the type, postkeyword and post parts using a regex
    //   In case of declarations ...
    //     We parse the annotation (if any) ...
    //       We look for the first '[' character
    //       We start counting '[' and ']' characters, to find the end of the annotation
    //       We set ANNOTATION to the trimmed text between the '[' and ']' characters
    //     We parse the generic (if any) ...
    //       We look for the first '<' character
    //       We start counting '<' and '>' characters, to find the end of the generic
    //       We set GENERIC to the trimmed text between the '<' and '>' characters
    //     We parse the arguments (if any) ...
    //       We look for the first '(' character
    //       We start counting '(' and ')' characters, to find the end of the arguments
    //       We set ARGUMENTS to the trimmed text between the '(' and ')' characters
    //     We parse the postkeyword and post parts using a regex
    //   In case of comments ...
    //     We add the comment to the comment buffer
    //   In case of empty lines ...
    //     We ignore the line
    //   In case of unknown lines ...
    //     We ignore the line

    let currentIndex = 0;
    let commentBuffer = [];
    let results = [];

    while (currentIndex < inputText.length) {
        const currentLineEndIndex = inputText.indexOf("\n", currentIndex);
        if (currentIndex === currentLineEndIndex) {
            // Empty line
            currentIndex++;
            commentBuffer = [];
            continue;
        }
        const currentLine = inputText
            .substring(
                currentIndex,
                currentLineEndIndex === -1
                    ? inputText.length
                    : currentLineEndIndex
            )
            .trim();

        // Check for comments
        if (currentLine.startsWith("//")) {
            commentBuffer.push(currentLine.substring(2).trim());
            // Move to the next line
            currentIndex = currentLineEndIndex + 1;
            continue;
        }

        const item = { type: "Unknown" };

        // Try to match a top level element
        let matched = false;

        for (let topLevelElement of topLevelElements) {
            const isThisElement = new RegExp(
                `^\\s*${topLevelElement.keyword}\\s+`
            ).test(currentLine);
            if (!matched && isThisElement) {
                if (topLevelElement.type === "block") {
                    // It is a block
                    // Let's first find where it starts (first '{' character)
                    const blockStartIndex = inputText.indexOf(
                        "{",
                        currentIndex
                    );
                    if (blockStartIndex === -1) {
                        // No block start found
                        break;
                    }
                    const blockContent = extractWithinBrackets(
                        inputText,
                        blockStartIndex,
                        "{",
                        "}"
                    );

                    // We should now find the name from the current line
                    const nameMatch = currentLine.match(
                        new RegExp(
                            `\\s*${topLevelElement.keyword}\\s+([a-zA-Z0-9_\\-#\\. ]+)(?:[\\[\\(<{])`
                        )
                    );
                    const name = nameMatch ? nameMatch[1] : null;

                    // Now let's see if the block has annotations
                    // We need to check between currentIndex and blockStartIndex, whether there's a '[' character
                    // If there is, we should extract the annotation
                    let annotation = "";
                    const nextSquareBracketIndex = inputText.indexOf(
                        "[",
                        currentIndex
                    );
                    if (
                        nextSquareBracketIndex !== -1 &&
                        nextSquareBracketIndex < blockStartIndex
                    ) {
                        const annotationContent = extractWithinBrackets(
                            inputText,
                            nextSquareBracketIndex,
                            "[",
                            "]"
                        );
                        annotation = annotationContent.content;
                    }

                    // Extract generics
                    let generic = "";
                    const nextLessThanIndex = inputText.indexOf(
                        "<",
                        currentIndex
                    );
                    if (
                        nextLessThanIndex !== -1 &&
                        nextLessThanIndex < blockStartIndex
                    ) {
                        const genericContent = extractWithinBrackets(
                            inputText,
                            nextLessThanIndex,
                            "<",
                            ">"
                        );
                        generic = genericContent.content;
                    }

                    // Extract arguments
                    let arguments = "";
                    const nextOpenParenthesisIndex = inputText.indexOf(
                        "(",
                        currentIndex
                    );
                    if (
                        nextOpenParenthesisIndex !== -1 &&
                        nextOpenParenthesisIndex < blockStartIndex
                    ) {
                        const argumentsContent = extractWithinBrackets(
                            inputText,
                            nextOpenParenthesisIndex,
                            "(",
                            ")"
                        );
                        arguments = argumentsContent.content;
                    }

                    // Now we parse the content
                    const parsedBlockContent = parse(
                        blockContent.content,
                        topLevelElement.content || []
                    );

                    item.type = topLevelElement.name;
                    item.name = name.trim();
                    item.annotation = annotation.trim();
                    item.generic = generic.trim();
                    item.arguments = arguments.trim();
                    item.content = parsedBlockContent;

                    item.comment = commentBuffer.join("\n");
                    commentBuffer = [];

                    // Add item to results
                    results.push(item);
                    matched = true;

                    // Now we move to the line after the block
                    currentIndex = blockContent.endIndex + 1;
                } else if (topLevelElement.type === "property") {
                    item.type = topLevelElement.name;
                    item.value = currentLine
                        .substring(topLevelElement.keyword.length)
                        .trim();

                    item.comment = commentBuffer.join("\n");
                    commentBuffer = [];

                    results.push(item);
                    matched = true;

                    // Move to next line
                    if (currentLineEndIndex === -1) {
                        // End of input
                        currentIndex = inputText.length;
                    } else {
                        currentIndex = currentLineEndIndex + 1;
                    }
                } else if (topLevelElement.type === "declaration") {
                    // We should now find the name from the current line
                    const nameMatch = currentLine.match(
                        new RegExp(
                            `\\s*${topLevelElement.keyword}\\s+([a-zA-Z0-9_\\-#\\. ]+)(?:[\\[\\(<{])`
                        )
                    );
                    const name = nameMatch ? nameMatch[1] : null;

                    // Now let's see if the declaration has annotations in the current line
                    // We need to check between currentIndex and currentLineEndIndex, whether there's a '[' character
                    // If there is, we should extract the annotation
                    let annotation = "";
                    const nextSquareBracketIndex = inputText.indexOf(
                        "[",
                        currentIndex
                    );
                    if (
                        nextSquareBracketIndex !== -1 &&
                        (nextSquareBracketIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const annotationContent = extractWithinBrackets(
                            inputText,
                            nextSquareBracketIndex,
                            "[",
                            "]"
                        );
                        annotation = annotationContent.content;
                    }

                    // Extract generics
                    let generic = "";
                    const nextLessThanIndex = inputText.indexOf(
                        "<",
                        currentIndex
                    );
                    if (
                        nextLessThanIndex !== -1 &&
                        (nextLessThanIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const genericContent = extractWithinBrackets(
                            inputText,
                            nextLessThanIndex,
                            "<",
                            ">"
                        );
                        generic = genericContent.content;
                    }

                    // Extract arguments
                    let arguments = "";
                    const nextOpenParenthesisIndex = inputText.indexOf(
                        "(",
                        currentIndex
                    );
                    if (
                        nextOpenParenthesisIndex !== -1 &&
                        (nextOpenParenthesisIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const argumentsContent = extractWithinBrackets(
                            inputText,
                            nextOpenParenthesisIndex,
                            "(",
                            ")"
                        );
                        arguments = argumentsContent.content;
                    }

                    // See if it has a postkeyword
                    const postkeywordMatch = currentLine.match(
                        new RegExp(`\\s*${topLevelElement.postkeyword}\\s+`)
                    );
                    if (postkeywordMatch) {
                        item.postkeyword = topLevelElement.postkeyword;
                        item.post = currentLine
                            .substring(
                                postkeywordMatch.index +
                                    postkeywordMatch[0].length
                            )
                            .trim();
                    }

                    item.type = topLevelElement.name;
                    item.name = name.trim();
                    item.annotation = annotation.trim();
                    item.generic = generic.trim();
                    item.arguments = arguments.trim();

                    item.comment = commentBuffer.join("\n");
                    commentBuffer = [];

                    results.push(item);
                    matched = true;

                    // Move to next line
                    if (currentLineEndIndex === -1) {
                        // End of input
                        currentIndex = inputText.length;
                    } else {
                        currentIndex = currentLineEndIndex + 1;
                    }
                } else if (topLevelElement.type === "typed-declaration") {
                    // We should now find the name from the current line
                    const nameMatch = currentLine.match(
                        new RegExp(
                            `\\s*${topLevelElement.keyword}\\s+([a-zA-Z0-9_\\-#\\. ]+)(?:[\\[\\(<{])?\\s*:\\s*`
                        )
                    );
                    const name = nameMatch ? nameMatch[1] : null;

                    // Now we should find the type declaration
                    const typeMatch = currentLine.match(
                        /\s*:\s*([\w]+)(?:\s+)?/
                    );
                    const type = typeMatch ? typeMatch[1] : null;

                    // Now let's see if the block has annotations
                    // We need to check between currentIndex and blockStartIndex, whether there's a '[' character
                    // If there is, we should extract the annotation
                    let annotation = "";
                    const nextSquareBracketIndex = inputText.indexOf(
                        "[",
                        currentIndex
                    );
                    if (
                        nextSquareBracketIndex !== -1 &&
                        (nextSquareBracketIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const annotationContent = extractWithinBrackets(
                            inputText,
                            nextSquareBracketIndex,
                            "[",
                            "]"
                        );
                        annotation = annotationContent.content;
                    }

                    // Extract generics
                    let generic = "";
                    const nextLessThanIndex = inputText.indexOf(
                        "<",
                        currentIndex
                    );
                    if (
                        nextLessThanIndex !== -1 &&
                        (nextLessThanIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const genericContent = extractWithinBrackets(
                            inputText,
                            nextLessThanIndex,
                            "<",
                            ">"
                        );
                        generic = genericContent.content;
                    }

                    // Extract arguments
                    let arguments = "";
                    const nextOpenParenthesisIndex = inputText.indexOf(
                        "(",
                        currentIndex
                    );
                    if (
                        nextOpenParenthesisIndex !== -1 &&
                        (nextOpenParenthesisIndex < currentLineEndIndex ||
                            currentLineEndIndex === -1)
                    ) {
                        const argumentsContent = extractWithinBrackets(
                            inputText,
                            nextOpenParenthesisIndex,
                            "(",
                            ")"
                        );
                        arguments = argumentsContent.content;
                    }

                    // See if it has a postkeyword
                    const postkeywordMatch = currentLine.match(
                        new RegExp(`\\s*${topLevelElement.postkeyword}\\s+`)
                    );
                    if (postkeywordMatch) {
                        item.postkeyword = topLevelElement.postkeyword;
                        item.post = currentLine
                            .substring(
                                postkeywordMatch.index +
                                    postkeywordMatch[0].length
                            )
                            .trim();
                    }

                    item.type = topLevelElement.name;
                    item.name = name.trim();
                    item.declaredtype = type.trim();
                    item.annotation = annotation.trim();
                    item.generic = generic.trim();
                    item.arguments = arguments.trim();

                    item.comment = commentBuffer.join("\n");
                    commentBuffer = [];

                    results.push(item);
                    matched = true;

                    // Move to next line
                    if (currentLineEndIndex === -1) {
                        // End of input
                        currentIndex = inputText.length;
                    } else {
                        currentIndex = currentLineEndIndex + 1;
                    }
                } else {
                    item.type = topLevelElement.name;

                    item.comment = commentBuffer.join("\n");
                    commentBuffer = [];

                    results.push(item);
                    matched = true;

                    // Move to next line
                    if (currentLineEndIndex === -1) {
                        // End of input
                        currentIndex = inputText.length;
                    } else {
                        currentIndex = currentLineEndIndex + 1;
                    }
                }
            }
        }

        if (!matched) {
            // Move to next line
            if (currentLineEndIndex === -1) {
                // End of input
                currentIndex = inputText.length;
            } else {
                currentIndex = currentLineEndIndex + 1;
            }
        }

        if (currentIndex === -1) {
            // End of input
            break;
        }
    }

    return results;
}

module.exports = {
    parse,
};
