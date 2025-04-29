import { lintLatexContent } from './lintLatexContent.js';

function lintOverleafEditor() {
    const contentDiv2 = document.querySelector('.cm-content.cm-lineWrapping');

    if (!contentDiv2) {
        console.warn("Could not retrieve Overleaf data.");
        return;
    }

    const lines = Array.from(contentDiv2.querySelectorAll('.cm-line'))
        .map(line => line.textContent);
    const originalText = lines.join('\n');

    const newText = lintLatexContent(originalText);

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
