import re

def splinter(latex_content):
    math_patterns = [
        r"\$.*?\$",
        r"\\\[.*?\\\]",
        r"\\\(.*?\\\)",
    ]
    math_pat = "|".join(math_patterns)

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

    return latex_content