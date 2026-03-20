import random
import re

def parse_input(filename):
    nodes, adj = [], {}
    with open(filename) as f:
        section = None
        for raw in f:
            line = raw.strip()
            if not line: continue
            if line == "V": section = "V"; continue
            if line == "E": section = "E"; continue
            if section == "V":
                m = re.fullmatch(r"\((.+?)\)", line)
                if m:
                    nodes.append(m.group(1))
                    adj[m.group(1)] = []
            elif section == "E":
                m = re.fullmatch(r"\((.+?)\)-\((.+?)\)-([\d.]+)", line)
                if m:
                    u, v, w = m.group(1), m.group(2), float(m.group(3))
                    adj[u].append((v, w))
                    adj[v].append((u, w))
    return nodes, adj

def cut_weight(set_a, adj):
    return sum(w for u in set_a for v, w in adj[u] if v not in set_a)

def local_search(nodes, adj, seed=None):
    random.seed(seed)
    set_a = set(random.sample(nodes, k=len(nodes) // 2))
    set_b = set(nodes) - set_a

    def gain(v):
        in_a = v in set_a
        same = sum(w for n, w in adj[v] if (n in set_a) == in_a)
        other = sum(w for n, w in adj[v] if (n in set_a) != in_a)
        return same - other

    improved = True
    while improved:
        improved = False
        best_v, best_gain = None, 0.0
        for v in nodes:
            g = gain(v)
            if g > best_gain:
                best_gain, best_v = g, v
        if best_v:
            if best_v in set_a:
                set_a.remove(best_v)
                set_b.add(best_v)
            else:
                set_b.remove(best_v)
                set_a.add(best_v)
            improved = True

    return set_a, set_b, cut_weight(set_a, adj)

nodes, adj = parse_input("input.txt")
best_a, best_b, best_weight = set(), set(), -1.0
for i in range(10):
    a, b, w = local_search(nodes, adj, seed=i)
    if w > best_weight:
        best_a, best_b, best_weight = a, b, w

n = len(nodes)
partitions = 2 ** n
print(f"  Cut weight (total)        : {best_weight}")
print(f"  Number of nodes (n)       : {n}")
print(f"  Total possible partitions : 2^{n} = {partitions}")