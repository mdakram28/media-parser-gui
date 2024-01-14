







import re
import sys


text = """


pred_weight_table( ) { Descriptor
luma_log2_weight_denom ue(v)
if( ChromaArrayType != 0 )
delta_chroma_log2_weight_denom se(v)
for( i = 0; i <= num_ref_idx_l0_active_minus1; i++ )
if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) | |
( PicOrderCnt( RefPicList0[ i ] ) != PicOrderCnt( CurrPic ) ) )
luma_weight_l0_flag[ i ] u(1)
if( ChromaArrayType != 0 )
for( i = 0; i <= num_ref_idx_l0_active_minus1; i++ )
if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) | |
( PicOrderCnt(RefPicList0[ i ]) != PicOrderCnt( CurrPic ) ) )
chroma_weight_l0_flag[ i ] u(1)
for( i = 0; i <= num_ref_idx_l0_active_minus1; i++ ) {
if( luma_weight_l0_flag[ i ] ) {
delta_luma_weight_l0[ i ] se(v)
luma_offset_l0[ i ] se(v)
}
if( chroma_weight_l0_flag[ i ] )
for( j = 0; j < 2; j++ ) {
delta_chroma_weight_l0[ i ][ j ] se(v)
delta_chroma_offset_l0[ i ][ j ] se(v)
}
}
if( slice_type = = B ) {
for( i = 0; i <= num_ref_idx_l1_active_minus1; i++ )
if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) | |
( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
luma_weight_l1_flag[ i ] u(1)
if( ChromaArrayType != 0 )
for( i = 0; i <= num_ref_idx_l1_active_minus1; i++ )
if( ( pic_layer_id( RefPicList0[ i ] ) != nuh_layer_id ) | |
( PicOrderCnt(RefPicList1[ i ]) != PicOrderCnt( CurrPic ) ) )
chroma_weight_l1_flag[ i ] u(1)
for( i = 0; i <= num_ref_idx_l1_active_minus1; i++ ) {
if( luma_weight_l1_flag[ i ] ) {
delta_luma_weight_l1[ i ] se(v)
luma_offset_l1[ i ] se(v)
}
if( chroma_weight_l1_flag[ i ] )
for( j = 0; j < 2; j++ ) {
delta_chroma_weight_l1[ i ][ j ] se(v)
delta_chroma_offset_l1[ i ][ j ] se(v)
}
}
}
}

"""


known_ctx_vars = set()

reg = '(\w+)(:?\[\s*[a-z]+\s*\])?(:?\[\s*[a-z]+\s*\])? u\((\d+|v)\)'
def repl(m):
    # print(m.groups())
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
    # print(line)
    return line

code = re.sub(reg, repl, text)


reg = '(\w+)(:?\[\s*[a-z]+\s*\])?(:?\[\s*[a-z]+\s*\])? (ue|se)\(v\)'
def repl(m):
    # print(m.groups())
    var_name = m.group(1)
    known_ctx_vars.add(var_name)
    if m.group(2) is not None:
        inner = m.group(2)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    if m.group(3) is not None:
        inner = m.group(3)[1:-1].strip()
        var_name += "[${" + inner + "}]"
    
    if m.group(4) == "ue":
        line = f"bs.uvlc(`{var_name}`);"
    elif m.group(4) == "se":
        line = f"bs.svlc(`{var_name}`);"
    else:
        raise Exception("Only uvlc/svlc supported")
        
    # print(line)
    return line

code = re.sub(reg, repl, code)


reg = 'for\s*\(\s*([a-z]+)\s*='
def repl(m):
    return f"for(let {m.group(1)}="

code = re.sub(reg, repl, code)


def addcdot(code):
    lines = code.split("\n")
    for i in range(len(lines)):
        if "bs." in lines[i]:
            continue
        for var_name in known_ctx_vars:
            lines[i] = lines[i].replace(var_name, f"c.{var_name}")
    return "\n".join(lines)

code = addcdot(code)




def format(code):
    tabs = 0
    lines = code.split("\n")
    for i in range(len(lines)):
        lines[i] = lines[i].lstrip()
        lines[i] = "".join(["    "]*tabs) + lines[i]
        tabs -= lines[i].count("}")
        tabs += lines[i].count("{")
        if lines[i].strip() == "}":
            lines[i] = lines[i][4:]
        if lines[i].strip() == "}}":
            lines[i] = lines[i][8:]
            
    return "\n".join(lines)


code = code.replace("= =", "==");
code = code.replace("| |", "||");
code = format(code)


with open(sys.argv[1], "w") as f:
    f.write(code)