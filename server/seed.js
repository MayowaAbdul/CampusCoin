const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll, initDatabase } = require('./database');

const seedData = async () => {
  console.log('Initializing database tables...');
  await initDatabase();

  // Wait 500ms to ensure schema creation completes
  await new Promise((r) => setTimeout(r, 500));

  // 1. Seed Default Categories if empty
  const categoryCount = await dbGet('SELECT COUNT(*) as count FROM categories WHERE is_default = 1');
  if (categoryCount.count === 0) {
    console.log('Seeding default income & expense categories...');
    const defaultIncome = [
      { name: 'Allowance', icon: 'Wallet', color: '#10b981' },
      { name: 'Part-time Job', icon: 'Briefcase', color: '#06b6d4' },
      { name: 'Scholarship', icon: 'GraduationCap', color: '#8b5cf6' },
      { name: 'Gift', icon: 'Gift', color: '#ec4899' },
      { name: 'Other Income', icon: 'PlusCircle', color: '#64748b' }
    ];

    const defaultExpense = [
      { name: 'Food', icon: 'Utensils', color: '#f59e0b' },
      { name: 'Transport', icon: 'Bus', color: '#3b82f6' },
      { name: 'Hostel/Rent', icon: 'Home', color: '#ef4444' },
      { name: 'Academics', icon: 'BookOpen', color: '#8b5cf6' },
      { name: 'Subscriptions', icon: 'Tv', color: '#a855f7' },
      { name: 'Entertainment', icon: 'Film', color: '#f43f5e' },
      { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#64748b' }
    ];

    for (const cat of defaultIncome) {
      await dbRun(
        `INSERT INTO categories (name, type, is_default, icon, color) VALUES (?, 'income', 1, ?, ?)`,
        [cat.name, cat.icon, cat.color]
      );
    }

    for (const cat of defaultExpense) {
      await dbRun(
        `INSERT INTO categories (name, type, is_default, icon, color) VALUES (?, 'expense', 1, ?, ?)`,
        [cat.name, cat.icon, cat.color]
      );
    }
  }

  // 2. Seed Users (Student & Admin)
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  let student = await dbGet('SELECT * FROM users WHERE email = ?', ['alex@campus.edu']);
  if (!student) {
    console.log('Seeding default student user (alex@campus.edu)...');
    const res = await dbRun(
      `INSERT INTO users (name, email, password_hash, role, academic_year, monthly_allowance_baseline, monthly_savings_goal)
       VALUES (?, ?, ?, 'student', 'Sophomore', 600.00, 100.00)`,
      ['Alex Rivers', 'alex@campus.edu', passwordHash]
    );
    student = await dbGet('SELECT * FROM users WHERE user_id = ?', [res.id]);
  }

  let admin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@campuscoin.edu']);
  if (!admin) {
    console.log('Seeding admin user (admin@campuscoin.edu)...');
    await dbRun(
      `INSERT INTO users (name, email, password_hash, role, academic_year)
       VALUES (?, ?, ?, 'admin', 'N/A')`,
      ['Campus Administrator', 'admin@campuscoin.edu', adminPasswordHash]
    );
  }

  // 3. Seed Sample Transactions across last 6 months for student
  const txCount = await dbGet('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [student.user_id]);
  if (txCount.count === 0) {
    console.log('Seeding 6 months of historical transactions...');
    const categories = await dbAll('SELECT * FROM categories WHERE is_default = 1');
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c.category_id;
    });

    const now = new Date();
    // Helper to get YYYY-MM-DD for N months ago
    const getDate = (monthsAgo, day) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
      return d.toISOString().split('T')[0];
    };

    // 6 months of data
    for (let m = 5; m >= 0; m--) {
      // Monthly allowance (Income)
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, is_recurring, date)
         VALUES (?, ?, 500.00, 'income', 'Monthly Allowance from Parents', 1, ?)`,
        [student.user_id, catMap['Allowance'], getDate(m, 1)]
      );

      // Part time job (Income)
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, is_recurring, date)
         VALUES (?, ?, 180.00, 'income', 'Campus Library Assistant Stpend', 1, ?)`,
        [student.user_id, catMap['Part-time Job'], getDate(m, 15)]
      );

      // Hostel / Rent (Expense)
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, is_recurring, date)
         VALUES (?, ?, 200.00, 'expense', 'Dorm Room Fee', 1, ?)`,
        [student.user_id, catMap['Hostel/Rent'], getDate(m, 2)]
      );

      // Food (Expense) - multiple
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
         VALUES (?, ?, 85.00, 'expense', 'Weekly Groceries & Canteen Meal Pass', ?)`,
        [student.user_id, catMap['Food'], getDate(m, 5)]
      );

      // Spike food in recent month to trigger AI insight flag!
      const foodExtra = m === 0 ? 140.00 : 70.00;
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
         VALUES (?, ?, ?, 'expense', 'Campus Cafe & Late Night Food Delivery', ?)`,
        [student.user_id, catMap['Food'], foodExtra, getDate(m, 18)]
      );

      // Transport (Expense)
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
         VALUES (?, ?, 35.00, 'expense', 'Monthly Bus & Subway Pass', ?)`,
        [student.user_id, catMap['Transport'], getDate(m, 4)]
      );

      // Subscriptions
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, is_recurring, date)
         VALUES (?, ?, 12.99, 'expense', 'Spotify & Student Prime Subscription', 1, ?)`,
        [student.user_id, catMap['Subscriptions'], getDate(m, 8)]
      );

      // Academics
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
         VALUES (?, ?, 45.00, 'expense', 'Physics Lab Notebook & Stationary', ?)`,
        [student.user_id, catMap['Academics'], getDate(m, 12)]
      );

      // Entertainment
      await dbRun(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
         VALUES (?, ?, 30.00, 'expense', 'Weekend Movie Night with Friends', ?)`,
        [student.user_id, catMap['Entertainment'], getDate(m, 22)]
      );
    }
  }

  // 4. Seed Monthly Budgets for current month
  const currentMonth = new Date().toISOString().substring(0, 7);
  const budgetCount = await dbGet('SELECT COUNT(*) as count FROM budgets WHERE user_id = ? AND month = ?', [
    student.user_id,
    currentMonth
  ]);
  if (budgetCount.count === 0) {
    console.log('Seeding category budgets...');
    const foodCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Food' AND is_default = 1");
    const transportCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Transport' AND is_default = 1");
    const entCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Entertainment' AND is_default = 1");
    const acadCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Academics' AND is_default = 1");

    if (foodCat) await dbRun(`INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, 180.00)`, [student.user_id, foodCat.category_id, currentMonth]);
    if (transportCat) await dbRun(`INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, 50.00)`, [student.user_id, transportCat.category_id, currentMonth]);
    if (entCat) await dbRun(`INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, 40.00)`, [student.user_id, entCat.category_id, currentMonth]);
    if (acadCat) await dbRun(`INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, 60.00)`, [student.user_id, acadCat.category_id, currentMonth]);
  }

  // 5. Seed System Announcements
  const annCount = await dbGet('SELECT COUNT(*) as count FROM announcements');
  if (annCount.count === 0) {
    console.log('Seeding system announcements...');
    await dbRun(
      `INSERT INTO announcements (title, content, type) VALUES
       ('Welcome to Campus Coin!', 'Track your allowances, dorm rent, and food spending effortlessly with AI-powered insights.', 'info'),
       ('Mid-Term Financial Checkup', 'Review your monthly spending limits under Budget Goals to ensure you reach your savings goal before finals!', 'tip')`
    );
  }

  // 6. Seed Initial AI Category Rules / Learnings
  const learningCount = await dbGet('SELECT COUNT(*) as count FROM ai_learnings');
  if (learningCount.count === 0) {
    const foodCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Food' AND is_default = 1");
    const transCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Transport' AND is_default = 1");
    const subCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Subscriptions' AND is_default = 1");
    const acadCat = await dbGet("SELECT category_id FROM categories WHERE name = 'Academics' AND is_default = 1");

    if (foodCat) {
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'cafe', ?)`, [student.user_id, foodCat.category_id]);
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'canteen', ?)`, [student.user_id, foodCat.category_id]);
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'groceries', ?)`, [student.user_id, foodCat.category_id]);
    }
    if (transCat) {
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'bus', ?)`, [student.user_id, transCat.category_id]);
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'uber', ?)`, [student.user_id, transCat.category_id]);
    }
    if (subCat) {
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'spotify', ?)`, [student.user_id, subCat.category_id]);
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'netflix', ?)`, [student.user_id, subCat.category_id]);
    }
    if (acadCat) {
      await dbRun(`INSERT INTO ai_learnings (user_id, keyword, category_id) VALUES (?, 'textbook', ?)`, [student.user_id, acadCat.category_id]);
    }
  }

  console.log('Database seeding complete!');
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
} else {
  module.exports = seedData;
}
