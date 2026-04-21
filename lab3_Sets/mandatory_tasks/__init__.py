"""Set theory package exports."""

from .core import Set, MultiSet, EmptySet, BaseSet
from .operations import SetOperations, PowerSet, CardinalityOperations, InclusionExclusionPrinciple
from .logic import FormulaParser, LogicEvaluator, TruthTable, FormulaNode
from .characteristic import (
    CharacteristicFunction,
    CharacteristicFunctionTable,
    CharacteristicFunctionOperations,
    MultiSetCharacteristicFunction
)

__all__ = [
    # Core
    'Set',
    'MultiSet',
    'EmptySet',
    'BaseSet',
    
    # Operations
    'SetOperations',
    'PowerSet',
    'CardinalityOperations',
    'InclusionExclusionPrinciple',
    
    # Logic
    'FormulaParser',
    'LogicEvaluator',
    'TruthTable',
    'FormulaNode',
    
    # Characteristic Functions
    'CharacteristicFunction',
    'CharacteristicFunctionTable',
    'CharacteristicFunctionOperations',
    'MultiSetCharacteristicFunction',
]

__version__ = '1.0'
__author__ = 'Set Theory Framework'
