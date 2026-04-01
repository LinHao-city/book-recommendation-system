"""
推荐相关的Pydantic模式
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class AlgorithmType:
    """推荐算法类型 - 简化的字符串类型"""

    CONTENT = "content"
    HYBRID = "hybrid"
    BPR = "bpr"
    LIGHTGBM = "lightgbm"  # 使用标准标识符

    # 支持的类型
    VALID_TYPES = [CONTENT, HYBRID, BPR, LIGHTGBM]

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise ValueError("AlgorithmType must be a string")

        # 支持多种lightgbm标识符
        if v in [cls.LIGHTGBM, "lgmb"]:
            return cls.LIGHTGBM

        if v in cls.VALID_TYPES:
            return v

        raise ValueError(f"'{v}' is not a valid AlgorithmType. Expected: content, hybrid, bpr, lightgbm")


class RecommendationRequest(BaseModel):
    """推荐请求模式"""
    source_book: Dict[str, str] = Field(..., description="源图书信息")
    algorithm: str = Field(..., description="推荐算法类型")
    limit: int = Field(10, ge=1, le=50, description="推荐数量限制")

    @field_validator('source_book')
    @classmethod
    def validate_source_book(cls, v):
        """验证源图书信息"""
        if 'isbn' not in v or 'title' not in v:
            raise ValueError("源图书必须包含isbn和title字段")
        return v


class RecommendationReason(BaseModel):
    """推荐理由模式"""
    category: str = Field(..., description="理由类别")
    description: str = Field(..., description="理由描述")
    weight: float = Field(1.0, description="权重")


class PerformanceMetrics(BaseModel):
    """性能指标模式"""
    precision: float = Field(..., description="准确率")
    recall: float = Field(..., description="召回率")
    f1_score: float = Field(..., description="F1分数")
    coverage: float = Field(..., description="覆盖率")
    diversity: float = Field(..., description="多样性")


class RecommendationPerformance(BaseModel):
    """推荐性能模式"""
    algorithm: str = Field(..., description="算法名称")
    response_time_ms: int = Field(..., description="响应时间(毫秒)")
    algorithm_metrics: PerformanceMetrics = Field(..., description="算法指标")


class Recommendation(BaseModel):
    """推荐结果模式"""
    isbn: str = Field(..., description="图书ISBN")
    book_title: str = Field(..., description="图书标题")
    book_author: str = Field(..., description="作者")
    publisher: Optional[str] = Field(None, description="出版社")
    year_of_publication: Optional[int] = Field(None, description="出版年份")
    avg_rating: float = Field(0.0, description="平均评分")
    rating_count: int = Field(0, description="评分数量")
    image_url_s: Optional[str] = Field(None, description="小图URL")
    image_url_m: Optional[str] = Field(None, description="中图URL")
    image_url_l: Optional[str] = Field(None, description="大图URL")
    rank: int = Field(..., description="推荐排名")
    similarity_score: float = Field(..., description="相似度分数")
    reasons: Optional[List[RecommendationReason]] = Field(None, description="推荐理由")

    class Config:
        from_attributes = True

    @field_validator('avg_rating', mode='before')
    @classmethod
    def convert_avg_rating(cls, v):
        """转换平均评分"""
        return float(v) if v is not None else 0.0


class RecommendationResponse(BaseModel):
    """推荐响应模式"""
    source_book: Dict[str, str] = Field(..., description="源图书信息")
    algorithm: str = Field(..., description="使用的算法")
    recommendations: List[Recommendation] = Field(..., description="推荐结果")
    performance: RecommendationPerformance = Field(..., description="性能指标")
    total_count: int = Field(..., description="总推荐数量")
    generated_at: datetime = Field(default_factory=datetime.now, description="生成时间")


class AlgorithmInfo(BaseModel):
    """算法信息模式"""
    type: str = Field(..., description="算法类型")
    name: str = Field(..., description="算法名称")
    description: str = Field(..., description="算法描述")
    icon: str = Field(..., description="算法图标")
    color: str = Field(..., description="算法颜色")
    features: List[str] = Field(..., description="算法特点")
    performance: RecommendationPerformance = Field(..., description="性能指标")


class AlgorithmListResponse(BaseModel):
    """算法列表响应模式"""
    algorithms: List[AlgorithmInfo] = Field(..., description="算法列表")