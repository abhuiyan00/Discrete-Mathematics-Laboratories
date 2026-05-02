# Nim Game — Complete Project Reference

> A fully-featured, GUI-based implementation of the ancient strategy game **Nim**, built in Python with **tkinter**. Supports four rule variants, a three-difficulty AI opponent, and a smooth multi-screen navigation flow. Designed with a clean layered architecture (variants → players → state → screens → app).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [How to Run](#3-how-to-run)
4. [Architecture Overview](#4-architecture-overview)
5. [Module Reference](#5-module-reference)
   - [main.py](#51-mainpy)
   - [app.py](#52-apppy)
   - [state.py](#53-statepy)
   - [utils/constants.py](#54-utilsconstantspy)
   - [variants/base_variant.py](#55-variantsbase_variantpy)
   - [variants/classic_nim.py](#56-variantsclassic_nimpy)
   - [variants/misere_nim.py](#57-variantsmisere_nimpy)
   - [variants/single_pile_nim.py](#58-variantssingle_pile_nimpy)
   - [variants/bounded_nim.py](#59-variantsbounded_nimpy)
   - [variants/__init__.py](#510-variants__init__py)
   - [players/base_player.py](#511-playersbase_playerpy)
   - [players/human_player.py](#512-playershuman_playerpy)
   - [players/ai_player.py](#513-playersai_playerpy)
   - [players/__init__.py](#514-players__init__py)
   - [screens/base_screen.py](#515-screensbase_screenpy)
   - [screens/main_menu_screen.py](#516-screensmain_menu_screenpy)
   - [screens/variant_select_screen.py](#517-screensvariant_select_screenpy)
   - [screens/game_setup_screen.py](#518-screensgame_setup_screenpy)
   - [screens/gameplay_screen.py](#519-screensgameplay_screenpy)
   - [screens/result_screen.py](#520-screensresult_screenpy)
6. [Game Logic & Math](#6-game-logic--math)
   - [Classic Nim (Sprague–Grundy / XOR)](#61-classic-nim-spraguegrundy--xor)
   - [Misère Nim](#62-misère-nim)
   - [Single-Pile Nim](#63-single-pile-nim)
   - [Bounded Nim](#64-bounded-nim)
7. [AI System](#7-ai-system)
8. [UI / Screen Flow](#8-ui--screen-flow)
9. [State Management](#9-state-management)
10. [Theme & Constants](#10-theme--constants)
11. [Extension Points](#11-extension-points)
12. [Known Limitations & Future Work](#12-known-limitations--future-work)

---

## 1. Project Overview

Nim is a two-player mathematical strategy game. Players alternate turns removing stones from heaps. The winner (or loser, depending on the variant) is the player who takes the last stone. Despite its simple rules, Nim has deep mathematical structure rooted in **Sprague–Grundy theory** — every position can be assigned a Grundy value, and optimal play is deterministic.

**This project implements:**

- **4 Nim variants** — Classic, Misère, Single-Pile, and Bounded Nim
- **3 AI difficulty levels** — Easy, Medium, Hard — using probabilistic mixing of optimal and random play
- **Full GUI** — built with Python's standard `tkinter` library; no external UI dependencies
- **Multi-screen navigation** — Main Menu → Variant Select → Game Setup → Gameplay → Results
- **Session score tracking** — win counts persist across rematches; reset on return to the main menu
- **Scrollable setup screen** — handles up to 8 configurable heaps with live heap-entry widgets

---

## 2. Folder Structure

```
nim_game/
│
├── main.py                        # Entry point
├── app.py                         # Root Tk window + screen manager
├── state.py                       # Shared mutable game state (dataclass)
│
├── utils/
│   ├── __init__.py
│   └── constants.py               # Colors, fonts, AI config, presets
│
├── variants/
│   ├── __init__.py                # Exports ALL_VARIANTS list
│   ├── base_variant.py            # Abstract base class
│   ├── classic_nim.py             # Classic Nim (last to take wins, XOR strategy)
│   ├── misere_nim.py              # Misère Nim (last to take loses)
│   ├── single_pile_nim.py         # Single heap with max-take limit
│   └── bounded_nim.py             # Multi-heap with per-turn take limit
│
├── players/
│   ├── __init__.py                # Exports HumanPlayer, AIPlayer
│   ├── base_player.py             # Abstract base class
│   ├── human_player.py            # Human player (GUI-driven moves)
│   └── ai_player.py               # AI player (probabilistic optimal + random)
│
└── screens/
    ├── __init__.py
    ├── base_screen.py             # Abstract screen base (tk.Frame subclass)
    ├── main_menu_screen.py        # Title screen, mode select, difficulty dialog
    ├── variant_select_screen.py   # Variant picker + rules reader
    ├── game_setup_screen.py       # Player names, heap config, presets
    ├── gameplay_screen.py         # Canvas board, controls, game log
    └── result_screen.py           # Winner display, scores, replay options
```

---

## 3. How to Run

**Requirements:** Python 3.8+ (tkinter is included in the standard library).

```bash
# From inside the nim_game/ directory:
python main.py
```

Or from the parent directory:

```bash
python nim_game/main.py
```

No third-party packages are required.

---

## 4. Architecture Overview

The application follows a layered, single-responsibility design:

```
┌─────────────────────────────────────────────┐
│                 main.py                     │  ← Entry point
│         creates App, calls mainloop()       │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│                  app.py                     │  ← Root Tk window
│   Screen registry, show(name), GameState   │
└────┬──────────────┬──────────────┬──────────┘
     │              │              │
┌────▼────┐   ┌─────▼────┐  ┌─────▼──────┐
│ state.py│   │ variants/│  │  players/  │
│GameState│   │ (rules)  │  │ (players)  │
└─────────┘   └──────────┘  └────────────┘
                     │
┌────────────────────▼────────────────────────┐
│                screens/                     │  ← UI layer
│  MainMenu → Variant → Setup → Gameplay → Result
└─────────────────────────────────────────────┘
```

**Key design decisions:**

- All screens are instantiated **once** at startup and stacked in a grid. `app.show(name)` calls `tkraise()` to surface the right one — this avoids expensive widget re-creation on every navigation.
- `GameState` is a plain `dataclass` attached to the `App` instance. Every screen reads/writes it through `self.app.state`. This avoids callback spaghetti.
- Variant classes carry **all game rules** — move legality, optimal strategy, and winner determination. Screens are rule-agnostic.
- The AI doesn't make decisions inside the screen; instead, `GameplayScreen` delegates to `AIPlayer.get_move(variant)`, keeping the screen layer thin.

---

## 5. Module Reference

### 5.1 `main.py`

Entry point. Adds the project root to `sys.path` so the package can be run from any working directory, then creates and starts the `App`.

```python
"""main.py – Entry point. Run this file to start the Nim game."""

import sys
import os

# Ensure the project root is on sys.path regardless of how the script is run
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import App


def main() -> None:
    game = App()
    game.mainloop()


if __name__ == "__main__":
    main()
```

---

### 5.2 `app.py`

The root `tk.Tk` window. Creates `GameState`, builds all screens into a stacked container, and exposes `show(name)` for navigation.

```python
"""app.py – Root window and screen manager."""

from __future__ import annotations
import tkinter as tk
from state import GameState
from utils import constants as C


class App(tk.Tk):
    """
    The single Tk root window.  All screens live in a stacked grid;
    ``show(name)`` raises the appropriate frame to the top.
    """

    def __init__(self) -> None:
        super().__init__()
        self.title("Nim  —  The Strategy Game")
        self.geometry("980x720")
        self.minsize(820, 620)
        self.configure(bg=C.BG_DARK)
        self._set_icon()

        # Shared mutable state
        self.state = GameState()

        # Screen container (all screens live here, stacked)
        self._container = tk.Frame(self, bg=C.BG_DARK)
        self._container.pack(fill="both", expand=True)
        self._container.grid_rowconfigure(0, weight=1)
        self._container.grid_columnconfigure(0, weight=1)

        self._screens: dict[str, tk.Frame] = {}
        self._init_screens()
        self.show("main_menu")

    def _init_screens(self) -> None:
        from screens.main_menu_screen     import MainMenuScreen
        from screens.variant_select_screen import VariantSelectScreen
        from screens.game_setup_screen    import GameSetupScreen
        from screens.gameplay_screen      import GameplayScreen
        from screens.result_screen        import ResultScreen

        pairs = [
            ("main_menu", MainMenuScreen),
            ("variant",   VariantSelectScreen),
            ("setup",     GameSetupScreen),
            ("gameplay",  GameplayScreen),
            ("result",    ResultScreen),
        ]
        for name, ScreenClass in pairs:
            screen = ScreenClass(self._container, self)
            screen.grid(row=0, column=0, sticky="nsew")
            self._screens[name] = screen

    def show(self, name: str) -> None:
        """Raise a screen by name and call its on_show() hook."""
        screen = self._screens[name]
        screen.on_show()
        screen.tkraise()

    def _set_icon(self) -> None:
        try:
            self.iconbitmap(default="")
        except Exception:
            pass
```

**Screen name registry:**

| Key           | Class                  |
|---------------|------------------------|
| `"main_menu"` | `MainMenuScreen`       |
| `"variant"`   | `VariantSelectScreen`  |
| `"setup"`     | `GameSetupScreen`      |
| `"gameplay"`  | `GameplayScreen`       |
| `"result"`    | `ResultScreen`         |

---

### 5.3 `state.py`

A plain `dataclass` holding all shared mutable state. Passed around implicitly via `self.app.state`.

```python
"""state.py – Shared mutable game state passed between all screens via App."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from variants.base_variant import BaseVariant
    from players.base_player import BasePlayer


@dataclass
class GameState:
    # ── Pre-game choices ──────────────────────────────────────────
    vs_ai:          bool                    = False
    difficulty:     str                     = "Easy"      # "Easy" | "Medium" | "Hard"
    variant_class:  Optional[type]          = None        # the class (not instance)

    # ── Game instance ─────────────────────────────────────────────
    variant:        Optional["BaseVariant"] = None
    players:        List["BasePlayer"]      = field(default_factory=list)
    current_idx:    int                     = 0           # index into players

    # ── Result ────────────────────────────────────────────────────
    winner:         str                     = ""          # winner's display name

    def current_player(self) -> Optional["BasePlayer"]:
        if not self.players:
            return None
        return self.players[self.current_idx]

    def other_player(self) -> Optional["BasePlayer"]:
        if len(self.players) < 2:
            return None
        return self.players[1 - self.current_idx]

    def advance_turn(self) -> None:
        self.current_idx = 1 - self.current_idx

    def reset_for_replay(self) -> None:
        """Reset the variant and turn counter, keeping players and scores."""
        if self.variant is not None:
            self.variant.reset()
        self.current_idx = 0
        self.winner = ""
```

**Fields summary:**

| Field           | Type              | Purpose                                      |
|-----------------|-------------------|----------------------------------------------|
| `vs_ai`         | `bool`            | Whether player 2 is an AI                   |
| `difficulty`    | `str`             | AI difficulty: `"Easy"`, `"Medium"`, `"Hard"`|
| `variant_class` | `type`            | The chosen variant class (not instance)      |
| `variant`       | `BaseVariant`     | Live game instance                           |
| `players`       | `List[BasePlayer]`| `[player1, player2]`                         |
| `current_idx`   | `int`             | 0 or 1; indexes into `players`              |
| `winner`        | `str`             | Name of winner, set when game ends           |

---

### 5.4 `utils/constants.py`

Central configuration file. All colors, fonts, layout values, AI probabilities, and game presets are defined here.

```python
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
AI_OPTIMAL_PROB = {
    "Easy":   0.08,   # ~8%  optimal
    "Medium": 0.55,   # ~55% optimal
    "Hard":   0.99,   # ~99% optimal
}

AI_DESCRIPTIONS = {
    "Easy":   ("😊", "Beginner-friendly  (~75 % win-rate)",    SUCCESS),
    "Medium": ("😐", "Challenging  (~40 % win-rate)",           WARNING),
    "Hard":   ("😈", "Near-perfect AI  (~1 % win-rate*)",      ACCENT),
}

# ── Presets ──────────────────────────────────
MULTI_PRESETS = [
    {"label": "Beginner  (2 heaps: 4, 6)",        "heaps": [4, 6],        "desc": "A gentle start — two heaps, easy to visualise."},
    {"label": "Classic   (3 heaps: 3, 5, 7)",     "heaps": [3, 5, 7],     "desc": "The most iconic Nim configuration played world-wide."},
    {"label": "Advanced  (5 heaps: 1, 3, 5, 7, 9)","heaps": [1,3,5,7,9], "desc": "Five odd-sized heaps — a true test of strategy."},
]

SINGLE_PRESETS = [
    {"label": "Quick     (15 stones, max 3)", "heaps": [15], "max_take": 3, "desc": "Short, sharp, and strategically rich."},
    {"label": "Standard  (21 stones, max 3)", "heaps": [21], "max_take": 3, "desc": "The classic '21 game' — a pub favourite."},
    {"label": "Extended  (50 stones, max 5)", "heaps": [50], "max_take": 5, "desc": "Longer game with a higher take limit."},
]
```

---

### 5.5 `variants/base_variant.py`

Abstract base class enforcing the contract every Nim variant must satisfy.

```python
"""base_variant.py – Abstract base class for all Nim variants."""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple


class BaseVariant(ABC):
    NAME: str = "Nim"
    SHORT_DESC: str = ""
    FULL_RULES: str = ""
    SUPPORTS_MULTI_HEAP: bool = True

    def __init__(self, heaps: List[int]) -> None:
        if not heaps:
            raise ValueError("At least one heap is required.")
        if any(h < 0 for h in heaps):
            raise ValueError("Heap sizes must be non-negative integers.")
        self._heaps: List[int] = list(heaps)
        self._initial: List[int] = list(heaps)

    @property
    def heaps(self) -> List[int]:
        return list(self._heaps)

    @property
    def num_heaps(self) -> int:
        return len(self._heaps)

    @property
    def total_stones(self) -> int:
        return sum(self._heaps)

    def is_game_over(self) -> bool:
        return self.total_stones == 0

    def is_valid_move(self, heap_idx: int, amount: int) -> bool:
        if heap_idx < 0 or heap_idx >= len(self._heaps):
            return False
        if amount < 1 or amount > self._heaps[heap_idx]:
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        return [
            (i, a)
            for i, h in enumerate(self._heaps)
            for a in range(1, h + 1)
        ]

    def max_take_from(self, heap_idx: int) -> int:
        return self._heaps[heap_idx]

    def make_move(self, heap_idx: int, amount: int) -> bool:
        if not self.is_valid_move(heap_idx, amount):
            return False
        self._heaps[heap_idx] -= amount
        return True

    def reset(self) -> None:
        self._heaps = list(self._initial)

    @abstractmethod
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        ...

    @abstractmethod
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        ...

    def _nim_sum(self) -> int:
        result = 0
        for h in self._heaps:
            result ^= h
        return result

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(heaps={self._heaps})"
```

**Abstract methods subclasses must implement:**

| Method | Description |
|---|---|
| `determine_winner(last_mover, other_player)` | Returns the name of the winner given who moved last |
| `get_optimal_move()` | Returns `(heap_idx, amount)` for the game-theoretically best move |

**Class-level metadata attributes:**

| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `NAME` | `str` | `"Nim"` | Display name |
| `SHORT_DESC` | `str` | `""` | One-line description shown in variant list |
| `FULL_RULES` | `str` | `""` | Full rules text shown in the right panel |
| `SUPPORTS_MULTI_HEAP` | `bool` | `True` | Controls setup screen layout |

---

### 5.6 `variants/classic_nim.py`

Standard multi-heap Nim. Last player to take a stone wins. Uses full XOR / nim-sum optimal strategy.

```python
"""classic_nim.py – Standard multi-pile Nim: last to take WINS."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple
from variants.base_variant import BaseVariant


class ClassicNim(BaseVariant):
    NAME        = "Classic Nim"
    SHORT_DESC  = "Take from any heap — last to take WINS."
    FULL_RULES  = (
        "CLASSIC NIM\n"
        "─────────────────────────────────────────────────────\n\n"
        "Setup\n"
        "  Multiple heaps of stones are placed on the table.\n\n"
        "On your turn\n"
        "  • Choose exactly ONE heap.\n"
        "  • Remove at least 1 stone — up to the entire heap.\n\n"
        "Winning condition\n"
        "  The player who takes the LAST stone WINS.\n\n"
        "Mathematical strategy  (Sprague–Grundy / Nim-sum)\n"
        "  1. Compute the XOR of all heap sizes  →  called the nim-sum.\n"
        "  2. If nim-sum ≠ 0 you are in a WINNING position:\n"
        "       find a heap H where (H XOR nim-sum) < H,\n"
        "       then reduce that heap to (H XOR nim-sum).\n"
        "  3. If nim-sum = 0 you are in a LOSING position:\n"
        "       every move hands your opponent a winning position.\n\n"
        "Tip: practise spotting the nim-sum in your head — it's the\n"
        "     secret weapon every Nim master relies on."
    )
    SUPPORTS_MULTI_HEAP = True

    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover   # last to take wins

    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        nim_sum = self._nim_sum()
        if nim_sum != 0:
            for i, h in enumerate(self._heaps):
                target = h ^ nim_sum
                if target < h:
                    return (i, h - target)
        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, h))
```

---

### 5.7 `variants/misere_nim.py`

Misère Nim — identical to Classic, except the player who takes the **last** stone **loses**. Optimal strategy uses the Misère Nim theorem: play like Classic Nim until all heaps have at most 1 stone, then adjust parity.

```python
"""misere_nim.py – Misère Nim: last to take LOSES."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple
from variants.base_variant import BaseVariant


class MisereNim(BaseVariant):
    NAME        = "Misère Nim"
    SHORT_DESC  = "Take from any heap — last to take LOSES."
    SUPPORTS_MULTI_HEAP = True

    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return other_player   # last to take LOSES → other player wins

    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        if self._all_ones():
            return self._endgame_move()
        return self._midgame_move()

    def _all_ones(self) -> bool:
        return all(h <= 1 for h in self._heaps)

    def _endgame_move(self) -> Optional[Tuple[int, int]]:
        ones_idx = [i for i, h in enumerate(self._heaps) if h == 1]
        if not ones_idx:
            return None
        return (ones_idx[0], 1)

    def _midgame_move(self) -> Optional[Tuple[int, int]]:
        nim_sum = self._nim_sum()
        if nim_sum == 0:
            return self._fallback()
        for i, h in enumerate(self._heaps):
            target = h ^ nim_sum
            if target < h:
                amount = h - target
                new_heaps = list(self._heaps)
                new_heaps[i] = target
                if all(x <= 1 for x in new_heaps):
                    ones_after = sum(1 for x in new_heaps if x == 1)
                    if ones_after % 2 == 0:
                        return (i, h)   # adjust parity — take entire heap
                return (i, amount)
        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, h))
```

---

### 5.8 `variants/single_pile_nim.py`

One heap, bounded take per turn. Last to take wins. Optimal strategy: reduce pile to the nearest multiple of `(max_take + 1)`.

```python
"""single_pile_nim.py – One heap, limited take per turn, last to take WINS."""

from __future__ import annotations
from typing import List, Optional, Tuple
from variants.base_variant import BaseVariant


class SinglePileNim(BaseVariant):
    NAME        = "Single-Pile Nim"
    SHORT_DESC  = "One heap, take 1–K per turn — last to take WINS."
    SUPPORTS_MULTI_HEAP = False

    def __init__(self, heaps: List[int], max_take: int = 3) -> None:
        if len(heaps) != 1:
            raise ValueError("SinglePileNim requires exactly one heap.")
        if max_take < 1:
            raise ValueError("max_take must be at least 1.")
        super().__init__(heaps)
        self._max_take: int = max_take
        self._initial_max_take: int = max_take

    @property
    def max_take(self) -> int:
        return self._max_take

    def is_valid_move(self, heap_idx: int, amount: int) -> bool:
        if heap_idx != 0:
            return False
        if amount < 1 or amount > min(self._max_take, self._heaps[0]):
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        pile = self._heaps[0]
        limit = min(self._max_take, pile)
        return [(0, a) for a in range(1, limit + 1)]

    def max_take_from(self, heap_idx: int) -> int:
        return min(self._max_take, self._heaps[0])

    def reset(self) -> None:
        super().reset()
        self._max_take = self._initial_max_take

    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover

    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        pile = self._heaps[0]
        if pile == 0:
            return None
        m = self._max_take + 1
        remainder = pile % m
        if remainder == 0:
            return (0, 1)              # losing position — forced bad move
        take = min(remainder, self._max_take)
        return (0, take)
```

---

### 5.9 `variants/bounded_nim.py`

Multi-heap Nim with a per-turn take limit. Uses Sprague–Grundy theory: each heap's Grundy value is `heap_size mod (K + 1)`. XOR all Grundy values to find the winning move.

```python
"""bounded_nim.py – Multi-heap Nim with a per-turn take limit (Sprague–Grundy)."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple
from variants.base_variant import BaseVariant


class BoundedNim(BaseVariant):
    NAME        = "Bounded Nim"
    SHORT_DESC  = "Multi-heap, take at most K per heap per turn — last to take WINS."
    SUPPORTS_MULTI_HEAP = True

    def __init__(self, heaps: List[int], max_take: int = 3) -> None:
        if max_take < 1:
            raise ValueError("max_take must be at least 1.")
        super().__init__(heaps)
        self._max_take: int = max_take
        self._initial_max_take: int = max_take

    @property
    def max_take(self) -> int:
        return self._max_take

    def is_valid_move(self, heap_idx: int, amount: int) -> bool:
        if heap_idx < 0 or heap_idx >= len(self._heaps):
            return False
        limit = min(self._max_take, self._heaps[heap_idx])
        if amount < 1 or amount > limit:
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        return [
            (i, a)
            for i, h in enumerate(self._heaps)
            for a in range(1, min(self._max_take, h) + 1)
        ]

    def max_take_from(self, heap_idx: int) -> int:
        return min(self._max_take, self._heaps[heap_idx])

    def reset(self) -> None:
        super().reset()
        self._max_take = self._initial_max_take

    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover

    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        m = self._max_take + 1
        grundy_sum = 0
        for h in self._heaps:
            grundy_sum ^= (h % m)
        if grundy_sum == 0:
            return self._fallback()
        for i, h in enumerate(self._heaps):
            g = h % m
            target = g ^ grundy_sum
            if target < g:
                amount = g - target
                if 1 <= amount <= min(self._max_take, h):
                    return (i, amount)
        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, min(self._max_take, h)))
```

---

### 5.10 `variants/__init__.py`

Exposes all variants via `ALL_VARIANTS`, which is iterated by the `VariantSelectScreen`.

```python
from variants.classic_nim import ClassicNim
from variants.misere_nim import MisereNim
from variants.single_pile_nim import SinglePileNim
from variants.bounded_nim import BoundedNim

ALL_VARIANTS = [ClassicNim, MisereNim, SinglePileNim, BoundedNim]
```

To add a new variant, create the class, import it here, and append it to `ALL_VARIANTS`. The screen layer picks it up automatically.

---

### 5.11 `players/base_player.py`

Abstract base class for both human and AI players. Tracks name and win count.

```python
"""base_player.py – Abstract base class for human and AI players."""

from __future__ import annotations
from abc import ABC, abstractmethod


class BasePlayer(ABC):
    def __init__(self, name: str) -> None:
        self._name: str = name
        self._wins: int = 0

    @property
    def name(self) -> str:
        return self._name

    @property
    def wins(self) -> int:
        return self._wins

    def add_win(self) -> None:
        self._wins += 1

    def reset_wins(self) -> None:
        self._wins = 0

    @abstractmethod
    def is_human(self) -> bool:
        """Return True for HumanPlayer, False for AIPlayer."""

    def __str__(self) -> str:
        return self._name

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self._name!r}, wins={self._wins})"
```

---

### 5.12 `players/human_player.py`

Concrete human player. Moves are made entirely through the GUI; this class is a passive data holder.

```python
"""human_player.py – Human player; moves are driven by the GUI, not this class."""

from __future__ import annotations
from players.base_player import BasePlayer


class HumanPlayer(BasePlayer):
    def __init__(self, name: str = "Player") -> None:
        super().__init__(name)

    def is_human(self) -> bool:
        return True
```

---

### 5.13 `players/ai_player.py`

AI player. On each turn, with probability `_optimal_prob`, it calls `variant.get_optimal_move()`; otherwise it picks a uniformly random legal move from `variant.get_valid_moves()`.

```python
"""ai_player.py – AI player with three difficulty levels."""

from __future__ import annotations
import random
from typing import Optional, Tuple

from players.base_player import BasePlayer
from variants.base_variant import BaseVariant
from utils.constants import AI_OPTIMAL_PROB


class AIPlayer(BasePlayer):
    EASY   = "Easy"
    MEDIUM = "Medium"
    HARD   = "Hard"

    def __init__(self, difficulty: str = EASY) -> None:
        if difficulty not in AI_OPTIMAL_PROB:
            raise ValueError(f"Unknown difficulty: {difficulty!r}")
        super().__init__(f"AI ({difficulty})")
        self._difficulty: str = difficulty
        self._optimal_prob: float = AI_OPTIMAL_PROB[difficulty]

    @property
    def difficulty(self) -> str:
        return self._difficulty

    def is_human(self) -> bool:
        return False

    def get_move(self, variant: BaseVariant) -> Optional[Tuple[int, int]]:
        valid = variant.get_valid_moves()
        if not valid:
            return None
        if random.random() < self._optimal_prob:
            move = variant.get_optimal_move()
            if move is not None and move in valid:
                return move
        return random.choice(valid)
```

**Difficulty table:**

| Level  | `_optimal_prob` | Expected player win-rate |
|--------|----------------|--------------------------|
| Easy   | 0.08 (8%)      | ~75%                     |
| Medium | 0.55 (55%)     | ~40%                     |
| Hard   | 0.99 (99%)     | ~1–2%                    |

---

### 5.14 `players/__init__.py`

```python
from players.human_player import HumanPlayer
from players.ai_player import AIPlayer
```

---

### 5.15 `screens/base_screen.py`

Abstract base for all UI screens. Provides `build()` (called once at init) and `on_show()` (called every time the screen is surfaced). Also offers shared widget factories `make_btn`, `make_label`, and `make_separator`.

```python
"""base_screen.py – Abstract base for all tkinter screens."""

from __future__ import annotations
import tkinter as tk
from abc import abstractmethod
from typing import TYPE_CHECKING
from utils import constants as C

if TYPE_CHECKING:
    from app import App


class BaseScreen(tk.Frame):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, bg=C.BG_DARK)
        self.app = app

    @abstractmethod
    def build(self) -> None:
        """Create all widgets. Called once at construction."""

    def on_show(self) -> None:
        """Called every time this screen is raised to the top."""

    def make_btn(self, parent, text, command,
                 width=22, bg=C.ACCENT, fg=C.TEXT_PRIMARY, pady=8) -> tk.Button:
        btn = tk.Button(
            parent, text=text, command=command,
            bg=bg, fg=fg,
            activebackground=C.ACCENT_HOVER, activeforeground=C.TEXT_PRIMARY,
            font=C.F_BTN, width=width, height=1,
            pady=pady, bd=0, cursor="hand2", relief="flat",
        )
        btn.bind("<Enter>", lambda _e: btn.config(bg=C.ACCENT_HOVER if bg == C.ACCENT else bg))
        btn.bind("<Leave>", lambda _e: btn.config(bg=bg))
        return btn

    def make_label(self, parent, text="", textvariable=None,
                   font=None, fg=None, bg=None, **kw) -> tk.Label:
        return tk.Label(parent, text=text, textvariable=textvariable,
                        font=font or C.F_BODY, fg=fg or C.TEXT_PRIMARY,
                        bg=bg or C.BG_DARK, **kw)

    def make_separator(self, parent, color=C.ACCENT, height=2, pady=12) -> tk.Frame:
        frm = tk.Frame(parent, bg=color, height=height)
        frm.pack(fill="x", padx=40, pady=pady)
        return frm
```

---

### 5.16 `screens/main_menu_screen.py`

Title screen. Shows the "NIM" logo, two navigation buttons (vs Human / vs AI), and a Quit button. When vs AI is chosen, it opens a `tk.Toplevel` difficulty selection dialog before navigating.

```python
"""main_menu_screen.py – Title screen with Play vs Human / Play vs AI."""

from __future__ import annotations
import tkinter as tk
from screens.base_screen import BaseScreen
from utils import constants as C


class MainMenuScreen(BaseScreen):
    def __init__(self, parent, app) -> None:
        super().__init__(parent, app)
        self.build()

    def build(self) -> None:
        tk.Frame(self, bg=C.BG_DARK, height=60).pack()
        tk.Label(self, text="NIM", font=C.F_GIANT, bg=C.BG_DARK, fg=C.ACCENT).pack()
        tk.Label(self, text="The Ancient Strategy Game",
                 font=C.F_SUBHEAD, bg=C.BG_DARK, fg=C.TEXT_SEC).pack()
        self.make_separator(self, pady=24)

        btn_frame = tk.Frame(self, bg=C.BG_DARK)
        btn_frame.pack()
        self.make_btn(btn_frame, "▶   Play vs Human",
                      lambda: self._start(vs_ai=False), width=28).pack(pady=7)
        self.make_btn(btn_frame, "🤖   Play vs AI",
                      lambda: self._start(vs_ai=True), width=28).pack(pady=7)
        self.make_btn(btn_frame, "✕   Quit",
                      self.app.destroy, width=28, bg=C.BG_CARD).pack(pady=7)

        tk.Label(self,
                 text="Based on Sprague–Grundy theory  •  4 variants  •  3 AI levels",
                 font=C.F_SMALL, bg=C.BG_DARK, fg=C.TEXT_MUTED).pack(side="bottom", pady=14)

    def _start(self, vs_ai: bool) -> None:
        self.app.state.vs_ai = vs_ai
        if vs_ai:
            self._difficulty_dialog()
        else:
            self.app.state.difficulty = None
            self.app.show("variant")

    def _difficulty_dialog(self) -> None:
        dlg = tk.Toplevel(self.app)
        dlg.title("Choose AI Difficulty")
        dlg.geometry("420x340")
        dlg.configure(bg=C.BG_DARK)
        dlg.grab_set()
        dlg.resizable(False, False)
        # ... centers dialog and builds difficulty rows from C.AI_DESCRIPTIONS
        for level, (icon, desc, color) in C.AI_DESCRIPTIONS.items():
            row = tk.Frame(dlg, bg=C.BG_CARD, cursor="hand2")
            row.pack(fill="x", padx=30, pady=5)
            def _pick(lvl=level):
                self.app.state.difficulty = lvl
                dlg.destroy()
                self.app.show("variant")
            row.bind("<Button-1>", lambda _e, fn=_pick: fn())
```

---

### 5.17 `screens/variant_select_screen.py`

Two-panel layout: left panel lists all variants (from `ALL_VARIANTS`); right panel shows the selected variant's `FULL_RULES` in a scrollable read-only `tk.Text` widget. The "Next" button is disabled until a variant is chosen.

Key behaviour:
- `_select(variant_class)` highlights the chosen button and updates the rules pane.
- `on_show()` resets selection state so users don't carry forward a stale choice when returning from a back-navigation.
- `_go_setup()` writes `app.state.variant_class` and navigates to `"setup"`.

---

### 5.18 `screens/game_setup_screen.py`

Scrollable form that adapts its layout based on the selected variant:

- **Player names** — shown for both players; Player 2 field is hidden when `vs_ai=True` (AI name is auto-set).
- **Quick Presets** — buttons that auto-fill heap entries from `MULTI_PRESETS` or `SINGLE_PRESETS`.
- **Manual configuration** — a `Spinbox` for heap count (2–8) followed by individual `Entry` widgets, dynamically re-created by `_rebuild_heap_inputs()`. For single-pile variants, shows a single stone-count entry instead.
- **Move Limit (K)** — a `Spinbox` for `max_take`, shown only for `SinglePileNim` and `BoundedNim`.

On "Start Game":
1. Parses and validates all heap entries (must be positive integers).
2. Instantiates the variant class (`vc(heaps)` or `vc(heaps, max_take=K)`).
3. Creates player objects; preserves cumulative win scores if player names match existing players.
4. Writes everything into `app.state` and navigates to `"gameplay"`.

```python
# Score preservation logic
existing = self.app.state.players
if existing and len(existing) == 2 and \
        existing[0].name == p1.name and existing[1].name == p2.name:
    p1._wins = existing[0].wins
    p2._wins = existing[1].wins
```

---

### 5.19 `screens/gameplay_screen.py`

The main game board. Uses a `tk.Canvas` to render heaps as columns of coloured circles. Key visual constants:

```python
_SR       = 14    # stone radius in pixels
_GAP      = 4     # gap between stones
_ROW_MAX  = 5     # max stones per row
_MAX_DISP = 25    # stones shown before "+n more" label
_COL_H    = 320   # canvas height
```

**Heap rendering** (`_draw_heaps`): Each heap gets a column region on the canvas. Stones are drawn bottom-up. If a heap exceeds `_MAX_DISP`, an overflow label is shown at the top. The selected heap gets a highlighted border. Canvas `tag_bind` wires click/hover events per heap without storing individual item references.

**Turn flow:**
1. `on_show()` → resets selection, clears log, calls `_refresh()`.
2. `_refresh()` → updates the turn banner, redraws heaps, updates controls. If the current player is AI, schedules `_ai_turn()` via `self.after(900, ...)` (giving a visible 0.9 s "thinking" delay).
3. Human clicks a heap → `_select_heap(hi)` sets `_sel_heap`, amount resets to 1.
4. Human adjusts amount with `+`/`−` buttons (clamped to valid range).
5. Human clicks "Take Stones" → `_human_take()` validates and calls `_apply_move()`.
6. `_apply_move()` → calls `variant.make_move()`, appends to game log, checks `is_game_over()`. If over: sets `state.winner`, credits win, navigates to `"result"` after 300 ms.

---

### 5.20 `screens/result_screen.py`

Displays the winner, current session scores, and four navigation options:

- **Play Again (same setup)** — calls `state.reset_for_replay()` (resets variant to initial heaps, keeps scores) then goes to `"gameplay"`.
- **Change Setup** — goes to `"setup"`, scores preserved.
- **Change Variant** — goes to `"variant"`, scores preserved.
- **Main Menu** — calls `player.reset_wins()` for all players, then goes to `"main_menu"`.

```python
def on_show(self) -> None:
    winner  = self.app.state.winner
    players = self.app.state.players
    variant = self.app.state.variant
    self._winner_var.set(f"{winner}  wins!")
    self._variant_var.set(f"Variant: {variant.NAME if variant else '—'}")
    # Rebuild per-player score rows dynamically
    for p in players:
        color = C.SUCCESS if p.name == winner else C.TEXT_PRIMARY
        ...
```

---

## 6. Game Logic & Math

### 6.1 Classic Nim (Sprague–Grundy / XOR)

**Theorem:** A Nim position is a losing position for the player to move if and only if the XOR (nim-sum) of all heap sizes is 0.

**Winning move:** Find any heap `H` such that `H XOR nim_sum < H`. Reduce that heap to `H XOR nim_sum`. After this move, the nim-sum becomes 0 and all opponent responses will restore it to non-zero.

```
nim_sum = h1 XOR h2 XOR ... XOR hn
if nim_sum != 0:
    for each heap H:
        target = H XOR nim_sum
        if target < H:
            take (H - target) from this heap
            break
```

### 6.2 Misère Nim

**Theorem:** The optimal Misère strategy differs from Classic Nim only in the endgame (when all heaps have ≤ 1 stone).

- **Mid-game** (at least one heap > 1): Play exactly as Classic Nim, but if the winning move would produce all 1-stone heaps, verify parity. You want to leave an **odd** number of 1-stone heaps for your opponent (so they take the last one). If the nim-sum move produces an even number, take the entire heap instead.
- **Endgame** (all heaps are 0 or 1): Simply take from any 1-stone heap. The parity of remaining 1-stone heaps determines who loses.

### 6.3 Single-Pile Nim

**Key number:** `M = max_take + 1`

- **Losing positions:** multiples of M (0, M, 2M, 3M, …)
- **Winning move:** take `pile mod M` stones to reduce the pile to the nearest lower multiple of M.
- If `pile mod M == 0`: you're already in a losing position — take 1 and hope for opponent error.

```
remainder = pile % (max_take + 1)
if remainder == 0: take 1   # forced bad move
else: take min(remainder, max_take)
```

### 6.4 Bounded Nim

Generalises Single-Pile to multiple heaps using Sprague–Grundy theory.

- **Grundy value of a heap h:** `g(h) = h mod (K + 1)`
- **Grundy nim-sum:** `G = g(h1) XOR g(h2) XOR ... XOR g(hn)`
- **Winning move:** find heap `i` where `g(hi) XOR G < g(hi)`, then remove `g(hi) − (g(hi) XOR G)` stones.

Note: when `K ≥ max(all heaps)`, every heap can be fully emptied and the game reduces to Classic Nim.

---

## 7. AI System

The AI is implemented as a **probabilistic mixer** between optimal and random play. On each turn:

```python
if random.random() < self._optimal_prob:
    move = variant.get_optimal_move()
    if move is not None and move in variant.get_valid_moves():
        return move
return random.choice(variant.get_valid_moves())
```

This approach produces naturally variable play — even the Hard AI occasionally makes suboptimal moves (1% of the time), preventing it from feeling robotic. The Easy AI plays optimally only 8% of the time, making it genuinely beatable for new players.

The AI's "thinking delay" in `GameplayScreen` is purely cosmetic (900 ms via `self.after(900, self._ai_turn)`).

**Note:** The AI's `get_move()` receives the **live variant instance**. It calls `variant.get_optimal_move()` and `variant.get_valid_moves()` — the same methods used for move validation — so the AI always plays legally.

---

## 8. UI / Screen Flow

```
App starts
    │
    ▼
MainMenuScreen  ──── (vs Human) ────────────────────────────┐
    │                                                        │
    │  (vs AI) → difficulty dialog                          │
    │                    │                                  │
    ▼                    ▼                                  ▼
VariantSelectScreen  ◄──────────────────────────────────────┘
    │  (Next)
    ▼
GameSetupScreen  ◄─── (Back from Gameplay or Change Setup)
    │  (Start Game)
    ▼
GameplayScreen  ──── (game over) ───►  ResultScreen
    ▲                                       │
    │                                       │  Play Again (same setup)
    └───────────────────────────────────────┘
                                            │  Change Setup → GameSetupScreen
                                            │  Change Variant → VariantSelectScreen
                                            │  Main Menu → MainMenuScreen
```

All screens persist in memory. Navigation resets display state via `on_show()` hooks rather than destroying/recreating widgets.

---

## 9. State Management

`GameState` (in `state.py`) is the single source of truth. It lives on `app.state` and is directly read/written by all screens. There are no callbacks or event buses — screens simply check `self.app.state` when they need data.

**Lifecycle of a game session:**

1. `MainMenuScreen` sets `state.vs_ai` and `state.difficulty`.
2. `VariantSelectScreen` sets `state.variant_class`.
3. `GameSetupScreen` instantiates `state.variant` and `state.players`, resets `state.current_idx` and `state.winner`.
4. `GameplayScreen` reads/mutates `state.variant` (via `make_move`), reads/mutates `state.current_idx` (via `advance_turn`), writes `state.winner`, and calls `add_win()` on the winner player object.
5. `ResultScreen` reads `state.winner`, `state.players`, `state.variant`. "Play Again" calls `state.reset_for_replay()`.

---

## 10. Theme & Constants

The entire visual theme is defined in `utils/constants.py`. Colors are dark navy/midnight with a coral-red accent (`#e94560`) and mint-green success indicator (`#4ecca3`). This creates a sleek, modern aesthetic without any external CSS or image assets.

**Color palette summary:**

| Constant       | Hex       | Usage                          |
|----------------|-----------|--------------------------------|
| `BG_DARK`      | `#0d0d1a` | Main background                |
| `BG_MID`       | `#16213e` | Panels, top bars               |
| `BG_CARD`      | `#1a2744` | Cards, secondary panels        |
| `ACCENT`       | `#e94560` | Buttons, active elements       |
| `ACCENT_HOVER` | `#c73050` | Button hover state             |
| `SUCCESS`      | `#4ecca3` | Winner highlight, score labels |
| `WARNING`      | `#f5a623` | Medium difficulty label        |
| `TEXT_PRIMARY` | `#eaeaea` | Main text                      |
| `TEXT_SEC`     | `#a8a8b3` | Secondary/subtitle text        |
| `TEXT_MUTED`   | `#555577` | Disabled / footer text         |

Fonts are all `Segoe UI` (Windows system font) or `Consolas` (monospace for the rules pane). This makes the app feel native on Windows without bundling fonts.

---

## 11. Extension Points

**Adding a new variant:**
1. Create `variants/your_variant.py` subclassing `BaseVariant`.
2. Define `NAME`, `SHORT_DESC`, `FULL_RULES`, `SUPPORTS_MULTI_HEAP`.
3. Implement `determine_winner()` and `get_optimal_move()`.
4. Import and append to `ALL_VARIANTS` in `variants/__init__.py`.

No screen code needs to change — the variant select and setup screens are fully data-driven.

**Adding a new screen:**
1. Create `screens/your_screen.py` subclassing `BaseScreen`, implement `build()` and `on_show()`.
2. In `app.py`, import the class and add a `("key", YourScreen)` pair to `_init_screens()`.
3. Navigate to it with `self.app.show("key")`.

**Adjusting AI difficulty:**
Edit `AI_OPTIMAL_PROB` in `constants.py` — no code changes needed elsewhere.

**Adding more presets:**
Append dicts to `MULTI_PRESETS` or `SINGLE_PRESETS` in `constants.py`. The setup screen iterates them automatically.

---

## 12. Known Limitations & Future Work

- **Font fallback** — `Segoe UI` is a Windows-only font. On macOS/Linux it falls back to the system default, which may look different. A cross-platform font map (e.g., `Helvetica` on Mac, `DejaVu Sans` on Linux) could be added to `constants.py`.
- **No sound effects** — adding simple move/win sounds would require `pygame` or `playsound`.
- **No save/load** — game sessions are entirely in-memory. Persisting game history or high scores would require a JSON or SQLite backend.
- **AI move for Misère endgame** — the endgame parity logic always takes from the first 1-stone heap. Randomising heap selection in the endgame would make it less predictable against repeated plays.
- **Heap limit** — the UI supports 2–8 heaps. The variant logic is unbounded; lifting the cap requires only a spinbox `to=` change in `GameSetupScreen`.
- **No network/multiplayer** — the game is local-only. A server-based or LAN multiplayer mode would require significant architecture changes.
- **No animations** — stone removal is instantaneous. Animated removal (stones fading or flying out) would enhance the gameplay feel.
