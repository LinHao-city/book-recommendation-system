"""
图书相关的Pydantic模式
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BookBase(BaseModel):
    """图书基础模式"""
    isbn: str = Field(..., description="图书唯一标识")
    book_title: str = Field(..., description="图书标题")
    book_author: str = Field(..., description="作者")
    year_of_publication: Optional[int] = Field(None, description="原始出版年份")
    publisher: Optional[str] = Field(None, description="出版社")
    avg_rating: float = Field(0.0, description="平均评分")
    rating_count: int = Field(0, description="评分数量")


class BookCreate(BookBase):
    """创建图书模式"""
    image_url_s: Optional[str] = Field(None, description="小图URL")
    image_url_m: Optional[str] = Field(None, description="中图URL")
    image_url_l: Optional[str] = Field(None, description="大图URL")
    year_of_publication_cleaned: Optional[int] = Field(None, description="清洗后的出版年份")
    book_author_encoded: Optional[int] = Field(None, description="作者编码")
    publisher_encoded: Optional[int] = Field(None, description="出版社编码")
    publication_decade: Optional[str] = Field(None, description="出版年代")


class BookUpdate(BaseModel):
    """更新图书模式"""
    book_title: Optional[str] = Field(None, description="图书标题")
    book_author: Optional[str] = Field(None, description="作者")
    year_of_publication: Optional[int] = Field(None, description="原始出版年份")
    publisher: Optional[str] = Field(None, description="出版社")
    avg_rating: Optional[float] = Field(None, description="平均评分")
    rating_count: Optional[int] = Field(None, description="评分数量")
    image_url_s: Optional[str] = Field(None, description="小图URL")
    image_url_m: Optional[str] = Field(None, description="中图URL")
    image_url_l: Optional[str] = Field(None, description="大图URL")


class Book(BookBase):
    """图书完整模式"""
    image_url_s: Optional[str] = Field(None, description="小图URL")
    image_url_m: Optional[str] = Field(None, description="中图URL")
    image_url_l: Optional[str] = Field(None, description="大图URL")
    year_of_publication_cleaned: Optional[int] = Field(None, description="清洗后的出版年份")
    book_author_encoded: Optional[int] = Field(None, description="作者编码")
    publisher_encoded: Optional[int] = Field(None, description="出版社编码")
    publication_decade: Optional[str] = Field(None, description="出版年代")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")

    class Config:
        from_attributes = True

    @validator('avg_rating', pre=True)
    def convert_avg_rating(cls, v):
        """转换平均评分"""
        return float(v) if v is not None else 0.0


class BookSearch(BaseModel):
    """图书搜索模式"""
    query: str = Field(..., min_length=1, description="搜索查询")
    limit: int = Field(20, ge=1, le=100, description="返回数量限制")
    offset: int = Field(0, ge=0, description="偏移量")


class SortOrder(str, Enum):
    """排序方向"""
    ASC = "asc"
    DESC = "desc"


class SortBy(str, Enum):
    """排序字段"""
    TITLE = "book_title"
    AUTHOR = "book_author"
    YEAR = "year_of_publication_cleaned"
    PUBLISHER = "publisher"
    RATING = "avg_rating"
    RATING_COUNT = "rating_count"
    RELEVANCE = "relevance"


class SearchFilter(BaseModel):
    """搜索过滤器"""
    authors: Optional[List[str]] = Field(None, description="作者列表")
    publishers: Optional[List[str]] = Field(None, description="出版社列表")
    year_range: Optional[tuple[int, int]] = Field(None, description="出版年份范围")
    rating_range: Optional[tuple[float, float]] = Field(None, description="评分范围")
    min_rating_count: Optional[int] = Field(None, ge=0, description="最少评分数量")
    has_images: Optional[bool] = Field(None, description="是否有图片")
    decades: Optional[List[str]] = Field(None, description="出版年代列表")


class AdvancedBookSearch(BaseModel):
    """高级图书搜索模式"""
    query: Optional[str] = Field(None, description="搜索查询")
    filters: Optional[SearchFilter] = Field(None, description="搜索过滤器")
    sort_by: SortBy = Field(SortBy.RELEVANCE, description="排序字段")
    sort_order: SortOrder = Field(SortOrder.DESC, description="排序方向")
    limit: int = Field(20, ge=1, le=100, description="返回数量限制")
    offset: int = Field(0, ge=0, description="偏移量")


class BookSearchResponse(BaseModel):
    """图书搜索响应模式"""
    books: List[Book] = Field(..., description="图书列表")
    total: int = Field(..., description="总数量")
    limit: int = Field(..., description="返回数量限制")
    offset: int = Field(..., description="偏移量")
    has_more: bool = Field(..., description="是否有更多数据")
    search_time_ms: Optional[int] = Field(None, description="搜索耗时(毫秒)")


class SearchSuggestion(BaseModel):
    """搜索建议模式"""
    text: str = Field(..., description="建议文本")
    type: str = Field(..., description="建议类型")  # title, author, publisher
    count: Optional[int] = Field(None, description="匹配数量")


class SearchSuggestionsResponse(BaseModel):
    """搜索建议响应模式"""
    suggestions: List[SearchSuggestion] = Field(..., description="建议列表")


class SearchHistory(BaseModel):
    """搜索历史模式"""
    id: Optional[int] = Field(None, description="历史记录ID")
    query: str = Field(..., description="搜索查询")
    filters: Optional[SearchFilter] = Field(None, description="搜索过滤器")
    result_count: int = Field(..., description="结果数量")
    searched_at: datetime = Field(..., description="搜索时间")


class SearchHistoryResponse(BaseModel):
    """搜索历史响应模式"""
    history: List[SearchHistory] = Field(..., description="历史记录列表")
    total: int = Field(..., description="总记录数")


class BookRecommendation(BaseModel):
    """推荐图书模式"""
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
    similarity_score: float = Field(..., description="相似度分数")
    rank: int = Field(..., description="推荐排名")
    reasons: Optional[list[str]] = Field(None, description="推荐理由")

    class Config:
        from_attributes = True

    @validator('avg_rating', pre=True)
    def convert_avg_rating(cls, v):
        """转换平均评分"""
        return float(v) if v is not None else 0.0