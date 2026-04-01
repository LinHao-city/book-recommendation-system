"""
数据库模型
"""

from .book import Book
from .user_rating import UserRating
from .recommendation import Recommendation

__all__ = ["Book", "UserRating", "Recommendation"]