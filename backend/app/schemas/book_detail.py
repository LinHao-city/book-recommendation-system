"""
图书详情相关的Pydantic模式
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserReview(BaseModel):
    """用户评论模式"""
    user_id: str = Field(..., description="用户ID")
    book_rating: float = Field(..., description="用户评分")
    location: Optional[str] = Field(None, description="用户地理位置")
    age: Optional[int] = Field(None, description="用户年龄")
    rating_time: Optional[datetime] = Field(None, description="评分时间")


class RatingDistribution(BaseModel):
    """评分分布模式"""
    rating_1: int = Field(0, description="1分人数")
    rating_2: int = Field(0, description="2分人数")
    rating_3: int = Field(0, description="3分人数")
    rating_4: int = Field(0, description="4分人数")
    rating_5: int = Field(0, description="5分人数")
    rating_6: int = Field(0, description="6分人数")
    rating_7: int = Field(0, description="7分人数")
    rating_8: int = Field(0, description="8分人数")
    rating_9: int = Field(0, description="9分人数")
    rating_10: int = Field(0, description="10分人数")


class ReaderAnalytics(BaseModel):
    """读者画像分析模式"""
    location_distribution: Dict[str, int] = Field(default_factory=dict, description="地区分布")
    age_stats: Dict[str, Any] = Field(default_factory=dict, description="年龄统计")
    publication_decade: Optional[str] = Field(None, description="出版年代")
    total_readers: int = Field(0, description="总读者数")


class BookDetailResponse(BaseModel):
    """图书详情响应模式"""
    # 基本信息
    isbn: str = Field(..., description="图书ISBN")
    book_title: str = Field(..., description="图书标题")
    book_author: str = Field(..., description="作者")
    publisher: Optional[str] = Field(None, description="出版社")
    year_of_publication: Optional[int] = Field(None, description="出版年份")
    year_of_publication_cleaned: Optional[int] = Field(None, description="清洗后出版年份")
    publication_decade: Optional[str] = Field(None, description="出版年代")

    # 评分信息
    avg_rating: float = Field(0.0, description="平均评分")
    rating_count: int = Field(0, description="评分人数")
    rating_distribution: RatingDistribution = Field(..., description="评分分布")

    # 图片信息
    image_url_s: Optional[str] = Field(None, description="小图URL")
    image_url_m: Optional[str] = Field(None, description="中图URL")
    image_url_l: Optional[str] = Field(None, description="大图URL")

    # 时间信息
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")


class BookReviewsResponse(BaseModel):
    """图书评论响应模式"""
    isbn: str = Field(..., description="图书ISBN")
    total_reviews: int = Field(0, description="总评论数")
    reviews: List[UserReview] = Field(default_factory=list, description="用户评论列表")
    has_more: bool = Field(False, description="是否还有更多评论")


class BookAnalyticsResponse(BaseModel):
    """图书分析响应模式"""
    isbn: str = Field(..., description="图书ISBN")
    reader_analytics: ReaderAnalytics = Field(..., description="读者画像分析")
    rating_segments: Dict[str, Any] = Field(default_factory=dict, description="评分分段统计")