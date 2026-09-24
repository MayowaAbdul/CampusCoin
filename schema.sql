-- Campus Coin Database Schema (SQLite / SQL Compliant)
-- Project: Campus Coin (NextGen BudgetBee)
-- Category: End-to-End Web Solutions

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student', -- 'student' or 'admin'
    academic_year VARCHAR(100) DEFAULT 'Freshman', -- Freshman, Sophomore, Junior, Senior, Graduate
    monthly_allowance_baseline DECIMAL(10,2) DEFAULT 0.00,
    monthly_savings_goal DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NULL, -- NULL for default system categories, user_id for custom categories
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income' or 'expense'
    is_default BOOLEAN DEFAULT 0,
    icon VARCHAR(100) DEFAULT 'Tag',
    color VARCHAR(50) DEFAULT '#6366f1',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income' or 'expense'
    description TEXT,
    ai_suggested_category_id INTEGER NULL,
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_period VARCHAR(50) NULL, -- 'monthly', 'weekly'
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    limit_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 5. Insights Table (AI Monthly Generated Narrative Insights)
CREATE TABLE IF NOT EXISTS insights (
    insight_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    summary_text TEXT NOT NULL,
    tip_text TEXT NOT NULL,
    flagged_category_name VARCHAR(255) NULL,
    growth_percentage DECIMAL(5,2) NULL,
    is_bookmarked BOOLEAN DEFAULT 0,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Saved Tips Table (Personalized Saving Tips Engine)
CREATE TABLE IF NOT EXISTS saved_tips (
    tip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_name VARCHAR(255) NULL,
    potential_savings DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'pinned', 'dismissed', 'bookmarked'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 7. AI Category Learnings Table (Self-learning assistant)
CREATE TABLE IF NOT EXISTS ai_learnings (
    learning_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 8. Announcements Table (Admin System Announcements)
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'tip'
    created_by INTEGER NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 9. Recently Viewed / Edited Activity Trace Table
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'viewed' or 'edited'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE
);
