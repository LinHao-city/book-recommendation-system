"""
图书模型
"""

from sqlalchemy import Column, String, Integer, Float, Text, DECIMAL, DateTime
from sqlalchemy.sql import func
from ..core.database_sqlite import Base


class Book(Base):
    """图书模型"""
    __tablename__ = "books"

    isbn = Column(String(20), primary_key=True, comment="图书唯一标识")
    book_title = Column(String(500), nullable=False, comment="图书标题")
    book_author = Column(String(200), nullable=False, comment="作者")
    year_of_publication = Column(Integer, comment="原始出版年份")
    year_of_publication_cleaned = Column(Integer, comment="清洗后的出版年份")
    publisher = Column(String(200), comment="出版社")
    avg_rating = Column(DECIMAL(3, 2), default=0.0, comment="平均评分")
    rating_count = Column(Integer, default=0, comment="评分数量")

    # 图片URL字段
    image_url_s = Column(Text, comment="小图URL (搜索列表用)")
    image_url_m = Column(Text, comment="中图URL (推荐结果用)")
    image_url_l = Column(Text, comment="大图URL (详情页用)")

    # 编码字段 (推荐算法用)
    book_author_encoded = Column(Integer, comment="作者编码")
    publisher_encoded = Column(Integer, comment="出版社编码")
    publication_decade = Column(String(10), comment="出版年代")

    # 标准化字段
    year_of_publication_cleaned_standardized = Column(
        DECIMAL(10, 6), comment="标准化出版年份"
    )
    year_of_publication_cleaned_normalized = Column(
        DECIMAL(10, 6), comment="归一化出版年份"
    )

    # 时间戳
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), comment="创建时间"
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间"
    )

    def __repr__(self):
        return f"<Book(isbn='{self.isbn}', title='{self.book_title}', author='{self.book_author}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "isbn": self.isbn,
            "book_title": self.book_title,
            "book_author": self.book_author,
            "year_of_publication": self.year_of_publication,
            "year_of_publication_cleaned": self.year_of_publication_cleaned,
            "publisher": self.publisher,
            "avg_rating": float(self.avg_rating) if self.avg_rating else 0.0,
            "rating_count": self.rating_count,
            "image_url_s": self.image_url_s,
            "image_url_m": self.image_url_m,
            "image_url_l": self.image_url_l,
            "book_author_encoded": self.book_author_encoded,
            "publisher_encoded": self.publisher_encoded,
            "publication_decade": self.publication_decade,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }