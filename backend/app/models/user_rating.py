"""
用户评分模型
"""

from sqlalchemy import Column, String, Integer, Float, ForeignKey, DECIMAL, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database_sqlite import Base


class UserRating(Base):
    """用户评分模型"""
    __tablename__ = "user_ratings"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(String(50), nullable=False, comment="用户ID")
    isbn = Column(String(20), ForeignKey("books.isbn", ondelete="CASCADE"), nullable=False, comment="图书ISBN")
    book_rating = Column(DECIMAL(3, 1), nullable=False, comment="用户评分(0-10)")
    location = Column(String(200), comment="用户地理位置")
    age = Column(Integer, comment="用户年龄")
    location_encoded = Column(Integer, comment="地理位置编码")
    age_standardized = Column(DECIMAL(10, 6), comment="标准化年龄")
    age_normalized = Column(DECIMAL(10, 6), comment="归一化年龄")

    # 关联关系
    book = relationship("Book", backref="user_ratings")

    def __repr__(self):
        return f"<UserRating(user_id='{self.user_id}', isbn='{self.isbn}', rating={self.book_rating})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "isbn": self.isbn,
            "book_rating": float(self.book_rating),
            "location": self.location,
            "age": self.age,
            "location_encoded": self.location_encoded,
            "age_standardized": float(self.age_standardized) if self.age_standardized else None,
            "age_normalized": float(self.age_normalized) if self.age_normalized else None,
        }