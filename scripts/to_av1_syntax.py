

import re
import sys
from syntax_util import format_code, known_ctx_vars, addcdot


lines = []
while True:
    try:
        lines.append(input())
    except EOFError:
        break



reg = "(\w+)(:?\[\s*\w+\s*\])?(:?\[\s*\w+\s*\])?\s+f\((\w+)\)"
def repl(m):
    var_name = m.group(1)
    known_ctx_vars.add(var_name)
    if m.group(2) is not None:
        inner = m.group(2)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    if m.group(3) is not None:
        inner = m.group(3)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    bits = m.group(4)
    line = f"bs.f(`{var_name}`, {bits});"
    return line

lines = [re.sub(reg, repl, line) for line in lines]
lines = addcdot(lines)
lines = format_code(lines)


with open(sys.argv[1], "w") as f:
    f.write("\n".join(lines))