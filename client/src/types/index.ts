export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  academic_year: string;
  monthly_allowance_baseline: number;
  monthly_savings_goal: number;
  is_active?: number;
  created_at?: string;
}

export interface Category {
  category_id: number;
  user_id?: number | null;
  name: string;
  type: 'income' | 'expense';
  is_default: number;
  icon: string;
  color: string;
}

export interface Transaction {
  transaction_id: number;
  user_id: number;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  ai_suggested_category_id?: number | null;
  is_recurring: number;
  recurrence_period?: string | null;
  date: string;
  created_at?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Budget {
  budget_id: number;
  user_id: number;
  category_id: number;
  month: string;
  limit_amount: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  spent_amount?: number;
  remaining_amount?: number;
  percentage?: number;
  alert_status?: 'ok' | 'warning' | 'exceeded';
}

export interface Insight {
  insight_id: number;
  user_id: number;
  month: string;
  summary_text: string;
  tip_text: string;
  flagged_category_name?: string | null;
  growth_percentage?: number | null;
  is_bookmarked: number;
  generated_at?: string;
}

export interface SavedTip {
  tip_id: number;
  user_id: number;
  title: string;
  content: string;
  category_name?: string | null;
  potential_savings: number;
  status: 'active' | 'pinned' | 'dismissed' | 'bookmarked';
  created_at?: string;
}

export interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'tip';
  created_by?: number;
  created_at?: string;
}

export interface AdminStats {
  activeUsers: number;
  totalTransactions: number;
  totalIncomeVolume: number;
  totalExpenseVolume: number;
  topCategories: Array<{
    name: string;
    type: string;
    color: string;
    tx_count: number;
    total_amount: number;
  }>;
}

export interface ActivityLog {
  log_id: number;
  action_type: string;
  timestamp: string;
  transaction_id: number;
  amount: number;
  description: string;
  date: string;
  category_name: string;
  category_icon: string;
  category_color: string;
}
