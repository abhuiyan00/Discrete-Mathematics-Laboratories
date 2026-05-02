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
