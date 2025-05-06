listMode = "dot"

function lintLatexContent(latexContent, listMode = "dot") {
    const mathPatterns = [
        /\$(?:\\.|[^\$\\])*\$/g,
        /\\\[(?:\\.|[^\]\\])*\]/g,
        /\\\((?:\\.|[^\)\\])*\)/g,
    ];

    let mathContent = [];

    for (const pattern of mathPatterns) {
        latexContent = latexContent.replace(pattern, match => {
            mathContent.push(match);
            return `{math_block_${mathContent.length - 1}}`;
        });
    }

    latexContent = latexContent.replace(/(?<=\d)\s*-+\s*(?=\d)/g, "{double_minus}");
    latexContent = latexContent.replace(/\s*~---\s*/g, "{triple_minus}");

    latexContent = latexContent.replace(/\s*-\s*/g, "{triple_minus}");

    latexContent = latexContent.replace(/{double_minus}/g, "--");
    latexContent = latexContent.replace(/{triple_minus}/g, "~--- ");

    latexContent = latexContent.replace(/\"(.*?)\"/g, "<<$1>>");

    latexContent = latexContent.replace(/\s*(\\footnote)/g, "$1");
    latexContent = latexContent.replace(/\s*~*(\\cite)/g, "~$1");

    latexContent = lintLatexList(latexContent, listMode);

    function restoreMath(match, index) {
        return mathContent[parseInt(index)];
    }

    latexContent = latexContent.replace(/{math_block_(\d+)}/g, restoreMath);

    return latexContent;
}

function lintLatexList(latexContent, mode = "dot") {
    // may be changed in future
    if (mode !== "dot") {
        mode = "semicolon";
    }

    const listItemPattern = /\\item\s*(.*)/g;

    function correctItem(item, isLast = false) {
        item = item.trim();
        if (mode === "dot" && item) {
            item = item[0].toUpperCase() + item.slice(1);
        } else if (mode === "semicolon" && item) {
            item = item[0].toLowerCase() + item.slice(1);
        }

        if (mode === "dot" && !item.endsWith('.')) {
            item += '.';
        } else if (mode === "semicolon") {
            if (!isLast && !item.endsWith(';')) {
                item = item.replace(/\.$/, '') + ';';
            } else if (isLast && !item.endsWith('.')) {
                item = item.replace(/;$/, '') + '.';
            }
        }
        return item;
    }

    function processList(listContent) {
        const items = [];
        let match;
        while ((match = listItemPattern.exec(listContent)) !== null) {
            items.push(match[1]);
        }

        items.forEach((item, i) => {
            const isLast = (i === items.length - 1);
            listContent = listContent.replace(item, correctItem(item, isLast));
        });

        return listContent;
    }

    latexContent = latexContent.replace(/(\\begin{.*}[\s\S]*?\\end{.*})/g, (match) => processList(match));

    return latexContent;
}

function lintOverleafEditor(listMode = "dot") {
    const contentDiv2 = document.querySelector('.cm-content.cm-lineWrapping');

    if (!contentDiv2) {
        console.warn("Could not retrieve Overleaf data.");
        return;
    }

    const lines = Array.from(contentDiv2.querySelectorAll('.cm-line'))
        .map(line => line.textContent);
    const originalText = lines.join('\n');

    const newText = lintLatexContent(originalText, listMode);

    contentDiv2.innerHTML = '';

    newText.split('\n').forEach(lineText => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'cm-line';

        if (lineText.trim() === '') {
            lineDiv.innerHTML = '<br>';
        } else {
            lineDiv.textContent = lineText;
        }

        contentDiv2.appendChild(lineDiv);
    });

    contentDiv2.dispatchEvent(new InputEvent('input', { bubbles: true }));

    console.log("Successfully linted and updated the Overleaf editor.");
}

browser.runtime.onMessage.addListener((message) => {
    if (message.command === "splint") {
        lintOverleafEditor(listMode);
    }
})
