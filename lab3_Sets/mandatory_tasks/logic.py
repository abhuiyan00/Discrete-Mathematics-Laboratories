"""Logic parser and truth table tools."""

from typing import List, Dict, Set as PySet, Tuple
from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class FormulaNode(ABC):
    """Abstract base class for formula AST nodes."""
    
    @abstractmethod
    def evaluate(self, valuation: Dict[str, bool]) -> bool:
        """Evaluate this node given variable assignments."""
        pass
    
    @abstractmethod
    def get_variables(self) -> PySet[str]:
        """Get all variables in this formula."""
        pass
    
    @abstractmethod
    def __str__(self) -> str:
        """String representation."""
        pass


@dataclass
class Variable(FormulaNode):
    """Represents a variable (e.g., 'A', 'B', 'P')."""
    name: str
    
    def evaluate(self, valuation: Dict[str, bool]) -> bool:
        """Look up variable value."""
        if self.name not in valuation:
            raise ValueError(f"Variable {self.name} not found in valuation")
        return valuation[self.name]
    
    def get_variables(self) -> PySet[str]:
        """Return the variable name."""
        return {self.name}
    
    def __str__(self) -> str:
        return self.name


@dataclass
class NotFormula(FormulaNode):
    """Represents negation (¬ operand)."""
    operand: FormulaNode
    
    def evaluate(self, valuation: Dict[str, bool]) -> bool:
        """Evaluate NOT."""
        return not self.operand.evaluate(valuation)
    
    def get_variables(self) -> PySet[str]:
        """Get variables from operand."""
        return self.operand.get_variables()
    
    def __str__(self) -> str:
        return f"¬{self.operand}"


@dataclass
class AndFormula(FormulaNode):
    """Represents conjunction (left ∧ right)."""
    left: FormulaNode
    right: FormulaNode
    
    def evaluate(self, valuation: Dict[str, bool]) -> bool:
        """Evaluate AND."""
        return self.left.evaluate(valuation) and self.right.evaluate(valuation)
    
    def get_variables(self) -> PySet[str]:
        """Get variables from both operands."""
        return self.left.get_variables() | self.right.get_variables()
    
    def __str__(self) -> str:
        return f"({self.left} ∧ {self.right})"


@dataclass
class OrFormula(FormulaNode):
    """Represents disjunction (left ∨ right)."""
    left: FormulaNode
    right: FormulaNode
    
    def evaluate(self, valuation: Dict[str, bool]) -> bool:
        """Evaluate OR."""
        return self.left.evaluate(valuation) or self.right.evaluate(valuation)
    
    def get_variables(self) -> PySet[str]:
        """Get variables from both operands."""
        return self.left.get_variables() | self.right.get_variables()
    
    def __str__(self) -> str:
        return f"({self.left} ∨ {self.right})"


class FormulaParser:
    """
    Parser for logical formulas.
    
    Supports:
    - Variables: single letters or identifiers
    - NOT: ¬A, ~A, !A
    - AND: A∧B, A&B, A and B
    - OR: A∨B, A|B, A or B
    - Parentheses: (A ∧ B) ∨ C
    """
    
    def __init__(self, formula_string: str):
        """
        Initialize parser.
        
        Args:
            formula_string: The formula to parse.
        """
        self.formula_string = formula_string
        self.position = 0
        self._tokenize()
    
    def _tokenize(self) -> None:
        """Convert formula string to tokens."""
        tokens = []
        i = 0
        formula = self.formula_string.replace(" ", "")
        
        while i < len(formula):
            char = formula[i]
            
            # Variable (letter or alphanumeric)
            if char.isalpha():
                j = i
                while j < len(formula) and formula[j].isalnum():
                    j += 1
                tokens.append(('VAR', formula[i:j]))
                i = j
            
            # NOT operators
            elif char in ['¬', '~', '!']:
                tokens.append(('NOT', char))
                i += 1
            
            # AND operators
            elif char in ['∧', '&']:
                tokens.append(('AND', char))
                i += 1
            elif formula[i:i+3] == 'and':
                tokens.append(('AND', 'and'))
                i += 3
            
            # OR operators
            elif char in ['∨', '|']:
                tokens.append(('OR', char))
                i += 1
            elif formula[i:i+2] == 'or':
                tokens.append(('OR', 'or'))
                i += 2
            
            # Parentheses
            elif char == '(':
                tokens.append(('LPAREN', '('))
                i += 1
            elif char == ')':
                tokens.append(('RPAREN', ')'))
                i += 1
            
            else:
                raise ValueError(f"Unknown character: {char}")
        
        self.tokens = tokens
        self.position = 0
    
    def _current_token(self) -> Tuple[str, str]:
        """Get current token."""
        if self.position >= len(self.tokens):
            return ('EOF', '')
        return self.tokens[self.position]
    
    def _consume(self, expected_type: str = None) -> Tuple[str, str]:
        """Consume and return current token."""
        token = self._current_token()
        if expected_type and token[0] != expected_type:
            raise ValueError(f"Expected {expected_type}, got {token[0]}")
        self.position += 1
        return token
    
    def _peek(self) -> Tuple[str, str]:
        """Peek at current token without consuming."""
        return self._current_token()
    
    def parse(self) -> FormulaNode:
        """
        Parse the formula and return AST.
        
        Returns:
            FormulaNode representing the parsed formula.
        
        Raises:
            ValueError: If formula is invalid.
        """
        formula = self._parse_or()
        
        if self._peek()[0] != 'EOF':
            raise ValueError("Unexpected tokens at end of formula")
        
        return formula
    
    def _parse_or(self) -> FormulaNode:
        """Parse OR expression (lowest precedence)."""
        left = self._parse_and()
        
        while self._peek()[0] == 'OR':
            self._consume('OR')
            right = self._parse_and()
            left = OrFormula(left, right)
        
        return left
    
    def _parse_and(self) -> FormulaNode:
        """Parse AND expression (higher precedence than OR)."""
        left = self._parse_not()
        
        while self._peek()[0] == 'AND':
            self._consume('AND')
            right = self._parse_not()
            left = AndFormula(left, right)
        
        return left
    
    def _parse_not(self) -> FormulaNode:
        """Parse NOT expression (highest precedence)."""
        if self._peek()[0] == 'NOT':
            self._consume('NOT')
            operand = self._parse_not()  # NOT is right-associative
            return NotFormula(operand)
        
        return self._parse_primary()
    
    def _parse_primary(self) -> FormulaNode:
        """Parse primary expression (variable or parenthesized formula)."""
        token_type, token_value = self._peek()
        
        if token_type == 'VAR':
            self._consume('VAR')
            return Variable(token_value)
        
        elif token_type == 'LPAREN':
            self._consume('LPAREN')
            formula = self._parse_or()
            self._consume('RPAREN')
            return formula
        
        else:
            raise ValueError(f"Unexpected token: {token_type}")


class TruthTable:
    """
    Represents a truth table for a logical formula.
    
    Attributes:
        formula: The parsed formula.
        variables: Sorted list of variables.
        rows: List of (valuation, result) tuples.
    """
    
    def __init__(self, formula: FormulaNode):
        """
        Initialize truth table from formula.
        
        Args:
            formula: FormulaNode object.
        """
        self.formula = formula
        self.variables = sorted(list(formula.get_variables()))
        self.rows = self._generate_rows()
    
    def _generate_rows(self) -> List[Tuple[Dict[str, bool], bool]]:
        """
        Generate all rows of the truth table.
        
        Returns:
            List of (valuation, result) pairs.
        """
        rows = []
        num_variables = len(self.variables)
        
        # Generate all 2^n combinations
        for i in range(2 ** num_variables):
            valuation = {}
            
            # Assign truth values based on binary representation
            for j, var in enumerate(self.variables):
                valuation[var] = bool((i >> j) & 1)
            
            result = self.formula.evaluate(valuation)
            rows.append((valuation, result))
        
        return rows
    
    def __str__(self) -> str:
        """String representation as formatted table."""
        # Build header
        header = " | ".join(self.variables) + " | Result"
        separator = "-" * len(header)
        
        lines = [header, separator]
        
        # Build rows
        for valuation, result in self.rows:
            values = [str(int(valuation[var])) for var in self.variables]
            result_str = "T" if result else "F"
            line = " | ".join(values) + " | " + result_str
            lines.append(line)
        
        return "\n".join(lines)
    
    def to_list_of_dicts(self) -> List[Dict]:
        """
        Convert truth table to list of dictionaries.
        
        Returns:
            List where each dict has variables and 'result' key.
        
        Example:
            [
                {'A': True, 'B': True, 'result': True},
                {'A': True, 'B': False, 'result': False},
                ...
            ]
        """
        result = []
        for valuation, res in self.rows:
            row_dict = valuation.copy()
            row_dict['result'] = res
            result.append(row_dict)
        return result
    
    def is_tautology(self) -> bool:
        """
        Check if the formula is a tautology (always true).
        
        Returns:
            True if formula is true for all valuations.
        """
        for _, result in self.rows:
            if not result:
                return False
        return True
    
    def is_contradiction(self) -> bool:
        """
        Check if the formula is a contradiction (always false).
        
        Returns:
            True if formula is false for all valuations.
        """
        for _, result in self.rows:
            if result:
                return False
        return True
    
    def is_contingency(self) -> bool:
        """
        Check if the formula is a contingency (sometimes true, sometimes false).
        
        Returns:
            True if formula is neither tautology nor contradiction.
        """
        return not (self.is_tautology() or self.is_contradiction())


class LogicEvaluator:
    """
    High-level interface for logic formula evaluation.
    """
    
    @staticmethod
    def evaluate_formula(formula_string: str, valuation: Dict[str, bool]) -> bool:
        """
        Evaluate a formula given a valuation (assignment of truth values).
        
        Args:
            formula_string: The formula as string.
            valuation: Dictionary mapping variables to truth values.
        
        Returns:
            The truth value of the formula under the given valuation.
        
        Example:
            >>> LogicEvaluator.evaluate_formula("A ∧ B", {'A': True, 'B': False})
            False
        """
        parser = FormulaParser(formula_string)
        formula = parser.parse()
        return formula.evaluate(valuation)
    
    @staticmethod
    def generate_truth_table(formula_string: str) -> TruthTable:
        """
        Generate a truth table for a formula.
        
        Args:
            formula_string: The formula as string.
        
        Returns:
            TruthTable object.
        
        Example:
            >>> table = LogicEvaluator.generate_truth_table("A ∨ ¬B")
            >>> print(table)
        """
        parser = FormulaParser(formula_string)
        formula = parser.parse()
        return TruthTable(formula)
    
    @staticmethod
    def is_tautology(formula_string: str) -> bool:
        """
        Check if a formula is a tautology.
        
        Args:
            formula_string: The formula as string.
        
        Returns:
            True if formula is always true.
        """
        table = LogicEvaluator.generate_truth_table(formula_string)
        return table.is_tautology()
    
    @staticmethod
    def is_contradiction(formula_string: str) -> bool:
        """
        Check if a formula is a contradiction.
        
        Args:
            formula_string: The formula as string.
        
        Returns:
            True if formula is always false.
        """
        table = LogicEvaluator.generate_truth_table(formula_string)
        return table.is_contradiction()
