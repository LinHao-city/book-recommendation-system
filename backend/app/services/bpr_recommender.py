import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class CompleteBPRRecommender:
    """基于BPR算法的完整图书推荐系统"""
    
    def __init__(self, factors=20, learning_rate=0.01, regularization=0.01, iterations=50):
        self.factors = factors
        self.learning_rate = learning_rate
        self.regularization = regularization
        self.iterations = iterations
        self.is_trained = False
        
    def fit(self, df):
        """使用完整数据训练BPR模型"""
        print("准备训练数据...")
        
        # 使用完整数据进行编码
        self.user_encoder = LabelEncoder()
        self.item_encoder = LabelEncoder()
        
        # 对完整数据的用户和物品进行编码
        print("编码用户和物品...")
        df_encoded = df.copy()
        df_encoded['user_enc'] = self.user_encoder.fit_transform(df['User-ID'].astype(str))
        df_encoded['item_enc'] = self.item_encoder.fit_transform(df['ISBN'].astype(str))
        
        self.n_users = len(self.user_encoder.classes_)
        self.n_items = len(self.item_encoder.classes_)
        
        print(f"用户数量: {self.n_users}")
        print(f"书籍数量: {self.n_items}")
        
        # 构建交互数据 - 使用完整数据！
        interactions = list(zip(df_encoded['user_enc'], df_encoded['item_enc']))
        print(f"交互数量: {len(interactions)}")
        
        # 初始化用户和物品矩阵
        self.user_factors = np.random.normal(0, 0.1, (self.n_users, self.factors))
        self.item_factors = np.random.normal(0, 0.1, (self.n_items, self.factors))
        
        # 训练模型 - 使用完整交互数据
        print("训练BPR模型中...")
        print("这可能需要一些时间，请耐心等待...")
        
        for iteration in range(self.iterations):
            loss = self._train_epoch(interactions)
            if (iteration + 1) % 10 == 0:
                print(f"迭代 {iteration + 1}/{self.iterations}, 损失: {loss:.4f}")
        
        self.is_trained = True
        print("✅ 模型训练完成!")
        
        # 标记哪些书籍在训练数据中
        self.trained_items = set(df_encoded['item_enc'])
    
    def _train_epoch(self, interactions):
        """训练一个epoch"""
        loss = 0
        user_items = {}
        
        # 构建用户交互物品集合
        for user, item in interactions:
            if user not in user_items:
                user_items[user] = set()
            user_items[user].add(item)
        
        # 生成并训练三元组
        all_items = set(range(self.n_items))
        batch_size = min(50000, len(interactions))  # 增加批次大小
        
        for _ in range(batch_size):
            user = np.random.randint(self.n_users)
            if user not in user_items or not user_items[user]:
                continue
                
            pos_item = np.random.choice(list(user_items[user]))
            neg_items = list(all_items - user_items[user])
            if not neg_items:
                continue
            neg_item = np.random.choice(neg_items)
            
            # BPR更新
            x_uij = np.dot(self.user_factors[user], 
                          self.item_factors[pos_item] - self.item_factors[neg_item])
            sigmoid = 1 / (1 + np.exp(x_uij))
            
            # 更新参数
            user_factor = self.user_factors[user]
            item_factor_i = self.item_factors[pos_item]
            item_factor_j = self.item_factors[neg_item]
            
            self.user_factors[user] += self.learning_rate * (
                sigmoid * (item_factor_i - item_factor_j) - self.regularization * user_factor
            )
            self.item_factors[pos_item] += self.learning_rate * (
                sigmoid * user_factor - self.regularization * item_factor_i
            )
            self.item_factors[neg_item] += self.learning_rate * (
                -sigmoid * user_factor - self.regularization * item_factor_j
            )
            
            loss += np.log(1 / (1 + np.exp(-x_uij)))
        
        return loss / batch_size if batch_size > 0 else 0
    
    def save_model(self, filepath):
        """保存训练好的模型"""
        if not self.is_trained:
            print("❌ 模型尚未训练，无法保存")
            return False
            
        model_data = {
            'user_factors': self.user_factors,
            'item_factors': self.item_factors,
            'user_encoder': self.user_encoder,
            'item_encoder': self.item_encoder,
            'factors': self.factors,
            'n_users': self.n_users,
            'n_items': self.n_items,
            'is_trained': self.is_trained,
            'trained_items': self.trained_items
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"✅ 模型已保存到: {filepath}")
        return True
    
    def load_model(self, filepath):
        """加载已训练的模型"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.user_factors = model_data['user_factors']
            self.item_factors = model_data['item_factors']
            self.user_encoder = model_data['user_encoder']
            self.item_encoder = model_data['item_encoder']
            self.factors = model_data['factors']
            self.n_users = model_data['n_users']
            self.n_items = model_data['n_items']
            self.is_trained = model_data['is_trained']
            self.trained_items = model_data.get('trained_items', set())
            
            print(f"✅ 模型已从 {filepath} 加载")
            return True
        except Exception as e:
            print(f"❌ 加载模型失败: {e}")
            return False
    
    def find_similar_books(self, target_isbn, top_n=5):
        """找到与目标书籍相似的书籍"""
        if not self.is_trained:
            print("❌ 模型未训练，请先训练或加载模型")
            return None
            
        if target_isbn not in self.item_encoder.classes_:
            return None
            
        target_item_id = self.item_encoder.transform([target_isbn])[0]
        
        # 检查目标书籍是否在训练数据中
        if target_item_id not in self.trained_items:
            print("⚠️  该书籍在训练数据中交互较少，推荐可能基于内容相似性")
            # 仍然尝试推荐，但告知用户可能不准确
        
        # 计算目标书籍与所有其他书籍的相似度
        target_vector = self.item_factors[target_item_id]
        similarities = np.dot(self.item_factors, target_vector)
        
        # 排除自己并获取最相似的书籍
        similarities[target_item_id] = -np.inf
        top_indices = np.argsort(-similarities)[:top_n]
        
        return top_indices, similarities[top_indices]

def main():
    print("=" * 70)
    print("📚 完整BPR图书推荐系统 - 支持所有书籍")
    print("=" * 70)
    
    # 模型文件路径
    model_path = r'D:\Projects\图书推荐系统\backend\models\complete_bpr_model.pkl'
    
    try:
        # 1. 加载完整数据
        print("正在加载数据...")
        df = pd.read_csv(r'F:\gcg\sjgc\work3\delt_data.csv', low_memory=False)
        print(f"✅ 数据加载成功: {len(df)} 条记录")
        print(f"📚 数据集中共有 {df['Book-Title'].nunique()} 本不同的书籍")
        
        # 2. 创建书籍信息映射
        book_info_map = {}
        for _, row in df.iterrows():
            isbn = row['ISBN']
            if isbn not in book_info_map:
                book_info_map[isbn] = {
                    'title': row['Book-Title'],
                    'author': row.get('Book-Author', '未知作者'),
                    'year': row.get('Year-Of-Publication', '未知年份')
                }
        
        # 3. 初始化推荐器
        recommender = CompleteBPRRecommender(factors=20, learning_rate=0.01, iterations=30)
        
        # 4. 检查是否有已保存的模型
        if os.path.exists(model_path):
            print("🔍 发现已保存的模型文件")
            choice = input("是否加载现有模型？(y/n): ").strip().lower()
            if choice == 'y':
                if recommender.load_model(model_path):
                    print("✅ 使用已训练的模型进行推荐")
                else:
                    print("❌ 模型加载失败，需要重新训练")
                    train_complete_model(recommender, df, model_path)
            else:
                train_complete_model(recommender, df, model_path)
        else:
            print("📝 未找到已保存的模型，需要训练新模型")
            train_complete_model(recommender, df, model_path)
        
        # 5. 改进的推荐函数 - 支持所有书籍
        def recommend_any_book(book_title, top_n=5):
            """为任意书籍推荐相似书籍"""
            # 精确匹配
            matching_books = df[df['Book-Title'] == book_title]
            
            if len(matching_books) == 0:
                # 模糊匹配
                similar_titles = df[df['Book-Title'].str.contains(book_title, case=False, na=False)]
                if len(similar_titles) > 0:
                    print(f"❌ 未找到精确匹配 '{book_title}'")
                    print("找到以下相似书籍:")
                    unique_titles = similar_titles['Book-Title'].unique()[:5]
                    for i, title in enumerate(unique_titles, 1):
                        print(f"  {i}. {title}")
                    return None
                else:
                    print(f"❌ 未找到书籍: '{book_title}'")
                    # 显示热门书籍供参考
                    popular_books = df['Book-Title'].value_counts().head(5)
                    print("热门书籍参考:")
                    for i, (title, count) in enumerate(popular_books.items(), 1):
                        print(f"  {i}. {title}")
                    return None
            
            # 使用第一本匹配的书籍
            target_book = matching_books.iloc[0]
            target_isbn = target_book['ISBN']
            target_title = target_book['Book-Title']
            target_author = target_book.get('Book-Author', '未知作者')
            
            print(f"🎯 目标书籍: {target_title}")
            print(f"📝 作者: {target_author}")
            
            # 获取相似书籍推荐
            result = recommender.find_similar_books(target_isbn, top_n)
            if result is None:
                print("❌ 无法生成推荐")
                return None
                
            similar_indices, similarity_scores = result
            
            recommendations = []
            for idx, score in zip(similar_indices, similarity_scores):
                similar_isbn = recommender.item_encoder.inverse_transform([idx])[0]
                if similar_isbn in book_info_map:
                    info = book_info_map[similar_isbn]
                    recommendations.append({
                        'title': info['title'],
                        'author': info['author'],
                        'similarity': score
                    })
            
            return recommendations
        
        # 6. 显示系统信息
        print("\n" + "=" * 70)
        print("🎮 完整图书推荐系统 - 模型已就绪")
        print("=" * 70)
        print(f"💡 现在你可以输入任意 {df['Book-Title'].nunique()} 本书籍名称")
        print("📚 系统支持所有书籍的推荐")
        print("🔧 改进：即使书籍交互较少也能生成推荐")
        print("📝 输入 'quit' 退出程序")
        print("=" * 70)
        
        # 7. 主循环
        while True:
            book_input = input("\n📖 请输入书籍名称: ").strip()
            
            if book_input.lower() == 'quit':
                print("👋 谢谢使用！")
                break
                
            if not book_input:
                continue
            
            print("🔍 搜索书籍并生成推荐...")
            recommendations = recommend_any_book(book_input)
            
            if recommendations:
                print(f"\n✅ 为您推荐以下5本相似书籍:")
                print("-" * 80)
                for i, rec in enumerate(recommendations, 1):
                    print(f"{i}. 《{rec['title']}》")
                    print(f"   作者: {rec['author']} | 相似度: {rec['similarity']:.4f}")
                    print()
            else:
                print("❌ 无法生成推荐")
            
            print("=" * 80)
            
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()

def train_complete_model(recommender, df, model_path):
    """使用完整数据训练模型"""
    print("开始使用完整数据训练模型...")
    print("这可能需要一些时间，请耐心等待...")
    
    # 使用完整数据训练！
    recommender.fit(df)
    
    # 保存模型
    recommender.save_model(model_path)

if __name__ == "__main__":
    main()