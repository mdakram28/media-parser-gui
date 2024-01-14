

from typing import List

known_ctx_vars = set()



def addcdot(lines: List[str]):
    for i in range(len(lines)):
        if "bs." in lines[i]:
            continue
        for var_name in known_ctx_vars:
            lines[i] = lines[i].replace(var_name, f"c.{var_name}")
    return lines

def format_code(lines: List[str]):
    tabs = 0
    for i in range(len(lines)):
        lines[i] = lines[i].lstrip()
        lines[i] = "".join(["    "]*tabs) + lines[i]
        tabs -= lines[i].count("}")
        tabs += lines[i].count("{")
        if lines[i].strip() == "}":
            lines[i] = lines[i][4:]
        if lines[i].strip() == "}}":
            lines[i] = lines[i][8:]
            
    return lines


