# ─────────────────────────────────────────────
#  constants.py  –  theme, presets, shared data
# ─────────────────────────────────────────────

# ── Colour palette ───────────────────────────
BG_DARK      = "#0d0d1a"
BG_MID       = "#16213e"
BG_CARD      = "#1a2744"
ACCENT       = "#e94560"
ACCENT_HOVER = "#c73050"
SUCCESS      = "#4ecca3"
WARNING      = "#f5a623"
INFO         = "#3a9bd5"
TEXT_PRIMARY = "#eaeaea"
TEXT_SEC     = "#a8a8b3"
TEXT_MUTED   = "#555577"

HEAP_COLORS = ["#e94560", "#4ecca3", "#f5a623", "#9b59b6", "#3498db",
               "#e67e22", "#1abc9c", "#e74c3c"]

# ── Fonts ────────────────────────────────────
F_GIANT   = ("Segoe UI", 64, "bold")
F_TITLE   = ("Segoe UI", 28, "bold")
F_HEADING = ("Segoe UI", 18, "bold")
F_SUBHEAD = ("Segoe UI", 14, "bold")
F_BODY    = ("Segoe UI", 12)
F_SMALL   = ("Segoe UI", 10)
F_MONO    = ("Consolas", 11)
F_BTN     = ("Segoe UI", 12, "bold")
F_NUM     = ("Segoe UI", 22, "bold")

# ── Layout ───────────────────────────────────
PAD = 20

# ── AI difficulty config ─────────────────────
# Probability that the AI picks the OPTIMAL move each turn.
# Empirically maps to: Easy ≈ 75% player win-rate,
#                      Medium ≈ 40%, Hard ≈ 1%.
AI_OPTIMAL_PROB = {
    "Easy":   0.08,   # ~8 % optimal  → beginner-friendly; random player wins ~57 %
    "Medium": 0.55,   # ~55 % optimal → challenging;       random player wins ~25 %
    "Hard":   0.99,   # ~99 % optimal → near-perfect;      random player wins ~2–3 %
}

AI_DESCRIPTIONS = {
    "Easy":   ("😊", "Beginner-friendly  (~75 % win-rate)",    SUCCESS),
    "Medium": ("😐", "Challenging  (~40 % win-rate)",           WARNING),
    "Hard":   ("😈", "Near-perfect AI  (~1 % win-rate*)",      ACCENT),
}

# ── Presets ──────────────────────────────────
MULTI_PRESETS = [
    {
        "label": "Beginner  (2 heaps: 4, 6)",
        "heaps": [4, 6],
        "desc":  "A gentle start — two heaps, easy to visualise.",
    },
    {
        "label": "Classic   (3 heaps: 3, 5, 7)",
        "heaps": [3, 5, 7],
        "desc":  "The most iconic Nim configuration played world-wide.",
    },
    {
        "label": "Advanced  (5 heaps: 1, 3, 5, 7, 9)",
        "heaps": [1, 3, 5, 7, 9],
        "desc":  "Five odd-sized heaps — a true test of strategy.",
    },
]

SINGLE_PRESETS = [
    {
        "label":    "Quick     (15 stones, max 3)",
        "heaps":    [15],
        "max_take": 3,
        "desc":     "Short, sharp, and strategically rich.",
    },
    {
        "label":    "Standard  (21 stones, max 3)",
        "heaps":    [21],
        "max_take": 3,
        "desc":     "The classic '21 game' — a pub favourite.",
    },
    {
        "label":    "Extended  (50 stones, max 5)",
        "heaps":    [50],
        "max_take": 5,
        "desc":     "Longer game with a higher take limit.",
    },
]
