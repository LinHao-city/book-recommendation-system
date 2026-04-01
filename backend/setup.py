"""
图书推荐系统后端安装和启动脚本
"""

import os
import sys
import subprocess
import time

def run_command(command, description):
    """运行命令并处理结果"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description}成功")
        if result.stdout:
            print(f"输出: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失败")
        if e.stderr:
            print(f"错误: {e.stderr.strip()}")
        return False

def check_python_version():
    """检查Python版本"""
    print("🐍 检查Python版本...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python版本过低: {version.major}.{version.minor}")
        print("需要Python 3.9或更高版本")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    return True

def install_dependencies():
    """安装依赖"""
    print("\n📦 安装Python依赖包...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ 依赖包安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print("❌ 依赖包安装失败")
        return False

def setup_database():
    """设置数据库"""
    print("\n🗄️  设置数据库...")

    # 检查环境变量
    db_password = os.getenv('DB_PASSWORD', '')
    if db_password == '':
        print("⚠️  数据库密码未设置，使用默认配置")

    # 创建数据库表
    if os.path.exists('../database/schema.sql'):
        print("📋 创建数据库表...")
        success = run_command(
            f"mysql -u root {'-p' + db_password if db_password else ''} < ../database/schema.sql",
            "创建数据库表"
        )
        if not success:
            print("❌ 数据库表创建失败，请手动执行：mysql -u root < ../database/schema.sql")
            return False
    else:
        print("⚠️  未找到数据库表结构文件")

    # 初始化测试数据
    print("📊 初始化测试数据...")
    success = run_command(
        f"{sys.executable} init_test_data.py",
        "初始化测试数据"
    )

    return True

def start_server():
    """启动服务器"""
    print("\n🚀 启动图书推荐系统后端服务...")
    print("服务将在 http://localhost:8000 启动")
    print("API文档: http://localhost:8000/docs")
    print("按 Ctrl+C 停止服务")

    try:
        subprocess.run([sys.executable, "run.py"])
    except KeyboardInterrupt:
        print("\n👋 服务已停止")

def main():
    """主函数"""
    print("=" * 60)
    print("📚 图书推荐系统后端 - 安装和启动")
    print("=" * 60)

    # 1. 检查Python版本
    if not check_python_version():
        return False

    # 2. 安装依赖
    if not install_dependencies():
        return False

    # 3. 设置数据库
    if not setup_database():
        print("⚠️  数据库设置失败，但您仍可以尝试启动服务")

    # 4. 启动服务
    start_server()

    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 安装已取消")
    except Exception as e:
        print(f"\n❌ 安装过程中出现错误: {e}")
        sys.exit(1)