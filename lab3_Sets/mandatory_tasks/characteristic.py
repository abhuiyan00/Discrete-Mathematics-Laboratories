"""Characteristic functions for sets and multisets."""

from typing import Any, List, Dict, Callable, Tuple
from core import Set, MultiSet


class CharacteristicFunction:
    """
    Represents the characteristic (indicator) function of a set.
    
    The characteristic function χ_A(x) is a function that:
    - Returns 1 if x ∈ A
    - Returns 0 if x ∉ A
    
    Mathematically: χ_A: U → {0, 1} where U is the universal set.
    
    Attributes:
        set_a: The set this function represents.
        domain: The universal set (domain of the function).
    """
    
    def __init__(self, set_a: Set, domain: Set = None):
        """
        Initialize characteristic function.
        
        Args:
            set_a: The set.
            domain: Optional universal set. If None, uses set_a as domain.
        
        Raises:
            ValueError: If set_a is not a subset of domain.
        """
        self.set_a = set_a
        
        if domain is None:
            self.domain = set_a.copy()
        else:
            self.domain = domain
            # Verify that set_a ⊆ domain
            for element in set_a.to_list():
                if element not in domain:
                    raise ValueError(f"Set must be subset of domain. "
                                   f"Element {element} not in domain.")
    
    def __call__(self, element: Any) -> int:
        """
        Evaluate characteristic function at an element.
        
        Args:
            element: Element to evaluate at.
        
        Returns:
            1 if element in set_a, 0 otherwise.
        
        Example:
            >>> s = Set([1, 2, 3])
            >>> chi = CharacteristicFunction(s)
            >>> chi(2)
            1
            >>> chi(5)
            0
        """
        return 1 if element in self.set_a else 0
    
    def evaluate(self, element: Any) -> int:
        """Alternative name for calling the function."""
        return self(element)
    
    def get_truth_set(self) -> Set:
        """
        Get the set of elements where χ_A(x) = 1.
        
        This is just the original set A.
        
        Returns:
            The set this function represents.
        """
        return self.set_a.copy()
    
    def get_false_set(self) -> Set:
        """
        Get the set of elements where χ_A(x) = 0.
        
        This is the complement of A with respect to the domain.
        
        Returns:
            Elements in domain but not in set_a.
        """
        from operations import SetOperations
        return SetOperations.relative_complement(self.domain, self.set_a)
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"χ({self.set_a})"
    
    def __str__(self) -> str:
        """String representation."""
        return f"χ_A where A = {self.set_a}"


class CharacteristicFunctionTable:
    """
    Tabular representation of a characteristic function.
    
    Shows the value of χ_A(x) for each element in the domain.
    
    Attributes:
        chi_function: The characteristic function.
        table: Dictionary mapping elements to function values.
    """
    
    def __init__(self, characteristic_function: CharacteristicFunction):
        """
        Initialize characteristic function table.
        
        Args:
            characteristic_function: The function to tabulate.
        """
        self.chi_function = characteristic_function
        self.table = self._build_table()
    
    def _build_table(self) -> Dict[Any, int]:
        """
        Build the table of function values.
        
        Returns:
            Dictionary mapping elements to function values.
        """
        table = {}
        for element in self.chi_function.domain.to_list():
            table[element] = self.chi_function(element)
        return table
    
    def __str__(self) -> str:
        """String representation as formatted table."""
        lines = ["Element | χ_A(Element)"]
        lines.append("-" * 25)
        
        for element, value in self.table.items():
            lines.append(f"{element:7} | {value}")
        
        return "\n".join(lines)
    
    def to_list_of_dicts(self) -> List[Dict[str, Any]]:
        """
        Convert table to list of dictionaries.
        
        Returns:
            List of dicts with 'element' and 'value' keys.
        """
        return [
            {'element': elem, 'value': val}
            for elem, val in self.table.items()
        ]
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"CharacteristicFunctionTable({self.chi_function})"


class MultiSetCharacteristicFunction:
    """
    Characteristic function for multisets.
    
    For multisets, the characteristic function returns the
    multiplicity (count) of an element instead of just 0/1.
    
    χ_MS(x) = multiplicity of x in multiset MS
    
    Attributes:
        multiset: The multiset.
        domain: The universal set.
    """
    
    def __init__(self, multiset: MultiSet, domain: Set = None):
        """
        Initialize multiset characteristic function.
        
        Args:
            multiset: The multiset.
            domain: Optional universal set.
        """
        self.multiset = multiset
        
        if domain is None:
            # Use unique elements as domain
            self.domain = multiset.unique_elements()
        else:
            self.domain = domain
    
    def __call__(self, element: Any) -> int:
        """
        Evaluate at element.
        
        Args:
            element: Element to evaluate at.
        
        Returns:
            Multiplicity of element in multiset (0 if not present).
        """
        return self.multiset.multiplicity(element)
    
    def evaluate(self, element: Any) -> int:
        """Alternative name for calling the function."""
        return self(element)
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"χ_MS({self.multiset})"


class CharacteristicFunctionOperations:
    """
    Operations on characteristic functions.
    
    Shows how set operations correspond to operations on
    characteristic functions.
    """
    
    @staticmethod
    def intersection_function(chi_a: CharacteristicFunction,
                             chi_b: CharacteristicFunction) -> CharacteristicFunction:
        """
        Create characteristic function for A ∩ B.
        
        Property:
            χ_(A∩B)(x) = χ_A(x) AND χ_B(x)
            (minimum of the two values)
        
        Args:
            chi_a: Characteristic function of set A.
            chi_b: Characteristic function of set B.
        
        Returns:
            Characteristic function of A ∩ B.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> b = Set([2, 3, 4])
            >>> chi_a = CharacteristicFunction(a)
            >>> chi_b = CharacteristicFunction(b)
            >>> chi_intersection = CharacteristicFunctionOperations.intersection_function(chi_a, chi_b)
            >>> chi_intersection(2)
            1  # in both sets
            >>> chi_intersection(1)
            0  # only in A, not in B
        """
        # Intersection of domains
        u = chi_a.domain
        
        # χ_(A∩B)(x) = min(χ_A(x), χ_B(x))
        def chi_ab(x):
            return min(chi_a(x), chi_b(x))
        
        # Reconstruct the intersection set
        from operations import SetOperations
        intersection_set = SetOperations.intersection(chi_a.set_a, chi_b.set_a)
        
        return CharacteristicFunction(intersection_set, u)
    
    @staticmethod
    def union_function(chi_a: CharacteristicFunction,
                      chi_b: CharacteristicFunction) -> CharacteristicFunction:
        """
        Create characteristic function for A ∪ B.
        
        Property:
            χ_(A∪B)(x) = χ_A(x) OR χ_B(x)
            (maximum of the two values)
        
        Args:
            chi_a: Characteristic function of set A.
            chi_b: Characteristic function of set B.
        
        Returns:
            Characteristic function of A ∪ B.
        """
        u = chi_a.domain
        
        # χ_(A∪B)(x) = max(χ_A(x), χ_B(x))
        def chi_ab(x):
            return max(chi_a(x), chi_b(x))
        
        # Reconstruct the union set
        from operations import SetOperations
        union_set = SetOperations.union(chi_a.set_a, chi_b.set_a)
        
        return CharacteristicFunction(union_set, u)
    
    @staticmethod
    def complement_function(chi_a: CharacteristicFunction,
                           universal_set: Set = None) -> CharacteristicFunction:
        """
        Create characteristic function for A'.
        
        Property:
            χ_(A')(x) = 1 - χ_A(x) (negation)
        
        Args:
            chi_a: Characteristic function of set A.
            universal_set: The universal set (if None, uses chi_a.domain).
        
        Returns:
            Characteristic function of A'.
        """
        u = universal_set if universal_set else chi_a.domain
        
        # χ_(A')(x) = 1 - χ_A(x)
        def chi_complement(x):
            return 1 - chi_a(x)
        
        # Reconstruct the complement set
        from operations import SetOperations
        complement_set = SetOperations.absolute_complement(chi_a.set_a, u)
        
        return CharacteristicFunction(complement_set, u)
    
    @staticmethod
    def compute_cardinality_from_function(chi: CharacteristicFunction) -> int:
        """
        Compute cardinality of a set from its characteristic function.
        
        Cardinality = sum of χ(x) for all x in domain
        
        Args:
            chi: A characteristic function.
        
        Returns:
            The cardinality (number of elements).
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> u = Set([1, 2, 3, 4, 5])
            >>> chi = CharacteristicFunction(a, u)
            >>> CharacteristicFunctionOperations.compute_cardinality_from_function(chi)
            3
        """
        total = 0
        for element in chi.domain.to_list():
            total += chi(element)
        return total
    
    @staticmethod
    def compute_union_cardinality_from_functions(chi_a: CharacteristicFunction,
                                                chi_b: CharacteristicFunction) -> int:
        """
        Compute |A ∪ B| using characteristic functions.
        
        Uses inclusion-exclusion:
        |A ∪ B| = Σ χ_(A∪B)(x) = Σ max(χ_A(x), χ_B(x))
        
        Args:
            chi_a: Characteristic function of A.
            chi_b: Characteristic function of B.
        
        Returns:
            Cardinality of A ∪ B.
        """
        total = 0
        for element in chi_a.domain.to_list():
            total += max(chi_a(element), chi_b(element))
        return total
