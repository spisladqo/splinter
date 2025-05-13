import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerCommand('extension.formatLatex', () => {
		const { activeTextEditor } = vscode.window;

		if (activeTextEditor && activeTextEditor.document.languageId === 'latex') {
			const { document } = activeTextEditor;
			const contents = document.getText();

			const config = vscode.workspace.getConfiguration("splinter");
			var mode = config.get("listType", "dot");

			const newContents = lintLatexContent(contents, mode);
			console.log("New contents:", newContents);

			const firstLine = document.lineAt(0);
			const lastLine = document.lineAt(document.lineCount - 1);
			const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

			const edit = new vscode.WorkspaceEdit();
			edit.replace(document.uri, textRange, newContents);
			return vscode.workspace.applyEdit(edit);
		}
	});
}

function lintLatexContent(latexContent: string, listMode: string = "dot"): string {
	const mathPatterns: RegExp[] = [
		/\$(?:\\.|[^\$\\])*\$/g,
		/\\\[(?:\\.|[^\]\\])*\\\]/g,
		/\\\((?:\\.|[^\)\\])*\\\)/g,
	];
	const bracesPattern: RegExp = /{[^{}]*}/g;

	const mathContent: string[] = [];
	const bracesContent: string[] = [];

	for (const pattern of mathPatterns) {
		latexContent = latexContent.replace(pattern, (match: string): string => {
			mathContent.push(match);
			return `{math_block_${mathContent.length - 1}}`;
		});
	}

	latexContent = latexContent.replace(bracesPattern, (match: string): string => {
		bracesContent.push(match);
		return `{braces_block_${bracesContent.length - 1}}`;
	});

	latexContent = latexContent.replace(/(?<=\d)\s*-+\s*(?=\d)/g, "{double_minus}");
	latexContent = latexContent.replace(/(?<!%)\s*~---\s*/g, "{triple_minus}");
	latexContent = latexContent.replace(/(?<!%)\s+-\s+/g, "{triple_minus}");

	latexContent = latexContent.replace(/{double_minus}/g, "--");
	latexContent = latexContent.replace(/{triple_minus}/g, "~--- ");

	latexContent = latexContent.replace(/(?<!%)\s*(\\footnote)/g, "$1");
	latexContent = latexContent.replace(/(?<!%)\s*~*(\\cite)/g, "~$1");

	latexContent = latexContent.replace(/\"(.*?)\"/g, "<<$1>>");

	latexContent = lintLatexList(latexContent, listMode);

	function restoreMath(_: string, index: string): string {
		return mathContent[parseInt(index)];
	}

	function restoreBraces(_: string, index: string): string {
		return bracesContent[parseInt(index)];
	}

	latexContent = latexContent.replace(/{braces_block_(\d+)}/g, restoreBraces);
	latexContent = latexContent.replace(/{math_block_(\d+)}/g, restoreMath);

	return latexContent;
}

function lintLatexList(latexContent: string, mode: string = "dot"): string {
	const listItemPattern: RegExp = /\\item\s*(.*)/g;

	function correctItem(item: string, isLast: boolean = false): string {
		item = item.trim();

		var commentAtEnd = false;
		if (item.endsWith('%')) {
			commentAtEnd = true;
			item = item.slice(0, -1);
		}

		if (mode === "dot" && item) {
			item = item[0].toUpperCase() + item.slice(1);
		} else if (mode === "semicolon" && item) {
			item = item[0].toLowerCase() + item.slice(1);
		}

		if (mode === "dot" && !item.endsWith('.')) {
			item = item.replace(/;$/g, '') + '.';
		} else if (mode === "semicolon") {
			if (!isLast && !item.endsWith(';')) {
				item = item.replace(/\.$/, '') + ';';
			} else if (isLast && !item.endsWith('.')) {
				item = item.replace(/;$/, '') + '.';
			}
		}

		if (commentAtEnd) {
			item += '%';
		}

		return item;
	}

	function processList(listContent: string): string {
		const items: string[] = [];
		let match: RegExpExecArray | null;

		while ((match = listItemPattern.exec(listContent)) !== null) {
			items.push(match[1]);
		}

		items.forEach((item, i) => {
			const isLast = (i === items.length - 1);
			listContent = listContent.replace(item, correctItem(item, isLast));
		});

		return listContent;
	}

	latexContent = latexContent.replace(/(\\begin{.*}[\s\S]*?\\end{.*})/g, (match: string): string => processList(match));

	return latexContent;
}

export function deactivate() { }
