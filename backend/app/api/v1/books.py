"""
图书管理API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
from ...core.database_sqlite import get_db
from ...models.book import Book
from ...schemas.book import (
    Book as BookSchema,
    BookSearch,
    BookSearchResponse,
    AdvancedBookSearch,
    SearchFilter,
    SortBy,
    SortOrder,
    SearchSuggestion,
    SearchSuggestionsResponse,
    SearchHistory,
    SearchHistoryResponse
)
from typing import Optional, List
import logging
import time
from datetime import datetime
import json

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/search", response_model=BookSearchResponse)
async def search_books(
    query: str = Query(..., min_length=1, description="搜索查询"),
    limit: int = Query(20, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: Session = Depends(get_db)
):
    """
    搜索图书

    支持按书名、作者、出版社搜索
    """
    try:
        logger.info(f"搜索图书: query='{query}', limit={limit}, offset={offset}")

        # 构建搜索条件
        search_conditions = or_(
            Book.book_title.ilike(f"%{query}%"),
            Book.book_author.ilike(f"%{query}%"),
            Book.publisher.ilike(f"%{query}%"),
            Book.isbn == query
        )

        # 获取总数
        total_query = db.query(func.count(Book.isbn)).filter(search_conditions)
        total = total_query.scalar()

        # 搜索图书
        books_query = db.query(Book).filter(search_conditions)

        # 排序：优先显示评分高的，然后是书名匹配
        books_query = books_query.order_by(
            Book.avg_rating.desc(),
            Book.rating_count.desc(),
            Book.book_title
        )

        # 分页
        books = books_query.offset(offset).limit(limit).all()

        # 转换为响应模型
        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"搜索完成: 找到 {total} 本图书，返回 {len(book_schemas)} 本")

        # 计算是否有更多数据
        has_more = offset + len(book_schemas) < total

        return BookSearchResponse(
            books=book_schemas,
            total=total,
            limit=limit,
            offset=offset,
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"搜索图书失败: {e}")
        raise HTTPException(status_code=500, detail="搜索图书失败")


@router.get("/popular/list", response_model=List[BookSchema])
async def get_popular_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取热门图书"""
    try:
        logger.info(f"获取热门图书: limit={limit}")

        books = db.query(Book).filter(
            Book.rating_count > 0
        ).order_by(
            Book.rating_count.desc(),
            Book.avg_rating.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取热门图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取热门图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取热门图书失败")


@router.get("/high-rated/list", response_model=List[BookSchema])
async def get_high_rated_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    min_rating_count: int = Query(10, ge=1, description="最少评分数量"),
    db: Session = Depends(get_db)
):
    """获取高分图书"""
    try:
        logger.info(f"获取高分图书: limit={limit}, min_rating_count={min_rating_count}")

        books = db.query(Book).filter(
            and_(
                Book.avg_rating >= 4.0,
                Book.rating_count >= min_rating_count
            )
        ).order_by(
            Book.avg_rating.desc(),
            Book.rating_count.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取高分图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取高分图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取高分图书失败")


@router.get("/new-releases/list", response_model=List[BookSchema])
async def get_new_releases(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    years: int = Query(5, ge=1, le=50, description="新书年数限制"),
    db: Session = Depends(get_db)
):
    """获取新书榜"""
    try:
        logger.info(f"获取新书榜: limit={limit}, years={years}")

        # 计算年份阈值
        current_year = 2025  # 使用当前年份
        min_year = current_year - years

        books = db.query(Book).filter(
            Book.year_of_publication_cleaned >= min_year,
            Book.rating_count > 0  # 只显示有评分的书
        ).order_by(
            Book.year_of_publication_cleaned.desc(),
            Book.avg_rating.desc(),
            Book.rating_count.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取新书榜完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取新书榜失败: {e}")
        raise HTTPException(status_code=500, detail="获取新书榜失败")


@router.get("/trending/list", response_model=List[BookSchema])
async def get_trending_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取趋势图书（按热门程度排序）"""
    try:
        logger.info(f"获取趋势图书: limit={limit}")

        # 趋势算法：结合评分数量、平均评分和出版年份
        # 给较新的书和受欢迎的书更高的权重
        books = db.query(Book).filter(
            Book.rating_count >= 10,  # 至少要有10个评分
            Book.avg_rating >= 3.0    # 平均评分至少3.0
        ).order_by(
            # 综合热度分数：评分数量 * 平均评分 * 年份权重
            (Book.rating_count * Book.avg_rating *
             (1.0 + (Book.year_of_publication_cleaned - 2000) * 0.01)).desc(),
            Book.rating_count.desc(),
            Book.avg_rating.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取趋势图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取趋势图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取趋势图书失败")


@router.get("/recent/list", response_model=List[BookSchema])
async def get_recent_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取最新图书"""
    try:
        logger.info(f"获取最新图书: limit={limit}")

        books = db.query(Book).filter(
            Book.year_of_publication_cleaned >= 2000
        ).order_by(
            Book.year_of_publication_cleaned.desc(),
            Book.avg_rating.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取最新图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取最新图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取最新图书失败")


@router.get("/classic/list", response_model=List[BookSchema])
async def get_classic_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取经典图书"""
    try:
        logger.info(f"获取经典图书: limit={limit}")

        books = db.query(Book).filter(
            and_(
                Book.year_of_publication_cleaned <= 1999,
                Book.rating_count >= 50
            )
        ).order_by(
            Book.avg_rating.desc(),
            Book.rating_count.desc()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取经典图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取经典图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取经典图书失败")


@router.get("/random/list", response_model=List[BookSchema])
async def get_random_books(
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取随机图书"""
    try:
        logger.info(f"获取随机图书: limit={limit}")

        # 使用RAND()函数获取随机图书
        books = db.query(Book).filter(
            Book.rating_count > 0
        ).order_by(
            func.rand()
        ).limit(limit).all()

        book_schemas = [BookSchema.from_orm(book) for book in books]

        logger.info(f"获取随机图书完成: {len(book_schemas)} 本")
        return book_schemas

    except Exception as e:
        logger.error(f"获取随机图书失败: {e}")
        raise HTTPException(status_code=500, detail="获取随机图书失败")


@router.get("/stats/overview")
async def get_books_stats(db: Session = Depends(get_db)):
    """获取图书统计概览"""
    try:
        logger.info("获取图书统计概览")

        # 总图书数
        total_books = db.query(func.count(Book.isbn)).scalar()

        # 有评分的图书数
        rated_books = db.query(func.count(Book.isbn)).filter(
            Book.rating_count > 0
        ).scalar()

        # 平均评分
        avg_rating = db.query(func.avg(Book.avg_rating)).filter(
            Book.rating_count > 0
        ).scalar()

        # 最高评分图书
        highest_rated_book = db.query(Book).filter(
            Book.rating_count >= 10
        ).order_by(Book.avg_rating.desc()).first()

        # 最多评分图书
        most_rated_book = db.query(Book).order_by(
            Book.rating_count.desc()
        ).first()

        stats = {
            "total_books": total_books,
            "rated_books": rated_books,
            "unrated_books": total_books - rated_books,
            "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
            "highest_rated_book": {
                "isbn": highest_rated_book.isbn,
                "title": highest_rated_book.book_title,
                "author": highest_rated_book.book_author,
                "rating": float(highest_rated_book.avg_rating)
            } if highest_rated_book else None,
            "most_rated_book": {
                "isbn": most_rated_book.isbn,
                "title": most_rated_book.book_title,
                "author": most_rated_book.book_author,
                "rating_count": most_rated_book.rating_count
            } if most_rated_book else None
        }

        logger.info(f"获取图书统计完成: total={total_books}, rated={rated_books}")
        return stats

    except Exception as e:
        logger.error(f"获取图书统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取图书统计失败")


@router.post("/advanced-search", response_model=BookSearchResponse)
async def advanced_search_books(
    search_request: AdvancedBookSearch,
    db: Session = Depends(get_db)
):
    """
    高级图书搜索

    支持复杂过滤、排序和分页
    """
    try:
        start_time = time.time()
        logger.info(f"高级图书搜索: {search_request}")

        # 构建基础查询
        books_query = db.query(Book)
        total_query = db.query(func.count(Book.isbn))

        # 应用搜索条件
        search_conditions = []

        if search_request.query and search_request.query.strip():
            query = search_request.query.strip()
            search_conditions.append(
                or_(
                    Book.book_title.ilike(f"%{query}%"),
                    Book.book_author.ilike(f"%{query}%"),
                    Book.publisher.ilike(f"%{query}%"),
                    Book.isbn == query
                )
            )

        # 应用过滤器
        if search_request.filters:
            filters = search_request.filters

            # 作者过滤
            if filters.authors:
                author_conditions = [Book.book_author.ilike(f"%{author}%") for author in filters.authors]
                search_conditions.append(or_(*author_conditions))

            # 出版社过滤
            if filters.publishers:
                publisher_conditions = [Book.publisher.ilike(f"%{publisher}%") for publisher in filters.publishers]
                search_conditions.append(or_(*publisher_conditions))

            # 年份范围过滤
            if filters.year_range:
                start_year, end_year = filters.year_range
                search_conditions.append(
                    Book.year_of_publication_cleaned.between(start_year, end_year)
                )

            # 评分范围过滤
            if filters.rating_range:
                min_rating, max_rating = filters.rating_range
                search_conditions.append(
                    Book.avg_rating.between(min_rating, max_rating)
                )

            # 最少评分数量过滤
            if filters.min_rating_count:
                search_conditions.append(Book.rating_count >= filters.min_rating_count)

            # 是否有图片过滤
            if filters.has_images is not None:
                if filters.has_images:
                    search_conditions.append(
                        or_(
                            Book.image_url_s.isnot(None),
                            Book.image_url_m.isnot(None),
                            Book.image_url_l.isnot(None)
                        )
                    )
                else:
                    search_conditions.append(
                        and_(
                            Book.image_url_s.is_(None),
                            Book.image_url_m.is_(None),
                            Book.image_url_l.is_(None)
                        )
                    )

            # 出版年代过滤
            if filters.decades:
                decade_conditions = [Book.publication_decade == decade for decade in filters.decades]
                search_conditions.append(or_(*decade_conditions))

        # 应用搜索条件
        if search_conditions:
            books_query = books_query.filter(and_(*search_conditions))
            total_query = total_query.filter(and_(*search_conditions))

        # 应用排序
        if search_request.sort_by == SortBy.RELEVANCE:
            # 相关性排序：结合多个因素
            if search_request.query and search_request.query.strip():
                query = search_request.query.strip()
                # 标题完全匹配优先，然后是作者匹配，最后是出版社匹配
                books_query = books_query.order_by(
                    func.case(
                        (Book.book_title.ilike(f"%{query}%"), 1),
                        else_=0
                    ).desc(),
                    func.case(
                        (Book.book_author.ilike(f"%{query}%"), 1),
                        else_=0
                    ).desc(),
                    Book.avg_rating.desc(),
                    Book.rating_count.desc()
                )
            else:
                # 无搜索词时按评分和评分数量排序
                books_query = books_query.order_by(
                    Book.avg_rating.desc(),
                    Book.rating_count.desc()
                )
        else:
            # 指定字段排序
            sort_column = {
                SortBy.TITLE: Book.book_title,
                SortBy.AUTHOR: Book.book_author,
                SortBy.YEAR: Book.year_of_publication_cleaned,
                SortBy.PUBLISHER: Book.publisher,
                SortBy.RATING: Book.avg_rating,
                SortBy.RATING_COUNT: Book.rating_count,
            }.get(search_request.sort_by, Book.book_title)

            if search_request.sort_order == SortOrder.DESC:
                books_query = books_query.order_by(sort_column.desc())
            else:
                books_query = books_query.order_by(sort_column.asc())

        # 获取总数
        total = total_query.scalar()

        # 分页
        books = books_query.offset(search_request.offset).limit(search_request.limit).all()

        # 转换为响应模型
        book_schemas = [BookSchema.from_orm(book) for book in books]

        # 计算搜索耗时
        search_time = int((time.time() - start_time) * 1000)
        has_more = (search_request.offset + len(book_schemas)) < total

        logger.info(f"高级搜索完成: 找到 {total} 本图书，返回 {len(book_schemas)} 本，耗时 {search_time}ms")

        return BookSearchResponse(
            books=book_schemas,
            total=total,
            limit=search_request.limit,
            offset=search_request.offset,
            has_more=has_more,
            search_time_ms=search_time
        )

    except Exception as e:
        logger.error(f"高级图书搜索失败: {e}")
        raise HTTPException(status_code=500, detail="高级图书搜索失败")


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    query: str = Query(..., min_length=1, description="搜索查询"),
    limit: int = Query(10, ge=1, le=20, description="建议数量限制"),
    db: Session = Depends(get_db)
):
    """
    获取搜索建议

    自动补全功能
    """
    try:
        logger.info(f"获取搜索建议: query='{query}', limit={limit}")

        query = f"%{query}%"

        suggestions = []

        # 书名建议
        title_suggestions = db.query(Book.book_title, func.count().label('count'))\
            .filter(Book.book_title.ilike(query))\
            .group_by(Book.book_title)\
            .order_by(func.count().desc())\
            .limit(limit).all()

        for title, count in title_suggestions:
            suggestions.append(SearchSuggestion(
                text=title,
                type="title",
                count=count
            ))

        # 作者建议
        author_suggestions = db.query(Book.book_author, func.count().label('count'))\
            .filter(Book.book_author.ilike(query))\
            .group_by(Book.book_author)\
            .order_by(func.count().desc())\
            .limit(limit).all()

        for author, count in author_suggestions:
            suggestions.append(SearchSuggestion(
                text=author,
                type="author",
                count=count
            ))

        # 出版社建议
        publisher_suggestions = db.query(Book.publisher, func.count().label('count'))\
            .filter(Book.publisher.ilike(query))\
            .group_by(Book.publisher)\
            .order_by(func.count().desc())\
            .limit(limit).all()

        for publisher, count in publisher_suggestions:
            suggestions.append(SearchSuggestion(
                text=publisher,
                type="publisher",
                count=count
            ))

        # 按匹配数量排序并限制总数
        suggestions.sort(key=lambda x: x.count or 0, reverse=True)
        suggestions = suggestions[:limit]

        logger.info(f"获取搜索建议完成: {len(suggestions)} 个建议")

        return SearchSuggestionsResponse(suggestions=suggestions)

    except Exception as e:
        logger.error(f"获取搜索建议失败: {e}")
        raise HTTPException(status_code=500, detail="获取搜索建议失败")


@router.get("/filters/authors")
async def get_author_filters(
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """
    获取作者筛选选项
    """
    try:
        authors = db.query(Book.book_author, func.count().label('book_count'))\
            .filter(Book.book_author.isnot(None))\
            .group_by(Book.book_author)\
            .order_by(func.count().desc())\
            .limit(limit).all()

        return [{"author": author, "count": count} for author, count in authors]

    except Exception as e:
        logger.error(f"获取作者筛选选项失败: {e}")
        raise HTTPException(status_code=500, detail="获取作者筛选选项失败")


@router.get("/filters/publishers")
async def get_publisher_filters(
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """
    获取出版社筛选选项
    """
    try:
        publishers = db.query(Book.publisher, func.count().label('book_count'))\
            .filter(Book.publisher.isnot(None))\
            .group_by(Book.publisher)\
            .order_by(func.count().desc())\
            .limit(limit).all()

        return [{"publisher": publisher, "count": count} for publisher, count in publishers]

    except Exception as e:
        logger.error(f"获取出版社筛选选项失败: {e}")
        raise HTTPException(status_code=500, detail="获取出版社筛选选项失败")


@router.get("/filters/decades")
async def get_decade_filters(db: Session = Depends(get_db)):
    """
    获取出版年代筛选选项
    """
    try:
        decades = db.query(Book.publication_decade, func.count().label('book_count'))\
            .filter(Book.publication_decade.isnot(None))\
            .group_by(Book.publication_decade)\
            .order_by(Book.publication_decade.desc())\
            .all()

        return [{"decade": decade, "count": count} for decade, count in decades if decade]

    except Exception as e:
        logger.error(f"获取出版年代筛选选项失败: {e}")
        raise HTTPException(status_code=500, detail="获取出版年代筛选选项失败")


@router.get("/filters/year-range")
async def get_year_range(db: Session = Depends(get_db)):
    """
    获取出版年份范围
    """
    try:
        min_year = db.query(func.min(Book.year_of_publication_cleaned))\
            .filter(Book.year_of_publication_cleaned.isnot(None)).scalar()

        max_year = db.query(func.max(Book.year_of_publication_cleaned))\
            .filter(Book.year_of_publication_cleaned.isnot(None)).scalar()

        return {
            "min_year": min_year or 1900,
            "max_year": max_year or 2025,
            "current_year": 2025
        }

    except Exception as e:
        logger.error(f"获取出版年份范围失败: {e}")
        raise HTTPException(status_code=500, detail="获取出版年份范围失败")


@router.get("/books/{isbn}/ratings")
async def get_book_ratings(
    isbn: str,
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """
    获取图书的用户评分信息
    """
    try:
        logger.info(f"获取图书用户评分: ISBN={isbn}, limit={limit}")

        # 检查图书是否存在
        book = db.query(Book).filter(Book.isbn == isbn).first()
        if not book:
            raise HTTPException(status_code=404, detail="图书不存在")

        # 导入UserRating模型
        from ...models.user_rating import UserRating

        # 获取用户评分数据
        ratings = db.query(UserRating).filter(
            UserRating.isbn == isbn
        ).order_by(UserRating.id.desc()).limit(limit).all()

        # 转换为响应格式
        rating_data = []
        for rating in ratings:
            rating_data.append({
                "user_id": rating.user_id,
                "book_rating": float(rating.book_rating),
                "location": rating.location,
                "age": rating.age
            })

        # 获取统计信息
        stats = db.query(
            func.count(UserRating.id).label('total_ratings'),
            func.avg(UserRating.book_rating).label('avg_rating'),
            func.min(UserRating.book_rating).label('min_rating'),
            func.max(UserRating.book_rating).label('max_rating'),
            func.count(func.distinct(UserRating.location)).label('location_count'),
            func.avg(UserRating.age).label('avg_age'),
            func.min(UserRating.age).label('min_age'),
            func.max(UserRating.age).label('max_age')
        ).filter(UserRating.isbn == isbn).first()

        return {
            "isbn": isbn,
            "book_title": book.book_title,
            "total_ratings": stats.total_ratings or 0,
            "avg_rating": float(stats.avg_rating or 0),
            "rating_range": {
                "min": float(stats.min_rating or 0),
                "max": float(stats.max_rating or 0)
            },
            "analytics": {
                "location_count": stats.location_count or 0,
                "avg_age": round(float(stats.avg_age or 0), 1),
                "age_range": {
                    "min": stats.min_age or 0,
                    "max": stats.max_age or 0
                }
            },
            "ratings": rating_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取图书用户评分失败: {e}")
        raise HTTPException(status_code=500, detail="获取图书用户评分失败")


@router.get("/{isbn}", response_model=BookSchema)
async def get_book_details(isbn: str, db: Session = Depends(get_db)):
    """获取图书详情"""
    try:
        logger.info(f"获取图书详情: isbn={isbn}")

        book = db.query(Book).filter(Book.isbn == isbn).first()

        if not book:
            raise HTTPException(status_code=404, detail="图书未找到")

        logger.info(f"找到图书: {book.book_title}")
        return BookSchema.from_orm(book)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取图书详情失败: {e}")
        raise HTTPException(status_code=500, detail="获取图书详情失败")