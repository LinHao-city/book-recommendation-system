"""
推荐记录模型
"""

from sqlalchemy import Column, String, Integer, ForeignKey, DECIMAL, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database_sqlite import Base
import enum


class AlgorithmType(enum.Enum):
    """推荐算法类型"""
    CONTENT = "content"
    HYBRID = "hybrid"


class Recommendation(Base):
    """推荐记录模型"""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    source_isbn = Column(String(20), ForeignKey("books.isbn", ondelete="CASCADE"), nullable=False, comment="源图书ISBN")
    target_isbn = Column(String(20), ForeignKey("books.isbn", ondelete="CASCADE"), nullable=False, comment="目标图书ISBN")
    algorithm_type = Column(Enum(AlgorithmType), nullable=False, comment="推荐算法类型")
    similarity_score = Column(DECIMAL(5, 4), nullable=False, comment="相似度分数")
    recommendation_reason = Column(String(1000), comment="推荐理由")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关联关系
    source_book = relationship("Book", foreign_keys=[source_isbn], backref="source_recommendations")
    target_book = relationship("Book", foreign_keys=[target_isbn], backref="target_recommendations")

    def __repr__(self):
        return f"<Recommendation(source='{self.source_isbn}', target='{self.target_isbn}', algorithm='{self.algorithm_type.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "source_isbn": self.source_isbn,
            "target_isbn": self.target_isbn,
            "algorithm_type": self.algorithm_type.value,
            "similarity_score": float(self.similarity_score),
            "recommendation_reason": self.recommendation_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }