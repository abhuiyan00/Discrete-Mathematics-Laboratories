"""Core set and multiset classes."""

from typing import Any, List, Optional, Tuple, Union
from abc import ABC, abstractmethod

class BaseSet(ABC):
    """
    Abstract base class for set-like collections.
    
    Defines the interface for all set implementations.
    """
    
    @abstractmethod
    def __contains__(self, element: Any) -> bool:
        """Check if element is in the set."""
        pass
    
    @abstractmethod
    def __len__(self) -> int:
        """Return the cardinality (size) of the set."""
        pass
    
    @abstractmethod
    def to_list(self) -> List[Any]:
        """Convert set to list representation."""
        pass


class Set(BaseSet):
    """
    Implementation of a mathematical set using native arrays.
    
    A set is an unordered collection of unique elements.
    No duplicates are allowed.
    
    Attributes:
        _elements: Internal list storing unique elements
    
    Example:
        >>> s = Set([1, 2, 2, 3])
        >>> print(s)
        {1, 2, 3}
    """
    
    def __init__(self, elements: Optional[List[Any]] = None):
        """
        Initialize a Set.
        
        Args:
            elements: List of elements. Duplicates are automatically removed.
        
        Raises:
            TypeError: If elements is not a list or None.
        """
        if elements is None:
            self._elements = []
        elif isinstance(elements, (list, tuple)):
            # Remove duplicates while preserving some order
            self._elements = self._remove_duplicates(list(elements))
        else:
            raise TypeError(f"Expected list or None, got {type(elements)}")
    
    @staticmethod
    def _remove_duplicates(elements: List[Any]) -> List[Any]:
        """
        Remove duplicates from a list while preserving relative order.
        
        Args:
            elements: List possibly containing duplicates.
        
        Returns:
            List with duplicates removed.
        """
        seen = []
        for element in elements:
            if not Set._is_in_list(seen, element):
                seen.append(element)
        return seen
    
    @staticmethod
    def _is_in_list(lst: List[Any], element: Any) -> bool:
        """
        Check if element is in list using equality comparison.
        
        Works with any hashable or non-hashable type.
        
        Args:
            lst: List to search.
            element: Element to find.
        
        Returns:
            True if element found, False otherwise.
        """
        for item in lst:
            if item == element:
                return True
        return False
    
    def __contains__(self, element: Any) -> bool:
        """Check if element is in the set."""
        return self._is_in_list(self._elements, element)
    
    def __len__(self) -> int:
        """Return cardinality (number of elements)."""
        return len(self._elements)
    
    def __str__(self) -> str:
        """String representation of the set."""
        if len(self._elements) == 0:
            return "∅"
        elements_str = ", ".join(str(e) for e in self._elements)
        return f"{{{elements_str}}}"
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"Set({self._elements})"
    
    def __eq__(self, other: 'Set') -> bool:
        """
        Two sets are equal if they contain the same elements.
        
        Args:
            other: Another Set object.
        
        Returns:
            True if sets are equal, False otherwise.
        """
        if not isinstance(other, Set):
            return False
        
        # Same length and all elements match
        if len(self) != len(other):
            return False
        
        for element in self._elements:
            if element not in other:
                return False
        
        return True
    
    def __ne__(self, other: 'Set') -> bool:
        """Not equal comparison."""
        return not self.__eq__(other)
    
    def is_subset(self, other: 'Set') -> bool:
        """
        Check if this set is a subset of another.
        
        Args:
            other: Another Set object.
        
        Returns:
            True if all elements of self are in other.
        """
        for element in self._elements:
            if element not in other:
                return False
        return True
    
    def is_proper_subset(self, other: 'Set') -> bool:
        """
        Check if this set is a proper subset (subset but not equal).
        
        Args:
            other: Another Set object.
        
        Returns:
            True if self is proper subset of other.
        """
        return self.is_subset(other) and self != other
    
    def to_list(self) -> List[Any]:
        """Convert set to list representation."""
        return self._elements.copy()
    
    def copy(self) -> 'Set':
        """Return a deep copy of the set."""
        return Set(self._elements.copy())
    
    def add(self, element: Any) -> None:
        """
        Add an element to the set.
        
        If element already exists, no change is made (set property).
        
        Args:
            element: Element to add.
        """
        if element not in self:
            self._elements.append(element)
    
    def remove(self, element: Any) -> None:
        """
        Remove an element from the set.
        
        Args:
            element: Element to remove.
        
        Raises:
            ValueError: If element not in set.
        """
        for i, item in enumerate(self._elements):
            if item == element:
                self._elements.pop(i)
                return
        raise ValueError(f"Element {element} not in set")
    
    def discard(self, element: Any) -> None:
        """
        Remove an element if it exists (no error if absent).
        
        Args:
            element: Element to remove.
        """
        try:
            self.remove(element)
        except ValueError:
            pass


class MultiSet(BaseSet):
    """
    Implementation of a multiset (bag).
    
    A multiset is like a set but allows duplicate elements.
    Each element has a multiplicity (count).
    
    Attributes:
        _elements: List of all elements (including duplicates)
        _multiplicities: Dictionary mapping elements to their counts
    
    Example:
        >>> ms = MultiSet([1, 1, 2, 2, 2, 3])
        >>> print(ms)
        {1:2, 2:3, 3:1}
    """
    
    def __init__(self, elements: Optional[List[Any]] = None):
        """
        Initialize a MultiSet.
        
        Args:
            elements: List of elements (duplicates allowed).
        
        Raises:
            TypeError: If elements is not a list or None.
        """
        if elements is None:
            self._elements = []
            self._multiplicities = []
        elif isinstance(elements, (list, tuple)):
            self._elements = list(elements)
            self._build_multiplicities()
        else:
            raise TypeError(f"Expected list or None, got {type(elements)}")
    
    def _build_multiplicities(self) -> None:
        """Build the multiplicity count for each unique element."""
        self._multiplicities = []
        unique_elements = Set(self._elements).to_list()
        
        for unique_elem in unique_elements:
            count = 0
            for elem in self._elements:
                if elem == unique_elem:
                    count += 1
            self._multiplicities.append((unique_elem, count))
    
    def __contains__(self, element: Any) -> bool:
        """Check if element appears at least once."""
        for elem in self._elements:
            if elem == element:
                return True
        return False
    
    def __len__(self) -> int:
        """Return total count of all elements (including duplicates)."""
        return len(self._elements)
    
    def multiplicity(self, element: Any) -> int:
        """
        Get the multiplicity (count) of an element.
        
        Args:
            element: Element to count.
        
        Returns:
            Number of occurrences of element.
        """
        count = 0
        for elem in self._elements:
            if elem == element:
                count += 1
        return count
    
    def unique_elements(self) -> Set:
        """
        Get the set of unique elements (ignoring multiplicities).
        
        Returns:
            Set containing each unique element once.
        """
        return Set(self._elements)
    
    def __str__(self) -> str:
        """String representation showing multiplicities."""
        if len(self._elements) == 0:
            return "∅"
        
        # Build multiplicity string
        parts = []
        seen = Set([])
        
        for elem in self._elements:
            if elem not in seen:
                mult = self.multiplicity(elem)
                if mult == 1:
                    parts.append(str(elem))
                else:
                    parts.append(f"{elem}:{mult}")
                seen.add(elem)
        
        return "{" + ", ".join(parts) + "}"
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"MultiSet({self._elements})"
    
    def to_list(self) -> List[Any]:
        """Convert multiset to list representation."""
        return self._elements.copy()
    
    def copy(self) -> 'MultiSet':
        """Return a deep copy of the multiset."""
        return MultiSet(self._elements.copy())
    
    def __eq__(self, other: 'MultiSet') -> bool:
        """
        Two multisets are equal if they have same elements with same multiplicities.
        
        Args:
            other: Another MultiSet object.
        
        Returns:
            True if multisets are equal.
        """
        if not isinstance(other, MultiSet):
            return False
        
        if len(self) != len(other):
            return False
        
        # Check each element's multiplicity
        unique_elems = self.unique_elements()
        for elem in unique_elems.to_list():
            if self.multiplicity(elem) != other.multiplicity(elem):
                return False
        
        return True


class EmptySet(Set):
    """
    Represents the empty set (∅).
    
    A specialized Set with no elements.
    """
    
    def __init__(self):
        """Initialize an empty set."""
        super().__init__([])
