"""
图书详情API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from typing import List, Optional
import logging

from ...core.database_sqlite import get_db
from ...models.book import Book
from ...models.user_rating import UserRating
from ...schemas.book_detail import (
    BookDetailResponse,
    BookReviewsResponse,
    BookAnalyticsResponse,
    UserReview,
    RatingDistribution,
    ReaderAnalytics
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/books/{isbn}/detail", response_model=BookDetailResponse)
async def get_book_detail(isbn: str, db: Session = Depends(get_db)):
    """
    获取图书详细信息

    - **isbn**: 图书ISBN
    """
    try:
        logger.info(f"获取图书详情: ISBN={isbn}")

        # 获取图书基本信息
        book = db.query(Book).filter(Book.isbn == isbn).first()
        if not book:
            raise HTTPException(status_code=404, detail="图书不存在")

        # 获取评分分布
        rating_dist_raw = db.query(
            UserRating.book_rating,
            func.count(UserRating.id).label('count')
        ).filter(UserRating.isbn == isbn).group_by(UserRating.book_rating).all()

        # 构建评分分布对象
        rating_dist = RatingDistribution()
        for rating, count in rating_dist_raw:
            setattr(rating_dist, f'rating_{int(rating)}', count)

        return BookDetailResponse(
            isbn=book.isbn,
            book_title=book.book_title,
            book_author=book.book_author,
            publisher=book.publisher,
            year_of_publication=book.year_of_publication,
            year_of_publication_cleaned=book.year_of_publication_cleaned,
            publication_decade=book.publication_decade,
            avg_rating=float(book.avg_rating) if book.avg_rating else 0.0,
            rating_count=book.rating_count,
            rating_distribution=rating_dist,
            image_url_s=book.image_url_s,
            image_url_m=book.image_url_m,
            image_url_l=book.image_url_l,
            created_at=book.created_at,
            updated_at=book.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取图书详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取图书详情失败: {str(e)}")


@router.get("/books/{isbn}/detail/reviews", response_model=BookReviewsResponse)
async def get_book_reviews(
    isbn: str,
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(10, ge=1, le=50, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取图书用户评论

    - **isbn**: 图书ISBN
    - **page**: 页码
    - **limit**: 每页数量
    """
    try:
        logger.info(f"获取图书评论: ISBN={isbn}, page={page}, limit={limit}")

        # 检查图书是否存在
        book = db.query(Book).filter(Book.isbn == isbn).first()
        if not book:
            raise HTTPException(status_code=404, detail="图书不存在")

        # 获取总数
        total_reviews = db.query(UserRating).filter(UserRating.isbn == isbn).count()

        # 获取评论列表（按时间倒序）
        offset = (page - 1) * limit
        reviews_raw = db.query(UserRating).filter(
            UserRating.isbn == isbn
        ).order_by(desc(UserRating.id)).offset(offset).limit(limit).all()

        reviews = [
            UserReview(
                user_id=rating.user_id,
                book_rating=float(rating.book_rating),
                location=rating.location,
                age=rating.age
            )
            for rating in reviews_raw
        ]

        has_more = offset + limit < total_reviews

        return BookReviewsResponse(
            isbn=isbn,
            total_reviews=total_reviews,
            reviews=reviews,
            has_more=has_more
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取图书评论失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取图书评论失败: {str(e)}")


@router.get("/books/{isbn}/detail/analytics", response_model=BookAnalyticsResponse)
async def get_book_analytics(isbn: str, db: Session = Depends(get_db)):
    """
    获取图书读者画像分析

    - **isbn**: 图书ISBN
    """
    try:
        logger.info(f"获取图书分析数据: ISBN={isbn}")

        # 检查图书是否存在
        book = db.query(Book).filter(Book.isbn == isbn).first()
        if not book:
            raise HTTPException(status_code=404, detail="图书不存在")

        # 获取地区分布（前10个地区）
        location_dist_raw = db.query(
            UserRating.location,
            func.count(UserRating.id).label('count')
        ).filter(
            UserRating.isbn == isbn,
            UserRating.location.isnot(None)
        ).group_by(UserRating.location).order_by(func.count(UserRating.id).desc()).limit(10).all()

        location_distribution = {loc: count for loc, count in location_dist_raw if loc}

        # 获取年龄统计
        age_stats_raw = db.query(
            func.avg(UserRating.age).label('avg_age'),
            func.min(UserRating.age).label('min_age'),
            func.max(UserRating.age).label('max_age'),
            func.count(UserRating.age).label('count_with_age')
        ).filter(
            UserRating.isbn == isbn,
            UserRating.age.isnot(None)
        ).first()

        age_stats = {}
        if age_stats_raw and age_stats_raw.avg_age:
            age_stats = {
                "avg_age": round(float(age_stats_raw.avg_age), 1),
                "min_age": age_stats_raw.min_age,
                "max_age": age_stats_raw.max_age,
                "count_with_age": age_stats_raw.count_with_age
            }

        # 获取评分分段统计
        total_readers = db.query(UserRating).filter(UserRating.isbn == isbn).count()
        high_rating = db.query(UserRating).filter(
            UserRating.isbn == isbn,
            UserRating.book_rating >= 8
        ).count()
        medium_rating = db.query(UserRating).filter(
            UserRating.isbn == isbn,
            UserRating.book_rating >= 6,
            UserRating.book_rating < 8
        ).count()
        low_rating = db.query(UserRating).filter(
            UserRating.isbn == isbn,
            UserRating.book_rating < 6
        ).count()

        rating_segments = {
            "total_readers": total_readers,
            "high_rating": high_rating,
            "medium_rating": medium_rating,
            "low_rating": low_rating,
            "high_rating_percent": round(high_rating / total_readers * 100, 1) if total_readers > 0 else 0,
            "medium_rating_percent": round(medium_rating / total_readers * 100, 1) if total_readers > 0 else 0,
            "low_rating_percent": round(low_rating / total_readers * 100, 1) if total_readers > 0 else 0
        }

        reader_analytics = ReaderAnalytics(
            location_distribution=location_distribution,
            age_stats=age_stats,
            publication_decade=book.publication_decade,
            total_readers=total_readers
        )

        return BookAnalyticsResponse(
            isbn=isbn,
            reader_analytics=reader_analytics,
            rating_segments=rating_segments
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取图书分析数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取图书分析数据失败: {str(e)}")