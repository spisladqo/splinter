import re

def splinter(latex_content, list_mode = "dot"):
    math_patterns = [
        r"\$.*?\$",
        r"\\\[.*?\\\]",
        r"\\\(.*?\\\)",
    ]
    math_pat = "|".join(math_patterns)
    quote_pat = r"\".*?\""

    math_content = []
    def replace_math(match):
        math_content.append(match.group(0))
        return f"{{math_block_{len(math_content)-1}}}"
    
    latex_content = re.sub(math_pat, replace_math, latex_content)

    latex_content = re.sub(r"(?<=\d)\s*-\s*(?=\d)", "{double_minus}", latex_content)
    latex_content = re.sub(r"\s*-\s*", "{triple_minus}", latex_content)

    latex_content = re.sub(r"{double_minus}", "--", latex_content)
    latex_content = re.sub(r"{triple_minus}", "~--- ", latex_content)

    def restore_math(match):
        index = int(match.group(1))
        return math_content[index]
    
    latex_content = re.sub(r"\{math_block_(\d+)\}", restore_math, latex_content)

    latex_content = re.sub(r"\"(.*)\"", r"<<\1>>", latex_content)

    latex_content = re.sub(r"\s*(\\footnote)", r"\1", latex_content)

    latex_content = re.sub(r"\s*(\\cite)", r"~\1", latex_content)

    latex_content = splint_lists(latex_content, list_mode)

    return latex_content

def splint_lists(latex_content, mode = "dot"):
    # may be changed in future
    if not mode == "dot":
        mode = "semicolon"

    list_item_pattern = r"\\item\s*(.*)"

    def correct_item(item, is_last=False):
        item = item.strip()
        if mode == "dot" and item:
            item = item[0].upper() + item[1:]
        elif mode == "semicolon" and item:
            item = item[0].lower() + item[1:]

        if mode == "dot" and not item.endswith('.'):
            item += '.'
        elif mode == "semicolon":
            if not is_last and not item.endswith(';'):
                item = item.rstrip('.') + ';'
            elif is_last and not item.endswith('.'):
                item = item.rstrip(';') +  '.'
        return item

    def process_list(list_content):
        items = re.findall(list_item_pattern, list_content)
        for i, item in enumerate(items):
            is_last = (i == len(items) - 1)
            list_content = list_content.replace(item, correct_item(item, is_last), 1)
        return list_content

    latex_content = re.sub(r"(\\begin{.*}[\s\S]*?\\end{.*})", lambda m: process_list(m.group(1)), latex_content)
    return latex_content
